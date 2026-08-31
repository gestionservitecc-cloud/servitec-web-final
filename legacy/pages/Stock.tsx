import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import StorageImage from "@/components/StorageImage";
import { storageObjectUrl } from "@/hooks/use-storage-url";
import { calculateNationalPrice, isPcArmadaCategoryValue, normalizeStockCategoryValue } from "@/lib/utils";

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

const resolveEquipmentImage = (path: string) => {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : storageObjectUrl(path.replace(/^\//, ""));
};

const normalizeStockCategory = (category?: string) => normalizeStockCategoryValue(category);
const isPcArmadaCategory = (category?: string) => isPcArmadaCategoryValue(category);

const Stock = () => {
  const [equipos, setEquipos] = useState<EquipoStock[]>([]);
  const [productosPrecargados, setProductosPrecargados] = useState<ProductoPrecargado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("tipo");
  const categoryFilter = searchParams.get("categoria");
  const normalizedCategoryFilter = normalizeStockCategory(categoryFilter);

  const categoryLabels: Record<string, string> = {
    celular: "Celulares",
    notebook: "Notebooks",
    tablet: "Tablets",
    pc: "PC armada",
    "pc-armada": "PC armada",
    tv: "TV´s",
  };

  useEffect(() => {
    const equiposRef = collection(db, "equipos_stock");
    const unsubEquipos = onSnapshot(
      equiposRef,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EquipoStock[];
        setEquipos(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubProductos = onSnapshot(
      collection(db, "stock"),
      (snap) => {
        setProductosPrecargados(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProductoPrecargado[]);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubEquipos();
      unsubProductos();
    };
  }, []);

  const publishedProducts = useMemo<EquipoStock[]>(
    () => productosPrecargados
      .filter((producto) => normalizeStockCategory(producto.categoria) === "celular")
      .map((producto) => ({
        id: `stock-${producto.id}`,
        categoria: "celular",
        nombre: producto.nombre,
        imagen: producto.imagen,
        original: producto.precio,
        promo: producto.precio,
        almacenamiento: "-",
        ram: "-",
        warranty: "Garantia oficial",
        condition: "Sellado",
        estado: producto.stock && producto.stock > 0 ? "disponible" : "vendido",
      })),
    [productosPrecargados]
  );

  const sortedProducts = useMemo(
    () => [...equipos, ...publishedProducts]
      .filter((equipo) => {
        if (categoryFilter && normalizeStockCategory(equipo.categoria) !== normalizedCategoryFilter) {
          return false;
        }
        if (filter === "reacondicionados") {
          return equipo.condition.toLowerCase().includes("reacondicionado");
        }
        if (filter === "nuevos") {
          return equipo.condition.toLowerCase().includes("sellado") || equipo.condition.toLowerCase().includes("nuevo");
        }
        return true;
      })
      .sort((a, b) => {
        const conditionOrder = (equipo: EquipoStock) => equipo.condition.toLowerCase().includes("reacondicionado") ? 1 : 0;
        return conditionOrder(a) - conditionOrder(b) || Number(a.promo || 0) - Number(b.promo || 0);
      }),
    [equipos, filter, categoryFilter, normalizedCategoryFilter, publishedProducts]
  );

  return (
    <Layout>
      <section className="relative overflow-hidden py-20 text-white sm:py-24">
        <StorageImage
          storagePath="BAN-IN.png"
          alt="Banner Stock"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="container relative z-10 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {categoryFilter ? categoryLabels[normalizedCategoryFilter] || "Equipos en Stock" : "Equipos en Stock"}
          </h1>
          <p className="mt-4 text-base text-slate-200 sm:text-lg">
            {filter === "reacondicionados" ? "Equipos reacondicionados con garantia." : filter === "nuevos" ? "Equipos nuevos y sellados con garantia." : "Equipos nuevos y reacondicionados con garantia."}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((p, index) => {
                const imagen = resolveEquipmentImage(p.imagen || p.image || "");
                const imagenes = (p.imagenes?.length ? p.imagenes : p.imagen || p.image ? [p.imagen || p.image || ""] : [])
                  .map(resolveEquipmentImage);
                const almacenamiento = p.almacenamiento || p.storage || "-";
                const vendido = String(p.estado || "disponible").toLowerCase() === "vendido";
                const nombreDisplay = p.nombre || `${p.marca || ""} ${p.modelo || ""}`.trim() || "Equipo";
                const mensaje = vendido
                  ? `Hola, quiero consultar por ${nombreDisplay} (figura como vendido)`
                  : `Hola, quiero consultar por ${nombreDisplay} - ${formatPrice(p.promo)} ARS`;

                const isReacondicionado = p.condition.toLowerCase().includes("reacondicionado");
                const previousIsReacondicionado = index > 0 && sortedProducts[index - 1].condition.toLowerCase().includes("reacondicionado");
                const isPcArmada = isPcArmadaCategory(p.categoria) || Boolean(p.presetId);
                const precioEfectivo = Number(p.promo || p.original || 0);
                const precioNacional = calculateNationalPrice(precioEfectivo);
                const specifications = [
                  ["Marca", p.marca],
                  ["Modelo", p.modelo],
                  ["UPC / EAN", p.upc],
                  ["Procesador", p.procesador],
                  ["Memoria", p.ram],
                  ["Gráficos", p.placaVideo],
                  ["Almacenamiento", almacenamiento],
                  ["Pantalla", p.pantalla],
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
                  <div key={p.id} className="contents">
                    {categoryFilter && !filter && (index === 0 || isReacondicionado !== previousIsReacondicionado) && (
                      <h2 className="col-span-full mt-4 border-b border-slate-200 pb-2 text-xl font-semibold text-slate-900 first:mt-0">
                        {isReacondicionado ? "Reacondicionados" : "Nuevos"}
                      </h2>
                    )}
                    <Card className="overflow-hidden transition hover:shadow-xl">
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                      <ProductGallery images={imagenes} name={nombreDisplay} />

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
                              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                                <p className="text-red-500 line-through decoration-red-500/80">
                                  ${formatPrice(p.original)} ARS
                                </p>
                                <span className="whitespace-nowrap rounded-full border border-red-500/50 bg-red-500/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500">
                                  3 cuotas sin interés
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Mejor precio
                                  </p>
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-[9px] font-bold text-slate-400">
                                    i
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-2xl font-black text-emerald-500 sm:text-3xl">
                                    ${formatPrice(precioEfectivo)}
                                  </p>
                                  <span className="whitespace-nowrap rounded-full border border-emerald-500/50 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                                    Efectivo / Transferencia
                                  </span>
                                </div>

                                <p className="text-[11px] font-medium text-slate-400">
                                  Precio sin impuestos nac. ${formatPrice(precioNacional)}
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
                              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{nombreDisplay}</DialogTitle>
                                </DialogHeader>
                                {p.componentes?.length ? (
                                  <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                    {p.componentes.map((component, componentIndex) => (
                                      <div key={`${component.key}-${componentIndex}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                                        {component.imagen && <img src={resolveEquipmentImage(component.imagen)} alt={component.nombre} className="h-16 w-16 rounded object-contain" loading="lazy" />}
                                        <div>
                                          <p className="text-xs font-semibold uppercase text-slate-500">{component.key === "memory" ? `x${component.cantidad || 1} ${component.label}` : component.label}</p>
                                          <p className="font-semibold text-slate-900">{component.nombre}</p>
                                          <p className="text-sm text-slate-600">{component.detalle}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="border-t border-slate-200 pt-4 text-sm text-slate-600">Componentes a confirmar.</p>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                          {!isPcArmada && hasSpecifications && (
                            <Dialog>
                              <DialogTrigger className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                                Especificaciones
                              </DialogTrigger>
                              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{nombreDisplay}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-x-8 gap-y-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                  {specifications.map(([label, value]) => (
                                    <p key={label} className="text-sm text-slate-600">
                                      <span className="font-semibold text-slate-900">{label}:</span>{" "}
                                      {value}
                                    </p>
                                  ))}
                                </div>
                                {p.warranty && (
                                  <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 text-center shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Garantía</p>
                                    <p className="mt-1 text-xl font-extrabold text-amber-600 sm:text-2xl">{p.warranty}</p>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Stock;

const ProductGallery = ({ images, name }: { images: string[]; name: string }) => {
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
      {images.length > 1 && (
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
