"use client";

import { useState } from "react";
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
import type { Producto } from "@/lib/types";
import { ImageField } from "./ImageField";

export function ProductoDialog({
  producto,
  categorias,
  onSave,
  onClose,
}: {
  producto: Producto;
  categorias: string[];
  onSave: (p: Producto) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Producto>(() => ({ ...producto }));
  const set = <K extends keyof Producto>(k: K, v: Producto[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {producto.nombre ? "Editar accesorio" : "Nuevo accesorio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre</Label>
            <Input value={draft.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Categoría</Label>
            <Input
              list="cat-list"
              value={draft.categoria}
              onChange={(e) => set("categoria", e.target.value)}
            />
            <datalist id="cat-list">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Precio</Label>
              <Input
                type="number"
                value={draft.precio || ""}
                onChange={(e) => set("precio", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Costo</Label>
              <Input
                type="number"
                value={draft.precioCosto || ""}
                onChange={(e) => set("precioCosto", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                value={draft.stock}
                onChange={(e) => set("stock", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Imagen</Label>
            <ImageField
              maxFiles={1}
              values={draft.imagen ? [draft.imagen] : []}
              onChange={(v) => set("imagen", v[0] || "")}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.nombre.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
