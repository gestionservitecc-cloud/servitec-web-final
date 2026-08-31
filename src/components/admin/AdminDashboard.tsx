"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  CATEGORIAS_EQUIPO,
  emptyEquipo,
  emptyProducto,
  newId,
  saveEquipos,
  saveProductos,
  uploadImage,
} from "./lib";
import { EquipoDialog } from "./EquipoDialog";
import { ProductoDialog } from "./ProductoDialog";

const money = (n: number) =>
  `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
const catLabel = (v: string) =>
  CATEGORIAS_EQUIPO.find((c) => c.value === v)?.label || v;

type Segment = "dashboard" | "stock";

export function AdminDashboard({ persistent }: { persistent: boolean }) {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("dashboard");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEquipo, setEditEquipo] = useState<Equipo | null>(null);
  const [editProducto, setEditProducto] = useState<Producto | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/equipos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/productos").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([e, p]) => {
        setEquipos(Array.isArray(e) ? e : []);
        setProductos(Array.isArray(p) ? p : []);
      })
      .finally(() => setLoading(false));
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-xl sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border border-white/15 bg-white/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ServiTec" className="h-full w-full object-contain" />
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
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Ir al inicio
          </a>
          <button
            onClick={logout}
            className="rounded-xl border border-rose-300/30 bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-xl sm:grid-cols-2">
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
              label: "Stock",
              description: "Nuevos y reacondicionados",
              icon: Boxes,
            },
          ] as const
        ).map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSegment(id)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
              segment === id
                ? "bg-white text-slate-950 shadow-lg"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide">
                {label}
              </span>
              <span
                className={`block text-xs ${
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
        />
      ) : (
        <StockTab
          equipos={equipos}
          setEquipos={setEquipos}
          persistent={persistent}
          onEdit={setEditEquipo}
        />
      )}

      {editEquipo && (
        <EquipoDialog
          equipo={editEquipo}
          onClose={() => setEditEquipo(null)}
          onSave={(saved) => {
            setEquipos((cur) => {
              const exists = cur.some((e) => e.id === saved.id);
              return exists
                ? cur.map((e) => (e.id === saved.id ? saved : e))
                : [...cur, { ...saved, orden: cur.length }];
            });
            setEditEquipo(null);
          }}
        />
      )}

      {editProducto && (
        <ProductoDialog
          producto={editProducto}
          categorias={[...new Set(productos.map((p) => p.categoria))].sort()}
          onClose={() => setEditProducto(null)}
          onSave={(saved) => {
            setProductos((cur) =>
              cur.some((p) => p.id === saved.id)
                ? cur.map((p) => (p.id === saved.id ? saved : p))
                : [...cur, saved],
            );
            setEditProducto(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
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
        className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setBaseline(JSON.stringify(data)), []);
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

const panel = "rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl sm:p-6";
const input =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-900";

/* ---------------------------- DASHBOARD ---------------------------- */

function DashboardTab({
  productos,
  setProductos,
  persistent,
  onEdit,
}: {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  persistent: boolean;
  onEdit: (p: Producto) => void;
}) {
  const { saving, saved, error, dirty, run } = useSaver(productos, saveProductos);
  const [filter, setFilter] = useState("");

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
        <StatCard label="Stock total" value={stockTotal} />
        <StatCard label="Valor inventario" value={money(valorInventario)} />
        <StatCard label="Rol actual" value="admin" />
      </div>

      <AddProductoForm
        categorias={categorias}
        persistent={persistent}
        onAdd={(p) => setProductos((cur) => [...cur, p])}
      />

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
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-3">Producto</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Costo</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Stock</th>
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
                  <td className="px-3 py-2 text-slate-500">{money(p.precioCosto)}</td>
                  <td className="px-3 py-2 font-semibold">{money(p.precio)}</td>
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
                        onClick={() => {
                          if (confirm(`¿Eliminar "${p.nombre}"?`))
                            setProductos((cur) => cur.filter((x) => x.id !== p.id));
                        }}
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
}: {
  categorias: string[];
  persistent: boolean;
  onAdd: (p: Producto) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
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
    let imagen = form.imagen;
    const file = fileRef.current?.files?.[0];
    if (file) {
      try {
        setUploading(true);
        imagen = await uploadImage(file);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Error al subir la imagen");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onAdd({ ...form, id: newId(), imagen });
    setForm(emptyProducto());
    if (fileRef.current) fileRef.current.value = "";
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
          <input
            className={input}
            list="add-cat-list"
            placeholder="Seleccionar categoría"
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            required
          />
          <datalist id="add-cat-list">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
            placeholder="Stock a añadir"
            value={form.stock || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))
            }
          />
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="text-sm" />

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

/* ------------------------------ STOCK ----------------------------- */

function StockTab({
  equipos,
  setEquipos,
  persistent,
  onEdit,
}: {
  equipos: Equipo[];
  setEquipos: React.Dispatch<React.SetStateAction<Equipo[]>>;
  persistent: boolean;
  onEdit: (e: Equipo) => void;
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
              {visible.map((e) => (
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
                        onClick={() => {
                          if (confirm(`¿Eliminar "${e.nombre}"?`))
                            setEquipos((cur) => cur.filter((x) => x.id !== e.id));
                        }}
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
