"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Equipo, EquipoComponente } from "@/lib/types";
import {
  componentCatalogLabels,
  componentCatalogKeys,
  getCatalog,
} from "@/lib/pc-catalog";
import { CATEGORIAS_EQUIPO, SPEC_FIELDS } from "./lib";
import { ImageField } from "./ImageField";

export function EquipoDialog({
  equipo,
  onSave,
  onClose,
}: {
  equipo: Equipo;
  onSave: (e: Equipo) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Equipo>(structuredClone(equipo));
  useEffect(() => setDraft(structuredClone(equipo)), [equipo]);

  const set = <K extends keyof Equipo>(key: K, value: Equipo[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setSpec = (key: string, value: string) =>
    setDraft((d) => ({ ...d, specs: { ...d.specs, [key]: value } }));

  const isPc = draft.categoria === "pc-armada";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipo.nombre ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <Select
                value={draft.categoria}
                onValueChange={(v) => set("categoria", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_EQUIPO.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={draft.estado} onValueChange={(v) => set("estado", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Nombre">
            <Input
              value={draft.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Notebook Lenovo IdeaPad 3 Slim"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca">
              <Input value={draft.marca} onChange={(e) => set("marca", e.target.value)} />
            </Field>
            <Field label="Modelo">
              <Input value={draft.modelo} onChange={(e) => set("modelo", e.target.value)} />
            </Field>
          </div>

          <Field label="Descripción corta">
            <Textarea
              rows={2}
              value={draft.detail}
              onChange={(e) => set("detail", e.target.value)}
              placeholder="Ej: Para estudio, trabajo y uso diario"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio de lista">
              <Input
                type="number"
                value={draft.original || ""}
                onChange={(e) => set("original", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Precio efectivo">
              <Input
                type="number"
                value={draft.promo || ""}
                onChange={(e) => set("promo", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Condición">
              <Select
                value={draft.condition}
                onValueChange={(v) => set("condition", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sellado">Sellado</SelectItem>
                  <SelectItem value="Reacondicionado">Reacondicionado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Garantía">
            <Input
              value={draft.warranty}
              onChange={(e) => set("warranty", e.target.value)}
              placeholder="Ej: 6 meses"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Destacado / recomendado</p>
              <p className="text-xs text-muted-foreground">
                Aparece en la home y en el configurador de PC.
              </p>
            </div>
            <Switch
              checked={draft.recomendada}
              onCheckedChange={(v) => set("recomendada", v)}
            />
          </div>

          <Field label="Imágenes">
            <ImageField
              multiple
              values={draft.imagenes}
              onChange={(v) => set("imagenes", v)}
            />
          </Field>

          {!isPc && (
            <details className="rounded-lg border p-3" open>
              <summary className="cursor-pointer text-sm font-medium">
                Especificaciones
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SPEC_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <Input
                      value={(draft.specs as Record<string, string>)[f.key] || ""}
                      onChange={(e) => setSpec(f.key, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </details>
          )}

          {isPc && (
            <ComponentesEditor
              value={draft.componentes}
              onChange={(v) => set("componentes", v)}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(draft)}
            disabled={!draft.nombre.trim()}
          >
            Guardar equipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ComponentesEditor({
  value,
  onChange,
}: {
  value: EquipoComponente[];
  onChange: (v: EquipoComponente[]) => void;
}) {
  const catalog = useMemo(() => getCatalog(), []);
  const [addKey, setAddKey] = useState<string>(componentCatalogKeys[0]);

  const addFromCatalog = (key: string, nombre: string) => {
    const item = (catalog as Record<string, { nombre: string; precio: number; imagen: string }[]>)[
      key
    ]?.find((c) => c.nombre === nombre);
    if (!item) return;
    onChange([
      ...value,
      {
        key,
        label: componentCatalogLabels[key as keyof typeof componentCatalogLabels] || key,
        nombre: item.nombre,
        detalle: "",
        imagen: item.imagen,
        precio: item.precio,
        cantidad: 1,
      },
    ]);
  };

  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">Componentes de la PC</p>
      <div className="mt-3 space-y-2">
        {value.map((c, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border p-2">
            {c.imagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imagen} alt="" className="size-10 shrink-0 rounded object-contain" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold uppercase text-muted-foreground">
                {c.label}
              </p>
              <p className="truncate text-sm">{c.nombre}</p>
            </div>
            <Input
              type="number"
              className="h-8 w-16"
              value={c.cantidad || 1}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...c, cantidad: Number(e.target.value) || 1 };
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-destructive"
              onClick={() => onChange(value.filter((_, k) => k !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Select value={addKey} onValueChange={setAddKey}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {componentCatalogKeys.map((k) => (
              <SelectItem key={k} value={k}>
                {componentCatalogLabels[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value="" onValueChange={(v) => addFromCatalog(addKey, v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Elegir del catálogo…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {((catalog as Record<string, { nombre: string }[]>)[addKey] || []).map(
              (c) => (
                <SelectItem key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
