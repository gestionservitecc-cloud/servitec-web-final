import { NextResponse } from "next/server";
import { getEquipos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const equipos = await getEquipos();
  return NextResponse.json(equipos, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
}
