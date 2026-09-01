import "server-only";
import { get, put } from "@vercel/blob";
import type { Equipo, Producto } from "./types";

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
  equipos: [],
  productos: [],
};

async function readCollection<T>(name: Collection): Promise<T[]> {
  if (!hasBlob()) return seeds[name] as T[];
  try {
    const blob = await get(`${PREFIX}/${name}.json`, { access: "private" });
    if (!blob) return seeds[name] as T[];
    return (await new Response(blob.stream).json()) as T[];
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
    access: "private",
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
