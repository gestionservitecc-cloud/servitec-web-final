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
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  };

  const add = () => onChange([...rules, { min: 0, max: null, pct: 5 }]);
  const removeAt = (index: number) => onChange(rules.filter((_, i) => i !== index));

  return (
    <div className="max-w-full space-y-1.5 overflow-hidden">
      {rules.map((rule, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-2 text-xs sm:flex sm:items-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 sm:text-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:contents">
            <input type="text" inputMode="numeric" value={formatCurrencyInput(rule.min)} onChange={(event) => update(index, { min: parsePrice(event.target.value) })} className="w-full min-w-0 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-28 sm:py-1" aria-label={`Desde ${index}`} />
            <span className="text-center text-slate-500">-</span>
            <input type="text" inputMode="numeric" value={rule.max == null ? "" : formatCurrencyInput(rule.max)} onChange={(event) => update(index, { max: event.target.value ? parsePrice(event.target.value) : null })} placeholder="Sin limite" className="w-full min-w-0 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-28 sm:py-1" aria-label={`Hasta ${index}`} />
          </div>
          <div className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:mt-0 sm:flex sm:items-center sm:gap-2">
            <span className="text-slate-500">+</span>
            <select value={String(rule.pct)} onChange={(event) => update(index, { pct: Number(event.target.value) })} className="w-full min-w-0 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-300 sm:w-24 sm:py-1" aria-label={`Porcentaje ${index}`}>
              {Array.from({ length: 21 }, (_, percentage) => percentage * 5).map((percentage) => <option key={percentage} value={percentage}>{percentage}%</option>)}
            </select>
          </div>
          <div className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:mt-0 sm:flex sm:items-center">
            <span className="text-slate-500">%</span>
            <button type="button" onClick={() => removeAt(index)} className="min-h-8 rounded px-1 py-1 text-left text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:ml-1 sm:min-h-0 sm:px-2 sm:py-1 sm:text-sm">Eliminar</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 sm:text-sm">Agregar rango</button>
    </div>
  );
}

export type { PriceRule };
