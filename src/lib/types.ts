export type EquipoCategoria =
  | "celular"
  | "notebook"
  | "tablet"
  | "consola"
  | "pc-armada"
  | "tv";

export interface EquipoComponente {
  key: string;
  label: string;
  nombre: string;
  detalle: string;
  imagen: string;
  precio: number | null;
  cantidad: number;
}

export interface EquipoSpecs {
  color?: string;
  accesorios?: string;
  detalles?: string;
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  pantalla?: string;
  pulgadas?: string;
  placaVideo?: string;
  sistema?: string;
  generacion?: string;
  resolucion?: string;
  unidadOptica?: string;
  conectividad?: string;
  bateria?: string;
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
  origen?: string;
  upc?: string;
  [key: string]: string | undefined;
}

export interface Equipo {
  id: string;
  orden: number;
  categoria: EquipoCategoria | string;
  nombre: string;
  marca: string;
  modelo: string;
  detail: string;
  notasPrivadas?: string;
  condition: string;
  estado: "disponible" | "vendido" | string;
  original: number;
  promo: number;
  recomendada: boolean;
  warranty: string;
  imagenes: string[];
  specs: EquipoSpecs;
  componentes: EquipoComponente[];
  stock?: number;
  precioCosto?: number;
  originalCatalogPrice?: number;
  esNuevo?: boolean;
  monedaCosto?: "ARS" | "USD";
  costoBaseUsd?: number;
  cotizacionDolar?: number;
  costoActualizadoEn?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioCosto: number;
  stock: number;
  imagen: string;
}

export interface ComponenteAdmin {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioCosto: number;
  stock: number;
  imagen: string;
  specs?: Record<string, string>;
  imagenes?: string[];
  originalCatalogPrice?: number;
  esNuevo?: boolean;
}

export interface CatalogItem {
  nombre: string;
  precio: number;
  imagen: string;
}

export type ComponentKey =
  | "motherboard"
  | "processor"
  | "memory"
  | "storage"
  | "graphics"
  | "power"
  | "case"
  | "cooling"
  | "peripherals";

export type Catalog = Record<ComponentKey, CatalogItem[]>;
