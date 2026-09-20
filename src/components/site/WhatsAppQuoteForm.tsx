"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { waLink } from "./site-config";

export function WhatsAppQuoteForm({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "budget";
}) {
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nombre = String(fd.get("nombre") || "").trim();
    const dispositivo = String(fd.get("dispositivo") || "").trim();
    const problema = String(fd.get("problema") || "").trim();
    if (!nombre || !dispositivo || !problema) { setError("Completá tu nombre, el equipo y la consulta."); return; }
    setError("");
    const msg =
      variant === "budget"
        ? `Hola, soy ${nombre}. Quiero un presupuesto para mi ${dispositivo}: ${problema}`
        : `Hola, soy ${nombre}. Tengo un problema con mi ${dispositivo}: ${problema}`;
    if (summary !== msg) { setSummary(msg); return; }
    setSending(true);
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
    setTimeout(() => setSending(false), 1200);
  };

  return (
    <form onSubmit={onSubmit} onChange={() => setSummary("")} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="q-nombre">Tu nombre</Label>
          <Input id="q-nombre" name="nombre" required placeholder="Nombre y apellido" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q-dispositivo">Dispositivo</Label>
          <Input
            id="q-dispositivo"
            name="dispositivo"
            required
            placeholder="iPhone 14, PS5, Notebook HP…"
          />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="q-problema">¿Qué necesitás?</Label>
        <Textarea
          id="q-problema"
          name="problema"
          required
          rows={4}
          placeholder="Contanos brevemente la falla o el trabajo que necesitás"
          className="resize-none"
        />
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {summary && <div role="status" className="mt-4 rounded-xl border bg-muted p-4"><p className="font-semibold">Revisá tu consulta</p><p className="mt-2 text-sm">{summary}</p><p className="mt-2 text-xs text-muted-foreground">Solicitás un presupuesto. No es un precio automático ni una reparación confirmada.</p></div>}
      <Button
        type="submit"
        size="lg"
        disabled={sending}
        className="mt-5 w-full gap-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
      >
        <MessageCircle className="size-5" />
        {sending ? "Abriendo WhatsApp…" : summary ? "Abrir WhatsApp con esta consulta" : "Revisar consulta"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Te respondemos en horario comercial. Presupuesto sin cargo.
      </p>
    </form>
  );
}
