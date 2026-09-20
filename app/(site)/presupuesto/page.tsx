import type { Metadata } from "next";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { WhatsAppQuoteForm } from "@/components/site/WhatsAppQuoteForm";

export const metadata: Metadata = {
  alternates: { canonical: "/presupuesto" },
  title: "Presupuesto online",
  description:
    "Pedí tu presupuesto sin cargo. Contanos qué dispositivo tenés y qué necesitás, y te respondemos a la brevedad por WhatsApp.",
};

const perks = [
  { icon: Sparkles, text: "Presupuesto sin cargo" },
  { icon: Clock, text: "Respuesta en el día hábil" },
  { icon: ShieldCheck, text: "Garantía escrita sobre el repuesto" },
];

export default function PresupuestoPage() {
  return (
    <>
      <PageHero
        eyebrow="Presupuesto"
        title="Pedí tu presupuesto online"
        description="Contanos qué necesitás y te respondemos a la brevedad, sin compromiso."
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_360px] lg:py-20">
        <div className="order-2 rounded-2xl border bg-card p-6 shadow-soft sm:p-8 lg:order-1">
          <h2 className="font-display text-xl font-bold">Contanos sobre tu equipo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Al enviar se abre WhatsApp con el mensaje listo para mandar.
          </p>
          <WhatsAppQuoteForm variant="budget" className="mt-6" />
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-accent/40 p-6">
            <h3 className="font-display text-lg font-bold">Qué incluye</h3>
            <ul className="mt-4 space-y-3">
              {perks.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <p.icon className="size-4" />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Los diagnósticos pueden demorar hasta 5 días hábiles según la
              complejidad y la disponibilidad de repuestos.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
