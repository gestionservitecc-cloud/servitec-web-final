import { NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import { loadCatalogFromBlob, componentCatalogKeys, catalogBlobJsonPath } from "@/lib/component-catalog";
import { resolveBlueReferenceFactor } from "@/lib/blue-rate";

export const dynamic = "force-dynamic";

async function fetchBlueRate() {
  try {
    const resp = await fetch("https://dolarapi.com/v1/dolares/blue");
    if (!resp.ok) throw new Error(`DolarAPI ${resp.status}`);
    const data = await resp.json();
    const compra = Number(data.compra);
    const venta = Number(data.venta);
    const base = Number(process.env.COMPONENTS_BASE_BLUE_RATE) || compra;
    if (!Number.isFinite(venta) || venta <= 0) throw new Error("cotizacion invalida");
    return { compra, venta, base };
  } catch (e) {
    console.error("fetchBlueRate", e);
    return null;
  }
}

export async function GET(req: Request) {
  // allow cron calls with a token or local authless calls in dev
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_CRON_TOKEN;
  if (expected && token !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const quote = await fetchBlueRate();
  if (!quote) return NextResponse.json({ error: "No se pudo obtener el dólar" }, { status: 502 });

  const catalog = await loadCatalogFromBlob();
  const factor = resolveBlueReferenceFactor(quote.base, quote.venta) * 1.08; // same multiplier used in UI

  try {
    await Promise.all(componentCatalogKeys.map(async (key) => {
      const products = catalog[key] || [];
      const folderPath = catalogBlobJsonPath(key as any);
      const rows = products.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio, // original base price
        imagen: p.imagen || p.imagenes?.[0] || "",
        categoria: p.categoria || "",
        precioARS: Math.round((Number(p.precio || 0) * factor)),
      }));
      await put(folderPath, JSON.stringify(rows, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }).catch(() => null);
    }));
  } catch (e) {
    console.error("recompute: write failed", e);
  }

  return NextResponse.json({ ok: true, quote, written: componentCatalogKeys.length });
}
