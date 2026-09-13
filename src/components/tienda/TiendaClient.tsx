"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Info, Minus, Plus, Search, ShoppingCart, SlidersHorizontal, Trash2, X } from "lucide-react";
import { calculateInstallmentPrice, calculateNationalPrice } from "@/lib/utils";
import {
  catalogProductImage,
  componentCatalogLabels,
  componentSpecificationFields,
  hasCatalogPrice,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { ProductImageGallery } from "@/components/site/ProductImageGallery";
import { PriceRangeFilter } from "@/components/site/PriceRangeFilter";
import { stockCategories, storeCategories, storeEquipmentCategories, waLink } from "@/components/site/site-config";
import { PedidoCheckoutModal } from "@/components/shared/PedidoCheckoutModal";
import { buildPedidoMessage, formatPedidoNumero, getNextPedidoNumber, readStoredPedidos } from "@/lib/order-data";
import { cn, normalizeEquipmentCondition, normalizeStockCategoryValue } from "@/lib/utils";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import type { Equipo } from "@/lib/types";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
  precio: number;
  stock: number;
  specs?: Record<string, string>;
  componentKey?: ComponentCatalogKey;
  condition?: string;
  imagenes?: string[];
}
interface CartItem extends Producto {
  cantidad: number;
}

const CART_KEY = "servitec-tienda-carrito";
const CART_EVENT = "servitec-cart-updated";
const money = (n: number) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const loadCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
};

export function TiendaClient() {
  const searchParams = useSearchParams();
  const requestedTipo = searchParams.get("tipo") || "accesorios";
  const tipo = [...storeCategories, ...storeEquipmentCategories].some((category) => category.value === requestedTipo)
    ? requestedTipo
    : "accesorios";
  const isStockType = storeEquipmentCategories.some((category) => category.value === tipo);
  const isEquipmentType = tipo === "equipos" || isStockType;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [componentes, setComponentes] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"" | "asc" | "desc">("");
  const [precioMin, setPrecioMin] = useState<number | null>(null);
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState({ tipo, value: "" });
  const [carrito, setCarrito] = useState<CartItem[]>(loadCart);
  const normalizeComponentCategory = (value?: string) => {
    const normalized = (value || "").trim();
    if (!normalized || normalized === "Sin categoría") return "Periféricos";
    return normalized;
  };
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(carrito));
    window.dispatchEvent(new Event(CART_EVENT));
  }, [carrito]);

  useEffect(() => {
    const syncCart = () => {
      const next = loadCart();
      setCarrito((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (tipo === "componentes") {
      fetch("/api/componentes")
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("No se pudo cargar el catálogo."))))
        .then((response: { catalog?: Record<string, CatalogProduct[]> }) => {
          if (!alive) return;
          const catalog = response.catalog || {};
          const items = Object.entries(catalog).flatMap(([key, products]) =>
            products
              .filter((product) => hasCatalogPrice(product.precio))
              .map((p, i) => ({
                id: p.id || `${key}-${i}-${p.nombre}`,
                nombre: p.nombre,
                categoria: componentCatalogLabels[key as ComponentCatalogKey],
                componentKey: key as ComponentCatalogKey,
                imagen: catalogProductImage(p),
                imagenes: catalogProductImage(p) ? [catalogProductImage(p)] : [],
                precio: Number(p.precio || 0),
                stock: 1,
                specs: p.specs as Record<string, string> | undefined,
              })),
          );
          setComponentes(items);
        })
        .catch(() => alive && setComponentes([]))
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }

    if (isEquipmentType) {
      fetch("/api/equipos")
        .then((response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("No se pudieron cargar los equipos.")),
        )
        .then((data: Equipo[]) => {
          if (!alive) return;
          const items = (Array.isArray(data) ? data : [])
            .filter((equipment) => {
              const category = normalizeStockCategoryValue(equipment.categoria);
              return tipo === "equipos"
                ? storeEquipmentCategories.some((item) => item.value === category)
                : category === tipo;
            })
            .filter((equipment) => equipment.estado !== "vendido")
            .filter((equipment) => normalizeEquipmentCondition(equipment.condition) === "Sellado")
            .map((equipment) => ({
              id: equipment.id,
              nombre: equipment.nombre,
              categoria:
                stockCategories.find(
                  (category) =>
                    category.value === normalizeStockCategoryValue(equipment.categoria),
                )?.label || tipo,
              imagen: equipment.imagenes?.[0] || "",
              imagenes: equipment.imagenes || [],
              precio: Number(equipment.promo || equipment.original || 0),
              stock: equipment.estado === "vendido"
                ? 0
                : Number(equipment.stock ?? 1),
              specs: equipment.specs,
              condition: normalizeEquipmentCondition(equipment.condition),
            }));
          setProductos(items);
        })
        .catch(() => alive && setProductos([]))
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }

    fetch("/api/productos")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Producto[]) => {
          if (alive) {
            setProductos(
              Array.isArray(data)
                ? data.map((product) => ({
                    ...product,
                    imagenes: product.imagen ? [product.imagen] : [],
                  }))
                : [],
            );
          }
      })
      .catch(() => alive && setProductos([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tipo, isEquipmentType]);

  const base = useMemo(
    () => tipo === "componentes"
      ? componentes
          .filter((product) => hasCatalogPrice(product.precio))
          .map((product) => ({ ...product, precio: Math.round(product.precio * 1.08) }))
      : productos,
    [componentes, productos, tipo],
  );
  const activeCategoriaFiltro = categoriaFiltro.tipo === tipo ? categoriaFiltro.value : "";
  const showPriceFilter = Boolean(activeCategoriaFiltro) || isStockType;
  const priceFilterProducts = activeCategoriaFiltro
    ? base.filter((product) => normalizeComponentCategory(product.categoria) === activeCategoriaFiltro)
    : base;

  const categorias = useMemo(
    () =>
      [...new Set(base.map((p) => normalizeComponentCategory(p.categoria)))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [base],
  );

  const filtrados = useMemo(() => {
    const list = base.filter(
      (p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        (!activeCategoriaFiltro || normalizeComponentCategory(p.categoria) === activeCategoriaFiltro) &&
        (!showPriceFilter || precioMin === null || p.precio >= precioMin) &&
        (!showPriceFilter || precioMax === null || p.precio <= precioMax),
    );
    if (orden === "asc") list.sort((a, b) => a.precio - b.precio);
    if (orden === "desc") list.sort((a, b) => b.precio - a.precio);
    return list;
  }, [base, busqueda, orden, activeCategoriaFiltro, precioMin, precioMax, showPriceFilter]);

  const grupos: [string, Producto[]][] = useMemo(() => {
    const map = new Map<string, Producto[]>();
    filtrados.forEach((p) => {
      const arr = map.get(p.categoria) ?? [];
      arr.push(p);
      map.set(p.categoria, arr);
    });
    // Ensure motherboard category renders items ordered from menor a mayor precio
    const entries = [...map];
    const motherboardLabel = componentCatalogLabels.motherboard;
    return entries.map(([categoria, items]) => {
      if (categoria === motherboardLabel) {
        return [categoria, items.slice().sort((a, b) => a.precio - b.precio)];
      }
      return [categoria, items];
    });
  }, [filtrados]);

  const totalArticulos = carrito.reduce((t, i) => t + i.cantidad, 0);
  const totalCarrito = carrito.reduce((t, i) => t + i.precio * i.cantidad, 0);

  const agregar = (p: Producto) => {
    if (!hasCatalogPrice(p.precio)) return;
    setCarrito((cur) => {
      const found = cur.find((i) => i.id === p.id);
      return found
        ? cur.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...cur, { ...p, cantidad: 1 }];
    });
  };

  const cambiar = (id: string, delta: number) =>
    setCarrito((cur) =>
      cur.flatMap((i) => {
        if (i.id !== id) return [i];
        const q = i.cantidad + delta;
        return q > 0 ? [{ ...i, cantidad: q }] : [];
      }),
    );

  const pedidoNumero = useMemo(() => getNextPedidoNumber(readStoredPedidos()), [carrito.length]);

  const pedir = () => {
    setCheckoutOpen(true);
  };

  return (
    <>
      <PageHero
        eyebrow="Tienda"
        title={
          tipo === "componentes"
            ? "Componentes de PC"
            : tipo === "accesorios"
              ? "Productos"
              : `${tipo === "equipos" ? "Equipos" : stockCategories.find((category) => category.value === tipo)?.label || "Equipos"} sellados`
        }
        description="Productos y equipos actualizados. Armá tu pedido y lo coordinamos por WhatsApp."
      >
        <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center rounded-xl border border-white/15 bg-white/5 p-1">
          {storeCategories.map(({ value, label }) => (
            <Link
              key={value}
              href={`/tienda?tipo=${value}`}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-semibold transition",
                tipo === value
                  ? "bg-background text-foreground shadow-soft"
                  : "text-sidebar-foreground/70 hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </PageHero>

      <section className="bg-muted/40">
      <div className="container-page py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* On desktop the fixed filters live beside the catalogue, so they never cover product cards. */}
          <div className="z-20 -mx-3 mb-8 border-b bg-background px-3 py-3 shadow-soft sm:mx-0 sm:mb-10 sm:rounded-2xl sm:border sm:px-4 lg:sticky lg:top-20 lg:mb-0 lg:rounded-2xl lg:border lg:p-4 lg:self-start">
          <div className="flex flex-col gap-3 md:flex-row md:items-center lg:flex-col lg:items-stretch">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto…"
                className="pl-9"
                aria-label="Buscar producto"
              />
            </div>
            <Select
              value={activeCategoriaFiltro || "all"}
              onValueChange={(v) => setCategoriaFiltro({ tipo, value: v === "all" ? "" : v })}
            >
              <SelectTrigger className="md:w-56 lg:w-full">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={orden || undefined}
              onValueChange={(v) => setOrden(v as "asc" | "desc")}
            >
              <SelectTrigger className="md:w-48 lg:w-full">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="desc">Precio: mayor a menor</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setCarritoAbierto(true)}
              className="relative gap-2 lg:w-full"
              aria-label={`Abrir carrito, ${totalArticulos} artículos`}
            >
              <ShoppingCart className="size-4" /> Carrito
              {totalArticulos > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-secondary-foreground">
                  {totalArticulos}
                </span>
              )}
            </Button>
          </div>
          {showPriceFilter && (
            <div className="mt-3">
              <PriceRangeFilter
                prices={priceFilterProducts.map((product) => product.precio)}
                min={precioMin}
                max={precioMax}
                onChange={({ min, max }) => {
                  setPrecioMin(min);
                  setPrecioMax(max);
                }}
              />
            </div>
          )}
        </div>

        <div className="min-w-0">
        {loading && (
          <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border bg-muted" />
            ))}
          </div>
        )}

        {!loading && grupos.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No encontramos productos con esos filtros.
          </p>
        )}

        {!loading &&
          grupos.map(([categoria, items]) => (
            <div key={categoria} className="mb-14">
              <h2 className="mb-6 inline-flex rounded-full border bg-muted px-4 py-1.5 text-sm font-bold">
                {categoria}
              </h2>
              <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => {
                  const agotado = tipo === "accesorios" && p.stock === 0;
                  return (
                    <article
                      key={p.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg"
                    >
                      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-4 sm:p-5">
                        {tipo === "componentes" && p.componentKey && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="absolute right-2 top-2 z-10 size-8 rounded-full bg-white/90 shadow-sm" aria-label={`Ver especificaciones de ${p.nombre}`}>
                                <Info className="size-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-3xl overflow-y-auto rounded-2xl border-slate-200 bg-slate-50 p-0 sm:w-[calc(100vw-2rem)] sm:rounded-3xl">
                              <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 px-5 py-6 text-white sm:px-7 sm:py-7">
                                <DialogHeader>
                                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                                    <SlidersHorizontal className="size-4" /> Ficha tecnica
                                  </div>
                                  <DialogTitle className="pr-6 text-left text-xl leading-tight text-white sm:text-2xl">{p.nombre}</DialogTitle>
                                  <p className="mt-2 text-left text-sm text-blue-100">Conocé los detalles principales de este componente.</p>
                                </DialogHeader>
                              </div>
                              <div className="p-5 sm:p-7">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {componentSpecificationFields(p.componentKey, p.nombre).map((field) => p.specs?.[field.key] ? (
                                    <div key={field.key} className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
                                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">{field.label}</p>
                                      <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-slate-900">{p.specs[field.key]}</p>
                                    </div>
                                  ) : null)}
                                  {!Object.values(p.specs || {}).some(Boolean) && <p className="rounded-xl border border-dashed border-blue-200 bg-white px-4 py-5 text-center text-sm text-slate-500">Las especificaciones todavía no fueron cargadas.</p>}
                                </div>
                                <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-blue-50 px-4 py-4 text-center shadow-sm">
                                  <p className="text-base font-black uppercase tracking-[0.18em] text-red-700 sm:text-lg">GARANTIA OFICIAL</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {p.imagenes?.length || p.imagen ? (
                          <ProductImageGallery
                            images={p.imagenes?.length ? p.imagenes : [p.imagen]}
                            name={p.nombre}
                            showThumbnails={isEquipmentType}
                            href={p.componentKey
                              ? `/producto/componente/${encodeURIComponent(p.id)}`
                              : isEquipmentType
                                ? `/producto/equipo/${encodeURIComponent(p.id)}`
                                : undefined}
                          />
                        ) : (
                          <ShoppingCart className="size-8 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                          {p.nombre}
                        </h3>
                        {agotado ? (
                          <p className="text-sm font-bold uppercase tracking-wide text-destructive">
                            Sin stock
                          </p>
                        ) : (
                          <div>
                            <p className="text-lg font-bold text-emerald-700">
                              {money(p.precio)}
                            </p>
                            <p className="text-[11px] font-semibold text-rose-600">
                              3/6 cuotas sin interés: {money(calculateInstallmentPrice(p.precio))}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Sin imp. nac. {money(calculateNationalPrice(p.precio))}
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={() => agregar(p)}
                          disabled={agotado}
                          size="sm"
                          className="mt-auto w-full gap-2"
                        >
                          <Plus className="size-3.5" /> Agregar
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
      </section>

      {carritoAbierto && (
        <CartDrawer
          items={carrito}
          total={totalCarrito}
          onClose={() => setCarritoAbierto(false)}
          onChange={cambiar}
          onCheckout={pedir}
        />
      )}
      <PedidoCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={carrito.map((item) => ({ nombre: item.nombre, cantidad: item.cantidad, precio: item.precio }))}
        total={totalCarrito}
        numeroPedido={pedidoNumero}
        origen="tienda"
      />
    </>
  );
}

function CartDrawer({
  items,
  total,
  onClose,
  onChange,
  onCheckout,
}: {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onChange: (id: string, delta: number) => void;
  onCheckout: () => void;
}) {
  useLockBodyScroll(true);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <p className="eyebrow">Tu selección</p>
            <h2 className="font-display text-xl font-bold">Carrito</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Tu carrito está vacío.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-xl border p-3">
                  <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-white p-1.5">
                    {item.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagen}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(item.precio)} c/u
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {money(item.precio * item.cantidad)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => onChange(item.id, -1)}
                      aria-label="Quitar una unidad"
                    >
                      {item.cantidad === 1 ? (
                        <Trash2 className="size-3.5" />
                      ) : (
                        <Minus className="size-3.5" />
                      )}
                    </Button>
                    <span className="w-5 text-center text-sm font-bold">
                      {item.cantidad}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => onChange(item.id, 1)}
                      aria-label="Agregar una unidad"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <strong className="font-display text-2xl font-bold">{money(total)}</strong>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Envío: a coordinar</p>
          <Button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="mt-4 w-full gap-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <ShoppingCart className="size-4" /> Iniciar pedido por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
