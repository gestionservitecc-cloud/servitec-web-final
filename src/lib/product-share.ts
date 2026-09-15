import "server-only";

import { get } from "@vercel/blob";
import {
  catalogBlobJsonPath,
  catalogDataKeys,
  componentCatalogLabels,
  normalizeCatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/component-catalog";
import { getEquipos } from "@/lib/store";

export type ProductShareType = "componente" | "equipo";

export type ProductShareData = {
  name: string;
  category: string;
  image: string;
  description: string;
};

function productDescription(category: string, name: string) {
  return `${category}: ${name}. Consultá disponibilidad, precio y opciones de compra en ServiTec.`;
}

async function findComponent(id: string): Promise<ProductShareData | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const matches = await Promise.all(
    catalogDataKeys.map(async (category) => {
      const blob = await get(catalogBlobJsonPath(category), { access: "private" }).catch(
        () => null,
      );
      if (!blob) return null;
      const payload = await new Response(blob.stream).json().catch(() => []);
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.productos)
          ? payload.productos
          : [];
      const product = rows
        .map((row, index) => normalizeCatalogProduct(row, category, index))
        .find((item) => String(item.id) === id);
      if (!product) return null;
      const key = category as ComponentCatalogKey;
      const label = componentCatalogLabels[key];
      return {
        name: product.nombre,
        category: label,
        image: product.imagenes[0] || product.imagen || "",
        description: productDescription(label, product.nombre),
      } satisfies ProductShareData;
    }),
  );

  return matches.find(Boolean) ?? null;
}

async function findEquipment(id: string): Promise<ProductShareData | null> {
  const equipment = (await getEquipos()).find((item) => String(item.id) === id);
  if (!equipment) return null;
  const category = equipment.categoria || "Equipo";
  return {
    name: equipment.nombre,
    category,
    image: equipment.imagenes[0] || "",
    description: productDescription(category, equipment.nombre),
  };
}

/** Server-side data used exclusively for dynamic Open Graph and Twitter cards. */
export async function getProductShareData(
  type: ProductShareType,
  id: string,
): Promise<ProductShareData | null> {
  return type === "componente" ? findComponent(id) : findEquipment(id);
}
