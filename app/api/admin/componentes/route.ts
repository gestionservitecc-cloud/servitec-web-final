import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import {
  catalogBlobJsonPath,
  catalogDataKeys,
  normalizeCatalogProduct,
  type CatalogProduct,
  type ComponentCatalog,
  type ComponentCatalogKey,
} from "@/lib/component-catalog";

export const dynamic = "force-dynamic";
const PRICE_RULES_PATH = "servitec-data/component-price-rules.json";
const DOLLAR_QUOTE_PATH = "servitec-data/dolar-blue.json";
type PriceRule = { min: number; max?: number | null; pct: number };
type PriceRules = Partial<Record<ComponentCatalogKey, PriceRule[]>>;
type DollarQuote = { valor: number; actualizadoEn: string };

const applyRules = (price: number, rules: PriceRule[] = []) => {
  const match = rules.find((rule) => price >= (rule.min || 0) && (rule.max == null || price < rule.max));
  return match ? Math.round(price + (price * (match.pct || 0)) / 100) : Math.round(price);
};

async function readPriceRules(): Promise<PriceRules> {
  const blob = await get(PRICE_RULES_PATH, { access: "private" }).catch(() => null);
  if (!blob) return {};
  const payload = await new Response(blob.stream).json().catch(() => ({}));
  return payload && typeof payload === "object" ? payload as PriceRules : {};
}

async function readDollarQuote(): Promise<DollarQuote | null> {
  const blob = await get(DOLLAR_QUOTE_PATH, { access: "private" }).catch(() => null);
  if (!blob) return null;
  const payload = await new Response(blob.stream).json().catch(() => null);
  const valor = Number(payload?.valor);
  return Number.isFinite(valor) && valor > 0 && typeof payload?.actualizadoEn === "string"
    ? { valor, actualizadoEn: payload.actualizadoEn }
    : null;
}

async function readCategory(category: ComponentCatalogKey): Promise<CatalogProduct[]> {
  const blob = await get(catalogBlobJsonPath(category), { access: "private" }).catch(() => null);
  if (!blob) return [];
  const payload = await new Response(blob.stream).json().catch(() => []);
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.productos)
      ? payload.productos
      : [];
  return rows.map((row, index) => normalizeCatalogProduct(row, category, index));
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [entries, priceRules, dollarQuote] = await Promise.all([
    Promise.all(catalogDataKeys.map(async (key) => [key, await readCategory(key)] as const)),
    readPriceRules(),
    readDollarQuote(),
  ]);
  return NextResponse.json({ catalog: Object.fromEntries(entries) as ComponentCatalog, priceRules, dollarQuote });
}

export async function PUT(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Falta configurar Vercel Blob." }, { status: 503 });
  }

  try {
    const body = await request.json() as { catalog?: Partial<ComponentCatalog>; priceRules?: PriceRules; dollarQuote?: DollarQuote };
    const catalog = body.catalog || {};
    const priceRules = body.priceRules || {};
    const dollarQuote = body.dollarQuote;
    if (dollarQuote !== undefined && (!Number.isFinite(Number(dollarQuote.valor)) || Number(dollarQuote.valor) <= 0 || typeof dollarQuote.actualizadoEn !== "string")) {
      return NextResponse.json({ error: "Cotización del dólar inválida." }, { status: 400 });
    }
    await Promise.all(catalogDataKeys.map(async (key) => {
      const items = Array.isArray(catalog[key]) ? catalog[key] : [];
      const normalizedItems = items.map((item) => {
        const cost = Number(item.precioCosto ?? item.precio) || 0;
        return {
          ...item,
          precioCosto: cost,
          precio: applyRules(cost, priceRules[key]),
          categoria: key,
        };
      });
      await put(catalogBlobJsonPath(key), JSON.stringify(normalizedItems, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    }));
    await put(PRICE_RULES_PATH, JSON.stringify(priceRules, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    if (dollarQuote) {
      await put(DOLLAR_QUOTE_PATH, JSON.stringify({
        valor: Number(dollarQuote.valor),
        actualizadoEn: dollarQuote.actualizadoEn,
      }, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron guardar los componentes." },
      { status: 500 },
    );
  }
}
