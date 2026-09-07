"use client";

import type { Equipo, Producto } from "@/lib/types";
import type { ComponentCatalog } from "@/lib/component-catalog";
export type ComponentPriceRules = Partial<Record<keyof ComponentCatalog, PriceRule[]>>;
export type DollarQuote = { valor: number; actualizadoEn: string };
export type PriceRule = { min: number; max?: number | null; pct: number };

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
  return data.url as string;
}

export async function saveEquipos(equipos: Equipo[]) {
  const res = await fetch("/api/admin/equipos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(equipos),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
  return data;
}

export async function saveStockCatalog(
  equipos: Equipo[],
  notebookPriceRules: PriceRule[] = [],
  dollarQuote?: DollarQuote,
) {
  const res = await fetch("/api/admin/stock", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipos, notebookPriceRules, ...(dollarQuote ? { dollarQuote } : {}) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo guardar el inventario de equipos.");
  return data;
}

export async function saveProductos(productos: Producto[]) {
  const res = await fetch("/api/admin/productos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productos),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
  return data;
}

export async function saveComponentCatalog(catalog: ComponentCatalog, priceRules: ComponentPriceRules = {}, dollarQuote?: DollarQuote) {
  const res = await fetch("/api/admin/componentes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalog, priceRules, ...(dollarQuote ? { dollarQuote } : {}) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudieron guardar los componentes.");
  return data;
}

export function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const CATEGORIAS_EQUIPO = [
  { value: "notebook", label: "Notebook" },
  { value: "celular", label: "Celular" },
  { value: "consola", label: "Consolas" },
  { value: "pc-armada", label: "PC armada" },
  { value: "tablet", label: "Tablet" },
  { value: "tv", label: "TV" },
];

export const emptyEquipo = (): Equipo => ({
  id: newId(),
  orden: 999,
  categoria: "notebook",
  nombre: "",
  marca: "",
  modelo: "",
  detail: "",
  notasPrivadas: "",
  condition: "Sellado",
  estado: "disponible",
  original: 0,
  promo: 0,
  precioCosto: 0,
  stock: 0,
  recomendada: false,
  warranty: "",
  imagenes: [],
  specs: {},
  componentes: [],
});

export const emptyProducto = (): Producto => ({
  id: newId(),
  nombre: "",
  categoria: "Productos",
  precio: 0,
  precioCosto: 0,
  stock: 1,
  imagen: "",
});

export const SPEC_FIELDS: { key: string; label: string }[] = [
  { key: "procesador", label: "Procesador" },
  { key: "ram", label: "Memoria RAM" },
  { key: "almacenamiento", label: "Almacenamiento" },
  { key: "placaVideo", label: "Placa de video" },
  { key: "pantalla", label: "Pantalla" },
  { key: "pulgadas", label: "Pulgadas" },
  { key: "sistema", label: "Sistema operativo" },
  { key: "bateria", label: "Batería" },
  { key: "distribucionTeclado", label: "Distribución teclado" },
  { key: "tecladoRetroiluminado", label: "Teclado retroiluminado" },
  { key: "webcam", label: "Webcam" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "hdmi", label: "HDMI" },
  { key: "usb", label: "USB" },
  { key: "rj45", label: "RJ-45" },
  { key: "vga", label: "VGA" },
  { key: "audio", label: "Audio" },
  { key: "lectorOptico", label: "Lector óptico" },
  { key: "lectorTarjetas", label: "Lector de tarjetas" },
  { key: "upc", label: "UPC / EAN" },
  { key: "origen", label: "Origen" },
];
