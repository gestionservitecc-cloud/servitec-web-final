import "server-only";
import { list, put } from "@vercel/blob";
import type { Equipo, Producto } from "./types";
import equiposSeed from "@/data/seed/equipos.json";
import productosSeed from "@/data/seed/productos.json";

/**
 * Data store. Uses Vercel Blob (one JSON document per collection) when
 * `BLOB_READ_WRITE_TOKEN` is available, and falls back to the JSON snapshots
 * committed under `src/data/seed/` so the site builds and previews with zero
 * configuration.
 */

const PREFIX = "servitec-data";
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Collection = "equipos" | "productos";

const seeds: Record<Collection, unknown[]> = {
  equipos: equiposSeed as Equipo[],
  productos: productosSeed as Producto[],
};

async function readCollection<T>(name: Collection): Promise<T[]> {
  if (!hasBlob()) return seeds[name] as T[];
  try {
    const { blobs } = await list({ prefix: `${PREFIX}/${name}.json` });
    const blob = blobs.find((b) => b.pathname === `${PREFIX}/${name}.json`);
    if (!blob) return seeds[name] as T[];
    const res = await fetch(blob.url, { next: { revalidate: 30 } });
    if (!res.ok) return seeds[name] as T[];
    return (await res.json()) as T[];
  } catch (err) {
    console.error(`store: falling back to seed for "${name}"`, err);
    return seeds[name] as T[];
  }
}

async function writeCollection<T>(name: Collection, data: T[]): Promise<void> {
  if (!hasBlob()) {
    throw new Error(
      "No hay almacenamiento configurado. Conectá Vercel Blob (variable BLOB_READ_WRITE_TOKEN).",
    );
  }
  await put(`${PREFIX}/${name}.json`, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export const getEquipos = () => readCollection<Equipo>("equipos");
export const getProductos = () => readCollection<Producto>("productos");
export const saveEquipos = (data: Equipo[]) => writeCollection("equipos", data);
export const saveProductos = (data: Producto[]) =>
  writeCollection("productos", data);

export const storeIsPersistent = hasBlob;
