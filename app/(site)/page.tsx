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
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturedStock } from "@/components/site/FeaturedStock";
import { HomeVideo } from "@/components/site/HomeVideo";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { WhatsAppQuoteForm } from "@/components/site/WhatsAppQuoteForm";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { Reveal, Stagger, StaggerItem, Pressable } from "@/components/site/motion";
import { waLink } from "@/components/site/site-config";

const trustItems = [
  { icon: ShieldCheck, label: "Garantía escrita" },
  { icon: Wallet, label: "Cuotas sin interés" },
  { icon: Star, label: "4.9 estrellas en Google Maps" },
  { icon: Truck, label: "Armado y asesoramiento" },
];

const shopCards = [
  {
    icon: Laptop,
    title: "Equipos disponibles",
    desc: "Notebooks, celulares, tablets y TVs con garantía y precio en efectivo.",
    href: "/tienda?tipo=equipos",
    tag: "Ver equipos",
  },
  {
    icon: Cpu,
    title: "PC armadas",
    desc: "Configuraciones listas para oficina, estudio y gaming.",
    href: "/tienda?tipo=pc-armada",
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
    title: "Productos",
    desc: "Periféricos, cargadores, cables y todo para tu setup.",
    href: "/tienda?tipo=accesorios",
    tag: "Ver productos",
  },
];

const repairCards = [
  {
    icon: Smartphone,
    title: "Celulares",
    desc: "Pantallas, baterías, pin de carga y microsoldadura.",
    href: "/servicios/iphone",
  },
  {
    icon: Laptop,
    title: "Computadoras",
    desc: "Notebooks y PC: reparación, upgrades y mantenimiento.",
    href: "/servicios/notebooks",
  },
  {
    icon: Gamepad2,
    title: "Consolas",
    desc: "PlayStation y Xbox: encendido, mandos y service premium.",
    href: "/servicios/consolas",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b bg-sidebar text-sidebar-foreground">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="eyebrow text-red-300">Tecnología + servicio técnico · Saavedra</p>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Tu próximo equipo.<br /><span className="text-red-300">Tu técnico de confianza.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">Elegí tecnología para lo que hacés todos los días. Comprá un equipo, armá tu PC o encontrá una solución para el que ya tenés.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/tienda">Explorar tienda <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/servicios">Reparar mi equipo</Link></Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link href="/armar-pc">Armá tu PC <ArrowRight className="size-4" /></Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/15 pt-5 text-xs text-slate-300"><span>Atención en Saavedra, CABA</span><span>Asesoramiento directo</span><Link href="/formas-de-pago" className="underline underline-offset-4">Ver medios de pago</Link></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            <HomeVideo />
            <div className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs text-red-300">Estamos cerca</p><p className="mt-1 font-semibold">Un lugar para tu tecnología</p></div><Link href="/conocenos" className="text-sm underline underline-offset-4">Conocenos</Link></div>
          </div>
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

        <Stagger className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shopCards.map((c) => (
            <StaggerItem key={c.title}>
              <Pressable className="h-full">
                <Link
                  href={c.href}
                  className="group flex h-full flex-col rounded-2xl border bg-card p-4 sm:p-6 shadow-soft transition-colors hover:border-primary/40"
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
        <div className="rounded-3xl border bg-muted/40 p-6 sm:p-8">
          <p className="eyebrow">Servicio técnico, paso a paso</p>
          <h2 className="mt-3 text-2xl font-bold">Sabé qué sigue con tu equipo</h2>
          <ol className="mt-5 space-y-4">
            {[["Ingreso", "Contanos el modelo y la falla para coordinar la revisión."], ["Diagnóstico", "Revisamos el equipo y te explicamos las opciones."], ["Aprobación", "Conocé el presupuesto antes de avanzar con la reparación."], ["Entrega", "Coordinamos el retiro e informamos la garantía correspondiente."]].map(([title, text], index) => <li key={title} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></div></li>)}
          </ol>
          <Link href="/presupuesto" className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-4">Consultar por una reparación</Link>
        </div>
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
                <Link href={c.href} className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-soft-lg">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground group-hover:text-primary-foreground/80">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-primary-foreground">Ver reparación <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
                </Link>
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
