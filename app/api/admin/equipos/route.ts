import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getEquipos, saveEquipos } from "@/lib/store";
import { get, put } from "@vercel/blob";
import type { Equipo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await getEquipos());
}

export async function PUT(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: Equipo[];
  try {
    body = await req.json();
    if (!Array.isArray(body)) throw new Error("Se esperaba un arreglo de equipos");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "JSON inválido" },
      { status: 400 },
    );
  }
  try {
    await saveEquipos(
      body.map((e, i) => ({ ...e, orden: typeof e.orden === "number" ? e.orden : i })),
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar" },
      { status: 500 },
    );
  }
  // Best-effort: write equipos per-category under componentes/<CATEGORY>/equipos.json
  try {
    const groups = body.reduce<Record<string, Equipo[]>>((acc, equipo) => {
      const key = String(equipo.categoria || "").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(equipo);
      return acc;
    }, {});
    await Promise.all(Object.entries(groups).map(async ([category, items]) => {
      if (!category) return;
      const pathname = `componentes/${category}/equipos.json`;
      const raw = items.map((e) => ({ id: e.id, nombre: e.nombre, marca: e.marca, modelo: e.modelo, imagenes: e.imagenes, categoria: e.categoria, promo: e.promo || 0, original: e.original || 0 }));
      await put(pathname, JSON.stringify(raw, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }).catch(() => null);
    }));
  } catch {
    // ignore failures
  }
  return NextResponse.json({ ok: true, count: body.length });
}
