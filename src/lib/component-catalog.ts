import { getAssetUrl } from "@/lib/asset-url";
import type { CatalogItem, ComponentKey } from "./types";

export type ComponentCatalogKey = ComponentKey;
export type CatalogProduct = CatalogItem & {
  id: string;
  categoria: string;
  marca: string;
  modelo: string;
  imagenes: string[];
  url: string;
  tags: string[];
  searchable: string;
  [key: string]: unknown;
};
export type ComponentCatalog = Record<ComponentKey, CatalogProduct[]>;

export const componentCatalogLabels: Record<ComponentCatalogKey, string> = {
  motherboard: "Motherboard",
  processor: "Procesador",
  memory: "Memoria RAM",
  storage: "Almacenamiento",
  graphics: "Placa de video",
  power: "Fuente",
  case: "Gabinete",
  cooling: "Refrigeración",
  peripherals: "Periféricos",
};

export const componentCatalogKeys = Object.keys(componentCatalogLabels) as ComponentCatalogKey[];
const COMPONENTS_ROOT_FOLDER = "componentes";
const FOLDER_BY_KEY: Record<ComponentCatalogKey, string> = {
  motherboard: "MOTHERBOARD",
  processor: "PROCESADOR",
  memory: "RAM",
  storage: "DISCO",
  graphics: "GRAFICA",
  power: "FUENTE",
  case: "GABINETE",
  cooling: "COOLER",
  peripherals: "PERIFERICO",
};
const IMAGE_FOLDER_BY_KEY: Record<ComponentCatalogKey, string> = {
  motherboard: "motherboard_img",
  processor: "procesador_img",
  memory: "ram_img",
  storage: "disco_img",
  graphics: "grafica_img",
  power: "fuente_img",
  case: "gabinete_img",
  cooling: "cooler_img",
  peripherals: "periferico_img",
};

export const catalogDataKeys = [...componentCatalogKeys, "peripherals"] as ComponentKey[];
const DATA_FOLDER_BY_KEY: Record<ComponentKey, string> = FOLDER_BY_KEY;

export function catalogBlobFolderPath(category: ComponentKey): string {
  return `${COMPONENTS_ROOT_FOLDER}/${DATA_FOLDER_BY_KEY[category]}`;
}

export function catalogBlobJsonPath(category: ComponentKey): string {
  return `${catalogBlobFolderPath(category)}/productos.json`;
}

export function hasCatalogPrice(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;

  if (typeof value === "number") return Number.isFinite(value) && value > 0;

  if (typeof value === "string") {
    const cleaned = Number(value.replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(cleaned) && cleaned > 0;
  }

  return false;
}

export function normalizeCatalogText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: unknown): string[] {
  return [...new Set(normalizeCatalogText(value).split(" ").filter((token) => token.length > 1))];
}

function firstString(...values: unknown[]): string {
  return values.find((value) => typeof value === "string" && value.trim()) as string || "";
}

function deriveBrand(name: string): string {
  return name.trim().split(/\s+/)[0] || "";
}

function deriveModel(name: string, brand: string): string {
  return name.trim().slice(brand.length).trim();
}

export function resolveCatalogImagePath(value: string, category: ComponentKey): string {
  if (/^(?:https?:|data:|blob:|\/api\/assets\/)/i.test(value)) return value;

  const path = value.replace(/^\/+/, "").replace(/\\/g, "/");
  const folder = DATA_FOLDER_BY_KEY[category];
  const imageFolder = IMAGE_FOLDER_BY_KEY[category];
  const rootFolder = COMPONENTS_ROOT_FOLDER;

  if (path.toLowerCase().startsWith(`${rootFolder.toLowerCase()}/`)) return path;
  if (path.toLowerCase().startsWith(`${folder.toLowerCase()}/`)) return `${rootFolder}/${path}`;
  if (path.toLowerCase().startsWith(`${imageFolder.toLowerCase()}/`)) return `${rootFolder}/${folder}/${path}`;

  const hasSubfolder = path.includes("/");
  const normalizedPath = hasSubfolder ? path : `${imageFolder}/${path}`;
  return `${rootFolder}/${folder}/${normalizedPath}`;
}

export function normalizeCatalogProduct(raw: Record<string, unknown>, category: ComponentKey, index: number): CatalogProduct {
  const name = firstString(raw.nombre, raw.name, raw.title) || `Producto ${index + 1}`;
  const brand = firstString(raw.marca, raw.brand) || deriveBrand(name);
  const model = firstString(raw.modelo, raw.model) || deriveModel(name, brand);
  const rawImages = raw.imagenes ?? raw.images ?? raw.imagen ?? raw.image;
  const images = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    .map((image) => getAssetUrl(resolveCatalogImagePath(image, category)));
  const priceValue = raw.precio ?? raw.price ?? 0;
  const price = typeof priceValue === "string" ? Number(priceValue.replace(/[^0-9.,-]/g, "").replace(",", ".")) : Number(priceValue);
  const categoryValue = firstString(raw.categoria, raw.category) || DATA_FOLDER_BY_KEY[category];
  const tagValues = Array.isArray(raw.tags) ? raw.tags : [raw.tags, raw.tipo, raw.socket, raw.compatibilidad, raw.compatibleCon];
  const tags = [...new Set(tagValues.flatMap((value) => tokens(value)))];
  const searchable = [...new Set([
    ...tokens(name),
    ...tokens(brand),
    ...tokens(model),
    ...tokens(categoryValue),
    ...tags,
  ])].join(" ");

  return {
    ...raw,
    id: firstString(raw.id, raw.sku, raw.codigo) || `${category}-${index}-${normalizeCatalogText(name)}`,
    nombre: name,
    categoria: categoryValue,
    marca: brand,
    modelo: model,
    precio: Number.isFinite(price) ? price : 0,
    imagen: images[0] || "",
    imagenes: images,
    url: firstString(raw.url, raw.href),
    tags,
    searchable,
  } as CatalogProduct;
}

export function buildCatalogIndex(catalog: ComponentCatalog) {
  const index = new Map<string, Set<string>>();
  for (const products of Object.values(catalog)) {
    for (const product of products) {
      for (const token of product.searchable.split(" ")) {
        const ids = index.get(token) || new Set<string>();
        ids.add(product.id);
        index.set(token, ids);
      }
    }
  }
  return index;
}

const catalogIndexes = new WeakMap<object, Map<string, Set<string>>>();

export function searchCatalog(
  catalog: ComponentCatalog,
  query = "",
  options: { category?: ComponentCatalogKey; brand?: string; order?: "price" | "relevance" } = {},
): CatalogProduct[] {
  const products = options.category ? catalog[options.category] || [] : Object.values(catalog).flat();
  const queryTokens = tokens(query);
  let candidates = products;
  if (queryTokens.length > 0) {
    const index = catalogIndexes.get(catalog) || buildCatalogIndex(catalog);
    catalogIndexes.set(catalog, index);
    const matchingIds = queryTokens.reduce<Set<string> | null>((result, token) => {
      const ids = index.get(token) || new Set<string>();
      return result ? new Set([...result].filter((id) => ids.has(id))) : new Set(ids);
    }, null) || new Set<string>();
    candidates = products.filter((product) => matchingIds.has(product.id));
  }

  const filtered = candidates.filter((product) => {
    if (options.brand && normalizeCatalogText(product.marca) !== normalizeCatalogText(options.brand)) return false;
    return queryTokens.every((token) => product.searchable.includes(token));
  });

  return filtered.sort((left, right) => {
    if (options.order === "price") return left.precio - right.precio;
    const leftScore = queryTokens.reduce((score, token) => score + (normalizeCatalogText(left.nombre).includes(token) ? 3 : 1), 0);
    const rightScore = queryTokens.reduce((score, token) => score + (normalizeCatalogText(right.nombre).includes(token) ? 3 : 1), 0);
    return rightScore - leftScore || left.nombre.localeCompare(right.nombre, "es");
  });
}

export const catalogProductImage = (product: CatalogProduct) => product.imagenes[0] || product.imagen || "";
export const matchesProductKeywords = (productName: string, keywords: string[]) => {
  const normalizedName = normalizeCatalogText(productName);
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeCatalogText(keyword);
    return normalizedKeyword.length > 0 && normalizedName.includes(normalizedKeyword);
  });
};
export const matchesMonitorProduct = (productName: string) => /\b(monitor|pantalla|display|led)\b/.test(normalizeCatalogText(productName)) && !/teclado|mouse|auricular|parlante|speaker/.test(normalizeCatalogText(productName));
export const matchesSpeakerProduct = (productName: string) => /parlante|speaker|altavoz|soundbar|subwoofer/.test(normalizeCatalogText(productName)) && !/monitor|pantalla|teclado|mouse|auricular/.test(normalizeCatalogText(productName));

export async function loadCatalogFromBlob(): Promise<ComponentCatalog> {
  const base = (process.env.BLOB_CATALOG_BASE_URL || process.env.NEXT_PUBLIC_BLOB_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const entries = await Promise.all(catalogDataKeys.map(async (key) => {
    if (!base) return [key, []] as const;

    const candidates = [
      `${base}/${catalogBlobJsonPath(key)}`,
      `${base}/${DATA_FOLDER_BY_KEY[key]}/productos.json`,
    ];

    let data: unknown = [];
    for (const url of candidates) {
      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) continue;
      data = await response.json();
      break;
    }

    const rows = Array.isArray(data) ? data : Array.isArray((data as any)?.productos) ? (data as any).productos : [];
    return [key, rows.map((row, index) => normalizeCatalogProduct(row, key, index))] as const;
  }));
  return Object.fromEntries(entries) as ComponentCatalog;
}
