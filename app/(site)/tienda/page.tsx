import type { Metadata } from "next";
import { Suspense } from "react";
import { TiendaClient } from "@/components/tienda/TiendaClient";

export const metadata: Metadata = {
  alternates: { canonical: "/tienda" },
  title: "Tienda — productos y componentes",
  description:
    "Comprá productos, periféricos y componentes de PC con disponibilidad actualizada de ServiTec. Armá tu pedido y coordinamos por WhatsApp.",
};

export default function TiendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TiendaClient />
    </Suspense>
  );
}
