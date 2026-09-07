"use client";
import React from "react";
import { formatCurrencyInput, parsePrice } from "@/lib/utils";

type PriceRule = { min: number; max?: number | null; pct: number };

export default function CategoryPriceRules({
  rules,
  onChange,
}: {
  rules: PriceRule[];
  onChange: (next: PriceRule[]) => void;
}) {
  const update = (index: number, patch: Partial<PriceRule>) => {
    const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  const add = () => onChange([...rules, { min: 0, max: null, pct: 5 }]);
  const removeAt = (i: number) => onChange(rules.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex sm:border-0 sm:bg-transparent sm:p-0">
          <input
            type="text"
            inputMode="numeric"
            value={formatCurrencyInput(r.min)}
            onChange={(e) => update(i, { min: parsePrice(e.target.value) })}
            className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-28 sm:py-1"
            aria-label={`Desde ${i}`}
          />
          <span>—</span>
          <input
            type="text"
            inputMode="numeric"
            value={r.max == null ? "" : formatCurrencyInput(r.max)}
            onChange={(e) => update(i, { max: e.target.value ? parsePrice(e.target.value) : null })}
            placeholder="Sin límite"
            className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-28 sm:py-1"
            aria-label={`Hasta ${i}`}
          />
          <span>+</span>
          <select
            value={String(r.pct)}
            onChange={(e) => update(i, { pct: Number(e.target.value) })}
            className="col-span-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-24 sm:py-1"
            aria-label={`Pct ${i}`}
          >
            {Array.from({ length: 21 }, (_, index) => index * 5).map((percentage) => (
              <option key={percentage} value={percentage}>{percentage}%</option>
            ))}
          </select>
          <span>%</span>
          <button onClick={() => removeAt(i)} className="col-span-1 min-h-10 rounded px-2 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:ml-2 sm:min-h-0 sm:py-1">Eliminar</button>
        </div>
      ))}
      <div>
        <button onClick={add} className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700 shadow-sm">Agregar rango</button>
      </div>
    </div>
  );
}

export type { PriceRule };
