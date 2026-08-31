import { NextResponse } from "next/server";
import { getProductos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const productos = await getProductos();
  return NextResponse.json(productos, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
}
