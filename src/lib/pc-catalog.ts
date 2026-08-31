import catalogData from "@/data/catalog/index.json";
import type { Catalog, CatalogItem, ComponentKey } from "./types";

export type { CatalogItem, ComponentKey };
export type CatalogProduct = CatalogItem;
export type ComponentCatalogKey = Exclude<ComponentKey, "peripherals">;

export const componentCatalogLabels: Record<ComponentCatalogKey, string> = {
  motherboard: "Motherboard",
  processor: "Procesador",
  memory: "Memoria RAM",
  storage: "Almacenamiento",
  graphics: "Placa de video",
  power: "Fuente",
  case: "Gabinete",
  cooling: "Refrigeración",
};

export const componentCatalogKeys = Object.keys(
  componentCatalogLabels,
) as ComponentCatalogKey[];

const CATALOG = catalogData as Catalog;

/** Bundled component catalog (previously fetched from Firebase Storage). */
export async function loadComponentCatalog(): Promise<
  Record<ComponentCatalogKey, CatalogProduct[]>
> {
  return Object.fromEntries(
    componentCatalogKeys.map((k) => [k, CATALOG[k] ?? []]),
  ) as Record<ComponentCatalogKey, CatalogProduct[]>;
}

export function getCatalog(): Catalog {
  return CATALOG;
}

export const catalogProductImage = (product: CatalogProduct) => product.imagen || "";

export const normalizeCatalogText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

export const matchesProductKeywords = (
  productName: string,
  keywords: string[],
) => {
  if (!keywords.length) return false;
  const normalized = normalizeCatalogText(productName);
  return keywords.some(
    (k) =>
      normalizeCatalogText(k).length > 0 &&
      normalized.includes(normalizeCatalogText(k)),
  );
};

export const matchesMonitorProduct = (productName: string) => {
  const n = normalizeCatalogText(productName);
  if (!n) return false;
  if (!/(monitor|pantalla|display|led)/.test(n)) return false;
  return !/(teclado|keyboard|mouse|raton|auricular|headset|parlante|speaker|altavoz|soundbar|subwoofer)/.test(
    n,
  );
};

export const matchesSpeakerProduct = (productName: string) => {
  const n = normalizeCatalogText(productName);
  if (!n) return false;
  if (!/(parlante|speaker|altavoz|soundbar|subwoofer)/.test(n)) return false;
  return !/(monitor|pantalla|display|led|teclado|keyboard|mouse|raton|auricular|headset)/.test(
    n,
  );
};
