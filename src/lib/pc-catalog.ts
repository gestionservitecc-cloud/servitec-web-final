import {
  buildCatalogIndex,
  catalogProductImage,
  componentCatalogKeys,
  componentCatalogLabels,
  loadCatalogFromBlob,
  matchesMonitorProduct,
  matchesProductKeywords,
  matchesSpeakerProduct,
  normalizeCatalogProduct,
  normalizeCatalogText,
  searchCatalog,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "./component-catalog";
import type { Catalog } from "./types";

export type { CatalogProduct, ComponentCatalogKey };
export { buildCatalogIndex, catalogProductImage, componentCatalogKeys, componentCatalogLabels, matchesMonitorProduct, matchesProductKeywords, matchesSpeakerProduct, normalizeCatalogProduct, normalizeCatalogText, searchCatalog };

const emptyCatalog = (): Record<ComponentCatalogKey, CatalogProduct[]> => Object.fromEntries(componentCatalogKeys.map((key) => [key, []])) as Record<ComponentCatalogKey, CatalogProduct[]>;
let catalogCache: Record<ComponentCatalogKey, CatalogProduct[]> | null = null;

export async function loadComponentCatalog(): Promise<Record<ComponentCatalogKey, CatalogProduct[]>> {
  if (catalogCache) return catalogCache;
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/catalog");
      if (response.ok) catalogCache = await response.json();
    } catch {
      // Existing UI fallback options remain available when Blob is unavailable.
    }
  } else {
    catalogCache = await loadCatalogFromBlob();
  }
  catalogCache ||= emptyCatalog();
  return catalogCache;
}

export function getCatalog(): Catalog {
  return (catalogCache || emptyCatalog()) as unknown as Catalog;
}

export function getCatalogIndex() {
  return buildCatalogIndex((catalogCache || emptyCatalog()) as unknown as import("./component-catalog").ComponentCatalog);
}
