import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Wrench } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { getService, services } from "@/content/services";
import { waLink } from "@/components/site/site-config";

type PageProps = { params: Promise<{ slug: string }> };
const accents = { cyan: "border-cyan-200 bg-cyan-50 text-cyan-800", blue: "border-blue-200 bg-blue-50 text-blue-800", violet: "border-violet-200 bg-violet-50 text-violet-800", amber: "border-amber-200 bg-amber-50 text-amber-800" };

export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const service = getService((await params).slug);
  return service ? { title: service.title, description: `${service.description} Consultá por WhatsApp a ServiTec.` } : { title: "Servicio no encontrado" };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const Icon = service.icon;
  const message = `Hola ServiTec, quiero consultar por ${service.shortTitle}. Mi equipo es:`;

  return <>
    <PageHero eyebrow={`${service.category} · Servicio técnico`} title={service.title} description={service.intro} align="left"><div className="flex flex-wrap gap-3"><Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><a href={waLink(message)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" /> Consultar por WhatsApp</a></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/servicios"><ArrowLeft className="size-4" /> Ver todos los servicios</Link></Button></div></PageHero>
    <main className="container-page py-12 sm:py-16 lg:py-20">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8"><div className={`inline-flex size-12 items-center justify-center rounded-2xl border ${accents[service.accent]}`}><Icon className="size-6" /></div><p className="eyebrow mt-5 text-primary">Diagnóstico y reparación</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Contanos qué necesita tu {service.shortTitle}</h2><p className="mt-3 max-w-2xl text-muted-foreground">Seleccioná la falla que más se parece a tu caso y envianos el modelo para orientarte con el siguiente paso.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{service.repairs.map((repair) => <a key={repair} href={waLink(`${message} ${repair}.`)} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><span>{repair}</span><ArrowRight className="size-4 text-primary transition-all group-hover:translate-x-1 group-hover:text-primary-foreground" /></a>)}</div></div>
      <aside className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-6 sm:p-8"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Wrench className="size-5" /></div><div><p className="font-display font-bold">Cómo trabajamos</p><p className="text-sm text-muted-foreground">Simple, claro y sin sorpresas.</p></div></div><div className="mt-7 space-y-5">{[["1", "Contanos el modelo y la falla"], ["2", "Revisamos el equipo y el alcance"], ["3", "Te informamos la alternativa antes de reparar"]].map(([number, text]) => <div key={number} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</span><p className="pt-0.5 text-sm font-medium">{text}</p></div>)}</div><div className="mt-7 grid gap-3 border-t pt-6 sm:grid-cols-2"><div className="rounded-xl bg-background p-3"><Clock3 className="size-4 text-primary" /><p className="mt-2 text-xs font-semibold">Coordinación ágil</p><p className="mt-1 text-xs text-muted-foreground">Te indicamos cómo seguir.</p></div><div className="rounded-xl bg-background p-3"><ShieldCheck className="size-4 text-primary" /><p className="mt-2 text-xs font-semibold">Garantía informada</p><p className="mt-1 text-xs text-muted-foreground">Según el trabajo realizado.</p></div></div></aside></section>
      <section className="mt-12 rounded-3xl border bg-muted/35 p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-primary">Modelos frecuentes</p><h2 className="mt-2 font-display text-2xl font-bold">¿Cuál es tu equipo?</h2><p className="mt-2 text-sm text-muted-foreground">Si no encontrás tu modelo, escribinos igual: lo revisamos con vos.</p></div><Button asChild variant="outline"><a href={waLink(message)} target="_blank" rel="noopener noreferrer">Consultar otro modelo <ArrowRight className="size-4" /></a></Button></div><div className="mt-6 flex flex-wrap gap-2">{service.models.map((model) => <Badge key={model} variant="secondary" className="border border-primary/15 bg-background px-3 py-1.5 text-sm font-medium">{model}</Badge>)}</div></section>
      <section className="mt-12 grid gap-4 md:grid-cols-3">{service.highlights.map(([title, description]) => <div key={title} className="rounded-2xl border bg-card p-5"><CheckCircle2 className="size-5 text-primary" /><h2 className="mt-3 font-display font-bold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>)}</section>
      <section className="mx-auto mt-16 max-w-3xl"><div className="text-center"><p className="eyebrow text-primary">Preguntas frecuentes</p><h2 className="mt-2 font-display text-2xl font-bold">Sobre {service.shortTitle}</h2></div><Accordion type="single" collapsible className="mt-6 rounded-2xl border bg-card px-4 sm:px-6">{service.faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger className="text-left font-semibold hover:no-underline">{question}</AccordionTrigger><AccordionContent className="pb-4 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion></section>
    </main>
    <section className="border-t bg-muted/40 py-14"><div className="container-page flex flex-col items-center gap-4 text-center"><h2 className="font-display text-2xl font-bold">¿Listo para revisar tu {service.shortTitle}?</h2><p className="max-w-xl text-sm text-muted-foreground">Escribinos el modelo y la falla. Te ayudamos a coordinar el ingreso del equipo.</p><Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><a href={waLink(message)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" /> Cotizar por WhatsApp</a></Button></div></section>
  </>;
}
