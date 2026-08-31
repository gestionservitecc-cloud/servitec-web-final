import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getProductos, saveProductos } from "@/lib/store";
import type { Producto } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await getProductos());
}

export async function PUT(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: Producto[];
  try {
    body = await req.json();
    if (!Array.isArray(body)) throw new Error("Se esperaba un arreglo de productos");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "JSON inválido" },
      { status: 400 },
    );
  }
  try {
    await saveProductos(body);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, count: body.length });
}
