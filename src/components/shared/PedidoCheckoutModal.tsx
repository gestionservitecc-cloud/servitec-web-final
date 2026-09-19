"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Banknote, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { waLink } from "@/components/site/site-config";
import { calculateInstallmentPrice, calculateNationalPrice } from "@/lib/utils";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import {
  buildPedidoMessage,
  readStoredClientes,
  readStoredPedidos,
  saveStoredClientes,
  saveStoredPedidos,
  type PedidoItem,
} from "@/lib/order-data";

export function PedidoCheckoutModal({
  open,
  onClose,
  items,
  total,
  numeroPedido,
  origen,
}: {
  open: boolean;
  onClose: () => void;
  items: PedidoItem[];
  total: number;
  numeroPedido: number;
  origen: "tienda" | "armado";
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const reduceMotion = useReducedMotion();

  useLockBodyScroll(open);

  if (!open || typeof document === "undefined") return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const efectivoTotal = Number(total || 0);
  const tarjetaTotal = calculateInstallmentPrice(efectivoTotal);
  const totalSeleccionado = paymentMethod === "tarjeta" ? tarjetaTotal : efectivoTotal;
  const hasPaymentMethod = paymentMethod !== null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
    };

    if (!payload.nombre || !payload.apellido || !payload.dni || !payload.email || !payload.telefono || !payload.direccion) {
      setError("Completá todos los campos para continuar con el pedido.");
      return;
    }

    setSubmitting(true);

    const pedido = {
      id: `pedido-${numeroPedido}`,
      numeroPedido,
      ...payload,
      items,
      total: totalSeleccionado,
      formaPago: paymentMethod || undefined,
      createdAt: new Date().toISOString(),
      origen,
    };

    const cliente = {
      id: `cliente-${numeroPedido}`,
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni,
      email: payload.email,
      telefono: payload.telefono,
      direccion: payload.direccion,
      createdAt: new Date().toISOString(),
    };

    const storedPedidos = readStoredPedidos();
    const storedClientes = readStoredClientes();

    saveStoredPedidos([...storedPedidos, pedido]);
    saveStoredClientes([
      ...storedClientes.filter((entry) => entry.dni !== payload.dni && entry.email.toLowerCase() !== payload.email.toLowerCase()),
      cliente,
    ]);

    try {
      await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidos: [pedido],
          clientes: [cliente],
        }),
      });
    } catch (error) {
      console.error("pedido: local save only", error);
    }

    const fullName = `${payload.nombre} ${payload.apellido}`.trim();
    const lines = [
      buildPedidoMessage({ numeroPedido, items, total: totalSeleccionado, nombre: fullName }),
    ];
    if (paymentMethod) lines.push(`Forma de pago: ${paymentMethod === "tarjeta" ? "Tarjeta (3/6 cuotas)" : "Efectivo / Transferencia"}`);
    lines.push("",
      `Nombre y Apellido: ${fullName}`,
      `DNI: ${payload.dni}`,
      `Correo electrónico: ${payload.email}`,
      `Teléfono: ${payload.telefono}`,
      `Dirección: ${payload.direccion}`,
    );
    const message = lines.join("\n");

    window.open(waLink(message), "_blank", "noopener,noreferrer");
    setSubmitting(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-red-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[92vh] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Finalizar pedido</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Pedido {numeroPedido}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar formulario">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
              <p className="text-sm font-semibold text-slate-800">Tus datos</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkout-nombre">Nombre</Label>
              <Input id="checkout-nombre" value={form.nombre} onChange={(event) => updateField("nombre", event.target.value)} placeholder="Nombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-apellido">Apellido</Label>
              <Input id="checkout-apellido" value={form.apellido} onChange={(event) => updateField("apellido", event.target.value)} placeholder="Apellido" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-dni">DNI</Label>
              <Input id="checkout-dni" value={form.dni} onChange={(event) => updateField("dni", event.target.value)} placeholder="DNI" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-email">Correo electrónico</Label>
              <Input id="checkout-email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-telefono">Teléfono</Label>
              <Input id="checkout-telefono" type="tel" value={form.telefono} onChange={(event) => updateField("telefono", event.target.value)} placeholder="11 5555-5555" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="checkout-direccion">Dirección</Label>
              <Input id="checkout-direccion" value={form.direccion} onChange={(event) => updateField("direccion", event.target.value)} placeholder="Calle, número, barrio, localidad" required />
            </div>
            </div>
          </div>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          {origen === "tienda" && (
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">2. Medio de pago</p>
                  <p className="mt-1 text-sm text-slate-600">Elegí una opción para actualizar el total.</p>
                </div>
                <ShieldCheck className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Medio de pago">
                <motion.button type="button" role="radio" aria-checked={paymentMethod === "efectivo"} onClick={() => setPaymentMethod("efectivo")}
                  whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  className={`relative min-h-32 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${paymentMethod === "efectivo" ? "border-emerald-500 bg-emerald-50 shadow-[0_10px_24px_-18px_rgba(5,150,105,0.9)]" : "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50"}`}>
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Banknote className="size-5" /></span>
                  {paymentMethod === "efectivo" && <CheckCircle2 className="absolute right-4 top-4 size-5 text-emerald-700" aria-label="Seleccionado" />}
                  <p className="text-xs font-semibold text-emerald-700">Efectivo / Transferencia</p>
                  <p className="mt-1 font-display text-lg font-bold text-emerald-700">{`$${efectivoTotal.toLocaleString("es-AR")}`}</p>
                  <p className="mt-1 text-xs text-slate-500">Precio por pago directo</p>
                </motion.button>
                <motion.button type="button" role="radio" aria-checked={paymentMethod === "tarjeta"} onClick={() => setPaymentMethod("tarjeta")}
                  whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  className={`relative min-h-32 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${paymentMethod === "tarjeta" ? "border-rose-500 bg-rose-50 shadow-[0_10px_24px_-18px_rgba(225,29,72,0.9)]" : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/50"}`}>
                  <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600"><CreditCard className="size-5" /></span>
                  {paymentMethod === "tarjeta" && <CheckCircle2 className="absolute right-4 top-4 size-5 text-rose-600" aria-label="Seleccionado" />}
                  <p className="text-xs font-semibold text-rose-500">Tarjeta de crédito</p>
                  <p className="mt-1 font-display text-lg font-bold text-slate-900">{`$${tarjetaTotal.toLocaleString("es-AR")}`}</p>
                  <p className="mt-1 text-xs text-slate-500">3/6 cuotas sin interés (VISA / Mastercard)</p>
                </motion.button>
              </div>
              <AnimatePresence initial={false} mode="wait">
                {paymentMethod && (
                  <motion.p
                    key={paymentMethod}
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${paymentMethod === "efectivo" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                  >
                    <CheckCircle2 className="size-4" />
                    {paymentMethod === "efectivo" ? "Efectivo o transferencia seleccionado." : "Tarjeta de crédito seleccionada."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resumen</p>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div key={`${item.nombre}-${item.cantidad}`} className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.cantidad} x {item.nombre}</span>
                  <span className="font-semibold">${Number(item.precio || 0).toLocaleString("es-AR")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-red-200 pt-3 text-base font-bold">
              <span>{hasPaymentMethod ? `Total ${paymentMethod === "tarjeta" ? "con tarjeta" : "en efectivo"}` : "Total a confirmar"}</span>
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={paymentMethod || "pending"}
                  initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16 }}
                >
                  {hasPaymentMethod ? `$${totalSeleccionado.toLocaleString("es-AR")}` : "—"}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 bg-transparent text-slate-700 hover:bg-slate-100">Cancelar</Button>
            <Button type="submit" disabled={submitting || (origen === "tienda" && !paymentMethod)} className="bg-secondary text-slate-950 hover:bg-secondary/90">
              {submitting ? "Guardando…" : "Enviar por WhatsApp"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
