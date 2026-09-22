import { AnimatedButton } from "@/components/site/AnimatedButton";
import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  alternates: { canonical: "/formas-de-pago" },
  title: "Formas de pago",
  description:
    "Medios de pago aceptados en ServiTec: efectivo con descuento, débito, crédito y transferencia bancaria.",
};

const methods = [
  {
    icon: Banknote,
    title: "Efectivo",
    desc: "Con descuento especial abonando el total en el local.",
    highlight: true,
  },
  { icon: Wallet, title: "Transferencia", desc: "Aplica el mismo descuento que el efectivo." },
  { icon: CreditCard, title: "Débito", desc: "Aceptamos todas las tarjetas de débito." },
  { icon: Landmark, title: "Crédito", desc: "Según el servicio o producto; consultá cuotas disponibles." },
];

export default function FormasPagoPage() {
  return (
    <>
      <PageHero
        eyebrow="Pagos"
        title="Formas de pago"
        description="Trabajamos con la mayoría de los medios de pago disponibles."
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <div
              key={m.title}
              className={`rounded-2xl border p-6 shadow-soft ${
                m.highlight ? "border-primary/30 bg-accent/50" : "bg-card"
              }`}
            >
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{m.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          El descuento aplica únicamente abonando el total en efectivo y/o
          transferencia. ServiTec se reserva el derecho de aceptar pagos con
          tarjeta de crédito, según corresponda al servicio o producto.
        </div>

        <div className="mt-8">
          <AnimatedButton asChild variant="outline">
            <Link href="/condiciones">Ver condiciones generales</Link>
          </AnimatedButton>
        </div>
      </section>
    </>
  );
}
