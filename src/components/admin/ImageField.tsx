"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "./lib";

export function ImageField({
  values,
  onChange,
  multiple = false,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadImage(f));
        if (!multiple) break;
      }
      onChange(multiple ? [...values, ...urls] : urls.slice(0, 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((url, i) => (
          <div
            key={url + i}
            className="group relative size-20 overflow-hidden rounded-lg border bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, k) => k !== i))}
              className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Quitar imagen"
            >
              <X className="size-3" />
            </button>
            {multiple && values.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-between bg-black/50 px-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} className="text-xs">
                  ←
                </button>
                <button type="button" onClick={() => move(i, 1)} className="text-xs">
                  →
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group grid size-20 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          aria-label="Agregar imagen"
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <span className="flex flex-col items-center gap-0.5">
              <span className="relative">
                <ImagePlus className="size-6" />
                <Plus className="absolute -bottom-1 -right-2 size-3.5 rounded-full bg-primary text-white" />
              </span>
              <span className="text-[10px] font-semibold">Agregar</span>
            </span>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {values.length > 0 && !multiple && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => onChange([])}
        >
          <Trash2 className="size-3" /> Quitar
        </Button>
      )}
    </div>
  );
}
