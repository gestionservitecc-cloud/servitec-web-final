"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Info, MessageCircle, Share2, ShoppingCart, Smartphone } from "lucide-react";
import { ProductImageGallery } from "@/components/site/ProductImageGallery";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  catalogProductImage,
  componentCatalogLabels,
  componentSpecificationFields,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";
import { calculateInstallmentPrice, calculateNationalPrice, normalizeEquipmentCondition, normalizeStockCategoryValue } from "@/lib/utils";
import { stockCategories, waLink } from "@/components/site/site-config";
import type { Equipo } from "@/lib/types";

type DetailType = "componente" | "equipo";

const money = (value: number) => `$${Math.round(Number(value) || 0).toLocaleString("es-AR")}`;
const CART_KEY = "servitec-tienda-carrito";
const CART_EVENT = "servitec-cart-updated";

type CartItem = {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
  imagenes: string[];
  precio: number;
  stock: number;
  specs?: Record<string, string>;
  componentKey?: ComponentCatalogKey;
  condition?: string;
  cantidad: number;
  precioBase?: number;
  paymentMethod?: "efectivo" | "tarjeta";
  productId?: string;
  productType?: DetailType;
};

const humanizeKey = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();

const equipmentCategoryLabel = (value?: string) =>
  stockCategories.find((category) => category.value === normalizeStockCategoryValue(value))?.label || "Equipo";

export function ProductDetailClient({ type, id }: { type: DetailType; id: string }) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from");
  const safeReturn = returnTo && /^\/(tienda|reacondicionados)(\?|$)/.test(returnTo) ? returnTo : null;
  const [component, setComponent] = useState<{ product: CatalogProduct; key: ComponentCatalogKey } | null>(null);
  const [equipment, setEquipment] = useState<Equipo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartMessage, setCartMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta">("efectivo");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (type === "componente") {
          const response = await fetch("/api/componentes");
          if (!response.ok) throw new Error("No se pudo cargar el componente.");
          const payload = (await response.json()) as { catalog?: Record<string, CatalogProduct[]> };
          const found = Object.entries(payload.catalog || {}).find(([, products]) =>
            products.some((product) => String(product.id) === id),
          );
          const product = found?.[1].find((item) => String(item.id) === id);
          if (alive && product && found) {
            setComponent({ product, key: found[0] as ComponentCatalogKey });
          }
        } else {
          const response = await fetch("/api/equipos");
          if (!response.ok) throw new Error("No se pudo cargar el equipo.");
          const data = await response.json();
          const found = (Array.isArray(data) ? data : []).find((item: Equipo) => String(item.id) === id);
          if (alive && found) setEquipment(found);
        }
      } catch {
        if (alive) setLoadError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [id, type]);

  const componentData = component?.product;
  const equipmentData = equipment;
  const title = componentData?.nombre || equipmentData?.nombre || "Producto";
  const images = componentData
    ? componentData.imagenes?.length ? componentData.imagenes : [catalogProductImage(componentData)]
    : equipmentData?.imagenes || [];
  const price = componentData
    ? Math.round((Number(componentData.precio) || 0) * 1.08)
    : Number(equipmentData?.promo || equipmentData?.original || 0);
  const selectedPrice = paymentMethod === "tarjeta" ? calculateInstallmentPrice(price) : price;
  const isReconditioned = equipmentData && normalizeEquipmentCondition(equipmentData.condition) === "Reacondicionado";
  const categoryLabel = component ? componentCatalogLabels[component.key] : equipmentCategoryLabel(equipmentData?.categoria);

  const unavailable = componentData?.stock === 0 || (equipmentData && (equipmentData.estado === "vendido" || equipmentData.stock === 0));
  const addToCart = () => {
    if (unavailable || price <= 0) return;
    const cartId = `${type}:${id}:${paymentMethod}`;
    const item: CartItem = {
      id: cartId,
      productId: id,
      productType: type,
      paymentMethod,
      precioBase: price,
      nombre: `${title} · ${paymentMethod === "tarjeta" ? "Tarjeta" : "Efectivo / Transferencia"}`,
      categoria: categoryLabel,
      imagen: images[0] || "",
      imagenes: images,
      precio: selectedPrice,
      stock: 1,
      specs: componentData?.specs as Record<string, string> | undefined || equipmentData?.specs,
      componentKey: component?.key,
      condition: equipmentData?.condition,
      cantidad: 1,
    };
    try {
      const stored = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
      const current: CartItem[] = Array.isArray(stored) ? stored : [];
      const next = current.some((cartItem) => String(cartItem.id) === cartId)
        ? current.map((cartItem) => String(cartItem.id) === cartId
          ? { ...item, cantidad: Math.max(0, Number(cartItem.cantidad) || 0) + 1 }
          : cartItem)
        : [...current, item];
      window.localStorage.setItem(CART_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CART_EVENT));
      setCartMessage("Agregado al carrito");
    } catch {
      setCartMessage("No se pudo actualizar el carrito");
    }
  };

  const shareProduct = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Mirá este producto: ${title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Enlace copiado");
      }
    } catch {
      // Closing the native share sheet is not an error for the user.
    }
  };

  const shareOnWhatsApp = () => {
    window.open(waLink(`Mirá este producto de ServiTec: ${title}\n${window.location.href}`), "_blank", "noopener,noreferrer");
    setShareMessage("Abriendo WhatsApp");
  };

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Enlace copiado");
    } catch {
      setShareMessage("No se pudo copiar el enlace");
    }
  };

  const specs = useMemo(() => {
    if (componentData && component) {
      const fields = componentSpecificationFields(component.key, componentData.nombre);
      const known = new Set(fields.map((field) => field.key));
      return [
        ...fields
          .filter((field) => componentData.specs?.[field.key])
          .map((field) => [field.label, componentData.specs?.[field.key] || ""] as const),
        ...Object.entries(componentData.specs || {})
          .filter(([key, value]) => value && !known.has(key))
          .map(([key, value]) => [humanizeKey(key), String(value)] as const),
      ];
    }
    if (!equipmentData) return [] as Array<readonly [string, string]>;
    const equipmentSpecs = equipmentData.specs || {};
    return [
      ["Marca", equipmentData.marca],
      ["Modelo", equipmentData.modelo],
      ["Garantía", equipmentData.warranty],
      ...Object.entries(equipmentSpecs).map(([key, value]) => [humanizeKey(key), String(value || "")] as const),
    ].filter(([, value]) => value) as Array<readonly [string, string]>;
  }, [component, componentData, equipmentData]);

  if (loadError) return <div role="alert" className="container-page py-16"><h1 className="text-2xl font-bold">No pudimos cargar el producto</h1><Button className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button></div>;
  if (loading) {
    return <div className="container-page grid min-h-[70vh] place-items-center py-16"><div className="h-96 w-full animate-pulse rounded-3xl bg-muted" /></div>;
  }

  if ((!componentData && !equipmentData) || (type === "componente" && !componentData)) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
        <div><h1 className="font-display text-2xl font-bold">No encontramos este producto</h1><Button asChild className="mt-5"><Link href={type === "componente" ? "/tienda?tipo=componentes" : "/tienda?tipo=equipos"}>Volver</Link></Button></div>
      </div>
    );
  }

  const equipmentCategory = normalizeStockCategoryValue(equipmentData?.categoria);
  const backHref = safeReturn || (type === "componente"
    ? "/tienda?tipo=componentes"
    : isReconditioned
      ? `/reacondicionados?categoria=${equipmentCategory}`
      : `/tienda?tipo=${equipmentCategory || "equipos"}`);
  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10">
      <div className="container-page">
        <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600"><ArrowLeft className="size-4" /> Volver a {categoryLabel}</Link>
        <section className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex min-h-[360px] items-center justify-center bg-white p-5 sm:min-h-[520px] sm:p-10">
            <div className="relative aspect-square w-full max-w-xl overflow-hidden rounded-2xl bg-slate-50">
              <ProductImageGallery images={images} name={title} showThumbnails={images.length > 1} />
            </div>
          </div>
          <div className="flex flex-col justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 p-6 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">{categoryLabel}{isReconditioned ? " · Reacondicionado" : ""}</p>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">{title}</h1>
            <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">{paymentMethod === "tarjeta" ? "Precio total con tarjeta" : "Efectivo / transferencia"}</p>
              <p className="mt-1 text-3xl font-black text-white sm:text-4xl">{money(selectedPrice)}</p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  aria-pressed={paymentMethod === "efectivo"}
                  onClick={() => setPaymentMethod("efectivo")}
                  className={`rounded-xl border p-3 text-left transition ${paymentMethod === "efectivo" ? "border-emerald-300 bg-white text-slate-900" : "border-white/20 bg-white/5 text-white hover:bg-white/10"}`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wide ${paymentMethod === "efectivo" ? "text-emerald-700" : "text-emerald-200"}`}>Efectivo / Transferencia</p>
                  <p className="mt-1 text-lg font-black">{money(price)}</p>
                  <p className={`mt-1 text-xs font-medium ${paymentMethod === "efectivo" ? "text-slate-600" : "text-slate-300"}`}>Sin imp. nac. {money(calculateNationalPrice(price))}</p>
                </button>
                <button
                  type="button"
                  aria-pressed={paymentMethod === "tarjeta"}
                  onClick={() => setPaymentMethod("tarjeta")}
                  className={`rounded-xl border p-3 text-left transition ${paymentMethod === "tarjeta" ? "border-red-300 bg-white text-slate-900" : "border-white/20 bg-white/5 text-white hover:bg-white/10"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wide ${paymentMethod === "tarjeta" ? "text-red-700" : "text-red-200"}`}>Tarjeta de crédito</p>
                      <p className="mt-1 text-lg font-black">{money(calculateInstallmentPrice(price))}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-white p-1.5">
                      <img src="/pagos/visa.svg" alt="Visa" className="h-5 w-auto" />
                      <img src="/pagos/mastercard.svg" alt="Mastercard" className="h-5 w-auto" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs opacity-75">3 cuotas de {money(calculateInstallmentPrice(price) / 3)} o 6 de {money(calculateInstallmentPrice(price) / 6)}. Total: {money(calculateInstallmentPrice(price))}. Importes por cuota aproximados por redondeo.</p>
                </button>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-emerald-200"><Check className="size-4" /> {unavailable ? "Sin disponibilidad para compra" : "Disponible para consultar"}</p>
            </div>
            {equipmentData?.warranty && <p className="mt-4 text-sm">Garantía: {equipmentData.warranty}</p>}
            {unavailable && <a className="mt-4 font-semibold text-white underline" href={waLink(`Hola, busco alternativas a ${title}`)} target="_blank" rel="noopener noreferrer">Consultar alternativas por WhatsApp</a>}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button disabled={Boolean(unavailable) || price <= 0} type="button" onClick={addToCart} className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-fit"><ShoppingCart className="size-4" /> Agregar al carrito</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-fit" aria-label="Abrir opciones para compartir">
                    <Share2 className="size-4" /> Compartir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200 p-1.5">
                  <DropdownMenuItem onSelect={shareOnWhatsApp} className="gap-3 rounded-lg px-3 py-2.5">
                    <MessageCircle className="size-4 text-emerald-600" />
                    <span>Compartir por WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void copyProductLink()} className="gap-3 rounded-lg px-3 py-2.5">
                    <Copy className="size-4 text-blue-600" />
                    <span>Copiar enlace</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void shareProduct()} className="gap-3 rounded-lg px-3 py-2.5">
                    <Smartphone className="size-4 text-red-600" />
                    <span>Más opciones del dispositivo</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild variant="ghost" className="w-full text-blue-100 hover:bg-white/10 hover:text-white sm:w-fit"><Link href={backHref}>Volver a comprar</Link></Button>
            </div>
            {(cartMessage || shareMessage) && <p className="mt-3 text-sm font-semibold text-emerald-200">{cartMessage || shareMessage}</p>}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
          <div className="flex items-center gap-2 border-b border-red-200 pb-4"><Info className="size-5 text-red-600" /><h2 className="text-xl font-black text-slate-900 sm:text-2xl">Especificaciones</h2></div>
          {equipmentData?.detail && <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-700">{equipmentData.detail}</p>}
          {equipmentData?.componentes?.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {equipmentData.componentes.map((item, index) => <div key={`${item.key}-${index}`} className="rounded-xl border border-blue-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-red-600">{item.label}</p><p className="mt-1 font-semibold text-slate-900">{item.nombre}</p><p className="mt-1 text-sm text-slate-600">{item.detalle}</p></div>)}
            </div>
          ) : null}
          {specs.length > 0 ? <div className="mt-5 grid gap-x-8 rounded-xl bg-slate-50 px-3 sm:grid-cols-2">{specs.map(([label, value], index) => <div key={`${label}-${index}`} className="flex items-start justify-between gap-4 border-b border-slate-200 py-3 text-sm"><span className="font-semibold text-slate-600">{label}</span><span className="max-w-[58%] text-right font-medium text-slate-900">{value}</span></div>)}</div> : <p className="mt-6 text-sm text-slate-500">Las especificaciones todavía no fueron cargadas.</p>}
          {!equipmentData?.warranty && <p className="mt-6 text-sm text-slate-600">Consultá la cobertura de garantía para este producto. <Link href="/condiciones" className="font-semibold text-primary underline">Ver condiciones</Link></p>}
        </section>
      </div>
    </div>
  );
}
