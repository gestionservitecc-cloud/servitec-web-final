import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeCsvProductName(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function shouldIgnoreCsvProduct(name: string): boolean {
  const normalized = normalizeCsvProductName(name);
  if (!normalized) return true;

  const ignoredExact = new Set([
    "clear",
    "mate",
    "clear mate",
    "mate antiespía",
    "mate antiespia",
    "mate anti espía",
    "mate anti espia",
    "clear mate antiespía",
    "clear mate antiespia",
    "clear mate anti espía",
    "clear mate anti espia"
  ]);

  if (ignoredExact.has(normalized)) return true;

  return normalized.startsWith("clear")
    || normalized.startsWith("mate")
    || normalized.includes(" clear mate")
    || normalized.includes("mate antiespía")
    || normalized.includes("mate antiespia")
    || normalized.includes("mate anti espía")
    || normalized.includes("mate anti espia");
}

export function calculateNationalPrice(price: number): number {
  const safePrice = Number(price) || 0;
  if (safePrice <= 0) return 0;
  return Number((safePrice / 1.21).toFixed(2));
}

export function normalizeStockCategoryValue(value?: string): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "";

  if (["pc", "pcs", "pc armada", "pc-armada", "pc armadas", "pc-armadas"].includes(normalized)) {
    return "pc-armada";
  }

  if (["celular", "celulares"].includes(normalized)) return "celular";
  if (["notebook", "notebooks"].includes(normalized)) return "notebook";
  if (["tablet", "tablets"].includes(normalized)) return "tablet";
  if (["tv", "tvs", "tvs"].includes(normalized)) return "tv";

  return normalized;
}

export function isPcArmadaCategoryValue(value?: string): boolean {
  return normalizeStockCategoryValue(value) === "pc-armada";
}

export function isAccessoryCategoryValue(value?: string): boolean {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return true;

  return [
    "ACCESORIOS",
    "ADAPTADORES",
    "ALMACENAMIENTO",
    "ARTICULOS",
    "AURICULARES",
    "CARGADORES",
    "CABLES",
    "CARGADOR NOTEBOOK",
    "CELULARES",
    "CONSOLAS",
    "HIDROGEL",
    "INSUMOS TECNICOS",
    "JOYSTICK PS4 AAA",
    "PARLANTES",
    "PERIFERICOS",
    "SOPORTES",
    "TECLADOS",
    "WEBCAM"
  ].includes(normalized);
}
