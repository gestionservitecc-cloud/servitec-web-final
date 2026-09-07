import { NextResponse } from "next/server";
import { getEquipos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const equipos = await getEquipos();
  const publicEquipos = equipos.map((equipo) => {
    const {
      notasPrivadas,
      precioCosto,
      originalCatalogPrice,
      monedaCosto,
      costoBaseUsd,
      cotizacionDolar,
      costoActualizadoEn,
      ...publicEquipo
    } = equipo;
    return publicEquipo;
  });
  return NextResponse.json(publicEquipos, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
}
