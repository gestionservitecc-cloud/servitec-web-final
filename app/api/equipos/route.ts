import { NextResponse } from "next/server";
import { getEquipos, storeIsPersistent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!storeIsPersistent()) return NextResponse.json({ error: "Catálogo no disponible" }, { status: 503 });
  try {
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
    headers: { "Cache-Control": "no-store" },
  });
  } catch { return NextResponse.json({ error: "Catálogo no disponible" }, { status: 503 }); }
}
