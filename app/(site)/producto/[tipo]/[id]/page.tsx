import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/site/ProductDetailClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle del producto",
  description: "Información, imágenes y especificaciones del producto.",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ tipo: string; id: string }>;
}) {
  const { tipo, id } = await params;
  const type = tipo === "componente" ? "componente" : "equipo";
  return <ProductDetailClient type={type} id={decodeURIComponent(id)} />;
}
