import {
  buildCatalogIndex,
  catalogProductImage,
  componentCatalogKeys,
  componentCatalogLabels,
  componentSpecificationFields,
  hasCatalogPrice,
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
export { buildCatalogIndex, catalogProductImage, componentCatalogKeys, componentCatalogLabels, componentSpecificationFields, hasCatalogPrice, matchesMonitorProduct, matchesProductKeywords, matchesSpeakerProduct, normalizeCatalogProduct, normalizeCatalogText, searchCatalog };

const emptyCatalog = (): Record<ComponentCatalogKey, CatalogProduct[]> => Object.fromEntries(componentCatalogKeys.map((key) => [key, []])) as Record<ComponentCatalogKey, CatalogProduct[]>;
let catalogCache: Record<ComponentCatalogKey, CatalogProduct[]> | null = null;

export async function loadComponentCatalog(): Promise<Record<ComponentCatalogKey, CatalogProduct[]>> {
  // Fetch on each builder visit so admin updates are not hidden by a session-long cache.
  if (typeof window !== "undefined") {
    const response = await fetch("/api/componentes", { cache: "no-store" }).catch(() => null);
    if (response?.ok) {
      const payload = await response.json().catch(() => ({}));
      const catalog = payload?.catalog;
      if (catalog && typeof catalog === "object") {
        catalogCache = catalog as Record<ComponentCatalogKey, CatalogProduct[]>;
        return catalogCache;
      }
    }
    throw new Error("No se pudo cargar el catálogo de componentes.");
  }
  catalogCache = await loadCatalogFromBlob();
  catalogCache ||= emptyCatalog();
  return catalogCache;
}

export function getCatalog(): Catalog {
  return (catalogCache || emptyCatalog()) as unknown as Catalog;
}

export function getCatalogIndex() {
  return buildCatalogIndex((catalogCache || emptyCatalog()) as unknown as import("./component-catalog").ComponentCatalog);
}
