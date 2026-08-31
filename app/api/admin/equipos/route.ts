import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getEquipos, saveEquipos } from "@/lib/store";
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
  return NextResponse.json({ ok: true, count: body.length });
}
