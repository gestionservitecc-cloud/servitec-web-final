import type { Metadata } from "next";
import { Suspense } from "react";
import { TiendaClient } from "@/components/tienda/TiendaClient";

export const metadata: Metadata = {
  title: "Tienda — accesorios y componentes",
  description:
    "Comprá accesorios, periféricos y componentes de PC con stock real de ServiTec. Armá tu pedido y coordinamos por WhatsApp.",
};

export default function TiendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TiendaClient />
    </Suspense>
  );
}
