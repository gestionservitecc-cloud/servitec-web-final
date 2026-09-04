"use client";

import { useMemo, useState } from "react";
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
  type CatalogProduct,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";
import type { ComponentCatalog } from "@/lib/component-catalog";
import { normalizeCatalogText } from "@/lib/pc-catalog";
import { CATEGORIAS_EQUIPO, SPEC_FIELDS } from "./lib";
import { ImageField } from "./ImageField";
import { calculateInstallmentPrice, normalizeStockCategoryValue } from "@/lib/utils";

export function EquipoDialog({
  equipo,
  componentCatalog,
  onSave,
  onClose,
}: {
  equipo: Equipo;
  componentCatalog: ComponentCatalog;
  onSave: (e: Equipo) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Equipo>(() => structuredClone(equipo));

  const set = <K extends keyof Equipo>(key: K, value: Equipo[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setEffectivePrice = (value: number) => {
    const promo = Number(value) || 0;
    setDraft((d) => ({
      ...d,
      promo,
      original: calculateInstallmentPrice(promo),
    }));
  };
  const setSpec = (key: string, value: string) =>
    setDraft((d) => ({ ...d, specs: { ...d.specs, [key]: value } }));

  const isPc = draft.categoria === "pc-armada";
  const isCelular = draft.categoria === "celular";
  const isNotebook = draft.categoria === "notebook";
  const isTablet = draft.categoria === "tablet";
  const isTv = draft.categoria === "tv";
  const isConsola = normalizeStockCategoryValue(draft.categoria) === "consola";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto p-4 sm:max-h-[92vh] sm:max-w-[calc(100vw-2rem)] sm:p-6 md:max-w-3xl">
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
              catalog={componentCatalog}
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
                {(isTablet || isTv) && <Field label="Precio efectivo">
                  <Input type="number" value={draft.promo || ""} onChange={(e) => setEffectivePrice(Number(e.target.value) || 0)} />
                  {draft.promo && <p className="mt-1 text-[11px] text-red-500">3/6 cuotas: ${draft.promo ? calculateInstallmentPrice(Number(draft.promo)).toLocaleString("es-AR") : "0"}</p>}
                </Field>}
              </div>
            </details>
          ) : isConsola ? (
            <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" open>
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                Especificaciones de la consola
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Marca"><Input value={draft.marca} onChange={(e) => set("marca", e.target.value)} /></Field>
                <Field label="Modelo"><Input value={draft.modelo} onChange={(e) => set("modelo", e.target.value)} /></Field>
                {[
                  ["generacion", "Generación"],
                  ["almacenamiento", "Almacenamiento"],
                  ["resolucion", "Resolución máxima"],
                  ["unidadOptica", "Unidad óptica"],
                  ["conectividad", "Conectividad"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input value={(draft.specs as Record<string, string>)[key] || ""} onChange={(e) => setSpec(key, e.target.value)} />
                  </Field>
                ))}
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

          {!isCelular && !isNotebook && !isPc && !isTablet && !isTv && !isConsola && (
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

          {!isTablet && !isTv && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio efectivo">
              <Input
                type="number"
                value={draft.promo || ""}
                onChange={(e) => setEffectivePrice(Number(e.target.value) || 0)}
              />
              {draft.promo && <p className="mt-1 text-[11px] text-red-500">3/6 cuotas: ${draft.promo ? calculateInstallmentPrice(Number(draft.promo)).toLocaleString("es-AR") : "0"}</p>}
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
              multiple={isNotebook}
              maxFiles={isNotebook ? 3 : 1}
              values={draft.imagenes}
              onChange={(v) => set("imagenes", v)}
            />
          </Field>

          {!isPc && !isCelular && !isNotebook && !isTablet && !isTv && !isConsola && (
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

        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="w-full"
            onClick={() => {
              const normalized = {
                ...draft,
                promo: Number(draft.promo || 0),
                original: calculateInstallmentPrice(Number(draft.promo || 0)),
              };
              onSave(isCelular || isNotebook || isTablet || isTv ? { ...normalized, detail: "" } : normalized);
            }}
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
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-md overflow-y-auto p-4 sm:p-6">
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
            <Button className="w-full sm:w-auto" type="button">Listo</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComponentesEditor({
  catalog,
  value,
  onChange,
}: {
  catalog: ComponentCatalog;
  value: EquipoComponente[];
  onChange: (v: EquipoComponente[]) => void;
}) {
  const [addKey, setAddKey] = useState<ComponentCatalogKey>(componentCatalogKeys[0]);
  const [componentFilter, setComponentFilter] = useState("");

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

  const selectedCount = value.reduce((total, component) => total + (Number(component.cantidad) || 1), 0);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">Componentes de la PC</p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedCount} seleccionado{selectedCount === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-3 space-y-2">
        {value.map((c, i) => (
          <div key={i} className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {c.imagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imagen} alt="" className="size-10 shrink-0 rounded border border-slate-100 bg-white object-contain" />
            )}
            <div className="min-w-0 flex-1 basis-32">
              <p className="truncate text-xs font-semibold uppercase text-muted-foreground">
                {c.label}
              </p>
              <p className="truncate text-sm">{c.nombre}</p>
            </div>
            <Input
              type="number"
              className="h-10 w-16"
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
              className="size-10 shrink-0 text-destructive"
              onClick={() => onChange(value.filter((_, k) => k !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3 sm:p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-800">Categoría interna</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {componentCatalogKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setAddKey(key); setComponentFilter(""); }}
              className={`min-h-11 rounded-lg border px-2 py-2 text-left text-xs font-bold transition ${addKey === key ? "border-sky-600 bg-sky-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"}`}
            >
              <span className="block truncate">{componentCatalogLabels[key].toUpperCase()}</span>
              <span className={`mt-0.5 block text-[11px] font-medium ${addKey === key ? "text-sky-100" : "text-slate-500"}`}>{catalog[key]?.length || 0} disponibles</span>
            </button>
          ))}
        </div>
        <Input className="mt-3 h-11 bg-white" value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)} placeholder="Buscar en esta categoría..." />
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredComponents.map((component) => (
            <button key={component.id} type="button" onClick={() => addFromCatalog(addKey, component.nombre)} className="flex min-h-12 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-sky-400 hover:bg-sky-50">
              {component.imagen && <img src={component.imagen} alt="" className="size-8 shrink-0 rounded object-contain" />}
              <span className="min-w-0 truncate">{component.nombre}</span>
              <Plus className="ml-auto size-4 shrink-0 text-sky-600" />
            </button>
          ))}
          {filteredComponents.length === 0 && <p className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-center text-xs text-slate-500">No hay componentes cargados en esta categoría.</p>}
        </div>
      </div>

      <div className="hidden mt-3 flex flex-col gap-2 sm:flex-row">
        <Select value={addKey} onValueChange={(value) => setAddKey(value as ComponentCatalogKey)}>
          <SelectTrigger className="w-full sm:w-40">
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
