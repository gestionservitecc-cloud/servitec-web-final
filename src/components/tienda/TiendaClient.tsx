"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Info, Plus, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { calculateInstallmentPrice, calculateNationalPrice } from "@/lib/utils";
import {
  catalogProductImage,
  componentCatalogLabels,
  componentSpecificationFields,
  hasCatalogPrice,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";
import { AnimatedButton } from "@/components/site/AnimatedButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { GlobalCart } from "@/components/site/GlobalCart";
import { PageHero } from "@/components/site/PageHero";
import { ProductImageGallery } from "@/components/site/ProductImageGallery";
import { PriceRangeFilter } from "@/components/site/PriceRangeFilter";
import { stockCategories, storeCategories, storeEquipmentCategories, waLink } from "@/components/site/site-config";
import { cn, normalizeEquipmentCondition, normalizeStockCategoryValue } from "@/lib/utils";
import type { Equipo } from "@/lib/types";
import { equipmentStock } from "@/lib/equipment-availability";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
  precio: number;
  stock?: number;
  specs?: Record<string, string>;
  componentKey?: ComponentCatalogKey;
  condition?: string;
  imagenes?: string[];
}
interface CartItem extends Producto {
  productId?: string;
  productType?: string;
  paymentMethod?: "efectivo" | "tarjeta";
  precioBase?: number;
  cantidad: number;
}

const CART_KEY = "servitec-tienda-carrito";
const CART_EVENT = "servitec-cart-updated";
const money = (n: number) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const loadCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export function TiendaClient() {
  const searchParams = useSearchParams();
  const requestedTipo = searchParams.get("tipo") || "equipos";
  const tipo = [...storeCategories, ...storeEquipmentCategories].some((category) => category.value === requestedTipo)
    ? requestedTipo
    : "accesorios";
  const isStockType = storeEquipmentCategories.some((category) => category.value === tipo);
  const isEquipmentType = tipo === "equipos" || isStockType;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [componentes, setComponentes] = useState<Producto[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(searchParams.get("q") || "");
  const [orden, setOrden] = useState<"" | "asc" | "desc">((searchParams.get("orden") as "asc" | "desc") || "");
  const [precioMin, setPrecioMin] = useState<number | null>(searchParams.has("min") && Number.isFinite(Number(searchParams.get("min"))) ? Number(searchParams.get("min")) : null);
  const [precioMax, setPrecioMax] = useState<number | null>(searchParams.has("max") && Number.isFinite(Number(searchParams.get("max"))) ? Number(searchParams.get("max")) : null);
  const [categoriaFiltro, setCategoriaFiltro] = useState({ tipo, value: searchParams.get("categoria") || "" });
  const [cartMessage, setCartMessage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const values = { q: busqueda, orden, min: precioMin === null ? "" : String(precioMin), max: precioMax === null ? "" : String(precioMax), categoria: categoriaFiltro.tipo === tipo ? categoriaFiltro.value : "" };
    Object.entries(values).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [busqueda, orden, categoriaFiltro, tipo, precioMin, precioMax]);
  const normalizeComponentCategory = (value?: string) => {
    const normalized = (value || "").trim();
    if (!normalized || normalized === "Sin categoría") return "Periféricos";
    return normalized;
  };
  useEffect(() => {
    let alive = true;
    // New remote request: reset feedback before its response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(false);
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
                stock: typeof p.stock === "number" ? p.stock : 1,
                specs: p.specs as Record<string, string> | undefined,
              })),
          );
          setComponentes(items);
        })
        .catch(() => { if (alive) setLoadError(true); })
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
          const items = (Array.isArray(data) ? data : []).sort((a, b) => a.orden - b.orden)
            .filter((equipment) => {
              const category = normalizeStockCategoryValue(equipment.categoria);
              return tipo === "equipos"
                ? category !== "pc-armada" && storeEquipmentCategories.some((item) => item.value === category)
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
              stock: equipmentStock(equipment),
              specs: equipment.specs,
              condition: normalizeEquipmentCondition(equipment.condition),
            }));
          setProductos(items);
        })
        .catch(() => { if (alive) setLoadError(true); })
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }

    fetch("/api/productos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
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
      .catch(() => { if (alive) setLoadError(true); })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tipo, isEquipmentType, attempt]);

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
      if (categoria === motherboardLabel && !orden) {
        return [categoria, items.slice().sort((a, b) => a.precio - b.precio)];
      }
      return [categoria, items];
    });
  }, [filtrados, orden]);

  const agregar = (p: Producto) => {
    if (!hasCatalogPrice(p.precio) || p.stock === 0) return;
    try {
      const current = loadCart();
      const productType = tipo === "componentes" ? "componente" : isEquipmentType ? "equipo" : "producto";
      const cartId = `${productType}:${p.id}`;
      const found = current.find(item => item.id === cartId);
      const item: CartItem = { ...p, id: cartId, productId: p.id, productType, precioBase: p.precio, cantidad: (found?.cantidad || 0) + 1 };
      const next = found ? current.map(existing => existing.id === cartId ? item : existing) : [...current, item];
      window.localStorage.setItem(CART_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CART_EVENT));
      setCartMessage(`${p.nombre}: agregado al carrito. Elegí el medio de pago al preparar el pedido.`);
    } catch { setCartMessage("No pudimos guardar el carrito en este navegador."); }
  };
  const productHref = (product: Producto) => {
    const path = tipo === "componentes" ? `/producto/componente/${encodeURIComponent(product.id)}` : `/producto/equipo/${encodeURIComponent(product.id)}`;
    return `${path}?from=${encodeURIComponent(`/tienda?${searchParams.toString()}`)}`;
  };

  return (
    <>
      <PageHero fullWidth background={{ image: "/backgrounds/tienda.png", preset: "tienda", overlay: "dark-image" }}
        eyebrow="Tienda"
        title={
          tipo === "componentes"
            ? "Componentes de PC"
            : tipo === "accesorios"
              ? "Accesorios"
              : `${tipo === "equipos" ? "Equipos" : stockCategories.find((category) => category.value === tipo)?.label || "Equipos"} · Nuevos`
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
      <div className="container-page max-w-none py-12 lg:py-16">
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
            <GlobalCart />
            <p role="status" className="text-xs text-muted-foreground">{cartMessage}</p>
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
        <div className="mb-5 flex items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{loading ? "Cargando catálogo…" : loadError ? "Catálogo no disponible" : `${filtrados.length} productos`}</p><Button variant="ghost" onClick={() => { setBusqueda(""); setOrden(""); setCategoriaFiltro({ tipo, value: "" }); setPrecioMin(null); setPrecioMax(null); }}>Limpiar filtros</Button></div>
        {loading && (
          <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        )}

        {loadError && <div role="alert" className="rounded-2xl border p-8"><h2 className="font-semibold">No pudimos cargar el catálogo</h2><p className="mt-2 text-sm text-muted-foreground">Reintentá para consultar precios y disponibilidad.</p><Button className="mt-4" onClick={() => setAttempt(a => a + 1)}>Reintentar</Button></div>}
        {!loading && !loadError && grupos.length === 0 && (
          <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <div>
              <Search className="mx-auto mb-3 size-6 text-primary" aria-hidden="true" />
              <p className="font-semibold text-slate-900">No encontramos productos con esos filtros.</p>
              <p className="mt-1 text-sm text-muted-foreground">Probá otra búsqueda o limpiá los filtros para ver el catálogo completo.</p>
            </div>
          </div>
        )}

        {!loading && !loadError &&
          grupos.map(([categoria, items]) => (
            <div key={categoria} className="mb-14">
              <h2 className="mb-6 inline-flex rounded-full border bg-muted px-4 py-1.5 text-sm font-bold">
                {categoria}
              </h2>
              <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
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
                              ? productHref(p)
                              : isEquipmentType
                                ? productHref(p)
                                : undefined}
                          />
                        ) : (
                          <ShoppingCart className="size-8 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                          {isEquipmentType || tipo === "componentes" ? <Link href={productHref(p)} className="hover:text-primary hover:underline">{p.nombre}</Link> : p.nombre}
                        </h3>
                        {agotado ? (
                          <p className="text-sm font-bold uppercase tracking-wide text-destructive">
                            Sin stock
                          </p>
                        ) : (
                          <div>
                            <p className="text-xs text-muted-foreground">Efectivo / transferencia</p>
                            <p className="text-lg font-bold text-emerald-700">
                              {money(p.precio)}
                            </p>
                            <p className="text-[11px] font-semibold text-rose-600">
                              Total con tarjeta: {money(calculateInstallmentPrice(p.precio))}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Sin imp. nac. {money(calculateNationalPrice(p.precio))}
                            </p>
                          </div>
                        )}
                        <AnimatedButton
                          onClick={() => agregar(p)}
                          disabled={agotado}
                          size="sm"
                          className="mt-auto w-full gap-2"
                        >
                          <Plus className="size-3.5" /> Agregar
                        </AnimatedButton>
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

    </>
  );
}
