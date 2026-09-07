import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getEquipos, saveEquipos } from "@/lib/store";
import type { Equipo } from "@/lib/types";
import { normalizeEquipmentCondition } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RULES_PATH = "servitec-data/notebook-price-rules.json";
const DOLLAR_PATH = "servitec-data/notebook-dollar-quote.json";
type PriceRule = { min: number; max?: number | null; pct: number };
type DollarQuote = { valor: number; actualizadoEn: string };

async function readJson(path: string, fallback: unknown) {
  const blob = await get(path, { access: "private" }).catch(() => null);
  if (!blob) return fallback;
  return new Response(blob.stream).json().catch(() => fallback);
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [equipos, rules, dollarQuote] = await Promise.all([
    getEquipos(),
    readJson(RULES_PATH, []),
    readJson(DOLLAR_PATH, null),
  ]);
  return NextResponse.json({
    equipos,
    notebookPriceRules: Array.isArray(rules) ? rules : [],
    dollarQuote,
  });
}

export async function PUT(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Falta configurar Vercel Blob." }, { status: 503 });
  }

  try {
    const body = await request.json() as {
      equipos?: Equipo[];
      notebookPriceRules?: PriceRule[];
      dollarQuote?: DollarQuote;
    };
    if (!Array.isArray(body.equipos)) {
      return NextResponse.json({ error: "Se esperaba un arreglo de equipos." }, { status: 400 });
    }
    const rules = Array.isArray(body.notebookPriceRules) ? body.notebookPriceRules : [];
    if (rules.some((rule) => !Number.isFinite(Number(rule.min)) || Number(rule.min) < 0 || (rule.max != null && (!Number.isFinite(Number(rule.max)) || Number(rule.max) <= Number(rule.min))) || !Number.isFinite(Number(rule.pct)) || Number(rule.pct) < 0)) {
      return NextResponse.json({ error: "Los rangos de precio de notebooks son inválidos." }, { status: 400 });
    }
    if (body.dollarQuote && (!Number.isFinite(Number(body.dollarQuote.valor)) || Number(body.dollarQuote.valor) <= 0 || typeof body.dollarQuote.actualizadoEn !== "string")) {
      return NextResponse.json({ error: "Cotización del dólar inválida." }, { status: 400 });
    }

    await saveEquipos(body.equipos.map((equipment) => ({
      ...equipment,
      condition: normalizeEquipmentCondition(equipment.condition),
    })));
    await put(RULES_PATH, JSON.stringify(rules, null, 2), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    if (body.dollarQuote) {
      await put(DOLLAR_PATH, JSON.stringify({ valor: Number(body.dollarQuote.valor), actualizadoEn: body.dollarQuote.actualizadoEn }, null, 2), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    }
    return NextResponse.json({ ok: true, count: body.equipos.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar el stock." }, { status: 500 });
  }
}
