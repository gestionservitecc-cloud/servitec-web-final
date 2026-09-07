import "server-only";
import { get, put } from "@vercel/blob";

export type DollarQuote = { valor: number; actualizadoEn: string };

export const DOLLAR_QUOTE_PATH = "servitec-data/dollar-quote.json";

const LEGACY_PATHS = [
  "servitec-data/dolar-blue.json",
  "servitec-data/notebook-dollar-quote.json",
];

async function readPath(path: string): Promise<DollarQuote | null> {
  const blob = await get(path, { access: "private" }).catch(() => null);
  if (!blob) return null;

  const payload = await new Response(blob.stream).json().catch(() => null);
  const valor = Number(payload?.valor);
  if (!Number.isFinite(valor) || valor <= 0 || typeof payload?.actualizadoEn !== "string") {
    return null;
  }

  return { valor, actualizadoEn: payload.actualizadoEn };
}

export async function readDollarQuote(): Promise<DollarQuote | null> {
  const shared = await readPath(DOLLAR_QUOTE_PATH);
  if (shared) return shared;

  const legacyQuotes = (await Promise.all(LEGACY_PATHS.map(readPath))).filter(
    (quote): quote is DollarQuote => quote !== null,
  );
  return legacyQuotes.sort(
    (a, b) => Date.parse(b.actualizadoEn) - Date.parse(a.actualizadoEn),
  )[0] || null;
}

export async function saveDollarQuote(quote: DollarQuote) {
  await put(DOLLAR_QUOTE_PATH, JSON.stringify(quote, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
