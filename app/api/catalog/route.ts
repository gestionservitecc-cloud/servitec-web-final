import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { catalogDataKeys, normalizeCatalogProduct, type ComponentCatalog } from "@/lib/component-catalog";
import { isAccessoryCategoryValue } from "@/lib/utils";
import { getComponentes, getProductos } from "@/lib/store";
import localPeripheralFallback from "@/data/perifericos-fallback.json";

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

const componentCatalogRoots = ["componentes", ""] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Blob no está configurado." }, { status: 503 });
    }

    const componentOverrides = await getComponentes().catch(() => []);
    const entries = await Promise.all(catalogDataKeys.map(async (key) => {
      const candidates = componentCatalogRoots.flatMap((root) => {
        const folder = `${root ? `${root}/` : ""}${folders[key]}`;
        return [`${folder}/productos.json`, `${folders[key]}/productos.json`];
      });

      let payload: unknown = key === "peripherals" ? localPeripheralFallback : [];
      for (const filePath of candidates) {
        const result = await get(filePath, { access: "private" }).catch(() => null);
        if (!result) continue;
        payload = await new Response(result.stream).json();
        break;
      }

      const data = payload;
      let rows = Array.isArray(data) ? data : Array.isArray((data as any)?.productos) ? (data as any).productos : [];
      if (key === "peripherals" && rows.length === 0) {
        const storedProducts = await getProductos().catch(() => []);
        rows = storedProducts
          .filter((product) => isAccessoryCategoryValue(product.categoria))
          .map((product) => ({ ...product, categoria: "PERIFERICO" }));
      }
      const normalizedRows = rows.map((row, index) => normalizeCatalogProduct(row, key, index));
      const overrides = componentOverrides.filter((item) => item.categoria === key);
      const overrideIds = new Set(overrides.map((item) => item.id));
      const normalizedOverrides = overrides.map((item, index) => normalizeCatalogProduct(item, key, normalizedRows.length + index));
      return [key, [
        ...normalizedRows.filter((row) => !overrideIds.has(row.id)),
        ...normalizedOverrides,
      ]] as const;
    }));

    return NextResponse.json(Object.fromEntries(entries) as ComponentCatalog, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("catalog: unable to load Blob catalog", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo." }, { status: 502 });
  }
}
