export type EquipoCategoria =
  | "celular"
  | "notebook"
  | "tablet"
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
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  pantalla?: string;
  pulgadas?: string;
  placaVideo?: string;
  sistema?: string;
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
}

export interface Equipo {
  id: string;
  orden: number;
  categoria: EquipoCategoria | string;
  nombre: string;
  marca: string;
  modelo: string;
  detail: string;
  condition: string;
  estado: "disponible" | "vendido" | string;
  original: number;
  promo: number;
  recomendada: boolean;
  warranty: string;
  imagenes: string[];
  specs: EquipoSpecs;
  componentes: EquipoComponente[];
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
