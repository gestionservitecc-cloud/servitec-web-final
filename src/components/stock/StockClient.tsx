"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { stockCategories } from "@/components/site/site-config";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calculateInstallmentPrice, calculateNationalPrice, isPcArmadaCategoryValue, normalizeStockCategoryValue } from "@/lib/utils";
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
  original: Number(e.original || calculateInstallmentPrice(Number(e.promo || e.original || 0))),
  promo: Number(e.promo || e.original || 0),
  almacenamiento: e.specs?.almacenamiento || "",
  ram: e.specs?.ram || "",
  warranty: e.warranty || "",
  condition: e.condition || "Sellado",
  estado: e.estado || "disponible",
});

export const StockClient = () => {
  const [equipos, setEquipos] = useState<EquipoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get("tipo");
  const categoryFilter = searchParams.get("categoria");
  const normalizedCategoryFilter = normalizeStockCategory(categoryFilter);

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
        if (filter === "reacondicionados") {
          return equipo.condition.toLowerCase().includes("reacondicionado");
        }
        if (filter === "nuevos") {
          return (
            equipo.condition.toLowerCase().includes("sellado") ||
            equipo.condition.toLowerCase().includes("nuevo")
          );
        }
        return true;
      })
      .sort((a, b) => {
        const conditionOrder = (equipo: EquipoStock) =>
          equipo.condition.toLowerCase().includes("reacondicionado") ? 1 : 0;
        return conditionOrder(a) - conditionOrder(b) || Number(a.promo || 0) - Number(b.promo || 0);
      });
  }, [equipos, filter, categoryFilter, normalizedCategoryFilter]);

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
        eyebrow="Stock"
        title={
          categoryFilter
            ? categoryLabels[normalizedCategoryFilter] || "Equipos en stock"
            : "Equipos en stock"
        }
        description={
          filter === "reacondicionados"
            ? "Equipos reacondicionados con garantía."
            : filter === "nuevos"
              ? "Equipos nuevos y sellados con garantía."
              : "Equipos nuevos y reacondicionados con garantía."
        }
      />

      <section className="py-12 sm:py-16">
        <div className="container-page">
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
                        const hasSpecifications = specifications.length > 0 || Boolean(p.warranty);

                        return (
                          <Card key={p.id} className="overflow-hidden transition hover:shadow-xl">
                            <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                              <ProductGallery images={imagenes} name={nombreDisplay} showThumbnails={isNotebook} />
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
                                  {isPcArmada && (
                                    <Dialog>
                                      <DialogTrigger className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                                        Ver componentes
                                      </DialogTrigger>
                                      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
                                        <DialogHeader>
                                          <DialogTitle>{nombreDisplay}</DialogTitle>
                                        </DialogHeader>
                                        {p.componentes?.length ? (
                                          <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                            {p.componentes.map((component, componentIndex) => (
                                              <div key={`${component.key}-${componentIndex}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                                                {component.imagen && (
                                                  <img
                                                    src={resolveEquipmentImage(component.imagen)}
                                                    alt={component.nombre}
                                                    className="h-16 w-16 rounded object-contain"
                                                    loading="lazy"
                                                  />
                                                )}
                                                <div>
                                                  <p className="text-xs font-semibold uppercase text-slate-500">
                                                    {component.key === "memory" ? `x${component.cantidad || 1} ${component.label}` : component.label}
                                                  </p>
                                                  <p className="font-semibold text-slate-900">{component.nombre}</p>
                                                  <p className="text-sm text-slate-600">{component.detalle}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="border-t border-slate-200 pt-4 text-sm text-slate-600">
                                            Componentes a confirmar.
                                          </p>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                  )}

                                  {!isPcArmada && hasSpecifications && (
                                    <Dialog>
                                      <DialogTrigger className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                                        Especificaciones
                                      </DialogTrigger>
                                      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
                                        <DialogHeader>
                                          <DialogTitle>{nombreDisplay}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-x-8 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                          {specifications.map(([label, value]) => (
                                            <p key={String(label)} className="text-sm text-slate-600">
                                              <span className="font-semibold text-slate-900">{label}:</span>{" "}
                                              {value}
                                            </p>
                                          ))}
                                        </div>
                                        {p.warranty && (
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
                                  )}

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
      </section>
    </>
  );
};

const ProductGallery = ({
  images,
  name,
  showThumbnails = false,
}: {
  images: string[];
  name: string;
  showThumbnails?: boolean;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] || images[0];

  if (!selectedImage) return null;

  return (
    <>
      <img
        src={selectedImage}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {showThumbnails && images.length > 1 && (
        <div className="absolute left-3 top-3 flex gap-2" aria-label={`Fotos de ${name}`}>
          {images.slice(0, 3).map((url, imageIndex) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedIndex(imageIndex)}
              aria-label={`Ver foto ${imageIndex + 1} de ${name}`}
              aria-pressed={selectedIndex === imageIndex}
              className={`h-12 w-12 overflow-hidden rounded border-2 shadow transition ${selectedIndex === imageIndex ? "border-primary ring-2 ring-primary/50" : "border-white/80 opacity-80 hover:opacity-100"}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
};
