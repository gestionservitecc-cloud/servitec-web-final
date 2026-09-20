import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEquipos, saveEquipos } from "@/lib/store";
import type { Equipo } from "@/lib/types";
import { normalizeEquipmentCondition } from "@/lib/utils";
import { parseAdminEquipos, validationMessage } from "@/lib/admin-validation";
import { readDollarQuote, saveDollarQuote, type DollarQuote } from "@/lib/dollar-quote";

export const dynamic = "force-dynamic";

const RULES_PATH = "servitec-data/notebook-price-rules.json";
type PriceRule = { min: number; max?: number | null; pct: number };

async function readJson(path: string, fallback: unknown) {
  const blob = await get(path, { access: "private" }).catch(() => null);
  if (!blob) return fallback;
  return new Response(blob.stream).json().catch(() => fallback);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [equipos, rules, dollarQuote] = await Promise.all([
    getEquipos(),
    readJson(RULES_PATH, []),
    readDollarQuote(),
  ]);
  return NextResponse.json({
    equipos,
    notebookPriceRules: Array.isArray(rules) ? rules : [],
    dollarQuote,
  });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Falta configurar Vercel Blob." }, { status: 503 });
  }

  try {
    const body = await request.json() as {
      equipos?: Equipo[];
      notebookPriceRules?: PriceRule[];
      dollarQuote?: DollarQuote;
    };
    const parsedEquipos = parseAdminEquipos(body.equipos);
    if (!parsedEquipos.success) return NextResponse.json({ error: validationMessage(parsedEquipos.error) }, { status: 400 });
    const rules = Array.isArray(body.notebookPriceRules) ? body.notebookPriceRules : [];
    if (rules.some((rule) => !Number.isFinite(Number(rule.min)) || Number(rule.min) < 0 || (rule.max != null && (!Number.isFinite(Number(rule.max)) || Number(rule.max) <= Number(rule.min))) || !Number.isFinite(Number(rule.pct)) || Number(rule.pct) < 0)) {
      return NextResponse.json({ error: "Los rangos de precio de notebooks son inválidos." }, { status: 400 });
    }
    if (body.dollarQuote && (!Number.isFinite(Number(body.dollarQuote.valor)) || Number(body.dollarQuote.valor) <= 0 || typeof body.dollarQuote.actualizadoEn !== "string")) {
      return NextResponse.json({ error: "Cotización del dólar inválida." }, { status: 400 });
    }

    await saveEquipos((parsedEquipos.data as Equipo[]).map((equipment) => ({
      ...equipment,
      condition: normalizeEquipmentCondition(equipment.condition),
    })));
    await put(RULES_PATH, JSON.stringify(rules, null, 2), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    if (body.dollarQuote) {
      await saveDollarQuote({
        valor: Number(body.dollarQuote.valor),
        actualizadoEn: body.dollarQuote.actualizadoEn,
      });
    }
    return NextResponse.json({ ok: true, count: parsedEquipos.data.length });
  } catch (error) {
    console.error("admin/stock: save failed", error);
    return NextResponse.json({ error: "No se pudo guardar el stock." }, { status: 500 });
  }
}
