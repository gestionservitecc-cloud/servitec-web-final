"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComponenteAdmin } from "@/lib/types";
import { ImageField } from "./ImageField";
import { componentSpecificationFields } from "@/lib/component-catalog";

export function ComponenteDialog({ componente, onClose, onSave }: {
  componente: ComponenteAdmin;
  onClose: () => void;
  onSave: (component: ComponenteAdmin) => Promise<void>;
}) {
  const [draft, setDraft] = useState(componente);
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const set = (field: keyof ComponenteAdmin, value: string | number) => setDraft((current) => ({ ...current, [field]: value }));
  const specificationFields = useMemo(
    () => componentSpecificationFields(componente.categoria as Parameters<typeof componentSpecificationFields>[0], componente.nombre),
    [componente.categoria, componente.nombre],
  );
  const setSpec = (key: string, value: string) => setDraft((current) => ({ ...current, specs: { ...(current.specs || {}), [key]: value } }));
  const removeSpec = (key: string) => setDraft((current) => {
    const next = { ...(current.specs || {}) } as Record<string, string>;
    delete next[key];
    return { ...current, specs: Object.keys(next).length ? next : undefined };
  });
  const addNewSpec = () => {
    const key = (newSpecKey || "").trim();
    if (!key) return;
    setSpec(key, newSpecValue || "");
    setNewSpecKey("");
    setNewSpecValue("");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-4" role="dialog" aria-modal="true">
      <form onSubmit={async (event) => { event.preventDefault(); await onSave(draft); }} className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[92vh] sm:p-6">
        <h2 className="text-xl font-bold">{componente.esNuevo ? "Nuevo componente" : "Editar componente"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Nombre</Label><Input value={draft.nombre} onChange={(event) => set("nombre", event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Categoría</Label><Input value={draft.categoria} readOnly={!componente.esNuevo} onChange={(event) => set("categoria", event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Precio base</Label><Input type="number" value={draft.precio || ""} disabled={!componente.esNuevo} onChange={(event) => set("precio", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Costo</Label><Input type="number" value={draft.precioCosto || ""} onChange={(event) => set("precioCosto", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Stock</Label><Input type="number" value={draft.stock} onChange={(event) => set("stock", Number(event.target.value) || 0)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Imagen</Label><ImageField values={draft.imagen ? [draft.imagen] : []} onChange={(values) => set("imagen", values[0] || "")} /></div>
          <div className="space-y-3 sm:col-span-2">
            <Label>Especificaciones</Label>
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {specificationFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-slate-600">{field.label}</Label>
                    <Input value={draft.specs?.[field.key] || ""} onChange={(event) => setSpec(field.key, event.target.value)} />
                  </div>
                ))}
              </div>
              {/* render extra spec keys not included in specificationFields */}
              {Object.keys(draft.specs || {}).filter((k) => !specificationFields.some((f) => f.key === k)).length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-slate-600">Otras especificaciones</Label>
                  <div className="mt-2 grid gap-2">
                    {Object.keys(draft.specs || {}).filter((k) => !specificationFields.some((f) => f.key === k)).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input value={key} readOnly className="flex-1" />
                        <Input value={draft.specs?.[key] || ""} onChange={(e) => setSpec(key, e.target.value)} className="flex-2" />
                        <Button type="button" variant="ghost" onClick={() => removeSpec(key)}>Eliminar</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* add new spec */}
              <div className="mt-3 grid sm:grid-cols-3 gap-2 items-end">
                <div className="space-y-1 sm:col-span-1"><Label className="text-xs text-slate-600">Clave</Label><Input value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="ej: TDP" /></div>
                <div className="space-y-1 sm:col-span-1"><Label className="text-xs text-slate-600">Valor</Label><Input value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="ej: 95W" /></div>
                <div className="sm:col-span-1"><Button type="button" onClick={addNewSpec}>Agregar especificación</Button></div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Los componentes existentes conservan su precio original. Los nuevos se indexan al dólar blue compra al mostrarse.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar</Button></div>
      </form>
    </div>
  );
}