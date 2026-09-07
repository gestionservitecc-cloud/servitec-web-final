import { NextResponse } from "next/server";
import { getProductos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const productos = await getProductos();
  const publicProductos = productos.map(({ precioCosto, ...producto }) => producto);
  return NextResponse.json(publicProductos, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
}
