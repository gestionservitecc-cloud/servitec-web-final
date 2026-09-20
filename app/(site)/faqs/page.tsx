import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { waLink } from "@/components/site/site-config";
import { faqs } from "@/content/faqs";

export const metadata: Metadata = {
  alternates: { canonical: "/faqs" },
  title: "Preguntas frecuentes",
  description:
    "Respuestas sobre reparaciones, plazos de diagnóstico, garantías, formas de pago y atención en ServiTec.",
};

export default function FaqsPage() {
  return (
    <>
      <PageHero
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        description="Todo lo que solés consultar antes de dejar tu equipo: plazos, garantías, pagos y condiciones."
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_320px] lg:py-20">
        <div className="rounded-2xl border bg-card p-2 shadow-soft sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem
                key={item.question}
                value={`item-${i}`}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="px-3 text-left text-base font-semibold hover:no-underline sm:px-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground sm:px-4 sm:text-[15px]">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-accent/40 p-6">
            <HelpCircle className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold">
              ¿No encontraste tu respuesta?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Escribinos y te asesoramos sin compromiso.
            </p>
            <Button
              asChild
              className="mt-4 w-full gap-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
            >
              <a
                href={waLink("Hola ServiTec, tengo una consulta")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Consultar por WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href="/condiciones">Ver condiciones generales</Link>
            </Button>
          </div>
        </aside>
      </section>
    </>
  );
}
