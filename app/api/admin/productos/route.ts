import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { get, put } from "@vercel/blob";
import { getProductos, saveProductos } from "@/lib/store";
import type { Producto } from "@/lib/types";
import { parseAdminProductos, validationMessage } from "@/lib/admin-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await getProductos());
}

export async function PUT(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  let body: Producto[];
  try {
    const parsed = parseAdminProductos(await req.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    body = parsed.data as Producto[];
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
    console.error("admin/productos: save failed", e);
    return NextResponse.json({ error: "No se pudo guardar el inventario." }, { status: 500 });
  }
  // Best-effort: write per-category productos.json under componentes/<FOLDER>/productos.json
  try {
    const groups = body.reduce<Record<string, Producto[]>>((acc, prod) => {
      const key = String(prod.categoria || "").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(prod);
      return acc;
    }, {});
    await Promise.all(Object.entries(groups).map(async ([category, items]) => {
      if (!category) return;
      const pathname = `componentes/${category}/productos.json`;
      const raw = items.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen, categoria: category }));
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
