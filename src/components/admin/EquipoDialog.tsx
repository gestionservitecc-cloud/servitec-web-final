"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  loadComponentCatalog,
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";
import { normalizeCatalogText } from "@/lib/pc-catalog";
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
  const [draft, setDraft] = useState<Equipo>(() => structuredClone(equipo));

  const set = <K extends keyof Equipo>(key: K, value: Equipo[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setSpec = (key: string, value: string) =>
    setDraft((d) => ({ ...d, specs: { ...d.specs, [key]: value } }));

  const isPc = draft.categoria === "pc-armada";
  const isCelular = draft.categoria === "celular";
  const isNotebook = draft.categoria === "notebook";
  const isTablet = draft.categoria === "tablet";
  const isTv = draft.categoria === "tv";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8 sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle>{equipo.nombre ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
          <PrivateNotesButton
            value={draft.notasPrivadas || ""}
            onChange={(value) => set("notasPrivadas", value)}
          />
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

          {isPc ? (
            <ComponentesEditor
              value={draft.componentes}
              onChange={(v) => set("componentes", v)}
            />
          ) : isTablet || isTv ? (
            <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                {isTablet ? "Especificaciones de la tablet" : "Especificaciones del TV"}
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Marca"><Input value={draft.marca} onChange={(e) => set("marca", e.target.value)} /></Field>
                <Field label="Modelo"><Input value={draft.modelo} onChange={(e) => set("modelo", e.target.value)} /></Field>
                {(isTablet
                  ? [
                      ["almacenamiento", "Almacenamiento"],
                      ["ram", "RAM"],
                      ["pantalla", "Pantalla"],
                      ["sistema", "Sistema operativo"],
                    ]
                  : [
                      ["pulgadas", "Pulgadas"],
                      ["pantalla", "Tipo de pantalla"],
                      ["sistema", "Sistema operativo"],
                    ]
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input value={(draft.specs as Record<string, string>)[key] || ""} onChange={(e) => setSpec(key, e.target.value)} />
                  </Field>
                ))}
                {(isTablet || isTv) && <Field label="Garantía"><Input value={draft.warranty} onChange={(e) => set("warranty", e.target.value)} /></Field>}
                {(isTablet || isTv) && <Field label="Precio original"><Input type="number" value={draft.original || ""} onChange={(e) => set("original", Number(e.target.value) || 0)} /></Field>}
                {(isTablet || isTv) && <Field label="Precio promo"><Input type="number" value={draft.promo || ""} onChange={(e) => set("promo", Number(e.target.value) || 0)} /></Field>}
              </div>
            </details>
          ) : isCelular ? (
            <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                Datos del celular
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Marca">
                  <Input value={draft.marca} onChange={(e) => set("marca", e.target.value)} />
                </Field>
                <Field label="Modelo">
                  <Input value={draft.modelo} onChange={(e) => set("modelo", e.target.value)} />
                </Field>
                {[
                  ["almacenamiento", "Almacenamiento"],
                  ["ram", "RAM"],
                  ["pantalla", "Pantalla"],
                  ["sistema", "Sistema operativo"],
                  ["bateria", "Batería"],
                  ["origen", "Origen"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input
                      value={(draft.specs as Record<string, string>)[key] || ""}
                      onChange={(e) => setSpec(key, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </details>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marca">
                <Input value={draft.marca} onChange={(e) => set("marca", e.target.value)} />
              </Field>
              <Field label="Modelo">
                <Input value={draft.modelo} onChange={(e) => set("modelo", e.target.value)} />
              </Field>
            </div>
          )}

          {!isCelular && !isNotebook && !isPc && !isTablet && !isTv && (
            <Field label="Descripción corta">
              <Textarea
                rows={2}
                value={draft.detail}
                onChange={(e) => set("detail", e.target.value)}
                placeholder="Ej: Para estudio, trabajo y uso diario"
              />
            </Field>
          )}

          {isNotebook && (
            <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                Especificaciones
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          {!isTablet && !isTv && <div className="grid gap-4 sm:grid-cols-3">
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
          </div>}

          {isTablet && (
            <Field label="Condición">
              <Select value={draft.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sellado">Sellado</SelectItem>
                  <SelectItem value="Reacondicionado">Reacondicionado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {isTv && (
            <Field label="Condición">
              <Select value={draft.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sellado">Sellado</SelectItem>
                  <SelectItem value="Reacondicionado">Reacondicionado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {!isTablet && !isTv && <Field label="Garantía">
            <Input
              value={draft.warranty}
              onChange={(e) => set("warranty", e.target.value)}
              placeholder="Ej: 6 meses"
            />
          </Field>}

          {isPc && (
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
          )}

          <Field label="Imágenes">
            <ImageField
              multiple
              values={draft.imagenes}
              onChange={(v) => set("imagenes", v)}
            />
          </Field>

          {!isPc && !isCelular && !isNotebook && !isTablet && !isTv && (
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

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(isCelular || isNotebook || isTablet || isTv ? { ...draft, detail: "" } : draft)}
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

function PrivateNotesButton({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-fit gap-2 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
        >
          <StickyNote className="size-4" />
          {value.trim() ? "Editar nota privada" : "Agregar nota privada"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nota privada</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={6}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Solo visible dentro del panel admin"
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Listo</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComponentesEditor({
  value,
  onChange,
}: {
  value: EquipoComponente[];
  onChange: (v: EquipoComponente[]) => void;
}) {
  const [catalog, setCatalog] = useState<Partial<Record<ComponentCatalogKey, CatalogProduct[]>>>({});
  const [addKey, setAddKey] = useState<ComponentCatalogKey>(componentCatalogKeys[0]);
  const [componentFilter, setComponentFilter] = useState("");

  useEffect(() => {
    let active = true;
    loadComponentCatalog().then((loaded) => {
      if (active) setCatalog(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredComponents = useMemo(() => {
    const query = normalizeCatalogText(componentFilter);
    return (catalog[addKey] || []).filter((component) =>
      !query || component.searchable.includes(query) || normalizeCatalogText(component.nombre).includes(query),
    );
  }, [addKey, catalog, componentFilter]);

  const addFromCatalog = (key: string, nombre: string) => {
    const item = catalog[key as ComponentCatalogKey]?.find((c) => c.nombre === nombre);
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
        <Select value={addKey} onValueChange={(value) => setAddKey(value as ComponentCatalogKey)}>
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
            <div
              className="sticky top-0 z-10 bg-popover p-2"
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Input
                value={componentFilter}
                onChange={(event) => setComponentFilter(event.target.value)}
                placeholder="Buscar componente…"
              />
            </div>
            {filteredComponents.map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
