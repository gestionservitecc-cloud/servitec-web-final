import { AnimatedButton } from "@/components/site/AnimatedButton";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Users, Wrench } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { asset } from "@/lib/assets";

export const metadata: Metadata = {
  alternates: { canonical: "/conocenos" },
  title: "Conocenos",
  description:
    "ServiTec es un servicio técnico especializado en celulares, consolas y computadoras. Herramientas profesionales, repuestos de calidad y personal capacitado.",
};

const values = [
  {
    icon: ShieldCheck,
    title: "Garantía escrita",
    desc: "Cada reparación se entrega con comprobante y cobertura sobre el repuesto instalado.",
  },
  {
    icon: Wrench,
    title: "Herramientas profesionales",
    desc: "Microsoldadura, estaciones de calor controladas e instrumental de diagnóstico.",
  },
  {
    icon: Users,
    title: "Atención personalizada",
    desc: "Te explicamos la falla, las opciones y el costo antes de intervenir el equipo.",
  },
];

const localImages = ["Local1.png", "Local2.png", "Local3.png", "Local4.png"];

export default function ConocenosPage() {
  return (
    <>
      <PageHero background={{ image: "/backgrounds/nosotros.png", preset: "nosotros", overlay: "dark-image" }}
        eyebrow="Nosotros"
        title="Conocenos"
        description="Transparencia, profesionalismo y atención personalizada en cada servicio."
      />

      <section className="container-page grid items-start gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Nuestra historia
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Somos un servicio técnico especializado en reparación de celulares,
              consolas y computadoras. Trabajamos con herramientas profesionales,
              repuestos de calidad y personal capacitado para garantizar
              resultados confiables.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold">¿Qué hacemos?</h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                En ServiTec trabajamos para que tus dispositivos recuperen
                plenamente su funcionalidad, extendiendo su vida útil y
                devolviéndolos al servicio de tus necesidades diarias.
              </p>
              <p>
                Muchas veces creemos que la inversión no justifica reparar un
                equipo, pero en la mayoría de los casos existen soluciones
                técnicas viables.
              </p>
              <p>
                Contamos con capacitación profesional, herramientas adecuadas y
                experiencia para ofrecer diagnósticos precisos y reparaciones
                confiables.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {[
              "Celulares de todas las marcas",
              "Notebooks y PC de escritorio",
              "Consolas PlayStation y Xbox",
              "Armado de PC a medida",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <AnimatedButton asChild>
              <Link href="/servicios">Ver servicios</Link>
            </AnimatedButton>
            <AnimatedButton asChild variant="outline">
              <Link href="/contacto">Cómo llegar</Link>
            </AnimatedButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {localImages.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={asset(src)}
              alt="Local de ServiTec"
              className="aspect-[4/3] w-full rounded-2xl border object-cover shadow-soft transition-transform hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/40 py-16 lg:py-20">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{v.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
