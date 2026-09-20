"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Equipo } from "@/lib/types";
import { stockCategories } from "@/components/site/site-config";
import {
  calculateInstallmentPrice,
  normalizeEquipmentCondition,
  normalizeStockCategoryValue,
} from "@/lib/utils";

const currency = (n: number) => `$${n.toLocaleString("es-AR")}`;

export function FeaturedStock() {
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/equipos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Equipo[]) => {
        if (alive) setEquipos(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (alive) { setError(true); setEquipos([]); } });
    return () => {
      alive = false;
    };
  }, []);

  const ready = equipos !== null;
  const list = equipos ?? [];
  const disponibles = [...list].sort((a, b) => a.orden - b.orden).filter((e) => e.estado !== "vendido");

  const destacados = stockCategories
    .flatMap((category) =>
      (["Sellado", "Reacondicionado"] as const).map((condition) => ({
        ...category,
        condition,
        items: disponibles
          .filter(
            (equipment) =>
              normalizeStockCategoryValue(equipment.categoria) === category.value &&
              normalizeEquipmentCondition(equipment.condition) === condition &&
              equipment.recomendada,
          )
          .slice(0, 4),
      })),
    )
    .filter((category) => category.items.length > 0);

  if (error) return <section className="container-page py-8" role="status"><p>No pudimos cargar los destacados.</p><Link className="text-primary underline" href="/tienda">Explorar la tienda</Link></section>;
  if (ready && destacados.length === 0) return null;

  return (
    <section className="container-page space-y-6 py-10 lg:py-12">
      {ready && <div aria-label="Categorías destacadas" className="flex gap-2 overflow-x-auto pb-2">{destacados.map((category, index) => <button key={`${category.value}-${category.condition}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${active === index ? "bg-primary text-white" : "bg-card"}`}>{category.label} · {category.condition}</button>)}</div>}
      {!ready ? (
        <StockRow
          title="Equipos destacados"
          href="/tienda?tipo=equipos"
          items={[]}
          loading
        />
      ) : (
        destacados.filter((_, index) => index === Math.min(active, destacados.length - 1)).map((category, index) => (
          <StockRow
            key={`${category.value}-${category.condition}`}
            title={`${category.label} ${category.condition === "Sellado" ? "nuevos" : "reacondicionados"} destacados`}
            href={
              category.condition === "Sellado"
                ? `/tienda?tipo=${category.value}`
                : `/reacondicionados?categoria=${category.value}`
            }
            items={category.items}
            accent={index === 0 && category.value === "pc-armada"}
            loading={false}
          />
        ))
      )}
    </section>
  );
}

function StockRow({
  title,
  href,
  items,
  loading,
  accent = false,
}: {
  title: string;
  href: string;
  items: Equipo[];
  loading: boolean;
  accent?: boolean;
}) {
  if (!loading && items.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Equipos destacados</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          Ver todo →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border bg-muted" />
            ))
          : items.map((item, i) => {
              const price = Number(item.promo || item.original || 0);
              const installmentPrice = calculateInstallmentPrice(price);
              return (
                <motion.article
                  key={item.id}
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}

                  className={`group flex flex-col overflow-hidden rounded-2xl border shadow-soft transition-shadow hover:shadow-soft-lg ${
                    accent ? "border-primary/20 bg-accent/30" : "bg-card"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {item.imagenes?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagenes?.[0]}
                        alt={item.nombre}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">Imagen no disponible</div>}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                      {item.nombre}
                    </h3>
                    <div><p className="text-xs text-muted-foreground">Efectivo / transferencia</p><p className="text-xl font-bold">{currency(price)}</p></div>
                    <p className="text-xs text-muted-foreground">Total con tarjeta: {currency(installmentPrice)}</p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-auto w-full"
                      variant={accent ? "secondary" : "default"}
                    >
                      <Link href={`/producto/equipo/${encodeURIComponent(item.id)}`}>
                        Ver más <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              );
            })}
      </div>
    </div>
  );
}
