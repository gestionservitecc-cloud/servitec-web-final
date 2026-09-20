import "server-only";
import { get, put } from "@vercel/blob";
import type { ComponenteAdmin, Equipo, Producto } from "./types";

/**
 * Data store. Uses Vercel Blob (one JSON document per collection) when
 * `BLOB_READ_WRITE_TOKEN` is available. An unconfigured store has empty
 * collections; public APIs report 503 rather than presenting this as stock.
 * Read failures propagate so consumers can distinguish error from empty.
 */

const PREFIX = "servitec-data";
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Collection = "equipos" | "productos" | "componentes";

const seeds: Record<Collection, unknown[]> = {
  equipos: [],
  productos: [],
  componentes: [],
};

async function readCollection<T>(name: Collection): Promise<T[]> {
  if (!hasBlob()) return seeds[name] as T[];
  try {
    const blob = await get(`${PREFIX}/${name}.json`, { access: "private", useCache: false });
    if (!blob) return seeds[name] as T[];
    return (await new Response(blob.stream).json()) as T[];
  } catch (err) {
    console.error(`store: unable to read "${name}"`, err);
    throw new Error("No se pudo leer el catálogo.");
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
export const getComponentes = () => readCollection<ComponenteAdmin>("componentes");
export const saveEquipos = (data: Equipo[]) => writeCollection("equipos", data);
export const saveProductos = (data: Producto[]) =>
  writeCollection("productos", data);
export const saveComponentes = (data: ComponenteAdmin[]) =>
  writeCollection("componentes", data);

export const storeIsPersistent = hasBlob;
