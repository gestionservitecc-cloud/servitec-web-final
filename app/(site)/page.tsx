import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Gamepad2,
  Headphones,
  Laptop,
  MemoryStick,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { asset } from "@/lib/assets";
import { FeaturedStock } from "@/components/site/FeaturedStock";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { WhatsAppQuoteForm } from "@/components/site/WhatsAppQuoteForm";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { Reveal, Stagger, StaggerItem, Pressable } from "@/components/site/motion";
import { waLink } from "@/components/site/site-config";

const trustItems = [
  { icon: ShieldCheck, label: "Garantía escrita" },
  { icon: Wallet, label: "Cuotas sin interés" },
  { icon: Sparkles, label: "Stock actualizado" },
  { icon: Truck, label: "Armado y asesoramiento" },
];

const shopCards = [
  {
    icon: Laptop,
    title: "Equipos en stock",
    desc: "Notebooks, celulares, tablets y TVs con garantía y precio en efectivo.",
    href: "/stock",
    tag: "Ver stock",
  },
  {
    icon: Cpu,
    title: "PC armadas",
    desc: "Configuraciones listas para oficina, estudio y gaming.",
    href: "/stock?categoria=pc-armada",
    tag: "Ver PC armadas",
  },
  {
    icon: MemoryStick,
    title: "Componentes",
    desc: "Procesadores, motherboards, memorias, placas de video y más.",
    href: "/tienda?tipo=componentes",
    tag: "Ver componentes",
  },
  {
    icon: Headphones,
    title: "Accesorios",
    desc: "Periféricos, cargadores, cables y todo para tu setup.",
    href: "/tienda?tipo=accesorios",
    tag: "Ver accesorios",
  },
];

const repairCards = [
  {
    icon: Smartphone,
    title: "Celulares",
    desc: "Pantallas, baterías, pin de carga y microsoldadura.",
  },
  {
    icon: Laptop,
    title: "Computadoras",
    desc: "Notebooks y PC: reparación, upgrades y mantenimiento.",
  },
  {
    icon: Gamepad2,
    title: "Consolas",
    desc: "PlayStation y Xbox: encendido, mandos y service premium.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("BAN-IN.png")}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          loading="eager"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-sidebar/70 via-sidebar/85 to-sidebar"
        />
        <HeroBackdrop />

        <div className="container-page relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="p" y={12} className="eyebrow justify-center text-primary">
              Venta de equipos · PC a medida · Servicio técnico
            </Reveal>
            <Reveal
              as="h1"
              delay={0.05}
              className="mt-5 font-display text-4xl font-bold leading-[1.05] text-balance sm:text-5xl md:text-6xl"
            >
              Comprá, armá y potenciá tu{" "}
              <span className="text-primary">tecnología</span>
            </Reveal>
            <Reveal
              as="p"
              delay={0.12}
              className="mx-auto mt-5 max-w-xl text-base text-sidebar-foreground/70 sm:text-lg"
            >
              Notebooks, celulares y PC armadas con stock real. Configurá tu PC
              ideal y sumá los accesorios. Y si algo falla, tenés nuestro servicio
              técnico con garantía escrita.
            </Reveal>

            <Reveal
              delay={0.2}
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap"
            >
              <Button asChild size="lg" className="h-12 sm:min-w-[180px]">
                <Link href="/stock">
                  Ver equipos en stock <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:min-w-[180px]"
              >
                <Link href="/armar-pc">
                  Armá tu PC <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 sm:min-w-[200px]"
              >
                <a
                  href={waLink("Hola ServiTec, quiero hacer una consulta")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" /> WhatsApp directo
                </a>
              </Button>
            </Reveal>
          </div>

          <Stagger className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {trustItems.map((t) => (
              <StaggerItem
                key={t.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs font-medium text-sidebar-foreground/80"
              >
                <t.icon className="size-5 text-primary" />
                {t.label}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Ventas primero: stock destacado en vivo */}
      <div className="border-b bg-muted/40">
        <FeaturedStock />
      </div>

      {/* Comprá y armá */}
      <section className="container-page py-16 lg:py-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Comprá y armá</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Todo para tu próxima compra tech
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Equipos con stock real, PC armadas listas y componentes para armar la
            tuya desde cero.
          </p>
        </Reveal>

        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shopCards.map((c) => (
            <StaggerItem key={c.title}>
              <Pressable className="h-full">
                <Link
                  href={c.href}
                  className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <c.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                    {c.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {c.tag}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Split promo — Armá tu PC primero */}
      <section className="container-page grid gap-6 pb-4 lg:grid-cols-2">
        <Reveal>
          <PromoCard
            badge="Configurador"
            title={
              <>
                Armá tu PC a tu <span className="text-primary">medida</span>
              </>
            }
            desc="Elegí componentes compatibles, calculá el consumo y creá una configuración pensada para jugar, trabajar o crear. Cotización al instante."
            tags={["Gaming", "Oficina", "Compatibilidad", "Precio estimado"]}
            cta={{ label: "Empezar a armarla", href: "/armar-pc", external: false }}
            footnote="Armado, asesoramiento y garantía escrita incluidos"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <PromoCard
            badge="Servicio técnico"
            title={
              <>
                ¿Se te rompió algo? Lo{" "}
                <span className="text-primary">reparamos</span>
              </>
            }
            desc="Celulares, notebooks, PC y consolas. Diagnóstico profesional, presupuesto sin cargo y garantía escrita sobre el repuesto."
            tags={["Celulares", "Notebooks", "Consolas", "Microsoldadura"]}
            cta={{
              label: "Ver servicios",
              href: "/servicios",
              external: false,
            }}
            footnote="Presupuesto sin cargo · Entrega en 24/48 h"
          />
        </Reveal>
      </section>

      {/* Reparación (secundario) */}
      <section className="mt-12 border-y bg-muted/40 py-16 lg:py-20">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">También reparamos</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Servicio técnico con garantía escrita
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Si tu equipo dejó de funcionar, lo diagnosticamos y te damos una
              solución real.
            </p>
          </Reveal>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {repairCards.map((c) => (
              <StaggerItem key={c.title}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft-lg">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1} className="mt-8">
            <Button asChild>
              <Link href="/servicios">
                Ver todos los servicios <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <ReviewsSection />

      {/* Contact form */}
      <section className="container-page py-16 lg:py-20">
        <Reveal className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 shadow-soft-lg sm:p-8 md:p-10">
          <div className="text-center">
            <p className="eyebrow justify-center">Contacto</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Escribinos
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Consultá por un equipo, un armado o una reparación. Te respondemos a
              la brevedad.
            </p>
          </div>
          <WhatsAppQuoteForm className="mt-8" />
        </Reveal>
      </section>
    </>
  );
}

function PromoCard({
  badge,
  title,
  desc,
  tags,
  cta,
  footnote,
}: {
  badge: string;
  title: React.ReactNode;
  desc: string;
  tags: string[];
  cta: { label: string; href: string; external: boolean };
  footnote: string;
}) {
  return (
    <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl bg-sidebar p-8 text-sidebar-foreground sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
      />
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Sparkles className="size-3.5" /> {badge}
      </span>
      <h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
        {title}
      </h3>
      <p className="max-w-md text-sm text-sidebar-foreground/70 sm:text-base">
        {desc}
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-sidebar-foreground/70"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-2">
        <Button asChild size="lg" className="rounded-full px-6">
          {cta.external ? (
            <a href={cta.href} target="_blank" rel="noopener noreferrer">
              {cta.label} <ArrowRight className="size-4" />
            </a>
          ) : (
            <Link href={cta.href}>
              {cta.label} <ArrowRight className="size-4" />
            </Link>
          )}
        </Button>
      </div>
      <p className="text-xs text-sidebar-foreground/50">{footnote}</p>
    </div>
  );
}
