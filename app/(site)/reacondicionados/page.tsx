import type { Metadata } from "next";
import { Suspense } from "react";
import { StockClient } from "@/components/stock/StockClient";

export const metadata: Metadata = {
  title: "Equipos reacondicionados",
  description:
    "Equipos reacondicionados de ServiTec con garantía. Consultá celulares, notebooks, tablets, PC armadas y TVs disponibles.",
};

export default function ReacondicionadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StockClient />
    </Suspense>
  );
}
