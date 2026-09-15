"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  getCoreRowModel,
  getSortedRowModel,
  type LegacyColumnDef as ColumnDef,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import type { SortingState } from "@tanstack/table-core";
import {
  Boxes,
  Check,
  CircleDollarSign,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Equipo, EquipoCategoria, Producto } from "@/lib/types";
import { getAssetUrl } from "@/lib/asset-url";
import {
  calculateInstallmentPrice,
  formatCurrencyInput,
  normalizeCsvProductName,
  normalizeEquipmentCondition,
  normalizeImportedCategory,
  normalizeStockCategoryValue,
  parsePrice,
  shouldIgnoreCsvProduct,
} from "@/lib/utils";
import {
  CATEGORIAS_EQUIPO,
  emptyEquipo,
  emptyProducto,
  newId,
  saveComponentCatalog,
  saveStockCatalog,
  saveProductos,
} from "./lib";
import type { ComponentPriceRules, DollarQuote, PriceRule } from "./lib";
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
import NotebookBulkUpload from "./NotebookBulkUpload";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const money = (n: number) =>
  `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
const productCategoryLabel = (value: string) =>
  /accesorios/i.test(value) ? "Productos" : value;
const INITIAL_DOLLAR_QUOTE = 1545;
const catLabel = (v: string) =>
  CATEGORIAS_EQUIPO.find((c) => c.value === v)?.label || v;

const componentKeyFromValue = (value: unknown): ComponentCatalogKey | null => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
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
  return (
    catalogDataKeys.find(
      (key) =>
        key === normalized ||
        folders[key] === normalized ||
        componentCatalogLabels[key].toLowerCase() === normalized,
    ) || null
  );
};

type Segment = "dashboard" | "stock" | "componentes";

const adminSections = [
  {
    id: "dashboard",
    label: "Productos",
    description: "Productos y accesorios",
    icon: LayoutDashboard,
  },
  {
    id: "stock",
    label: "Equipos",
    description: "Equipos y reacondicionados",
    icon: Package,
  },
  {
    id: "componentes",
    label: "Componentes",
    description: "Armá tu PC y tienda",
    icon: Boxes,
  },
] as const;

const adminSectionTitle = (segment: Segment) =>
  adminSections.find((section) => section.id === segment)?.label || "Panel";

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
const getCurrentAdminUser = () => {
  return "Administrador Google";
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
    window.localStorage.setItem(
      STORAGE_KEY_MOVEMENTS,
      JSON.stringify(movements),
    );
  } catch {
    // no-op
  }
};

const getMovementMeta = (tipo: InventoryMovement["tipo"]) => ({
  label: tipo === "entrada" ? "Entrada" : "Salida",
  color: tipo === "entrada" ? "text-emerald-700" : "text-rose-700",
});

function AdminSidebar({
  segment,
  onSelect,
  onLogout,
}: {
  segment: Segment;
  onSelect: (segment: Segment) => void;
  onLogout: () => void;
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" className="border-sidebar-border/70">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 px-3 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white p-1.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetUrl("logo.png")}
              alt="ServiTec"
              className="size-full object-contain"
            />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-display text-lg font-bold leading-none text-white">
              Servi<span className="text-primary">Tec</span>
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Administración
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión de catálogo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminSections.map(({ id, label, description, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    type="button"
                    size="lg"
                    isActive={segment === id}
                    tooltip={label}
                    onClick={() => onSelect(id)}
                    className="h-auto min-h-12 py-2.5 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Icon />
                    <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="block truncate font-semibold">{label}</span>
                      <span className="block truncate text-xs font-normal text-sidebar-foreground/55 group-data-[active=true]:text-primary-foreground/75">
                        {description}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver sitio web">
              <Link href="/" target="_blank">
                <ExternalLink />
                <span>Ver sitio web</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Cerrar sesión"
              onClick={onLogout}
              className="text-rose-200 hover:bg-rose-500/15 hover:text-rose-100"
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminDashboard({
  persistent,
  canManageCatalog,
}: {
  persistent: boolean;
  canManageCatalog: boolean;
}) {
  const [segment, setSegment] = useState<Segment>("dashboard");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [componentCatalog, setComponentCatalog] = useState<ComponentCatalog>(
    () =>
      Object.fromEntries(
        catalogDataKeys.map((key) => [key, []]),
      ) as ComponentCatalog,
  );
  const [componentPriceRules, setComponentPriceRules] =
    useState<ComponentPriceRules>({});
  const [dollarQuote, setDollarQuote] = useState<DollarQuote | null>(null);
  const [notebookPriceRules, setNotebookPriceRules] = useState<PriceRule[]>([]);
  const [movimientos, setMovimientos] =
    useState<InventoryMovement[]>(readStoredMovements);
  const [loading, setLoading] = useState(true);
  const [editEquipo, setEditEquipo] = useState<Equipo | null>(null);
  const [editProducto, setEditProducto] = useState<Producto | null>(null);
  const [editComponente, setEditComponente] = useState<CatalogProduct | null>(
    null,
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    loading?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const reduceMotion = useReducedMotion();

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
      fetch("/api/admin/stock").then(async (r) => {
        if (r.ok) return r.json();
        const fallback = await fetch("/api/admin/equipos");
        return fallback.ok ? fallback.json() : [];
      }),
      fetch("/api/admin/productos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/componentes").then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([e, p, c]) => {
        const stockResponse = e as { equipos?: Equipo[]; notebookPriceRules?: PriceRule[]; dollarQuote?: DollarQuote | null } | null;
        const loadedEquipos = Array.isArray(stockResponse?.equipos)
          ? stockResponse.equipos
          : Array.isArray(e)
            ? e
            : [];
        setEquipos(loadedEquipos.map((equipment) => ({
          ...equipment,
          condition: normalizeEquipmentCondition(equipment.condition),
        })));
        setNotebookPriceRules(Array.isArray(stockResponse?.notebookPriceRules) ? stockResponse.notebookPriceRules : []);
        setProductos(Array.isArray(p) ? p : []);
        if (c && typeof c === "object") {
          const response = c as {
            catalog?: ComponentCatalog;
            priceRules?: ComponentPriceRules;
            dollarQuote?: DollarQuote | null;
          };
          setComponentCatalog(response.catalog || (c as ComponentCatalog));
          setComponentPriceRules(response.priceRules || {});
          setDollarQuote(response.dollarQuote || stockResponse?.dollarQuote || null);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    await signOut({ callbackUrl: "/admin" });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-7 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar segment={segment} onSelect={setSegment} onLogout={logout} />
      <SidebarInset className="min-w-0 bg-transparent text-white">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 overflow-x-hidden px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-10 shrink-0 text-white hover:bg-white/10 hover:text-white" />
            <div className="grid size-12 place-items-center rounded-xl border border-white/15 bg-white/10 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAssetUrl("logo.png")}
                alt="ServiTec"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-2xl font-black leading-none tracking-tight">
                <span className="text-white">Servi</span>
                <span className="text-primary">Tec</span>
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">
                {adminSectionTitle(segment)} · Panel administrativo
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={persistent
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                : "border-amber-300/25 bg-amber-400/10 text-amber-100"}
            >
              <CircleDollarSign className="mr-1 size-3" />
              {persistent ? "Cambios activos" : "Solo lectura"}
            </Badge>
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
        <nav className="hidden grid gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-xl sm:grid-cols-3">
          {(
            [
              {
                id: "dashboard",
                label: "Productos",
                description: "Productos y accesorios de tienda",
                icon: LayoutDashboard,
              },
              {
                id: "stock",
                label: "Equipos",
                description: "Equipos y reacondicionados",
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
              type="button"
              onClick={() => setSegment(id)}
              className={`flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition ${id === "dashboard" ? "order-1" : id === "componentes" ? "order-2" : "order-3"} hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:px-4 ${
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
            <strong className="font-semibold">Modo solo lectura.</strong>{" "}
            Conectá la integración <strong>Vercel Blob</strong> al proyecto para
            guardar cambios y subir imágenes.
          </div>
        )}

        <motion.div
          key={segment}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
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
              canManageCatalog={canManageCatalog}
              onEdit={setEditEquipo}
              onRequestConfirm={setConfirmState}
              notebookPriceRules={notebookPriceRules}
              setNotebookPriceRules={setNotebookPriceRules}
              dollarQuote={dollarQuote}
              setDollarQuote={setDollarQuote}
            />
          ) : (
            <ComponentesTab
              catalog={componentCatalog}
              setCatalog={setComponentCatalog}
              persistent={persistent}
              canManageCatalog={canManageCatalog}
              onEdit={setEditComponente}
              onOpenBulk={() => setBulkOpen(true)}
              onRequestConfirm={setConfirmState}
              priceRules={componentPriceRules}
              setPriceRules={setComponentPriceRules}
              dollarQuote={dollarQuote}
              setDollarQuote={setDollarQuote}
            />
          )}
        </motion.div>

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
                    const response = catalog as {
                      catalog?: ComponentCatalog;
                      priceRules?: ComponentPriceRules;
                      dollarQuote?: DollarQuote | null;
                    };
                    setComponentCatalog(
                      response.catalog || (catalog as ComponentCatalog),
                    );
                    setComponentPriceRules(response.priceRules || {});
                    setDollarQuote(response.dollarQuote || null);
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
                await saveStockCatalog(
                  next,
                  notebookPriceRules,
                  dollarQuote || undefined,
                );
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
              const category =
                componentKeyFromValue(saved.categoria) ||
                componentKeyFromValue(editComponente.categoria) ||
                "motherboard";
              const savedForCatalog = { ...saved, categoria: category };
              const sortByPrice = (items: CatalogProduct[]) =>
                [...items].sort((a, b) => {
                  const priceDifference =
                    (Number(a.precio) || 0) - (Number(b.precio) || 0);
                  return (
                    priceDifference || a.nombre.localeCompare(b.nombre, "es")
                  );
                });
              const next = {
                ...componentCatalog,
                [category]: sortByPrice(
                  (componentCatalog[category] || []).some(
                    (item) => item.id === saved.id,
                  )
                    ? componentCatalog[category].map((item) =>
                        item.id === saved.id ? savedForCatalog : item,
                      )
                    : [...(componentCatalog[category] || []), savedForCatalog],
                ),
              };
              if (persistent)
                await saveComponentCatalog(next, componentPriceRules);
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
      </SidebarInset>
    </SidebarProvider>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div
        aria-hidden
        className="absolute -right-8 -top-10 size-28 rounded-full bg-sky-400/10 blur-2xl"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </p>
      <p className="relative mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

const inventoryChartConfig = {
  unidades: {
    label: "Unidades",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

function InventoryCategoryChart({
  data,
}: {
  data: Array<{ categoria: string; unidades: number }>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
            Inventario actual
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">Unidades por categoría</h2>
        </div>
        <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-cyan-100">
          Top {data.length}
        </span>
      </div>
      {data.length > 0 ? (
        <ChartContainer config={inventoryChartConfig} className="h-56 w-full aspect-auto">
          <BarChart data={data} accessibilityLayer margin={{ left: -18, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.10)" />
            <XAxis
              dataKey="categoria"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="unidades" fill="var(--color-unidades)" radius={[7, 7, 0, 0]} />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="grid h-56 place-items-center text-sm text-white/55">
          Aún no hay unidades para visualizar.
        </p>
      )}
    </section>
  );
}

function AdminGuide({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-slate-700">
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-1 leading-relaxed">{children}</p>
    </div>
  );
}

function SaveButton({
  dirty,
  saving,
  saved,
  error,
  onSave,
  onRevert,
  persistent,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  onSave: () => void;
  onRevert?: () => void;
  persistent: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {error && <span className="text-sm text-rose-600">{error}</span>}
      {saved && !dirty && (
        <span className="flex items-center gap-1 text-sm text-emerald-600">
          <Check className="size-4" /> Guardado
        </span>
      )}
      {onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={!dirty || saving}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Revertir cambios
        </button>
      )}
      <button
        type="button"
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
  const revert = () => {
    try {
      return JSON.parse(baseline) as T;
    } catch {
      return data;
    }
  };
  return { saving, saved, error, dirty, run, revert };
}

const panel =
  "rounded-3xl border border-slate-200/80 bg-white/95 p-5 text-slate-900 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6";
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
  const { saving, saved, error, dirty, run, revert } = useSaver(
    productos,
    saveProductos,
  );
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nombre", desc: false },
  ]);
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
  const stockPorCategoria = useMemo(
    () =>
      Object.entries(
        productos.reduce<Record<string, number>>((result, producto) => {
          const categoria = productCategoryLabel(producto.categoria || "Sin categoría");
          result[categoria] = (result[categoria] || 0) + (Number(producto.stock) || 0);
          return result;
        }, {}),
      )
        .map(([categoria, unidades]) => ({ categoria, unidades }))
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 6),
    [productos],
  );

  const visible = productos
    .filter((p) => categoryFilter === "all" || p.categoria === categoryFilter)
    .filter((p) => `${p.nombre} ${p.categoria}`.toLowerCase().includes(filter.toLowerCase()));
  const productColumns = useMemo<ColumnDef<Producto>[]>(
    () => [
      { accessorKey: "nombre", id: "nombre" },
      { accessorKey: "categoria", id: "categoria" },
      { accessorKey: "precioCosto", id: "precioCosto" },
      { accessorKey: "precio", id: "precio" },
      {
        id: "credito",
        accessorFn: (producto) => calculateInstallmentPrice(producto.precio),
      },
      { accessorKey: "stock", id: "stock" },
    ],
    [],
  );
  const productTable = useReactTable({
    data: visible,
    columns: productColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const sortableHeader = (columnId: string, label: string, className = "") => {
    const column = productTable.getColumn(columnId);
    const direction = column?.getIsSorted();
    return (
      <button
        type="button"
        onClick={column?.getToggleSortingHandler()}
        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${className}`}
      >
        {label}
        <span aria-hidden className="text-[10px] text-slate-400">
          {direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}
        </span>
      </button>
    );
  };
  const allVisibleProductsSelected =
    visible.length > 0 &&
    visible.every((product) => selectedProducts.has(product.id));
  const toggleProduct = (id: string) =>
    setSelectedProducts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const deleteSelectedProducts = () => {
    if (!selectedProducts.size) return;
    onRequestConfirm?.({
      open: true,
      title: `¿Eliminar ${selectedProducts.size} producto(s)?`,
      description: "Se eliminarán los productos seleccionados del inventario.",
      onConfirm: () => {
        setProductos((current) =>
          current.filter((product) => !selectedProducts.has(product.id)),
        );
        setSelectedProducts(new Set());
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminGuide title="Productos de tienda">
        Administra productos y accesorios. El stock y las unidades se controlan en esta seccion; los precios se guardan en pesos argentinos.
      </AdminGuide>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unidades totales" value={stockTotal} />
        <StatCard label="Valor inventario" value={money(valorInventario)} />
        <StatCard label="Rol actual" value="ADMIN" />
      </div>

      <InventoryCategoryChart data={stockPorCategoria} />

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
            const map = new Map(
              productos.map((p) => [normalizeCsvProductName(p.nombre), p]),
            );
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
                ? {
                    ...existing,
                    ...producto,
                    id: existing.id,
                    imagen: existing.imagen || producto.imagen,
                  }
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
              if (
                importedNames.has(key) ||
                shouldIgnoreCsvProduct(producto.nombre)
              )
                continue;
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
              <h2 className="text-lg font-semibold">
                Historial de movimientos
              </h2>
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
                {mostrarTodosMovimientos
                  ? "Mostrar solo el último"
                  : "Ver historial completo"}
              </button>
            )}
          </div>

          {movimientos.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay movimientos registrados.
            </p>
          )}

          <div
            className={`${mostrarTodosMovimientos ? "max-h-[380px] overflow-y-auto pr-2" : ""} space-y-3`}
          >
            {(mostrarTodosMovimientos
              ? movimientos
              : movimientos.slice(0, 1)
            ).map((movimiento) => {
              const meta = getMovementMeta(movimiento.tipo);
              return (
                <div
                  key={movimiento.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      <span className={meta.color}>{meta.label}</span> -{" "}
                      {movimiento.producto}
                    </p>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      {movimiento.usuario} • {movimiento.origen}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold sm:text-base">
                      {movimiento.cantidad} unidades
                    </p>
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

          {mostrarTodosMovimientos &&
            visibleMovimientos < movimientos.length && (
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
              {productos.length} producto(s) cargado(s)
            </p>
          </div>
          <SaveButton
            dirty={dirty}
            saving={saving}
            saved={saved}
            error={error}
            onSave={run}
            onRevert={() => setProductos(revert())}
            persistent={persistent}
          />
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
          <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${input} pl-9`}
            placeholder="Buscar producto…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          </div>
          <select
            className={input}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{productCategoryLabel(categoria)}</option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allVisibleProductsSelected}
              onChange={() =>
                setSelectedProducts((current) =>
                  allVisibleProductsSelected
                    ? new Set(
                        [...current].filter(
                          (id) => !visible.some((product) => product.id === id),
                        ),
                      )
                    : new Set([
                        ...current,
                        ...visible.map((product) => product.id),
                      ]),
                )
              }
              className="size-4 accent-sky-600"
            />
            Seleccionar visibles
          </label>
          {selectedProducts.size > 0 && (
            <button
              type="button"
              onClick={deleteSelectedProducts}
              className="min-h-10 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Eliminar seleccionados ({selectedProducts.size})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm md:min-w-[720px]">
            <thead className="border-b text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="w-10 py-2">
                  <span className="sr-only">Seleccionar</span>
                </th>
                <th className="py-2 pr-3">{sortableHeader("nombre", "Producto")}</th>
                <th className="hidden px-3 py-2 md:table-cell">{sortableHeader("categoria", "Categoría")}</th>
                <th className="hidden px-3 py-2 text-orange-600 md:table-cell">{sortableHeader("precioCosto", "Costo", "text-orange-600")}</th>
                <th className="whitespace-nowrap px-3 py-2 text-emerald-700">{sortableHeader("precio", "Efectivo", "text-emerald-700")}</th>
                <th className="px-3 py-2 text-rose-700">{sortableHeader("credito", "Crédito", "text-rose-700")}</th>
                <th className="whitespace-nowrap px-3 py-2">{sortableHeader("stock", "Un.")}</th>
                <th className="sticky right-0 z-10 bg-white px-3 py-2 shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.35)]"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productTable.getRowModel().rows.map(({ original: p }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      aria-label={`Seleccionar ${p.nombre}`}
                      className="size-4 accent-sky-600"
                    />
                  </td>
                  <td className="max-w-[220px] py-2 pr-3 md:max-w-none">
                    <div className="flex items-center gap-2">
                      {p.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagen}
                          alt=""
                          className="size-9 shrink-0 rounded border bg-white object-contain"
                        />
                      )}
                      <span className="line-clamp-2 break-words font-medium md:line-clamp-1">
                        {p.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-slate-500 md:table-cell">{productCategoryLabel(p.categoria)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-2 font-semibold text-orange-600 md:table-cell">
                    {money(p.precioCosto)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-emerald-700">
                    {money(p.precio)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-rose-700">
                    {money(calculateInstallmentPrice(p.precio))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                    <span
                      className={p.stock <= 0 ? "font-bold text-rose-600" : ""}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="sticky right-0 z-[1] min-w-[104px] bg-white px-3 py-2 shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => onEdit(p)}
                        className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() =>
                          onRequestConfirm?.({
                            open: true,
                            title: `¿Eliminar "${p.nombre}"?`,
                            description:
                              "Se eliminará este producto del inventario.",
                            onConfirm: () => {
                              setProductos((cur) =>
                                cur.filter((x) => x.id !== p.id),
                              );
                            },
                          })
                        }
                        className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-rose-600 transition hover:bg-rose-50"
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productTable.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
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
            onChange={(e) =>
              setForm((f) => ({ ...f, categoria: e.target.value }))
            }
            required
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {productCategoryLabel(c)}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="text"
            inputMode="numeric"
            placeholder="Costo de proveedor"
            value={formatCurrencyInput(form.precioCosto)}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                precioCosto: parsePrice(e.target.value),
              }))
            }
          />
          <input
            className={input}
            type="text"
            inputMode="numeric"
            placeholder="Precio Cliente"
            value={formatCurrencyInput(form.precio)}
            onChange={(e) =>
              setForm((f) => ({ ...f, precio: parsePrice(e.target.value) }))
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
          <ImageField
            values={form.imagen ? [form.imagen] : []}
            onChange={(values) =>
              setForm((f) => ({ ...f, imagen: values[0] || "" }))
            }
          />
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
    // Formato de inventario: Category, Name, Description, Cost, Price, Quantity.
    const headers = ["Category", "Name", "Description", "Cost", "Price", "Quantity"];
    const rows = productos.map((producto) => [
      producto.categoria,
      producto.nombre,
      "",
      String(producto.precioCosto ?? 0),
      String(producto.precio ?? 0),
      String(producto.stock ?? 0),
    ]);
    const escapeCsvCell = (cell: string) =>
      /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
      .join("\r\n");
    const blob = new Blob([`${csv}\r\n`], {
      type: "text/csv;charset=utf-8;",
    });
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
        throw new Error(
          "El CSV debe tener una cabecera y al menos una fila de datos.",
        );
      }

      const headers = rows[0].map((header) =>
        header
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase(),
      );
      const idxName = headers.indexOf("name");
      const idxCategory = headers.indexOf("category");
      const idxCost = headers.indexOf("cost");
      const idxPrice = headers.indexOf("price");
      const idxQuantity = headers.indexOf("quantity");
      const idxDeletedAt = headers.indexOf("deletedat");

      if (
        [idxName, idxCategory, idxCost, idxPrice, idxQuantity].some(
          (idx) => idx < 0,
        )
      ) {
        throw new Error(
          "Faltan columnas obligatorias: Name, Category, Cost, Price o Quantity.",
        );
      }

      const mapaPorNombre = new Map(
        productos.map((p) => [normalizeCsvProductName(p.nombre), p]),
      );
      const importados: Producto[] = [];
      let creados = 0;
      let actualizados = 0;
      let omitidos = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const deletedAt =
          idxDeletedAt >= 0 ? String(row[idxDeletedAt] || "").trim() : "";
        if (deletedAt) {
          omitidos += 1;
          continue;
        }

        const nombre = String(row[idxName] || "").trim();
        const categoria = normalizeImportedCategory(
          String(row[idxCategory] || "").trim() || "ARTICULO",
        );
        const parseNumber = (value: string | undefined) => {
          const normalized = String(value ?? "")
            .trim()
            .replace(",", ".");
          return normalized ? Number(normalized) : Number.NaN;
        };
        const costo = parseNumber(row[idxCost]);
        const precio = parseNumber(row[idxPrice]);
        const stock = parseNumber(row[idxQuantity]);
        const nombreNormalizado = normalizeCsvProductName(nombre);

        if (
          !nombre ||
          shouldIgnoreCsvProduct(nombre) ||
          !Number.isFinite(costo) ||
          !Number.isFinite(precio) ||
          !Number.isFinite(stock)
        ) {
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
      setMensaje(
        error instanceof Error ? error.message : "No se pudo importar el CSV.",
      );
    } finally {
      setImportando(false);
    }
  };

  return (
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Carga de Inventario</h2>
          <p className="text-xs text-slate-500">
            Exportá el inventario en formato Category, Name, Description, Cost, Price y Quantity.
          </p>
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
  canManageCatalog,
  onEdit,
  onOpenBulk,
  onRequestConfirm,
  priceRules,
  setPriceRules,
  dollarQuote,
  setDollarQuote,
}: {
  catalog: ComponentCatalog;
  setCatalog: React.Dispatch<React.SetStateAction<ComponentCatalog>>;
  persistent: boolean;
  canManageCatalog: boolean;
  onEdit: (component: CatalogProduct) => void;
  onOpenBulk: () => void;
  onRequestConfirm?: (req: ConfirmRequest) => void;
  priceRules: ComponentPriceRules;
  setPriceRules: React.Dispatch<React.SetStateAction<ComponentPriceRules>>;
  dollarQuote: DollarQuote | null;
  setDollarQuote: React.Dispatch<React.SetStateAction<DollarQuote | null>>;
}) {
  const pricingState = { catalog, priceRules, dollarQuote };
  const { saving, saved, error, dirty, run, revert } = useSaver(pricingState, (next) =>
    saveComponentCatalog(next.catalog, next.priceRules, next.dollarQuote || undefined),
  );
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<ComponentCatalogKey | "all">("all");
  const [applyingMargin, setApplyingMargin] = useState(false);
  const [marginMessage, setMarginMessage] = useState("");
  const [dollarMessage, setDollarMessage] = useState("");
  const [dollarInput, setDollarInput] = useState(
    formatCurrencyInput(dollarQuote?.valor || 1545),
  );
  const [includeUnclassified, setIncludeUnclassified] = useState(false);
  const [updatingDollar, setUpdatingDollar] = useState(false);
  const [showMarginRules, setShowMarginRules] = useState(true);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set(),
  );
  const ruleCategory = category === "all" ? null : category;
  const visible = useMemo(
    () =>
      catalogDataKeys
        .flatMap((key) =>
          (category === "all" || category === key
            ? catalog[key] || []
            : []
          ).map((component) => ({ key, component })),
        )
        .filter(({ component }) =>
          `${component.nombre} ${component.marca} ${component.modelo}`
            .toLowerCase()
            .includes(filter.toLowerCase()),
        ),
    [catalog, category, filter],
  );
  const componentSelectionKey = (key: ComponentCatalogKey, id: string) =>
    `${key}:${id}`;
  const allVisibleComponentsSelected =
    visible.length > 0 &&
    visible.every(({ key, component }) =>
      selectedComponents.has(componentSelectionKey(key, component.id)),
    );
  const toggleComponent = (key: ComponentCatalogKey, id: string) =>
    setSelectedComponents((current) => {
      const next = new Set(current);
      const selectionKey = componentSelectionKey(key, id);
      if (next.has(selectionKey)) next.delete(selectionKey);
      else next.add(selectionKey);
      return next;
    });
  const deleteSelectedComponents = () => {
    if (!selectedComponents.size) return;
    onRequestConfirm?.({
      open: true,
      title: `¿Eliminar ${selectedComponents.size} componente(s)?`,
      description: "Se eliminarán los componentes seleccionados del catálogo.",
      onConfirm: async () => {
        const next = Object.fromEntries(
          catalogDataKeys.map((key) => [
            key,
            (catalog[key] || []).filter(
              (component) =>
                !selectedComponents.has(
                  componentSelectionKey(key, component.id),
                ),
            ),
          ]),
        ) as ComponentCatalog;
        setCatalog(next);
        setSelectedComponents(new Set());
        if (persistent) {
          try {
            await saveComponentCatalog(next, priceRules);
          } catch {
            setCatalog(catalog);
          }
        }
      },
    });
  };

  const create = () => {
    const key = category === "all" ? catalogDataKeys[0] : category;
    onEdit(
      normalizeCatalogProduct(
        {
          id: newId(),
          nombre: "",
          precio: 0,
          precioCosto: 0,
          stock: 0,
          imagen: "",
          categoria: key,
        },
        key,
        0,
      ),
    );
  };

  const remove = (key: ComponentCatalogKey, id: string) => {
    const component = catalog[key]?.find((item) => item.id === id);
    if (!component) return;
    const deleteComponent = async () => {
      const next = {
        ...catalog,
        [key]: catalog[key].filter((item) => item.id !== id),
      };
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
      const rule = rules.find(
        (item) =>
          cost >= (item.min || 0) && (item.max == null || cost < item.max),
      );
      const price = rule
        ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100)
        : Math.round(cost);
      return { ...component, precioCosto: cost, precio: price };
    });
    const next = { ...catalog, [ruleCategory]: nextCategory };
    setApplyingMargin(true);
    setMarginMessage("");
    try {
      if (persistent) await saveComponentCatalog(next, priceRules);
      setCatalog(next);
      setMarginMessage(
        `Margen aplicado en ${componentCatalogLabels[ruleCategory].toUpperCase()}.`,
      );
    } catch (e) {
      setMarginMessage(
        e instanceof Error ? e.message : "No se pudo aplicar el margen.",
      );
    } finally {
      setApplyingMargin(false);
    }
  };

  const updateCostsFromDollar = () => {
    const value = parsePrice(dollarInput);
    if (!persistent) {
      setDollarMessage(
        "Conecta Vercel Blob para guardar la cotización y actualizar costos.",
      );
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setDollarMessage("Ingresá una cotización válida mayor a cero.");
      return;
    }

    const unclassified = catalogDataKeys
      .flatMap((key) => catalog[key] || [])
      .filter(
        (component) => {
          const currentCost = Number(component.precioCosto ?? component.precio) || 0;
          return currentCost > 0 &&
            component.monedaCosto !== "USD" &&
            !(Number(component.costoBaseUsd) > 0);
        },
      );
    if (unclassified.length > 0 && !includeUnclassified) {
      setDollarMessage(
        `${unclassified.length} componente(s) no tienen costo USD confirmado. Activá la opción de migración inicial para incluirlos.`,
      );
      return;
    }

    onRequestConfirm?.({
      open: true,
      title: "Actualizar costos con dólar blue venta",
      description: includeUnclassified
        ? `Se convertirán ${unclassified.length} costo(s) actuales en ARS a una base USD usando $${INITIAL_DOLLAR_QUOTE}, y luego se calcularán con la cotización ingresada. Se reaplicarán los márgenes por rango. ¿Continuar?`
        : "Se actualizarán sólo los componentes con costo USD confirmado y se reaplicarán los márgenes por rango. ¿Continuar?",
      onConfirm: async () => {
        setUpdatingDollar(true);
        setDollarMessage("");
        const updatedAt = new Date().toISOString();
        const next = Object.fromEntries(
          catalogDataKeys.map((key) => [
            key,
            (catalog[key] || []).map((component) => {
              const currentCost =
                Number(component.precioCosto ?? component.precio) || 0;
              const baseUsd =
                Number(component.costoBaseUsd) > 0
                  ? Number(component.costoBaseUsd)
                  : includeUnclassified && currentCost > 0
                    ? currentCost / INITIAL_DOLLAR_QUOTE
                    : 0;
              if (baseUsd <= 0) return component;
              const cost = Math.round(baseUsd * value);
              const rule = (priceRules[key] || []).find(
                (item) =>
                  cost >= (item.min || 0) &&
                  (item.max == null || cost < item.max),
              );
              const price = rule
                ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100)
                : Math.round(cost);
              return {
                ...component,
                precioCosto: cost,
                precio: price,
                monedaCosto: "USD" as const,
                costoBaseUsd: baseUsd,
                cotizacionDolar: value,
                costoActualizadoEn: updatedAt,
              };
            }),
          ]),
        ) as ComponentCatalog;
        const nextQuote = { valor: value, actualizadoEn: updatedAt };
        try {
          await saveComponentCatalog(next, priceRules, nextQuote);
          setCatalog(next);
          setDollarQuote(nextQuote);
          setDollarInput(formatCurrencyInput(value));
          const updatedCount = catalogDataKeys.reduce(
            (total, key) =>
              total +
              (next[key] || []).filter(
                (component) =>
                  component.cotizacionDolar === value &&
                  component.costoActualizadoEn === updatedAt,
              ).length,
            0,
          );
          setDollarMessage(
            `${updatedCount} componente(s) actualizado(s) con dólar venta $${value.toLocaleString("es-AR")}.`,
          );
        } catch (error) {
          setDollarMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron actualizar los costos.",
          );
        } finally {
          setUpdatingDollar(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminGuide title="Componentes">
        Este catalogo alimenta Arma tu PC y la tienda. Elegi una categoria para editar sus rangos, costos y precios; luego usa Guardar cambios.
      </AdminGuide>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Componentes"
          value={catalogDataKeys.reduce(
            (sum, key) => sum + (catalog[key]?.length || 0),
            0,
          )}
        />
        <StatCard
          label="Categorías"
          value={
            catalogDataKeys.filter((key) => (catalog[key]?.length || 0) > 0)
              .length
          }
        />
        {canManageCatalog && <StatCard label="Origen" value="Vercel Blob" />}
      </div>

      {category === "all" && (
        <section className={panel}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Elegir categoria</h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecciona una categoria para ver y administrar sus componentes.
              </p>
            </div>
            {canManageCatalog && (
              <button
                type="button"
                onClick={onOpenBulk}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Carga masiva
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalogDataKeys.map((key) => {
              const count = catalog[key]?.length || 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className="group min-h-32 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 p-5 text-left text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className="block text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                    Categoria
                  </span>
                  <span className="mt-3 block text-lg font-bold">
                    {componentCatalogLabels[key]}
                  </span>
                  <span className="mt-2 block text-sm text-white/70">
                    {count} componente{count === 1 ? "" : "s"} cargado{count === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className={category === "all" ? "hidden" : panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Componentes</h2>
            <p className="text-xs text-slate-500">
              Catálogo compartido por Armá tu PC y la tienda de componentes.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4"
            >
              Categorias
            </button>
            <button
              type="button"
              onClick={create}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4"
            >
              <Plus className="size-4" /> Nuevo componente
            </button>
            {canManageCatalog && (
              <button
                type="button"
                onClick={onOpenBulk}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4"
              >
                Carga masiva
              </button>
            )}
            <SaveButton
              dirty={dirty}
              saving={saving}
              saved={saved}
              error={error}
              onSave={run}
              onRevert={() => {
                const previous = revert();
                setCatalog(previous.catalog);
                setPriceRules(previous.priceRules);
                setDollarQuote(previous.dollarQuote);
              }}
              persistent={persistent}
            />
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${input} pl-9`}
              placeholder="Buscar componente..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <select
            className={input}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ComponentCatalogKey | "all")
            }
          >
            <option value="all">Todas las categorías</option>
            {catalogDataKeys.map((key) => (
              <option key={key} value={key}>
                {componentCatalogLabels[key].toUpperCase()}
              </option>
            ))}
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
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <DollarSign className="size-4 text-sky-700" />
                  Cotización dólar blue venta
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Actualiza sólo costos USD, recalcula el efectivo por rango y
                  conserva la base para evitar aumentos acumulativos.
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>
                  {dollarQuote
                    ? `Última actualización: ${new Date(dollarQuote.actualizadoEn).toLocaleString("es-AR")}`
                    : "Sin actualización guardada"}
                </p>
                {dollarMessage && (
                  <p className="mt-1 max-w-xs font-semibold text-sky-700">
                    {dollarMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-semibold text-slate-700">
                Valor venta (ARS)
                <input
                  type="text"
                  inputMode="numeric"
                  min="1"
                  step="0.01"
                  value={dollarInput}
                  onChange={(event) => setDollarInput(formatCurrencyInput(event.target.value))}
                  className={`${input} mt-1 bg-white`}
                />
              </label>
              <button
                type="button"
                onClick={updateCostsFromDollar}
                disabled={updatingDollar || !persistent}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingDollar && <Loader2 className="size-4 animate-spin" />}
                Actualizar costos
              </button>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeUnclassified}
                onChange={(event) =>
                  setIncludeUnclassified(event.target.checked)
                }
                className="mt-0.5 size-4 accent-sky-700"
              />
              Actualizar base de USD.
            </label>
          </div>
          {showMarginRules && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-3 shadow-sm sm:p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Margen por rango</h3>
                <p className="text-xs text-slate-500">
                  Se aplica al costo cargado y define el efectivo/transferencia
                  de esta categoría.
                </p>
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600">
                  Los cambios se calculan desde el costo.
                </span>
                <button
                  type="button"
                  onClick={() => void applyMargin()}
                  disabled={!ruleCategory || applyingMargin || !persistent}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyingMargin && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {applyingMargin ? "Aplicando..." : "Aplicar margen"}
                </button>
              </div>
              {ruleCategory ? (
                <CategoryPriceRules
                  rules={priceRules[ruleCategory] || []}
                  onChange={(rules) =>
                    setPriceRules((current) => ({
                      ...current,
                      [ruleCategory]: rules,
                    }))
                  }
                />
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-3 text-sm text-slate-600">
                  Selecciona una categoria para editar y aplicar sus rangos.
                </p>
              )}
              {marginMessage && (
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  {marginMessage}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allVisibleComponentsSelected}
              onChange={() =>
                setSelectedComponents((current) =>
                  allVisibleComponentsSelected
                    ? new Set(
                        [...current].filter(
                          (id) =>
                            !visible.some(
                              ({ key, component }) =>
                                componentSelectionKey(key, component.id) === id,
                            ),
                        ),
                      )
                    : new Set([
                        ...current,
                        ...visible.map(({ key, component }) =>
                          componentSelectionKey(key, component.id),
                        ),
                      ]),
                )
              }
              className="size-4 accent-sky-600"
            />
            Seleccionar visibles
          </label>
          {selectedComponents.size > 0 && (
            <button
              type="button"
              onClick={deleteSelectedComponents}
              className="min-h-10 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Eliminar seleccionados ({selectedComponents.size})
            </button>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {ruleCategory ? componentCatalogLabels[ruleCategory] : "Componentes"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Lista de componentes cargados</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
            {visible.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[600px] w-full text-sm md:min-w-[820px]">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="w-12 px-3 py-2">
                  <span className="sr-only">Seleccionar</span>
                </th>
                <th className="px-3 py-2">COMPONENTE</th>
                <th className="hidden px-3 py-2 md:table-cell">CATEGORÍA</th>
                <th className="hidden px-3 py-2 text-orange-600 md:table-cell">COSTO</th>
                <th className="px-3 py-2 text-emerald-700">EFECTIVO</th>
                <th className="px-3 py-2 text-rose-700">CRÉDITO</th>
                <th className="sticky right-0 z-10 min-w-[104px] bg-white px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map(({ key, component }) => (
                <tr
                  key={`${key}-${component.id}`}
                  className="h-[58px] hover:bg-slate-50"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedComponents.has(
                        componentSelectionKey(key, component.id),
                      )}
                      onChange={() => toggleComponent(key, component.id)}
                      aria-label={`Seleccionar ${component.nombre}`}
                      className="size-4 accent-sky-600"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {component.imagen && (
                        <img
                          src={component.imagen}
                          alt=""
                          className="size-9 rounded border object-contain"
                        />
                      )}
                      <span className="max-w-[170px] truncate font-medium text-slate-800 md:max-w-[360px]">
                        {component.nombre || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-slate-500 md:table-cell">
                    {componentCatalogLabels[key].toUpperCase()}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 font-semibold text-orange-600 md:table-cell">
                    {money(Number(component.precioCosto ?? component.precio))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-emerald-700">
                    {money(component.precio)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-rose-700">
                    {money(
                      calculateInstallmentPrice(Number(component.precio) || 0),
                    )}
                  </td>
                  <td className="sticky right-0 z-[1] min-w-[104px] bg-white px-3 py-2 text-right shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.35)]">
                    <button
                      type="button"
                      onClick={() => onEdit(component)}
                      className="mr-1 inline-grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Editar"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(key, component.id)}
                      className="inline-grid size-9 place-items-center rounded-lg border border-slate-200 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                      aria-label="Eliminar"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              No hay componentes cargados en Blob.
            </p>
          )}
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
  canManageCatalog,
  onEdit,
  onRequestConfirm,
  notebookPriceRules,
  setNotebookPriceRules,
  dollarQuote,
  setDollarQuote,
}: {
  equipos: Equipo[];
  setEquipos: React.Dispatch<React.SetStateAction<Equipo[]>>;
  persistent: boolean;
  canManageCatalog: boolean;
  onEdit: (e: Equipo) => void;
  onRequestConfirm?: (req: ConfirmRequest) => void;
  notebookPriceRules: PriceRule[];
  setNotebookPriceRules: React.Dispatch<React.SetStateAction<PriceRule[]>>;
  dollarQuote: DollarQuote | null;
  setDollarQuote: React.Dispatch<React.SetStateAction<DollarQuote | null>>;
}) {
  const stockState = { equipos, notebookPriceRules, dollarQuote };
  const { saving, saved, error, dirty, run, revert } = useSaver(stockState, (next) =>
    saveStockCatalog(next.equipos, next.notebookPriceRules, next.dollarQuote || undefined),
  );
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<EquipoCategoria | "all">("all");
  const [dollarInput, setDollarInput] = useState(formatCurrencyInput(dollarQuote?.valor || INITIAL_DOLLAR_QUOTE));
  const [includeUnclassified, setIncludeUnclassified] = useState(false);
  const [updatingDollar, setUpdatingDollar] = useState(false);
  const [dollarMessage, setDollarMessage] = useState("");
  const [applyingMargin, setApplyingMargin] = useState(false);
  const [marginMessage, setMarginMessage] = useState("");
  const [showPricing, setShowPricing] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedEquipos, setSelectedEquipos] = useState<Set<string>>(new Set());

  const disponibles = equipos.filter((e) => e.estado !== "vendido").length;
  const destacados = equipos.filter((e) => e.recomendada).length;

  const sorted = useMemo(
    () => [...equipos].sort((a, b) => {
      const aIsNotebook = normalizeStockCategoryValue(a.categoria) === "notebook";
      const bIsNotebook = normalizeStockCategoryValue(b.categoria) === "notebook";
      if (aIsNotebook && bIsNotebook) {
        const priceDifference = Number(a.promo || a.original || 0) - Number(b.promo || b.original || 0);
        if (priceDifference !== 0) return priceDifference;
      }
      return (a.orden ?? 0) - (b.orden ?? 0);
    }),
    [equipos],
  );
  const visible = sorted.filter((e) =>
    `${e.nombre} ${e.marca} ${e.categoria}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  ).filter((e) => category === "all" || normalizeStockCategoryValue(e.categoria) === category);
  const isNotebookSelected = category === "notebook";
  const allVisibleEquiposSelected =
    visible.length > 0 && visible.every((equipment) => selectedEquipos.has(equipment.id));

  const groupedVisible = useMemo(() => {
    const groups = CATEGORIAS_EQUIPO.map((category) => ({
      category,
      items: visible.filter(
        (e) => normalizeStockCategoryValue(e.categoria) === category.value,
      ),
    })).filter((group) => group.items.length > 0);

    if (groups.length > 0) return groups;

    return [
      {
        category: { value: "otros", label: "Otros" },
        items: visible,
      },
    ];
  }, [visible]);

  const patch = (id: string, p: Partial<Equipo>) =>
    setEquipos((cur) => cur.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const toggleEquipo = (id: string) =>
    setSelectedEquipos((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteSelectedEquipos = () => {
    if (!selectedEquipos.size) return;
    onRequestConfirm?.({
      open: true,
      title: `Eliminar ${selectedEquipos.size} equipo(s)?`,
      description: "Se eliminarán los equipos seleccionados del inventario.",
      onConfirm: async () => {
        const previous = equipos;
        const next = equipos.filter((equipment) => !selectedEquipos.has(equipment.id));
        setEquipos(next);
        setSelectedEquipos(new Set());
        if (persistent) {
          try {
            await saveStockCatalog(next, notebookPriceRules, dollarQuote || undefined);
          } catch {
            setEquipos(previous);
          }
        }
      },
    });
  };

  const applyNotebookMargin = async () => {
    const next = equipos.map((equipment) => {
      if (normalizeStockCategoryValue(equipment.categoria) !== "notebook") return equipment;
      const cost = Number(equipment.precioCosto) || 0;
      const rule = notebookPriceRules.find((item) => cost >= (item.min || 0) && (item.max == null || cost < item.max));
      const price = rule ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100) : Math.round(cost);
      return { ...equipment, promo: price, original: calculateInstallmentPrice(price) };
    });
    setApplyingMargin(true); setMarginMessage("");
    try {
      if (persistent) await saveStockCatalog(next, notebookPriceRules, dollarQuote || undefined);
      setEquipos(next); setMarginMessage("Margen aplicado en NOTEBOOKS.");
    } catch (error) { setMarginMessage(error instanceof Error ? error.message : "No se pudo aplicar el margen."); }
    finally { setApplyingMargin(false); }
  };

  const updateNotebookCosts = () => {
    const value = parsePrice(dollarInput);
    if (!persistent) { setDollarMessage("Conecta Vercel Blob para guardar la cotización y actualizar costos."); return; }
    if (!Number.isFinite(value) || value <= 0) { setDollarMessage("Ingresá una cotización válida mayor a cero."); return; }
    const notebooks = equipos.filter((equipment) => normalizeStockCategoryValue(equipment.categoria) === "notebook" && (Number(equipment.precioCosto) || 0) > 0);
    const unclassified = notebooks.filter((equipment) => equipment.monedaCosto !== "USD" && !(Number(equipment.costoBaseUsd) > 0));
    if (unclassified.length > 0 && !includeUnclassified) {
      setDollarMessage(`${unclassified.length} notebook(s) no tienen base USD. Activá la inicialización desde ARS para incluirlas.`);
      return;
    }
    onRequestConfirm?.({
      open: true,
      title: "Actualizar costos de notebooks",
      description: includeUnclassified
        ? `Se convertirán ${unclassified.length} costo(s) actuales en ARS a base USD usando $${INITIAL_DOLLAR_QUOTE} y se aplicará la cotización ingresada. También se reaplicará el margen por rango.`
        : "Se actualizarán sólo notebooks con base USD y se reaplicará el margen por rango.",
      onConfirm: async () => {
        setUpdatingDollar(true); setDollarMessage("");
        const updatedAt = new Date().toISOString();
        const next = equipos.map((equipment) => {
          if (normalizeStockCategoryValue(equipment.categoria) !== "notebook") return equipment;
          const currentCost = Number(equipment.precioCosto) || 0;
          const baseUsd = Number(equipment.costoBaseUsd) > 0 ? Number(equipment.costoBaseUsd) : includeUnclassified && currentCost > 0 ? currentCost / INITIAL_DOLLAR_QUOTE : 0;
          if (baseUsd <= 0) return equipment;
          const cost = Math.round(baseUsd * value);
          const rule = notebookPriceRules.find((item) => cost >= (item.min || 0) && (item.max == null || cost < item.max));
          const price = rule ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100) : Math.round(cost);
          return { ...equipment, precioCosto: cost, promo: price, original: calculateInstallmentPrice(price), monedaCosto: "USD" as const, costoBaseUsd: baseUsd, cotizacionDolar: value, costoActualizadoEn: updatedAt };
        });
        const nextQuote = { valor: value, actualizadoEn: updatedAt };
        try {
          await saveStockCatalog(next, notebookPriceRules, nextQuote);
          setEquipos(next); setDollarQuote(nextQuote); setDollarInput(formatCurrencyInput(value));
          const count = next.filter((equipment) => equipment.cotizacionDolar === value && equipment.costoActualizadoEn === updatedAt).length;
          setDollarMessage(`${count} notebook(s) actualizado(s) con dólar venta $${value.toLocaleString("es-AR")}.`);
        } catch (error) { setDollarMessage(error instanceof Error ? error.message : "No se pudieron actualizar los costos."); }
        finally { setUpdatingDollar(false); }
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminGuide title="Equipos y reacondicionados">
        Carga equipos nuevos o reacondicionados por categoria. Las notebooks usan dolar y margen por rango; los equipos nuevos no manejan unidades de stock.
      </AdminGuide>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Equipos" value={equipos.length} />
        <StatCard label="Disponibles" value={disponibles} />
        <StatCard label="Destacados" value={destacados} />
      </div>

      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Equipos y reacondicionados</h2>
            <p className="text-xs text-slate-500">
              Celulares, notebooks, PC armadas, tablets y TVs
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <button
              onClick={() => onEdit(emptyEquipo())}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4"
            >
              <Plus className="size-4" /> Nuevo equipo
            </button>
            {isNotebookSelected && canManageCatalog && (
              <button
                onClick={() => setBulkOpen((open) => !open)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-4"
              >
                Carga masiva
              </button>
            )}
            <SaveButton
              dirty={dirty}
              saving={saving}
              saved={saved}
              error={error}
              onSave={run}
              onRevert={() => {
                const previous = revert();
                setEquipos(previous.equipos);
                setNotebookPriceRules(previous.notebookPriceRules);
                setDollarQuote(previous.dollarQuote);
                setDollarInput(formatCurrencyInput(previous.dollarQuote?.valor || INITIAL_DOLLAR_QUOTE));
                setDollarMessage("");
                setMarginMessage("");
              }}
              persistent={persistent}
            />
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className={`${input} pl-9`} placeholder="Buscar equipo..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <select className={input} value={category} onChange={(event) => setCategory(event.target.value as EquipoCategoria | "all")}>
            <option value="all">Todas las categorías</option>
            {CATEGORIAS_EQUIPO.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        {isNotebookSelected && bulkOpen && <div className="mb-5"><NotebookBulkUpload equipos={equipos} priceRules={notebookPriceRules} dollarQuote={dollarQuote} persistent={persistent} onSaved={(next) => { setEquipos(next); setBulkOpen(false); }} /></div>}

        {isNotebookSelected && <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><DollarSign className="size-4 text-sky-700" />Dólar blue venta: sólo notebooks</h3><p className="mt-1 text-xs text-slate-600">Actualiza costo, reaplica el margen de notebooks y conserva la fórmula de cuotas.</p></div>
            <div className="text-left text-xs text-slate-500 sm:text-right"><p>{dollarQuote ? `Última actualización: ${new Date(dollarQuote.actualizadoEn).toLocaleString("es-AR")}` : "Sin actualización guardada"}</p>{dollarMessage && <p className="mt-1 max-w-xs font-semibold text-sky-700">{dollarMessage}</p>}</div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-semibold text-slate-700">Valor venta (ARS)<input type="text" inputMode="numeric" value={dollarInput} onChange={(event) => setDollarInput(formatCurrencyInput(event.target.value))} className={`${input} mt-1 bg-white`} /></label><button type="button" onClick={updateNotebookCosts} disabled={updatingDollar || !persistent} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{updatingDollar && <Loader2 className="size-4 animate-spin" />}Actualizar costos</button></div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={includeUnclassified} onChange={(event) => setIncludeUnclassified(event.target.checked)} className="mt-0.5 size-4 accent-sky-700" />Inicializar los costos actuales en ARS como base USD usando $1545.</label>
        </div>}

        {isNotebookSelected && <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Margen por rango: notebooks</h3><p className="mt-1 text-xs text-slate-500">Se aplica únicamente al precio efectivo de las notebooks.</p></div><button type="button" onClick={() => setShowPricing((open) => !open)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800">{showPricing ? "Ocultar margen" : "Mostrar margen"}</button></div>
          {showPricing && <><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-600">Los cambios se calculan desde el costo.</span><button type="button" onClick={() => void applyNotebookMargin()} disabled={applyingMargin || !persistent} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{applyingMargin && <Loader2 className="size-4 animate-spin" />}Aplicar margen</button></div><CategoryPriceRules rules={notebookPriceRules} onChange={setNotebookPriceRules} />{marginMessage && <p className="mt-3 text-xs font-semibold text-slate-600">{marginMessage}</p>}</>}
        </div>}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allVisibleEquiposSelected}
              onChange={() =>
                setSelectedEquipos((current) =>
                  allVisibleEquiposSelected
                    ? new Set([...current].filter((id) => !visible.some((equipment) => equipment.id === id)))
                    : new Set([...current, ...visible.map((equipment) => equipment.id)]),
                )
              }
              className="size-4 accent-sky-600"
            />
            Seleccionar visibles
          </label>
          {selectedEquipos.size > 0 && (
            <button
              type="button"
              onClick={deleteSelectedEquipos}
              className="min-h-10 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Eliminar seleccionados ({selectedEquipos.size})
            </button>
          )}
        </div>

        <div className="space-y-6">
          {groupedVisible.map(({ category, items }) => (
            <div
              key={category.value}
              className="rounded-2xl border border-slate-200 bg-slate-50/70"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
                  {category.label}
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {items.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-[600px] w-full text-sm md:min-w-[820px]">
                  <thead className="border-b text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <span className="sr-only">Seleccionar</span>
                      </th>
                      <th className="px-3 py-2">Equipo</th>
                      <th className="hidden px-3 py-2 md:table-cell">Categoría</th>
                      <th className="hidden px-3 py-2 text-orange-600 md:table-cell">COSTO</th>
                      <th className="whitespace-nowrap px-3 py-2 text-emerald-700">EFECTIVO</th>
                      <th className="px-3 py-2 text-rose-700">CRÉDITO</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="sticky right-0 z-10 bg-white px-3 py-2 shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.35)]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="max-w-[220px] px-3 py-2 md:max-w-none">
                          <input
                            type="checkbox"
                            checked={selectedEquipos.has(e.id)}
                            onChange={() => toggleEquipo(e.id)}
                            aria-label={`Seleccionar ${e.nombre}`}
                            className="size-4 accent-sky-600"
                          />
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
                            <span className="line-clamp-2 break-words font-medium md:line-clamp-1">
                              {e.nombre || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-3 py-2 text-slate-500 md:table-cell">
                          {catLabel(e.categoria)}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2 font-semibold text-orange-600 md:table-cell">
                          {e.precioCosto ? money(e.precioCosto) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-emerald-700">
                          {money(e.promo || e.original)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-rose-700">
                          {money(calculateInstallmentPrice(e.promo || e.original))}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              patch(e.id, {
                                estado:
                                  e.estado === "vendido"
                                    ? "disponible"
                                    : "vendido",
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
                        <td className="sticky right-0 z-[1] min-w-[104px] bg-white px-3 py-2 shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.35)]">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => onEdit(e)}
                              className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Editar"
                              title="Editar"
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
                                        .map((item, i) => ({
                                          ...item,
                                          orden:
                                            typeof item.orden === "number"
                                              ? item.orden
                                              : i,
                                        }));
                                      try {
                                        await saveStockCatalog(
                                          next,
                                          notebookPriceRules,
                                          dollarQuote || undefined,
                                        );
                                        window.dispatchEvent(
                                          new Event("equiposUpdated"),
                                        );
                                        setEquipos(next);
                                      } catch (err) {
                                        console.error("delete equipo", err);
                                        alert("No se pudo eliminar el equipo.");
                                      }
                                    } else {
                                      setEquipos((cur) =>
                                        cur.filter((x) => x.id !== e.id),
                                      );
                                    }
                                  },
                                })
                              }
                              className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                              aria-label="Eliminar"
                              title="Eliminar"
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
