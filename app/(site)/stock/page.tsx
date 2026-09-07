import type { Metadata } from "next";
import { Suspense } from "react";
import { StockClient } from "@/components/stock/StockClient";

export const metadata: Metadata = {
  title: "Equipos y reacondicionados",
  description:
    "Celulares, notebooks, tablets, PC armadas y TVs con garantía. Equipos disponibles de ServiTec, consultá disponibilidad por WhatsApp.",
};

export default function StockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StockClient />
    </Suspense>
  );
}
