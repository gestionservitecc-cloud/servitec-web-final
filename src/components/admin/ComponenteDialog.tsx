"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponenteAdmin } from "@/lib/types";
import { ImageField } from "./ImageField";

export function ComponenteDialog({ componente, onClose, onSave }: {
  componente: ComponenteAdmin;
  onClose: () => void;
  onSave: (component: ComponenteAdmin) => Promise<void>;
}) {
  const [draft, setDraft] = useState(componente);
  const set = (field: keyof ComponenteAdmin, value: string | number) => setDraft((current) => ({ ...current, [field]: value }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
      <form onSubmit={async (event) => { event.preventDefault(); await onSave(draft); }} className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
        <h2 className="text-xl font-bold">{componente.esNuevo ? "Nuevo componente" : "Editar componente"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Nombre</Label><Input value={draft.nombre} onChange={(event) => set("nombre", event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Categoría</Label><Input value={draft.categoria} readOnly={!componente.esNuevo} onChange={(event) => set("categoria", event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Precio base</Label><Input type="number" value={draft.precio || ""} disabled={!componente.esNuevo} onChange={(event) => set("precio", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Costo</Label><Input type="number" value={draft.precioCosto || ""} onChange={(event) => set("precioCosto", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Stock</Label><Input type="number" value={draft.stock} onChange={(event) => set("stock", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Imagen</Label><ImageField values={draft.imagen ? [draft.imagen] : []} onChange={(values) => set("imagen", values[0] || "")} /></div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Los componentes existentes conservan su precio original. Los nuevos se indexan al dólar blue compra al mostrarse.</p>
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar</Button></div>
      </form>
    </div>
  );
}