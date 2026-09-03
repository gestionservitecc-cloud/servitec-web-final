import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { catalogDataKeys, normalizeCatalogProduct, type ComponentCatalogKey } from "@/lib/component-catalog";
import { getComponentes, saveComponentes } from "@/lib/store";
import type { ComponenteAdmin } from "@/lib/types";

const folders: Record<ComponentCatalogKey, string> = {
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

export const dynamic = "force-dynamic";

async function getCatalogCategory(category: ComponentCatalogKey) {
  const candidates = [`componentes/${folders[category]}/productos.json`, `${folders[category]}/productos.json`];
  for (const pathname of candidates) {
    const blob = await get(pathname, { access: "private" }).catch(() => null);
    if (!blob) continue;
    const payload = await new Response(blob.stream).json();
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.productos) ? payload.productos : [];
    return rows.map((row: Record<string, unknown>, index: number) => normalizeCatalogProduct(row, category, index));
  }
  return [];
}

export async function GET(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const category = new URL(request.url).searchParams.get("categoria") as ComponentCatalogKey | null;
  if (!category || !catalogDataKeys.includes(category)) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  const [catalog, overrides] = await Promise.all([getCatalogCategory(category), getComponentes()]);
  const custom = overrides.filter((item) => item.categoria === category);
  const customIds = new Set(custom.map((item) => item.id));
  return NextResponse.json([
    ...catalog.filter((item) => !customIds.has(item.id)),
    ...custom,
  ]);
}

export async function PUT(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const item = (await request.json()) as ComponenteAdmin;
    if (!item?.id || !item.nombre?.trim() || !item.categoria) throw new Error("Datos incompletos");
    const current = await getComponentes();
    const existing = current.find((component) => component.id === item.id);
    const catalogEntries = await Promise.all(catalogDataKeys.map(async (key) => ({
      key,
      items: await getCatalogCategory(key),
    })));
    const catalogMatch = catalogEntries
      .flatMap(({ key, items }) => items.map((component) => ({ key, component })))
      .find(({ component }) => component.id === item.id);
    if (!existing && catalogMatch) {
      const nextItem: ComponenteAdmin = {
        ...item,
        categoria: catalogMatch.key,
        precio: catalogMatch.component.precio,
        originalCatalogPrice: catalogMatch.component.precio,
        esNuevo: false,
      };
      await saveComponentes([...current.filter((component) => component.id !== item.id), nextItem]);
      return NextResponse.json(nextItem);
    }
    const nextItem: ComponenteAdmin = {
      ...item,
      categoria: existing ? existing.categoria : item.categoria,
      precio: existing ? existing.precio : Number(item.precio) || 0,
      originalCatalogPrice: existing?.originalCatalogPrice,
      esNuevo: existing?.esNuevo ?? Boolean(item.esNuevo),
    };

    if (existing) {
      // Preserve the original ordering when updating an existing component
      const updated = current.map((component) => (component.id === item.id ? nextItem : component));
      await saveComponentes(updated);
    } else {
      // New override — append to the list
      await saveComponentes([...current.filter((component) => component.id !== item.id), nextItem]);
    }

    return NextResponse.json(nextItem);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 400 });
  }
}