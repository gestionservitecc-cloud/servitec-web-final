"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { waLink } from "@/components/site/site-config";

type ServiceInquiryFlowProps = { serviceName: string; repairs: string[]; models: string[]; modelHint?: string };

export function ServiceInquiryFlow({ serviceName, repairs, models, modelHint }: ServiceInquiryFlowProps) {
  const [repair, setRepair] = useState("");
  const [otherRepair, setOtherRepair] = useState("");
  const [model, setModel] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [form, setForm] = useState({ name: "", whatsapp: "", detail: "" });
  const [error, setError] = useState("");
  const selectedRepair = repair === "other" ? otherRepair.trim() : repair;
  const filteredModels = useMemo(() => models.filter((item) => item.toLowerCase().includes(modelSearch.toLowerCase())), [models, modelSearch]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) { setError("Ingresá tu nombre para continuar."); return; }
    if (!selectedRepair || !model) { setError("Elegí la reparación y el modelo antes de enviar la consulta."); return; }
    setError("");
    const lines = [
      `Hola ServiTec, quiero consultar por ${serviceName}.`,
      `Reparación: ${selectedRepair}`,
      `Modelo: ${model}`,
      `Nombre: ${form.name.trim()}`,
      form.whatsapp.trim() ? `Contacto alternativo: ${form.whatsapp.trim()}` : "",
      form.detail.trim() ? `Detalle: ${form.detail.trim()}` : "",
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  return <section className="container-page rounded-[2rem] border bg-card p-5 shadow-soft sm:p-8 lg:p-10">
    <div className="flex items-start justify-between gap-6"><div><p className="eyebrow text-primary">Elegí tu caso</p><h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">Contanos qué querés reparar</h2><p className="mt-3 max-w-2xl text-muted-foreground">Elegí la falla, buscá tu modelo y enviá la consulta. La preparamos con toda la información.</p></div><CheckCircle2 className="mt-1 hidden size-8 shrink-0 text-primary sm:block" /></div>
    <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4"><div className="rounded-2xl border bg-muted/45 p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="mr-2 inline-grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>¿Qué querés reparar?</p><p className="mt-2 text-sm text-muted-foreground">Elegí una reparación predeterminada o contanos otra.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{repairs.map((item) => <button key={item} type="button" aria-pressed={repair === item} onClick={() => { setRepair(item); setError(""); }} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${repair === item ? "border-primary bg-primary text-primary-foreground shadow-md" : "bg-card hover:border-primary/60 hover:bg-primary/5"}`}><span className={`size-3 rounded-full border ${repair === item ? "border-white bg-white" : "border-primary/50"}`} />{item}</button>)}</div><button type="button" onClick={() => { setRepair("other"); setError(""); }} className={`mt-3 text-sm font-bold underline-offset-4 hover:underline ${repair === "other" ? "text-primary" : "text-muted-foreground"}`}>Otra reparación</button>{repair === "other" && <div className="mt-3"><Label htmlFor="other-repair" className="sr-only">Otra reparación</Label><Input id="other-repair" value={otherRepair} onChange={(event) => setOtherRepair(event.target.value)} placeholder="Contanos qué reparación necesitás" autoFocus /></div>}</div>
        <div className="rounded-2xl border bg-muted/45 p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="mr-2 inline-grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>¿Cuál es tu modelo?</p><p className="mt-2 text-sm text-muted-foreground">{modelHint || "Elegí una familia o escribí el modelo exacto. Si no lo conocés, podés consultar igual."}</p><div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Label htmlFor="service-model" className="sr-only">Buscá tu modelo</Label><Input id="service-model" value={modelSearch} onChange={(event) => { setModelSearch(event.target.value); setModel(""); }} placeholder={`Buscá tu modelo ${serviceName}`} className="pl-9" /></div><button type="button" onClick={() => { setModel("No sé mi modelo"); setModelSearch(""); }} className="mt-3 block text-sm font-semibold text-primary underline">No sé mi modelo</button><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Más comunes</p><div className="mt-2 flex flex-wrap gap-2">{filteredModels.map((item) => <button key={item} type="button" aria-pressed={model === item} onClick={() => { setModel(item); setModelSearch(item); setError(""); }} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${model === item ? "border-secondary bg-secondary text-secondary-foreground" : "border-primary/15 bg-card hover:border-primary hover:bg-primary/5"}`}>{item}</button>)}</div>{modelSearch.trim() && model !== modelSearch.trim() && <button type="button" onClick={() => { setModel(modelSearch.trim()); setError(""); }} className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline">Usar “{modelSearch}” como modelo</button>}</div></div>
      <aside className="rounded-2xl border border-secondary/20 bg-gradient-to-b from-secondary/15 to-primary/[0.05] p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"><span className="mr-2 inline-grid size-5 place-items-center rounded-full bg-secondary text-[10px] text-secondary-foreground">3</span>Enviar consulta</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${selectedRepair && model ? "bg-emerald-100 text-emerald-700" : "bg-background text-muted-foreground"}`}>{selectedRepair && model ? "Listo" : "Faltan datos"}</span></div><h3 className="mt-4 font-display text-2xl font-black">{selectedRepair || "Elegí reparación"}{model ? ` para ${model}` : " y modelo"}</h3>{selectedRepair && <span className="mt-3 inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">{selectedRepair}</span>}<div className="mt-5 space-y-3"><div><Label htmlFor="service-name" className="mb-1 block text-sm">Tu nombre</Label><Input id="service-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tu nombre" /></div><div><Label htmlFor="service-whatsapp" className="mb-1 block text-sm">Otro teléfono de contacto (opcional)</Label><Input id="service-whatsapp" type="tel" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="Otro teléfono de contacto (opcional)" /></div><div><Label htmlFor="service-detail" className="mb-1 block text-sm">Detalle adicional</Label><Textarea id="service-detail" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="Contanos brevemente qué le pasa al equipo (opcional)" className="min-h-28 resize-y" /></div></div>{error && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{error}</p>}<Button type="submit" className="mt-5 w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><MessageCircle className="size-4" /> Enviar por WhatsApp</Button><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Revisá el resumen antes de abrir WhatsApp. Solicitás un presupuesto; no se calcula un precio ni se confirma una reparación.</p></aside>
    </form>
    <p className="mt-6 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-muted-foreground">¿No ves tu modelo? Escribinos igual: lo revisamos con vos.</p>
  </section>;
}
