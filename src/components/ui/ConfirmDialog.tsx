"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md gap-5 rounded-2xl p-5 sm:p-6">
        <DialogHeader className="flex-row items-start gap-3 pr-7 text-left">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
          <DialogTitle>{title || "Confirmar acción"}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex">
          <DialogClose asChild>
            <Button className="w-full" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            className="w-full"
            variant="destructive"
            size="sm"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Eliminando…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
