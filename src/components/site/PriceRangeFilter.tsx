"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parsePrice } from "@/lib/utils";

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
const PRICE_RANGE_MIN = 0;
const PRICE_RANGE_MAX = 100_000_000;

export function PriceRangeFilter({
  prices,
  min,
  max,
  onChange,
}: {
  prices: number[];
  min: number | null;
  max: number | null;
  onChange: (next: { min: number | null; max: number | null }) => void;
}) {
  const bounds = useMemo(() => {
    const values = prices.filter((price) => Number.isFinite(price) && price > 0);
    if (!values.length) return null;
    return {
      min: PRICE_RANGE_MIN,
      max: PRICE_RANGE_MAX,
    };
  }, [prices]);

  if (!bounds) return null;

  const lower = Math.max(bounds.min, Math.min(min ?? bounds.min, bounds.max));
  const upper = Math.min(bounds.max, Math.max(max ?? bounds.max, bounds.min));
  const safeLower = Math.min(lower, upper);
  const safeUpper = Math.max(lower, upper);
  const span = Math.max(bounds.max - bounds.min, 1);
  const left = `${((safeLower - bounds.min) / span) * 100}%`;
  const right = `${((safeUpper - bounds.min) / span) * 100}%`;

  const setMin = (value: string) => {
    if (value === "") return onChange({ min: null, max });
    onChange({ min: Math.min(parsePrice(value), max ?? bounds.max), max });
  };
  const setMax = (value: string) => {
    if (value === "") return onChange({ min, max: null });
    onChange({ min, max: Math.max(parsePrice(value), min ?? bounds.min) });
  };

  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Filtrar por precio
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {money(safeLower)} a {money(safeUpper)}
          </p>
        </div>
        {(min !== null || max !== null) && (
          <button
            type="button"
            onClick={() => onChange({ min: null, max: null })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <X className="size-3.5" /> Limpiar
          </button>
        )}
      </div>

      <div className="relative mt-3 h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left, right: `calc(100% - ${right})` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={safeLower}
          onChange={(event) => onChange({ min: Math.min(Number(event.target.value), safeUpper), max })}
          aria-label="Precio mínimo"
          className="price-range-input absolute inset-0 z-20"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={safeUpper}
          onChange={(event) => onChange({ min, max: Math.max(Number(event.target.value), safeLower) })}
          aria-label="Precio máximo"
          className="price-range-input absolute inset-0 z-30"
        />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Desde
          <Input
            type="text"
            inputMode="numeric"
            value={min === null ? "" : formatCurrencyInput(min)}
            onChange={(event) => setMin(event.target.value)}
            placeholder="$0"
            className="mt-1 h-9"
          />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Hasta
          <Input
            type="text"
            inputMode="numeric"
            value={max === null ? "" : formatCurrencyInput(max)}
            onChange={(event) => setMax(event.target.value)}
            placeholder="$100.000.000"
            className="mt-1 h-9"
          />
        </label>
      </div>
    </div>
  );
}
