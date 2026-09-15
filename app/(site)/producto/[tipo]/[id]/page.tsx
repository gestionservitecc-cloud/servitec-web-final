import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/site/ProductDetailClient";
import {
  getProductShareData,
  type ProductShareType,
} from "@/lib/product-share";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: "Detalle del producto",
  description: "Información, imágenes y especificaciones del producto.",
};

function imageForMetadata(image: string) {
  return image && !image.startsWith("data:") ? [{ url: image }] : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string; id: string }>;
}): Promise<Metadata> {
  const { tipo, id: rawId } = await params;
  const type: ProductShareType =
    tipo === "componente" ? "componente" : "equipo";
  const id = decodeURIComponent(rawId);
  const product = await getProductShareData(type, id);
  if (!product) return fallbackMetadata;

  const path = `/producto/${type}/${encodeURIComponent(rawId)}`;
  const images = imageForMetadata(product.image);
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url: path,
      siteName: "ServiTec",
      title: product.name,
      description: product.description,
      images: images?.map((image) => ({ ...image, alt: product.name })),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: product.name,
      description: product.description,
      images: images?.map((image) => image.url),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ tipo: string; id: string }>;
}) {
  const { tipo, id } = await params;
  const type = tipo === "componente" ? "componente" : "equipo";
  return <ProductDetailClient type={type} id={decodeURIComponent(id)} />;
}
