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
export type ComponentSpecificationField = { key: string; label: string };

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

const COMPONENT_SPECIFICATION_FIELDS: Record<Exclude<ComponentCatalogKey, "peripherals">, ComponentSpecificationField[]> = {
  processor: [
    { key: "socket", label: "Socket" }, { key: "cores", label: "Núcleos" }, { key: "threads", label: "Hilos" },
    { key: "baseFrequency", label: "Frecuencia base" }, { key: "turboFrequency", label: "Frecuencia máxima / Turbo" },
    { key: "cache", label: "Caché" }, { key: "integratedGraphics", label: "Gráficos integrados" }, { key: "tdp", label: "TDP" },
    { key: "includedCooler", label: "Cooler incluido" },
  ],
  motherboard: [
    { key: "socket", label: "Socket" }, { key: "chipset", label: "Chipset" }, { key: "formFactor", label: "Formato" },
    { key: "ramType", label: "Tipo de memoria RAM" }, { key: "ramSlots", label: "Cantidad de slots RAM" },
    { key: "maxMemory", label: "Memoria máxima soportada" }, { key: "m2Slots", label: "Slots M.2" }, { key: "sataPorts", label: "Puertos SATA" },
    { key: "wifi", label: "Wi-Fi" }, { key: "bluetooth", label: "Bluetooth" },
  ],
  cooling: [
    { key: "coolerType", label: "Tipo (Aire / Water Cooler)" }, { key: "compatibleSocket", label: "Socket compatible" },
    { key: "fanSize", label: "Tamaño del ventilador" }, { key: "radiatorSize", label: "Tamaño del radiador" },
    { key: "fanCount", label: "Cantidad de ventiladores" }, { key: "maxRpm", label: "RPM máximo" }, { key: "airflow", label: "Flujo de aire" },
    { key: "noiseLevel", label: "Nivel de ruido" }, { key: "rgb", label: "RGB / ARGB" },
  ],
  memory: [
    { key: "totalCapacity", label: "Capacidad total" }, { key: "configuration", label: "Configuración" }, { key: "memoryType", label: "Tipo (DDR4 / DDR5)" },
    { key: "frequency", label: "Frecuencia" }, { key: "latency", label: "Latencia CL" }, { key: "rgb", label: "RGB" }, { key: "xmpExpo", label: "Perfil XMP / EXPO" },
  ],
  graphics: [
    { key: "gpu", label: "GPU" }, { key: "vram", label: "VRAM" }, { key: "memoryType", label: "Tipo de memoria" }, { key: "memoryBus", label: "Bus de memoria" },
    { key: "boostClock", label: "Frecuencia Boost" }, { key: "powerConsumption", label: "Consumo" }, { key: "recommendedPsu", label: "Fuente recomendada" },
    { key: "length", label: "Longitud" }, { key: "fanCount", label: "Cantidad de ventiladores" }, { key: "videoConnectors", label: "Conectores de video" },
  ],
  storage: [
    { key: "storageType", label: "Tipo (SSD / HDD)" }, { key: "capacity", label: "Capacidad" }, { key: "formFactor", label: "Formato" }, { key: "interface", label: "Interfaz" },
    { key: "maxRead", label: "Lectura máxima" }, { key: "maxWrite", label: "Escritura máxima" }, { key: "pcieGeneration", label: "PCIe Generation" },
    { key: "nvme", label: "NVMe" }, { key: "rpm", label: "RPM (para HDD)" },
  ],
  power: [
    { key: "wattage", label: "Potencia" }, { key: "certification", label: "Certificación 80 Plus" }, { key: "modularity", label: "Modularidad" },
    { key: "formFactor", label: "Formato" }, { key: "atxVersion", label: "Versión ATX" }, { key: "fan", label: "Ventilador" },
    { key: "gpuConnector", label: "Conector PCIe / GPU" }, { key: "cpuConnector", label: "Conector CPU" }, { key: "sata", label: "SATA" },
  ],
  case: [
    { key: "formFactor", label: "Formato" }, { key: "compatibleMotherboards", label: "Motherboards compatibles" }, { key: "maxGpuLength", label: "Longitud máxima de GPU" },
    { key: "maxCoolerHeight", label: "Altura máxima de cooler" }, { key: "maxRadiatorSize", label: "Tamaño máximo de radiador" }, { key: "includedFans", label: "Ventiladores incluidos" },
    { key: "sidePanel", label: "Panel lateral" }, { key: "frontPorts", label: "Puertos frontales" }, { key: "color", label: "Color" },
  ],
};

const PERIPHERAL_SPECIFICATION_FIELDS: Record<"monitor" | "mouse" | "headphones" | "pad" | "keyboard", ComponentSpecificationField[]> = {
  monitor: [
    { key: "size", label: "Tamaño" }, { key: "resolution", label: "Resolución" }, { key: "panelType", label: "Tipo de panel" }, { key: "refreshRate", label: "Frecuencia de actualización" },
    { key: "responseTime", label: "Tiempo de respuesta" }, { key: "brightness", label: "Brillo" }, { key: "hdr", label: "HDR" }, { key: "freesync", label: "FreeSync" },
    { key: "gsync", label: "G-Sync" }, { key: "curved", label: "Curvo / Plano" }, { key: "vesa", label: "VESA" },
  ],
  mouse: [
    { key: "sensor", label: "Sensor" }, { key: "maxDpi", label: "DPI máximo" }, { key: "weight", label: "Peso" }, { key: "connectivity", label: "Conectividad" },
    { key: "buttonCount", label: "Cantidad de botones" }, { key: "pollingRate", label: "Polling Rate" }, { key: "switchType", label: "Tipo de switch" }, { key: "batteryLife", label: "Duración de batería" }, { key: "rgb", label: "RGB" },
  ],
  headphones: [
    { key: "headphoneType", label: "Tipo" }, { key: "connectivity", label: "Conectividad" }, { key: "microphone", label: "Micrófono" }, { key: "driverSize", label: "Tamaño de drivers" },
    { key: "frequencyResponse", label: "Respuesta de frecuencia" }, { key: "wireless", label: "Wireless" }, { key: "batteryLife", label: "Duración de batería" }, { key: "surround", label: "Surround" }, { key: "noiseCancellation", label: "Cancelación de ruido" },
  ],
  pad: [
    { key: "size", label: "Tamaño" }, { key: "dimensions", label: "Dimensiones" }, { key: "thickness", label: "Espesor" }, { key: "material", label: "Material" },
    { key: "surfaceType", label: "Tipo de superficie" }, { key: "padType", label: "Tipo (Control / Speed / Híbrido)" }, { key: "nonSlipBase", label: "Base antideslizante" }, { key: "stitchedEdges", label: "Bordes cosidos" },
  ],
  keyboard: [
    { key: "keyboardType", label: "Tipo" }, { key: "formFactor", label: "Formato" }, { key: "switchType", label: "Switch" }, { key: "connectivity", label: "Conectividad" },
    { key: "layout", label: "Distribución / Layout" }, { key: "rgb", label: "RGB" }, { key: "hotSwap", label: "Hot Swap" }, { key: "antiGhosting", label: "Anti-Ghosting" },
    { key: "pollingRate", label: "Polling Rate" }, { key: "keycaps", label: "Tipo de keycaps" }, { key: "batteryLife", label: "Duración de batería" },
  ],
};

export function componentSpecificationFields(category: ComponentCatalogKey, name = ""): ComponentSpecificationField[] {
  if (category !== "peripherals") return COMPONENT_SPECIFICATION_FIELDS[category];
  const normalized = normalizeCatalogText(name);
  if (matchesMonitorProduct(name)) return PERIPHERAL_SPECIFICATION_FIELDS.monitor;
  if (/(mouse|raton)/.test(normalized)) return PERIPHERAL_SPECIFICATION_FIELDS.mouse;
  if (/(auricular|headset|earphone|earbud)/.test(normalized)) return PERIPHERAL_SPECIFICATION_FIELDS.headphones;
  if (/(mousepad|mouse pad|pad)/.test(normalized)) return PERIPHERAL_SPECIFICATION_FIELDS.pad;
  return PERIPHERAL_SPECIFICATION_FIELDS.keyboard;
}

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

export const catalogDataKeys = componentCatalogKeys as ComponentKey[];
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

function defaultCatalogImagePath(category: ComponentKey, index: number): string {
  return `${IMAGE_FOLDER_BY_KEY[category]}/foto${index + 1}.jpg`;
}

export function normalizeCatalogProduct(raw: Record<string, unknown>, category: ComponentKey, index: number): CatalogProduct {
  const name = firstString(raw.nombre, raw.name, raw.title) || `Producto ${index + 1}`;
  const brand = firstString(raw.marca, raw.brand) || deriveBrand(name);
  const model = firstString(raw.modelo, raw.model) || deriveModel(name, brand);
  const rawImages = raw.imagenes ?? raw.images ?? raw.imagen ?? raw.image;
  const imageValues = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
  const images = (imageValues.length > 0 ? imageValues : [defaultCatalogImagePath(category, index)])
    .map((image) => getAssetUrl(resolveCatalogImagePath(image, category)));
  const costValue = raw.precioCosto ?? raw.precio ?? raw.price ?? 0;
  const priceValue = raw.precio ?? raw.price ?? raw.precioCosto ?? 0;
  const cost = typeof costValue === "string" ? Number(costValue.replace(/[^0-9.,-]/g, "").replace(",", ".")) : Number(costValue);
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
    precioCosto: Number.isFinite(cost) ? cost : 0,
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
      const response = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
      if (!response?.ok) continue;
      data = await response.json();
      break;
    }

    const rows = Array.isArray(data) ? data : Array.isArray((data as any)?.productos) ? (data as any).productos : [];
    return [key, rows.map((row, index) => normalizeCatalogProduct(row, key, index))] as const;
  }));
  return Object.fromEntries(entries) as ComponentCatalog;
}
