"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Info, Search, SlidersHorizontal } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { ProductImageGallery } from "@/components/site/ProductImageGallery";
import { PriceRangeFilter } from "@/components/site/PriceRangeFilter";
import { stockCategories } from "@/components/site/site-config";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calculateInstallmentPrice, calculateNationalPrice, isPcArmadaCategoryValue, normalizeEquipmentCondition, normalizeStockCategoryValue } from "@/lib/utils";
import type { Equipo } from "@/lib/types";

interface EquipoStock {
  id: string;
  categoria?: string;
  presetId?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  upc?: string;
  procesador?: string;
  pantalla?: string;
  sistema?: string;
  generacion?: string;
  resolucion?: string;
  unidadOptica?: string;
  conectividad?: string;
  placaVideo?: string;
  distribucionTeclado?: string;
  tecladoRetroiluminado?: string;
  lectorOptico?: string;
  lectorTarjetas?: string;
  webcam?: string;
  usb?: string;
  rj45?: string;
  wifi?: string;
  bluetooth?: string;
  vga?: string;
  hdmi?: string;
  audio?: string;
  bateria?: string;
  origen?: string;
  imagen?: string;
  imagenes?: string[];
  componentes?: Array<{ key: string; label: string; nombre: string; detalle: string; imagen: string; cantidad?: number }>;
  specs?: Record<string, string>;
  image?: string;
  original: number;
  promo: number;
  almacenamiento: string;
  storage?: string;
  ram: string;
  warranty: string;
  condition: "Sellado" | "Reacondicionado" | string;
  estado?: "disponible" | "vendido" | string;
}

interface ProductoPrecargado {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  imagen?: string;
  stock?: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR").format(price);
};

const resolveEquipmentImage = (path: string) => path || "";
const categoryLabels: Record<string, string> = {
  celular: "Celulares",
  notebook: "Notebooks",
  tablet: "Tablets",
  pc: "PC armada",
  "pc-armada": "PC armada",
  tv: "TV´s",
  consola: "Consolas",
};

const normalizeStockCategory = (category?: string) => normalizeStockCategoryValue(category);
const isPcArmadaCategory = (category?: string) => isPcArmadaCategoryValue(category);

/** Map the API `Equipo` shape onto the flat structure this view renders. */
const toStockShape = (e: Equipo): EquipoStock => ({
  id: e.id,
  categoria: e.categoria,
  presetId: "",
  nombre: e.nombre,
  marca: e.marca,
  modelo: e.modelo,
  upc: e.specs?.upc,
  procesador: e.specs?.procesador,
  generacion: e.specs?.generacion,
  resolucion: e.specs?.resolucion,
  unidadOptica: e.specs?.unidadOptica,
  conectividad: e.specs?.conectividad,
  pantalla: e.specs?.pantalla,
  sistema: e.specs?.sistema,
  placaVideo: e.specs?.placaVideo,
  distribucionTeclado: e.specs?.distribucionTeclado,
  tecladoRetroiluminado: e.specs?.tecladoRetroiluminado,
  lectorOptico: e.specs?.lectorOptico,
  lectorTarjetas: e.specs?.lectorTarjetas,
  webcam: e.specs?.webcam,
  usb: e.specs?.usb,
  rj45: e.specs?.rj45,
  wifi: e.specs?.wifi,
  bluetooth: e.specs?.bluetooth,
  vga: e.specs?.vga,
  hdmi: e.specs?.hdmi,
  audio: e.specs?.audio,
  bateria: e.specs?.bateria,
  origen: e.specs?.origen,
  imagenes: e.imagenes || [],
  imagen: e.imagenes?.[0] || "",
  componentes: e.componentes,
  specs: e.specs,
  original: Number(e.original || calculateInstallmentPrice(Number(e.promo || e.original || 0))),
  promo: Number(e.promo || e.original || 0),
  almacenamiento: e.specs?.almacenamiento || "",
  ram: e.specs?.ram || "",
  warranty: e.warranty || "",
  condition: normalizeEquipmentCondition(e.condition),
  estado: e.estado || "disponible",
});

export const StockClient = () => {
  const [equipos, setEquipos] = useState<EquipoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"" | "asc" | "desc">("");
  const [precioMin, setPrecioMin] = useState<number | null>(null);
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const filter = searchParams.get("tipo");
  const categoryFilter = searchParams.get("categoria");
  const normalizedCategoryFilter = normalizeStockCategory(categoryFilter);
  const categoryHref = (value: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("tipo", filter);
    if (value !== "all") params.set("categoria", value);
    const query = params.toString();
    return query ? `/stock?${query}` : "/stock";
  };

  useEffect(() => {
    let alive = true;

    fetch("/api/equipos")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Equipo[]) => {
        if (alive) setEquipos((Array.isArray(data) ? data : []).map(toStockShape));
      })
      .catch(() => alive && setEquipos([]))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const sortedProducts = useMemo(() => {
    return [...equipos]
      .filter((equipo) => {
        if (categoryFilter && normalizeStockCategory(equipo.categoria) !== normalizedCategoryFilter) {
          return false;
        }
        if (busqueda && !`${equipo.nombre} ${equipo.marca || ""} ${equipo.modelo || ""}`.toLowerCase().includes(busqueda.toLowerCase())) {
          return false;
        }
        if (categoryFilter && precioMin !== null && Number(equipo.promo || 0) < precioMin) return false;
        if (categoryFilter && precioMax !== null && Number(equipo.promo || 0) > precioMax) return false;
        if (filter === "reacondicionados") {
          return equipo.condition.toLowerCase().includes("reacondicionado");
        }
        if (filter === "nuevos") {
          return equipo.condition.toLowerCase().includes("sellado");
        }
        return true;
      })
      .sort((a, b) => {
        const conditionOrder = (equipo: EquipoStock) =>
          equipo.condition.toLowerCase().includes("reacondicionado") ? 1 : 0;
        const conditionDifference = conditionOrder(a) - conditionOrder(b);
        if (conditionDifference !== 0) return conditionDifference;
        const priceDifference = Number(a.promo || 0) - Number(b.promo || 0);
        if (orden === "desc") return -priceDifference;
        return priceDifference;
      });
  }, [equipos, filter, categoryFilter, normalizedCategoryFilter, busqueda, orden, precioMin, precioMax]);

  const groupedProducts = useMemo(() => {
    if (categoryFilter) {
      return [{ label: categoryLabels[normalizedCategoryFilter] || "Equipos", items: sortedProducts }];
    }

    return stockCategories
      .map((category) => ({
        label: category.label,
        items: sortedProducts.filter(
          (equipo) => normalizeStockCategory(equipo.categoria) === category.value,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [categoryFilter, normalizedCategoryFilter, sortedProducts]);

  return (
    <>
      <PageHero
        eyebrow="Reacondicionados"
        title={
          categoryFilter
            ? categoryLabels[normalizedCategoryFilter] || "Equipos Reacondicionados"
            : "Equipos Reacondicionados"
        }
        description={
          filter === "reacondicionados"
            ? "Equipos reacondicionados con garantía."
              : "Equipos reacondicionados con garantía."
        }
      />

      <section className="py-12 sm:py-16">
        <div className="container-page">
          <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* A side panel remains available while browsing without overlaying the product grid. */}
            <div className="z-20 -mx-4 mb-10 border-b bg-background px-4 py-3 shadow-soft sm:mx-0 sm:rounded-2xl sm:border sm:px-4 lg:sticky lg:top-20 lg:mb-0 lg:rounded-2xl lg:border lg:p-4 lg:self-start">
            <div className="flex flex-col gap-3 md:flex-row md:items-center lg:flex-col lg:items-stretch">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar equipo…"
                  aria-label="Buscar equipo"
                  className="pl-9"
                />
              </div>
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => {
                  window.location.href = categoryHref(value);
                }}
              >
                <SelectTrigger className="md:w-56 lg:w-full">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {stockCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={orden || undefined}
                onValueChange={(value) => setOrden(value as "asc" | "desc")}
              >
                <SelectTrigger className="md:w-48 lg:w-full">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Precio: menor a mayor</SelectItem>
                  <SelectItem value="desc">Precio: mayor a menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categoryFilter && (
              <div className="mt-3">
                <PriceRangeFilter
                  prices={equipos
                    .filter((equipo) => normalizeStockCategory(equipo.categoria) === normalizedCategoryFilter)
                    .map((equipo) => Number(equipo.promo || 0))}
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          )}

          {!loading && sortedProducts.length === 0 && (
            <p className="text-center text-muted-foreground">
              {filter ? "No hay equipos publicados en esta categoria." : "No hay equipos publicados."}
            </p>
          )}

          {!loading && sortedProducts.length > 0 && (
            <div className="space-y-10">
              {groupedProducts.map((group) => {
                const items = group.items || [];

                return (
                  <div key={group.label} className="space-y-6">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{group.label}</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {items.length}
                      </span>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((p) => {
                        const imagenes = (p.imagenes?.length ? p.imagenes : p.imagen || p.image ? [p.imagen || p.image || ""] : [])
                          .map(resolveEquipmentImage);
                        const isNotebook = normalizeStockCategory(p.categoria) === "notebook";
                        const isConsola = normalizeStockCategory(p.categoria) === "consola";
                        const almacenamiento = p.almacenamiento || p.storage || "-";
                        const vendido = String(p.estado || "disponible").toLowerCase() === "vendido";
                        const nombreDisplay = p.nombre || `${p.marca || ""} ${p.modelo || ""}`.trim() || "Equipo";
                        const mensaje = vendido
                          ? `Hola, quiero consultar por ${nombreDisplay} (figura como vendido)`
                          : `Hola, quiero consultar por ${nombreDisplay} - ${formatPrice(p.promo)} ARS`;
                        const isPcArmada = isPcArmadaCategory(p.categoria) || Boolean(p.presetId);
                        const precioEfectivo = Number(p.promo || p.original || 0);
                        const precioLista = calculateInstallmentPrice(precioEfectivo);
                        const precioNacional = calculateNationalPrice(precioEfectivo);
                        const specifications = [
                          ["Marca", p.marca],
                          ["Modelo", p.modelo],
                          ["Color", p.specs?.color],
                          ["Accesorios", p.specs?.accesorios],
                          ["Detalles a tener en cuenta", p.specs?.detalles],
                          ...(isConsola ? [["Generación", p.generacion]] : []),
                          ["UPC / EAN", p.upc],
                          ["Procesador", p.procesador],
                          ["Memoria", p.ram],
                          ["Gráficos", p.placaVideo],
                          ["Almacenamiento", almacenamiento],
                          ["Pantalla", p.pantalla],
                          ...(isConsola ? [
                            ["Resolución máxima", p.resolucion],
                            ["Unidad óptica", p.unidadOptica],
                            ["Conectividad", p.conectividad],
                          ] : []),
                          ["Distribución teclado", p.distribucionTeclado],
                          ["Teclado retroiluminado", p.tecladoRetroiluminado],
                          ["Sist. Operativo", p.sistema],
                          ["Lector Óptico", p.lectorOptico],
                          ["Lector de Tarjetas", p.lectorTarjetas],
                          ["Web Cam", p.webcam],
                          ["Usb", p.usb],
                          ["Rj 45", p.rj45],
                          ["Wi-fi", p.wifi],
                          ["Bluetooth", p.bluetooth],
                          ["Vga", p.vga],
                          ["Hdmi", p.hdmi],
                          ["Aur. y mic", p.audio],
                          ["Batería", p.bateria],
                          ["Origen", p.origen],
                        ].filter(([, value]) => value);
                        const knownSpecKeys = new Set([
                          "color", "accesorios", "detalles",
                          "upc", "procesador", "ram", "placaVideo", "almacenamiento", "pantalla", "generacion",
                          "resolucion", "unidadOptica", "conectividad", "distribucionTeclado", "tecladoRetroiluminado",
                          "sistema", "lectorOptico", "lectorTarjetas", "webcam", "usb", "rj45", "wifi", "bluetooth",
                          "vga", "hdmi", "audio", "bateria", "origen",
                        ]);
                        const specificationsWithExtras = [
                          ...specifications,
                          ...Object.entries(p.specs || {}).filter(([key, value]) => value && !knownSpecKeys.has(key)),
                        ];
                        const hasSpecifications = specificationsWithExtras.length > 0 || Boolean(p.warranty);
                        const hasOfficialWarranty = /sellado/i.test(p.condition || "");

                        return (
                          <Card key={p.id} className="overflow-hidden transition hover:shadow-xl">
                            <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                              <ProductImageGallery
                                images={imagenes}
                                name={nombreDisplay}
                                showThumbnails={imagenes.length > 1}
                                href={`/producto/equipo/${encodeURIComponent(p.id)}`}
                              />
                              {(hasSpecifications || isPcArmada) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={isPcArmada ? `Ver componentes de ${nombreDisplay}` : `Ver especificaciones de ${nombreDisplay}`}
                                      className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border border-white/80 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                                    >
                                      <Info className="size-4" />
                                    </button>
                                  </DialogTrigger>
                                  {isPcArmada ? (
                                    <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-3xl overflow-y-auto rounded-2xl border-slate-200 bg-slate-50 p-0 sm:w-[calc(100vw-2rem)] sm:rounded-3xl">
                                      <DialogHeader className="bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 px-5 py-6 text-white sm:px-7 sm:py-7">
                                        <DialogTitle className="pr-6 text-left text-xl leading-tight text-white sm:text-2xl">{nombreDisplay}</DialogTitle>
                                      </DialogHeader>
                                      {p.componentes?.length ? (
                                        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
                                          {p.componentes.map((component, componentIndex) => (
                                            <div key={`${component.key}-${componentIndex}`} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                                              {component.imagen && <img src={resolveEquipmentImage(component.imagen)} alt={component.nombre} className="h-16 w-16 rounded object-contain" loading="lazy" />}
                                              <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase text-red-600">{component.key === "memory" ? `x${component.cantidad || 1} ${component.label}` : component.label}</p>
                                                <p className="break-words font-semibold text-slate-900">{component.nombre}</p>
                                                <p className="text-sm text-slate-600">{component.detalle}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : <p className="p-5 text-sm text-slate-600 sm:p-7">Componentes a confirmar.</p>}
                                      {hasOfficialWarranty && <div className="mx-5 mb-5 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-blue-50 px-4 py-4 text-center shadow-sm sm:mx-7 sm:mb-7"><p className="text-base font-black uppercase tracking-[0.18em] text-red-700 sm:text-lg">GARANTIA OFICIAL</p></div>}
                                    </DialogContent>
                                  ) : (
                                  <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-3xl overflow-y-auto rounded-2xl border-slate-200 bg-slate-50 p-0 sm:w-[calc(100vw-2rem)] sm:rounded-3xl">
                                    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 px-5 py-6 text-white sm:px-7 sm:py-7">
                                      <DialogHeader>
                                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                                          <SlidersHorizontal className="size-4" /> Ficha tecnica
                                        </div>
                                        <DialogTitle className="pr-6 text-left text-xl leading-tight text-white sm:text-2xl">{nombreDisplay}</DialogTitle>
                                        <p className="mt-2 text-left text-sm text-slate-300">Conocé los detalles principales de este equipo antes de consultarnos.</p>
                                      </DialogHeader>
                                    </div>
                                    <div className="p-5 sm:p-7">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {specificationsWithExtras.map(([label, value]) => (
                                        <div key={String(label)} className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
                                          <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">{label}</p>
                                          <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-slate-900">{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    {p.warranty && (
                                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 shadow-sm">
                                        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-red-600" />
                                        <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Garantía</p>
                                        <p className="mt-1 text-base font-extrabold text-red-700 sm:text-lg">{p.warranty}</p>
                                        </div>
                                      </div>
                                    )}
                                    {hasOfficialWarranty && <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-blue-50 px-4 py-4 text-center shadow-sm"><p className="text-base font-black uppercase tracking-[0.18em] text-red-700 sm:text-lg">GARANTIA OFICIAL</p></div>}
                                    </div>
                                  </DialogContent>
                                  )}
                                </Dialog>
                              )}
                              <div className="absolute bottom-0 left-0 w-full bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4">
                                <p className="mb-2 break-words text-sm font-semibold text-white">{nombreDisplay}</p>
                              </div>
                            </div>

                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="w-full space-y-3">
                                  {vendido ? (
                                    <p className="text-xl font-extrabold uppercase tracking-wide text-rose-600">
                                      Vendido
                                    </p>
                                  ) : (
                                    <>
                                      <div className="space-y-1.5">
                                        <p className="text-2xl font-black text-emerald-500 sm:text-3xl">
                                          ${formatPrice(precioEfectivo)}
                                        </p>
                                        <p className="text-[11px] font-semibold text-rose-500">
                                          3/6 cuotas sin interés: ${formatPrice(precioLista)}
                                        </p>
                                        <p className="text-[11px] font-medium text-slate-400">
                                          Sin imp. nac. ${formatPrice(precioNacional)}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[150px]">
                                         {/*
                                          <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 text-center shadow-sm">
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                                              Garantía
                                            </p>
                                            <p className="mt-1 text-xl font-extrabold text-amber-600 sm:text-2xl">
                                              {p.warranty}
                                            </p>
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                           */}

                                   <a
                                    href={`https://wa.me/5491124873190?text=${encodeURIComponent(mensaje)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-secondary-foreground transition hover:bg-primary/80 sm:py-2"
                                  >
                                    Consultar
                                  </a>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
          </div>
        </div>
      </section>
    </>
  );
};
