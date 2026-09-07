"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  componentCatalogKeys,
  componentCatalogLabels,
  componentSpecificationFields,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/component-catalog";
import { ImageField } from "./ImageField";
import { formatCurrencyInput, parsePrice } from "@/lib/utils";

export function ComponenteDialog({ componente, onClose, onSave }: {
  componente: CatalogProduct;
  onClose: () => void;
  onSave: (component: CatalogProduct) => Promise<void>;
}) {
  const [draft, setDraft] = useState(componente);
  const set = (field: string, value: string | number) => setDraft((current) => ({ ...current, [field]: value }));
  const setSpec = (field: string, value: string) => setDraft((current) => ({
    ...current,
    specs: { ...((current.specs || {}) as Record<string, unknown>), [field]: value },
  }));
  const categoryKey = componentCatalogKeys.find((key) => {
    const value = String(draft.categoria || "").trim().toLowerCase();
    const folders: Record<ComponentCatalogKey, string> = {
      motherboard: "motherboard",
      processor: "procesador",
      memory: "ram",
      storage: "disco",
      graphics: "grafica",
      power: "fuente",
      case: "gabinete",
      cooling: "cooler",
      peripherals: "periferico",
    };
    return key === value || folders[key] === value || componentCatalogLabels[key].toLowerCase() === value;
  });
  const specificationFields = categoryKey ? componentSpecificationFields(categoryKey, draft.nombre) : [];
  const specifications = (draft.specs || {}) as Record<string, unknown>;
  const singleImageCategories: ComponentCatalogKey[] = ["processor", "cooling", "memory", "storage"];
  const allowMultipleImages = Boolean(categoryKey && !singleImageCategories.includes(categoryKey));
  const imageValues = draft.imagenes?.length ? draft.imagenes : draft.imagen ? [draft.imagen] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 sm:p-4" role="dialog" aria-modal="true">
      <form
        onSubmit={async (event) => { event.preventDefault(); await onSave(draft); }}
        className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 text-slate-900 shadow-2xl sm:p-6"
      >
        <h2 className="text-xl font-bold">{componente.nombre ? "Editar componente" : "Nuevo componente"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nombre</Label>
            <Input value={draft.nombre} onChange={(event) => set("nombre", event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm">
              {(componentCatalogLabels[draft.categoria as keyof typeof componentCatalogLabels] || draft.categoria).toUpperCase()}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Precio costo</Label>
            <Input type="text" inputMode="numeric" value={formatCurrencyInput(Number(draft.precioCosto ?? draft.precio ?? 0))} onChange={(event) => set("precioCosto", parsePrice(event.target.value))} />
          </div>
          {specificationFields.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Especificaciones</p>
                <p className="mt-1 text-xs text-slate-500">Completá los datos técnicos correspondientes a esta categoría.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {specificationFields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      value={String(specifications[field.key] ?? "")}
                      onChange={(event) => setSpec(field.key, event.target.value)}
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{allowMultipleImages ? "Imágenes (hasta 3)" : "Imagen"}</Label>
            <ImageField
              multiple={allowMultipleImages}
              maxFiles={allowMultipleImages ? 3 : 1}
              values={imageValues}
              onChange={(values) => setDraft((current) => ({
                ...current,
                imagen: values[0] || "",
                imagenes: values,
              }))}
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="w-full sm:w-auto" type="submit">Guardar</Button>
        </div>
      </form>
    </div>
  );
}
