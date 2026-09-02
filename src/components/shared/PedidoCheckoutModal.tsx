"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { waLink } from "@/components/site/site-config";
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
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  if (!open) return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

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
      total,
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
    const message = [
      buildPedidoMessage({
        numeroPedido,
        items,
        total,
        nombre: fullName,
      }),
      "",
      `Nombre y Apellido: ${fullName}`,
      `DNI: ${payload.dni}`,
      `Correo electrónico: ${payload.email}`,
      `Teléfono: ${payload.telefono}`,
      `Dirección: ${payload.direccion}`,
    ].join("\n");

    window.open(waLink(message), "_blank", "noopener,noreferrer");
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Finalizar pedido</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Pedido {numeroPedido}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar formulario">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

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
              <span>Total</span>
              <span>${Number(total || 0).toLocaleString("es-AR")}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 bg-transparent text-slate-700 hover:bg-slate-100">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="bg-secondary text-slate-950 hover:bg-secondary/90">
              {submitting ? "Guardando…" : "Enviar por WhatsApp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
