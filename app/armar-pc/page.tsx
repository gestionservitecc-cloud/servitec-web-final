import type { Metadata } from "next";
import ArmarPcClient from "@/components/armar-pc/ArmarPcClient";

export const metadata: Metadata = {
  title: "Armá tu PC a medida",
  description:
    "Configurador de PC de ServiTec: elegí componentes compatibles, sumá periféricos, estimá el precio y pedí tu cotización por WhatsApp.",
};

export default function ArmarPcPage() {
  return <ArmarPcClient />;
}
