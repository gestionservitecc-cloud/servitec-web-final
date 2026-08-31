import type { Metadata } from "next";
import { Suspense } from "react";
import { StockClient } from "@/components/stock/StockClient";

export const metadata: Metadata = {
  title: "Equipos en stock",
  description:
    "Celulares, notebooks, tablets, PC armadas y TVs con garantía. Stock real de ServiTec, consultá disponibilidad por WhatsApp.",
};

export default function StockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StockClient />
    </Suspense>
  );
}
