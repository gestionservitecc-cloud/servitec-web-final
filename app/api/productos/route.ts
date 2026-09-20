import { NextResponse } from "next/server";
import { getProductos, storeIsPersistent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!storeIsPersistent()) return NextResponse.json({ error: "Catálogo no disponible" }, { status: 503 });
  try {
  const productos = await getProductos();
  const publicProductos = productos.map(({ precioCosto, ...producto }) => producto);
  return NextResponse.json(publicProductos, {
    headers: { "Cache-Control": "no-store" },
  });
  } catch { return NextResponse.json({ error: "Catálogo no disponible" }, { status: 503 }); }
}
