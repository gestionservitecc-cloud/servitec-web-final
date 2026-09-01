import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { catalogDataKeys, normalizeCatalogProduct, type ComponentCatalog } from "@/lib/component-catalog";

const folders: Record<string, string> = {
  motherboard: "MOTHERBOARD",
  processor: "PROCESADOR",
  memory: "RAM",
  storage: "DISCO",
  graphics: "GRAFICA",
  power: "FUENTE",
  case: "GABINETE",
  cooling: "COOLER",
  peripherals: "PERIFERICO",
};

export const revalidate = 300;

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Blob no está configurado." }, { status: 503 });
    }

    const entries = await Promise.all(catalogDataKeys.map(async (key) => {
      const result = await get(`${folders[key]}/productos.json`, { access: "private" });
      if (!result) return [key, []] as const;
      const data = await new Response(result.stream).json();
      const rows = Array.isArray(data) ? data : Array.isArray(data.productos) ? data.productos : [];
      return [key, rows.map((row, index) => normalizeCatalogProduct(row, key, index))] as const;
    }));

    return NextResponse.json(Object.fromEntries(entries) as ComponentCatalog, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("catalog: unable to load Blob catalog", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo." }, { status: 502 });
  }
}
