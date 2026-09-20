import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  catalogBlobJsonPath,
  catalogDataKeys,
  normalizeCatalogProduct,
  type ComponentCatalog,
  type ComponentCatalogKey,
} from "@/lib/component-catalog";

export const dynamic = "force-dynamic";

async function readCategory(category: ComponentCatalogKey) {
  const blob = await get(catalogBlobJsonPath(category), { access: "private", useCache: false });
  if (!blob) return [];
  const payload = await new Response(blob.stream).json();
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.productos)
      ? payload.productos
      : [];
  return rows.map((row, index) => normalizeCatalogProduct(row, category, index));
}

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ catalog: {} as ComponentCatalog }, { status: 503 });
  }

  try {
  const entries = await Promise.all(
    catalogDataKeys.map(async (key) => {
      const products = await readCategory(key);
      const publicProducts = products.map((product) => {
        const {
          precioCosto,
          monedaCosto,
          costoBaseUsd,
          cotizacionDolar,
          costoActualizadoEn,
          notasPrivadas,
          originalCatalogPrice,
          ...publicProduct
        } = product;
        return publicProduct;
      });
      return [key, publicProducts] as const;
    }),
  );

  return NextResponse.json(
    { catalog: Object.fromEntries(entries) as ComponentCatalog },
    { headers: { "Cache-Control": "no-store" } },
  );
  } catch { return NextResponse.json({ error: "Catálogo no disponible" }, { status: 503 }); }
}
