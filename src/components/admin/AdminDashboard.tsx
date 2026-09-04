"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Check,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { Equipo, Producto } from "@/lib/types";
import { getAssetUrl } from "@/lib/asset-url";
import {
  calculateInstallmentPrice,
  normalizeCsvProductName,
  normalizeImportedCategory,
  normalizeStockCategoryValue,
  shouldIgnoreCsvProduct,
} from "@/lib/utils";
import {
  CATEGORIAS_EQUIPO,
  emptyEquipo,
  emptyProducto,
  newId,
  saveComponentCatalog,
  saveEquipos,
  saveProductos,
} from "./lib";
import type { ComponentPriceRules } from "./lib";
import CategoryPriceRules from "./CategoryPriceRules";
import { EquipoDialog } from "./EquipoDialog";
import BulkUploadDialog from "./BulkUploadDialog";
import { ProductoDialog } from "./ProductoDialog";
import { ImageField } from "./ImageField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  catalogDataKeys,
  componentCatalogLabels,
  normalizeCatalogProduct,
  type CatalogProduct,
  type ComponentCatalog,
  type ComponentCatalogKey,
} from "@/lib/component-catalog";
import { ComponenteDialog } from "./ComponenteDialog";

const money = (n: number) =>
  `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
const catLabel = (v: string) =>
  CATEGORIAS_EQUIPO.find((c) => c.value === v)?.label || v;

const componentKeyFromValue = (value: unknown): ComponentCatalogKey | null => {
  const normalized = String(value ?? "").trim().toLowerCase();
  const folders: Record<ComponentCatalogKey, string> = {
    motherboard: "motherboard",
    processor: "procesador",
    memory: "ram",
    storage: "disco",
    graphics: "grafica",
    power: "fuente",
    case: "gabinete",
    cooling: "cooler",
    peripherals: "periferico",
  };
  return catalogDataKeys.find((key) =>
    key === normalized || folders[key] === normalized || componentCatalogLabels[key].toLowerCase() === normalized,
  ) || null;
};

type Segment = "dashboard" | "stock" | "componentes";

type InventoryMovement = {
  id: string;
  tipo: "entrada" | "salida";
  producto: string;
  cantidad: number;
  anterior: number;
  nuevo: number;
  usuario: string;
  origen: string;
  fecha: string;
};

type ImportSummary = {
  creados: number;
  actualizados: number;
  marcadosSinStock: number;
  omitidos: number;
};

const STORAGE_KEY_MOVEMENTS = "servitec-admin-movimientos";
const STORAGE_KEY_USER = "servitec-admin-user";

const getCurrentAdminUser = () => {
  if (typeof window === "undefined") return "admin@servitec.com";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_USER);
    return stored || "admin@servitec.com";
  } catch {
    return "admin@servitec.com";
  }
};

type ConfirmRequest = {
  open: boolean;
  title: string;
  description?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
};

const readStoredMovements = (): InventoryMovement[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_MOVEMENTS);
    return raw ? (JSON.parse(raw) as InventoryMovement[]) : [];
  } catch {
    return [];
  }
};

const writeStoredMovements = (movements: InventoryMovement[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  } catch {
    // no-op
  }
};

const getMovementMeta = (tipo: InventoryMovement["tipo"]) => ({
  label: tipo === "entrada" ? "Entrada" : "Salida",
  color: tipo === "entrada" ? "text-emerald-700" : "text-rose-700",
});

export function AdminDashboard({ persistent }: { persistent: boolean }) {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("dashboard");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [componentCatalog, setComponentCatalog] = useState<ComponentCatalog>(() =>
    Object.fromEntries(catalogDataKeys.map((key) => [key, []])) as ComponentCatalog,
  );
  const [componentPriceRules, setComponentPriceRules] = useState<ComponentPriceRules>({});
  const [movimientos, setMovimientos] = useState<InventoryMovement[]>(readStoredMovements);
  const [loading, setLoading] = useState(true);
  const [editEquipo, setEditEquipo] = useState<Equipo | null>(null);
  const [editProducto, setEditProducto] = useState<Producto | null>(null);
  const [editComponente, setEditComponente] = useState<CatalogProduct | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const addMovement = (movement: Omit<InventoryMovement, "id" | "fecha">) => {
    setMovimientos((cur) => {
      const next = [
        {
          ...movement,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          fecha: new Date().toISOString(),
        },
        ...cur,
      ].slice(0, 50);
      writeStoredMovements(next);
      return next;
    });
  };

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/admin/equipos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/productos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/componentes").then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([e, p, c]) => {
        setEquipos(Array.isArray(e) ? e : []);
        setProductos(Array.isArray(p) ? p : []);
        if (c && typeof c === "object") {
          const response = c as { catalog?: ComponentCatalog; priceRules?: ComponentPriceRules };
          setComponentCatalog(response.catalog || c as ComponentCatalog);
          setComponentPriceRules(response.priceRules || {});
        }
      })
      .finally(() => setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-7 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border border-white/15 bg-white/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAssetUrl("logo.png")} alt="ServiTec" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none tracking-tight">
              <span className="text-white">Servi</span>
              <span className="text-primary">Tec</span>
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Panel administrativo
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link
              href="/"
              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/20 sm:flex-none sm:px-4"
            >
              Ir al inicio
            </Link>
            <button
              onClick={logout}
              className="flex-1 rounded-xl border border-rose-300/30 bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 sm:flex-none sm:px-4"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-xl sm:grid-cols-3">
        {(
          [
            {
              id: "dashboard",
              label: "Dashboard",
              description: "Inventario y resumen",
              icon: LayoutDashboard,
            },
            {
              id: "stock",
              label: "STOCK",
              description: "Nuevos y reacondicionados",
              icon: Boxes,
            },
            {
              id: "componentes",
              label: "Componentes",
              description: "Armá tu PC y tienda",
              icon: Boxes,
            },
          ] as const
        ).map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSegment(id)}
            className={`flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:px-4 ${
              segment === id
                ? "border-white/20 bg-white text-slate-950 shadow-lg"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            <span>
              <span className="block truncate text-sm font-bold uppercase tracking-wide">
                {label}
              </span>
              <span
                className={`block truncate text-xs ${
                  segment === id ? "text-slate-500" : "text-white/45"
                }`}
              >
                {description}
              </span>
            </span>
          </button>
        ))}
      </nav>

      {!persistent && (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold">Modo solo lectura.</strong> Conectá la
          integración <strong>Vercel Blob</strong> al proyecto para guardar cambios
          y subir imágenes.
        </div>
      )}

      {segment === "dashboard" ? (
        <DashboardTab
          productos={productos}
          setProductos={setProductos}
          persistent={persistent}
          onEdit={setEditProducto}
          movimientos={movimientos}
          addMovement={addMovement}
          onOpenBulk={() => setBulkOpen(true)}
          onRequestConfirm={setConfirmState}
        />
      ) : segment === "stock" ? (
        <StockTab
          equipos={equipos}
          setEquipos={setEquipos}
          persistent={persistent}
          onEdit={setEditEquipo}
          onRequestConfirm={setConfirmState}
        />
      ) : (
        <ComponentesTab
          catalog={componentCatalog}
          setCatalog={setComponentCatalog}
          persistent={persistent}
          onEdit={setEditComponente}
          onOpenBulk={() => setBulkOpen(true)}
          priceRules={componentPriceRules}
          setPriceRules={setComponentPriceRules}
        />
      )}

      {bulkOpen && (
        <BulkUploadDialog
          persistent={persistent}
          priceRules={componentPriceRules}
          onClose={() => setBulkOpen(false)}
          onUploaded={() => {
            setBulkOpen(false);
            void fetch("/api/admin/componentes")
              .then((response) => (response.ok ? response.json() : null))
              .then((catalog) => {
                if (catalog && typeof catalog === "object") {
                  const response = catalog as { catalog?: ComponentCatalog; priceRules?: ComponentPriceRules };
                  setComponentCatalog(response.catalog || catalog as ComponentCatalog);
                  setComponentPriceRules(response.priceRules || {});
                }
              });
          }}
        />
      )}

      {editEquipo && (
        <EquipoDialog
          key={editEquipo.id}
          equipo={editEquipo}
          componentCatalog={componentCatalog}
          onClose={() => setEditEquipo(null)}
          onSave={async (saved) => {
            if (persistent) {
              const next = equipos.some((e) => e.id === saved.id)
                ? equipos.map((e) => (e.id === saved.id ? saved : e))
                : [...equipos, { ...saved, orden: equipos.length }];
              await saveEquipos(next);
              window.dispatchEvent(new Event("equiposUpdated"));
              setEquipos(next);
              setEditEquipo(null);
            } else {
              setEquipos((cur) => {
                const exists = cur.some((e) => e.id === saved.id);
                return exists
                  ? cur.map((e) => (e.id === saved.id ? saved : e))
                  : [...cur, { ...saved, orden: cur.length }];
              });
              setEditEquipo(null);
            }
          }}
        />
      )}

      {editProducto && (
        <ProductoDialog
          key={editProducto.id}
          producto={editProducto}
          categorias={[...new Set(productos.map((p) => p.categoria))].sort()}
          onClose={() => setEditProducto(null)}
          onSave={async (saved) => {
            if (persistent) {
              const next = productos.some((p) => p.id === saved.id)
                ? productos.map((p) => (p.id === saved.id ? saved : p))
                : [...productos, saved];
              await saveProductos(next);
              // notify other clients / loaders
              window.dispatchEvent(new Event("productosUpdated"));
              setProductos(next);
              setEditProducto(null);
            } else {
              setProductos((cur) =>
                cur.some((p) => p.id === saved.id)
                  ? cur.map((p) => (p.id === saved.id ? saved : p))
                  : [...cur, saved],
              );
              setEditProducto(null);
            }
          }}
        />
      )}

      {editComponente && (
        <ComponenteDialog
          key={`${editComponente.categoria}-${editComponente.id}`}
          componente={editComponente}
          onClose={() => setEditComponente(null)}
          onSave={async (saved) => {
            const category = componentKeyFromValue(saved.categoria) || componentKeyFromValue(editComponente.categoria) || "motherboard";
            const savedForCatalog = { ...saved, categoria: category };
            const sortByPrice = (items: CatalogProduct[]) => [...items].sort((a, b) => {
              const priceDifference = (Number(a.precio) || 0) - (Number(b.precio) || 0);
              return priceDifference || a.nombre.localeCompare(b.nombre, "es");
            });
            const next = {
              ...componentCatalog,
              [category]: sortByPrice((componentCatalog[category] || []).some((item) => item.id === saved.id)
                ? componentCatalog[category].map((item) => (item.id === saved.id ? savedForCatalog : item))
                : [...(componentCatalog[category] || []), savedForCatalog]),
            };
            if (persistent) await saveComponentCatalog(next, componentPriceRules);
            setComponentCatalog(next);
            setEditComponente(null);
          }}
        />
      )}

      {/* Componentes admin removed — recreate with new prompt when ready */}
      {/* Bulk upload moved to a dedicated page: /admin/bulk-upload */}

      {confirmState && (
        <ConfirmDialog
          open={Boolean(confirmState.open)}
          title={confirmState.title}
          description={confirmState.description}
          loading={Boolean(confirmState.loading)}
          onOpenChange={(v) => {
            if (!v) setConfirmState(null);
            else setConfirmState((s) => (s ? { ...s, open: v } : s));
          }}
          onConfirm={async () => {
            if (!confirmState) return;
            setConfirmState((s) => (s ? { ...s, loading: true } : s));
            try {
              await confirmState.onConfirm();
            } finally {
              setConfirmState(null);
            }
          }}
        />
      )}
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div aria-hidden className="absolute -right-8 -top-10 size-28 rounded-full bg-sky-400/10 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </p>
      <p className="relative mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function SaveButton({
  dirty,
  saving,
  saved,
  error,
  onSave,
  persistent,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  onSave: () => void;
  persistent: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-rose-600">{error}</span>}
      {saved && !dirty && (
        <span className="flex items-center gap-1 text-sm text-emerald-600">
          <Check className="size-4" /> Guardado
        </span>
      )}
      <button
        onClick={onSave}
        disabled={!dirty || saving || !persistent}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saving ? "Guardando…" : dirty ? "Guardar cambios" : "Sin cambios"}
      </button>
    </div>
  );
}

function useSaver<T>(data: T, save: (d: T) => Promise<unknown>) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [baseline, setBaseline] = useState(() => JSON.stringify(data));
  const dirty = JSON.stringify(data) !== baseline;

  const run = async () => {
    setSaving(true);
    setError("");
    try {
      await save(data);
      setBaseline(JSON.stringify(data));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };
  return { saving, saved, error, dirty, run };
}

const panel = "rounded-3xl border border-slate-200/80 bg-white/95 p-5 text-slate-900 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6";
const input =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

/* ---------------------------- DASHBOARD ---------------------------- */

function DashboardTab({
  productos,
  setProductos,
  persistent,
  onEdit,
  movimientos,
  addMovement,
  onOpenBulk,
  onRequestConfirm,
}: {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  persistent: boolean;
  onEdit: (p: Producto) => void;
  movimientos: InventoryMovement[];
  addMovement: (movement: Omit<InventoryMovement, "id" | "fecha">) => void;
  onOpenBulk: () => void;
  onRequestConfirm?: (req: ConfirmRequest) => void;
}) {
  const { saving, saved, error, dirty, run } = useSaver(productos, saveProductos);
  const [filter, setFilter] = useState("");
  const [mostrarTodosMovimientos, setMostrarTodosMovimientos] = useState(false);
  const [visibleMovimientos, setVisibleMovimientos] = useState(5);

  const stockTotal = useMemo(
    () => productos.reduce((s, p) => s + (Number(p.stock) || 0), 0),
    [productos],
  );
  const valorInventario = useMemo(
    () =>
      productos.reduce(
        (s, p) => s + (Number(p.precioCosto) || 0) * (Number(p.stock) || 0),
        0,
      ),
    [productos],
  );

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria))].sort(),
    [productos],
  );

  const visible = productos
    .filter((p) =>
      `${p.nombre} ${p.categoria}`.toLowerCase().includes(filter.toLowerCase()),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unidades totales" value={stockTotal} />
        <StatCard label="Valor inventario" value={money(valorInventario)} />
        <StatCard label="Rol actual" value="ADMIN" />
      </div>

      <AddProductoForm
        categorias={categorias}
        persistent={persistent}
        onAdd={(p) => setProductos((cur) => [...cur, p])}
        onMovement={(movement) => addMovement(movement)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <BulkStockImport
          productos={productos}
          persistent={persistent}
          onImport={async (next) => {
            // retain previous import behavior when invoked programmatically
            const map = new Map(productos.map((p) => [normalizeCsvProductName(p.nombre), p]));
            const importedNames = new Set<string>();
            let creados = 0;
            let actualizados = 0;
            let marcadosSinStock = 0;

            for (const producto of next) {
              const key = normalizeCsvProductName(producto.nombre);
              const existing = map.get(key);
              const anterior = Number(existing?.stock) || 0;
              const nuevo = Number(producto.stock) || 0;
              const merged = existing
                ? { ...existing, ...producto, id: existing.id, imagen: existing.imagen || producto.imagen }
                : producto;

              map.set(key, merged);
              importedNames.add(key);
              if (existing) actualizados += 1;
              else creados += 1;

              if (anterior !== nuevo) {
                addMovement({
                  tipo: nuevo > anterior ? "entrada" : "salida",
                  producto: producto.nombre,
                  cantidad: Math.abs(nuevo - anterior),
                  anterior,
                  nuevo,
                  usuario: getCurrentAdminUser(),
                  origen: "importacion_csv",
                });
              }
            }

            for (const producto of productos) {
              const key = normalizeCsvProductName(producto.nombre);
              if (importedNames.has(key) || shouldIgnoreCsvProduct(producto.nombre)) continue;
              const anterior = Number(producto.stock) || 0;
              if (anterior === 0) continue;
              map.set(key, { ...producto, stock: 0 });
              marcadosSinStock += 1;
              addMovement({
                tipo: "salida",
                producto: producto.nombre,
                cantidad: anterior,
                anterior,
                nuevo: 0,
                usuario: getCurrentAdminUser(),
                origen: "importacion_csv",
              });
            }

            const finalProductos = Array.from(map.values());
            await saveProductos(finalProductos);
            setProductos(finalProductos);
            return { creados, actualizados, marcadosSinStock };
          }}
        />

        <section className={panel}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Historial de movimientos</h2>
              <p className="text-xs text-slate-500">
                {movimientos.length === 0
                  ? "Sin movimientos recientes"
                  : `Último movimiento de ${movimientos.length} registrado(s)`}
              </p>
            </div>
            {movimientos.length > 1 && (
              <button
                type="button"
                onClick={() => setMostrarTodosMovimientos((prev) => !prev)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {mostrarTodosMovimientos ? "Mostrar solo el último" : "Ver historial completo"}
              </button>
            )}
          </div>

          {movimientos.length === 0 && <p className="text-sm text-slate-500">No hay movimientos registrados.</p>}

          <div className={`${mostrarTodosMovimientos ? "max-h-[380px] overflow-y-auto pr-2" : ""} space-y-3`}>
            {(mostrarTodosMovimientos ? movimientos : movimientos.slice(0, 1)).map((movimiento) => {
              const meta = getMovementMeta(movimiento.tipo);
              return (
                <div
                  key={movimiento.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      <span className={meta.color}>{meta.label}</span> - {movimiento.producto}
                    </p>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      {movimiento.usuario} • {movimiento.origen}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold sm:text-base">{movimiento.cantidad} unidades</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      {new Date(movimiento.fecha).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {mostrarTodosMovimientos && visibleMovimientos < movimientos.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleMovimientos((prev) => prev + 5)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
              >
                Cargar más movimientos
              </button>
            </div>
          )}
        </section>
      </div>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gestión de inventario</h2>
            <p className="text-xs text-slate-500">
              {productos.length} accesorio(s) cargado(s)
            </p>
          </div>
          <SaveButton
            dirty={dirty}
            saving={saving}
            saved={saved}
            error={error}
            onSave={run}
            persistent={persistent}
          />
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${input} pl-9`}
            placeholder="Buscar accesorio…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-3">Producto</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2 text-orange-600">COSTO</th>
                <th className="px-3 py-2 text-emerald-700">PRECIO EFT</th>
                <th className="px-3 py-2 text-rose-700">CRÉDITO</th>
                <th className="px-3 py-2">Unidades</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      {p.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagen}
                          alt=""
                          className="size-9 shrink-0 rounded border bg-white object-contain"
                        />
                      )}
                      <span className="line-clamp-1 font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{p.categoria}</td>
                  <td className="px-3 py-2 font-semibold text-orange-600">{money(p.precioCosto)}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-700">{money(p.precio)}</td>
                  <td className="px-3 py-2 font-semibold text-rose-700">{money(calculateInstallmentPrice(p.precio))}</td>
                  <td className="px-3 py-2">
                    <span className={p.stock <= 0 ? "font-bold text-rose-600" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() =>
                          onRequestConfirm?.({
                            open: true,
                            title: `¿Eliminar "${p.nombre}"?`,
                            description: "Se eliminará este producto del inventario.",
                            onConfirm: () => {
                              setProductos((cur) => cur.filter((x) => x.id !== p.id));
                            },
                          })
                        }
                        className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AddProductoForm({
  categorias,
  persistent,
  onAdd,
  onMovement,
}: {
  categorias: string[];
  persistent: boolean;
  onAdd: (p: Producto) => void;
  onMovement: (movement: Omit<InventoryMovement, "id" | "fecha">) => void;
}) {
  const [form, setForm] = useState(emptyProducto());
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const margen = (Number(form.precio) || 0) - (Number(form.precioCosto) || 0);
  const pct = form.precioCosto
    ? Math.round((margen / Number(form.precioCosto)) * 100)
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persistent) return;
    setMsg("");
    setUploading(true);
    const producto = { ...form, id: newId(), imagen: form.imagen };
    onAdd(producto);
    onMovement({
      tipo: "entrada",
      producto: producto.nombre,
      cantidad: Number(producto.stock) || 0,
      anterior: 0,
      nuevo: Number(producto.stock) || 0,
      usuario: getCurrentAdminUser(),
      origen: "alta_manual",
    });
    setForm(emptyProducto());
    setUploading(false);
    setMsg("Producto agregado. Acordate de Guardar cambios.");
  };

  return (
    <section className={panel}>
      <h2 className="mb-4 text-lg font-semibold">Agregar nuevo producto</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={input}
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
          <select
            className={input}
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            placeholder="Costo de proveedor"
            value={form.precioCosto || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, precioCosto: Number(e.target.value) || 0 }))
            }
          />
          <input
            className={input}
            type="number"
            placeholder="Precio Cliente"
            value={form.precio || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, precio: Number(e.target.value) || 0 }))
            }
            required
          />
          <input
            className={`${input} md:col-span-2`}
            type="number"
            placeholder="Unidades a añadir"
            value={form.stock || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))
            }
          />
        </div>

        <div className="sm:col-span-2">
          <ImageField values={form.imagen ? [form.imagen] : []} onChange={(values) => setForm((f) => ({ ...f, imagen: values[0] || "" }))} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!persistent || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading && <Loader2 className="size-4 animate-spin" />}
            Guardar producto
          </button>
          <p className="text-sm font-medium text-emerald-600">
            Ganancia estimada: {money(margen)} ({pct}%)
          </p>
        </div>
        {msg && <p className="text-xs text-slate-500">{msg}</p>}
      </form>
    </section>
  );
}

function BulkStockImport({
  productos,
  persistent,
  onImport,
}: {
  productos: Producto[];
  persistent: boolean;
  onImport: (productos: Producto[]) => Promise<Partial<ImportSummary>>;
}) {
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const exportarCsv = () => {
    // Export format matches the import parser: Name, Category, Cost, Price, Quantity, DeletedAt
    const headers = ["Name", "Category", "Cost", "Price", "Quantity", "DeletedAt"];
    const rows = productos.map((producto) => [
      producto.nombre,
      producto.categoria,
      String(producto.precioCosto ?? 0),
      String(producto.precio ?? 0),
      String(producto.stock ?? 0),
      "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario_servitec.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMensaje("CSV exportado.");
  };

  const parseCsvRows = (text: string) => {
    const rows: string[][] = [];
    let current = "";
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        row.push(current);
        current = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(current);
        if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
        row = [];
        current = "";
        continue;
      }

      current += char;
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
    }

    return rows;
  };

  const importar = async () => {
    if (!archivoCsv) return;
    setImportando(true);
    setMensaje("");

    try {
      const csvText = await archivoCsv.text();
      const rows = parseCsvRows(csvText);
      if (rows.length < 2) {
        throw new Error("El CSV debe tener una cabecera y al menos una fila de datos.");
      }

      const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
      const idxName = headers.indexOf("name");
      const idxCategory = headers.indexOf("category");
      const idxCost = headers.indexOf("cost");
      const idxPrice = headers.indexOf("price");
      const idxQuantity = headers.indexOf("quantity");
      const idxDeletedAt = headers.indexOf("deletedat");

      if ([idxName, idxCategory, idxCost, idxPrice, idxQuantity].some((idx) => idx < 0)) {
        throw new Error("Faltan columnas obligatorias: Name, Category, Cost, Price o Quantity.");
      }

      const mapaPorNombre = new Map(productos.map((p) => [normalizeCsvProductName(p.nombre), p]));
      const importados: Producto[] = [];
      let creados = 0;
      let actualizados = 0;
      let omitidos = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const deletedAt = idxDeletedAt >= 0 ? String(row[idxDeletedAt] || "").trim() : "";
        if (deletedAt) {
          omitidos += 1;
          continue;
        }

        const nombre = String(row[idxName] || "").trim();
        const categoria = normalizeImportedCategory(String(row[idxCategory] || "").trim() || "ARTICULO");
        const parseNumber = (value: string | undefined) => {
          const normalized = String(value ?? "").trim().replace(",", ".");
          return normalized ? Number(normalized) : Number.NaN;
        };
        const costo = parseNumber(row[idxCost]);
        const precio = parseNumber(row[idxPrice]);
        const stock = parseNumber(row[idxQuantity]);
        const nombreNormalizado = normalizeCsvProductName(nombre);

        if (!nombre || shouldIgnoreCsvProduct(nombre) || !Number.isFinite(costo) || !Number.isFinite(precio) || !Number.isFinite(stock)) {
          omitidos += 1;
          continue;
        }

        const existente = mapaPorNombre.get(nombreNormalizado);
        const producto: Producto = {
          id: existente?.id || newId(),
          nombre,
          categoria,
          precioCosto: costo,
          precio,
          stock,
          imagen: existente?.imagen || "",
        };

        importados.push(producto);
        mapaPorNombre.set(nombreNormalizado, producto);
      }

      if (importados.length === 0) {
        throw new Error("No se encontraron productos válidos para importar.");
      }

      const resultado = await onImport(importados);
      setArchivoCsv(null);
      setMensaje(
        `Importacion completada. Creados: ${resultado.creados ?? creados}, actualizados: ${resultado.actualizados ?? actualizados}, marcados sin stock: ${resultado.marcadosSinStock ?? 0}, omitidos: ${omitidos}.`,
      );
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo importar el CSV.");
    } finally {
      setImportando(false);
    }
  };

  return (
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Carga de Inventario</h2>
          <p className="text-xs text-slate-500">Exportá el inventario en el formato compatible con la importación.</p>
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Exportar CSV
        </button>
      </div>

      {mensaje && <p className="mt-3 text-xs text-slate-500">{mensaje}</p>}
    </section>
  );
}

/* --------------------------- COMPONENTES -------------------------- */

function ComponentesTab({
  catalog,
  setCatalog,
  persistent,
  onEdit,
  onOpenBulk,
  onRequestConfirm,
  priceRules,
  setPriceRules,
}: {
  catalog: ComponentCatalog;
  setCatalog: React.Dispatch<React.SetStateAction<ComponentCatalog>>;
  persistent: boolean;
  onEdit: (component: CatalogProduct) => void;
  onOpenBulk: () => void;
  onRequestConfirm?: (req: ConfirmRequest) => void;
  priceRules: ComponentPriceRules;
  setPriceRules: React.Dispatch<React.SetStateAction<ComponentPriceRules>>;
}) {
  const pricingState = { catalog, priceRules };
  const { saving, saved, error, dirty, run } = useSaver(pricingState, (next) => saveComponentCatalog(next.catalog, next.priceRules));
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<ComponentCatalogKey | "all">("all");
  const [applyingMargin, setApplyingMargin] = useState(false);
  const [marginMessage, setMarginMessage] = useState("");
  const [showMarginRules, setShowMarginRules] = useState(true);
  const ruleCategory = category === "all" ? null : category;
  const visible = useMemo(() => catalogDataKeys.flatMap((key) =>
    (category === "all" || category === key ? catalog[key] || [] : [])
      .map((component) => ({ key, component })),
  ).filter(({ component }) =>
    `${component.nombre} ${component.marca} ${component.modelo}`.toLowerCase().includes(filter.toLowerCase()),
  ), [catalog, category, filter]);

  const create = () => {
    const key = category === "all" ? catalogDataKeys[0] : category;
    onEdit(normalizeCatalogProduct({ id: newId(), nombre: "", precio: 0, precioCosto: 0, stock: 0, imagen: "", categoria: key }, key, 0));
  };

  const remove = (key: ComponentCatalogKey, id: string) => {
    const component = catalog[key]?.find((item) => item.id === id);
    if (!component) return;
    const deleteComponent = async () => {
      const next = { ...catalog, [key]: catalog[key].filter((item) => item.id !== id) };
      setCatalog(next);
      if (persistent) {
        try {
          await saveComponentCatalog(next, priceRules);
        } catch {
          setCatalog(catalog);
        }
      }
    };
    onRequestConfirm?.({
      open: true,
      title: "Eliminar componente",
      description: `Se eliminará “${component.nombre}” del catálogo. Esta acción no se puede deshacer.`,
      onConfirm: deleteComponent,
    });
  };

  const applyMargin = async () => {
    if (!ruleCategory) {
      setMarginMessage("Selecciona una categoria para aplicar el margen.");
      return;
    }
    const rules = priceRules[ruleCategory] || [];
    const nextCategory = (catalog[ruleCategory] || []).map((component) => {
      const cost = Number(component.precioCosto ?? component.precio) || 0;
      const rule = rules.find((item) => cost >= (item.min || 0) && (item.max == null || cost < item.max));
      const price = rule ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100) : Math.round(cost);
      return { ...component, precioCosto: cost, precio: price };
    });
    const next = { ...catalog, [ruleCategory]: nextCategory };
    setApplyingMargin(true);
    setMarginMessage("");
    try {
      if (persistent) await saveComponentCatalog(next, priceRules);
      setCatalog(next);
      setMarginMessage(`Margen aplicado en ${componentCatalogLabels[ruleCategory].toUpperCase()}.`);
    } catch (e) {
      setMarginMessage(e instanceof Error ? e.message : "No se pudo aplicar el margen.");
    } finally {
      setApplyingMargin(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Componentes" value={catalogDataKeys.reduce((sum, key) => sum + (catalog[key]?.length || 0), 0)} />
        <StatCard label="Categorías" value={catalogDataKeys.filter((key) => (catalog[key]?.length || 0) > 0).length} />
        <StatCard label="Origen" value="Vercel Blob" />
      </div>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Componentes</h2>
            <p className="text-xs text-slate-500">Catálogo compartido por Armá tu PC y la tienda de componentes.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <button onClick={create} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4">
              <Plus className="size-4" /> Nuevo componente
            </button>
            <button onClick={onOpenBulk} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4">
              Carga masiva
            </button>
            <SaveButton dirty={dirty} saving={saving} saved={saved} error={error} onSave={run} persistent={persistent} />
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className={`${input} pl-9`} placeholder="Buscar componente..." value={filter} onChange={(event) => setFilter(event.target.value)} />
          </div>
          <select className={input} value={category} onChange={(event) => setCategory(event.target.value as ComponentCatalogKey | "all")}>
            <option value="all">Todas las categorías</option>
            {catalogDataKeys.map((key) => <option key={key} value={key}>{componentCatalogLabels[key].toUpperCase()}</option>)}
          </select>
        </div>

        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowMarginRules((visible) => !visible)}
            className="min-h-10 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-expanded={showMarginRules}
          >
            {showMarginRules ? "Ocultar margen" : "Mostrar margen"}
          </button>
        </div>
        {showMarginRules && <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Margen por rango</h3>
            <p className="text-xs text-slate-500">Se aplica al costo cargado y define el efectivo/transferencia de esta categoría.</p>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">Los cambios se calculan desde el costo.</span>
            <button
              type="button"
              onClick={() => void applyMargin()}
              disabled={!ruleCategory || applyingMargin || !persistent}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyingMargin && <Loader2 className="size-4 animate-spin" />}
              {applyingMargin ? "Aplicando..." : "Aplicar margen"}
            </button>
          </div>
          {ruleCategory ? (
            <CategoryPriceRules
              rules={priceRules[ruleCategory] || []}
              onChange={(rules) => setPriceRules((current) => ({ ...current, [ruleCategory]: rules }))}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-3 text-sm text-slate-600">Selecciona una categoria para editar y aplicar sus rangos.</p>
          )}
          {marginMessage && <p className="mt-3 text-xs font-semibold text-slate-600">{marginMessage}</p>}
        </div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-slate-400">
              <tr><th className="px-3 py-2">COMPONENTE</th><th className="px-3 py-2">CATEGORÍA</th><th className="px-3 py-2 text-orange-600">COSTO</th><th className="px-3 py-2 text-emerald-700">PRECIO EFT</th><th className="px-3 py-2 text-rose-700">CRÉDITO</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className="divide-y">
              {visible.map(({ key, component }) => (
                <tr key={`${key}-${component.id}`} className="hover:bg-slate-50">
                  <td className="px-3 py-2"><div className="flex items-center gap-2">{component.imagen && <img src={component.imagen} alt="" className="size-9 rounded border object-contain" />}{component.nombre}</div></td>
                  <td className="px-3 py-2 text-slate-500">{componentCatalogLabels[key].toUpperCase()}</td>
                  <td className="px-3 py-2 font-semibold text-orange-600">{money(Number(component.precioCosto ?? component.precio))}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-700">{money(component.precio)}</td>
                  <td className="px-3 py-2 font-semibold text-rose-700">{money(calculateInstallmentPrice(Number(component.precio) || 0))}</td>
                  <td className="px-3 py-2 text-right"><button onClick={() => onEdit(component)} className="mr-2 rounded border p-2 hover:bg-slate-100" aria-label="Editar"><Pencil className="size-4" /></button><button onClick={() => void remove(key, component.id)} className="rounded border p-2 text-rose-600 hover:bg-rose-50" aria-label="Eliminar"><Trash2 className="size-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No hay componentes cargados en Blob.</p>}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------ STOCK ----------------------------- */

function StockTab({
  equipos,
  setEquipos,
  persistent,
  onEdit,
  onRequestConfirm,
}: {
  equipos: Equipo[];
  setEquipos: React.Dispatch<React.SetStateAction<Equipo[]>>;
  persistent: boolean;
  onEdit: (e: Equipo) => void;
  onRequestConfirm?: (req: ConfirmRequest) => void;
}) {
  const { saving, saved, error, dirty, run } = useSaver(equipos, saveEquipos);
  const [filter, setFilter] = useState("");

  const disponibles = equipos.filter((e) => e.estado !== "vendido").length;
  const destacados = equipos.filter((e) => e.recomendada).length;

  const sorted = useMemo(
    () => [...equipos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [equipos],
  );
  const visible = sorted.filter((e) =>
    `${e.nombre} ${e.marca} ${e.categoria}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  const groupedVisible = useMemo(() => {
    const groups = CATEGORIAS_EQUIPO.map((category) => ({
      category,
      items: visible.filter((e) => normalizeStockCategoryValue(e.categoria) === category.value),
    })).filter((group) => group.items.length > 0);

    if (groups.length > 0) return groups;

    return [
      {
        category: { value: "otros", label: "Otros" },
        items: visible,
      },
    ];
  }, [visible]);

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((e) => e.id === id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[j]] = [next[j], next[idx]];
    setEquipos(next.map((e, i) => ({ ...e, orden: i })));
  };
  const patch = (id: string, p: Partial<Equipo>) =>
    setEquipos((cur) => cur.map((e) => (e.id === id ? { ...e, ...p } : e)));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Equipos" value={equipos.length} />
        <StatCard label="Disponibles" value={disponibles} />
        <StatCard label="Destacados" value={destacados} />
      </div>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Equipos en stock</h2>
            <p className="text-xs text-slate-500">
              Celulares, notebooks, PC armadas, tablets y TVs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(emptyEquipo())}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Plus className="size-4" /> Nuevo equipo
            </button>
            <SaveButton
              dirty={dirty}
              saving={saving}
              saved={saved}
              error={error}
              onSave={run}
              persistent={persistent}
            />
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${input} pl-9`}
            placeholder="Buscar equipo…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          {groupedVisible.map(({ category, items }) => (
            <div key={category.value} className="rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
                  {category.label}
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {items.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="w-20 py-2 pr-3">Orden</th>
                      <th className="px-3 py-2">Equipo</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2">Precio</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2 pr-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => move(e.id, -1)}
                              className="rounded border p-1 hover:bg-slate-100"
                              aria-label="Subir"
                            >
                              <ArrowUp className="size-3" />
                            </button>
                            <button
                              onClick={() => move(e.id, 1)}
                              className="rounded border p-1 hover:bg-slate-100"
                              aria-label="Bajar"
                            >
                              <ArrowDown className="size-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {e.imagenes[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={e.imagenes[0]}
                                alt=""
                                className="size-9 shrink-0 rounded border object-cover"
                              />
                            )}
                            <span className="line-clamp-1 font-medium">
                              {e.nombre || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {catLabel(e.categoria)}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {money(e.promo || e.original)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              patch(e.id, {
                                estado:
                                  e.estado === "vendido" ? "disponible" : "vendido",
                              })
                            }
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              e.estado === "vendido"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {e.estado === "vendido" ? "Vendido" : "Disponible"}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => patch(e.id, { recomendada: !e.recomendada })}
                              className={`rounded p-1.5 hover:bg-slate-100 ${
                                e.recomendada ? "text-amber-500" : "text-slate-400"
                              }`}
                              aria-label="Destacar"
                            >
                              <Star
                                className="size-4"
                                fill={e.recomendada ? "currentColor" : "none"}
                              />
                            </button>
                            <button
                              onClick={() => onEdit(e)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                              aria-label="Editar"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() =>
                                onRequestConfirm?.({
                                  open: true,
                                  title: `¿Eliminar "${e.nombre}"?`,
                                  description: "Se eliminará este equipo.",
                                  onConfirm: async () => {
                                    if (persistent) {
                                      const next = equipos
                                        .filter((x) => x.id !== e.id)
                                        .map((item, i) => ({ ...item, orden: typeof item.orden === "number" ? item.orden : i }));
                                      try {
                                        await saveEquipos(next);
                                        window.dispatchEvent(new Event("equiposUpdated"));
                                        setEquipos(next);
                                      } catch (err) {
                                        console.error("delete equipo", err);
                                        alert("No se pudo eliminar el equipo.");
                                      }
                                    } else {
                                      setEquipos((cur) => cur.filter((x) => x.id !== e.id));
                                    }
                                  },
                                })
                              }
                              className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-slate-400">
              Sin resultados
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
