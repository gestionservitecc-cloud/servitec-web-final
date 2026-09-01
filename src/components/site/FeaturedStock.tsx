"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Equipo } from "@/lib/types";

const currency = (n: number) => `$${n.toLocaleString("es-AR")}`;

export function FeaturedStock() {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/equipos")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Equipo[]) => {
        if (alive) setEquipos(Array.isArray(data) ? data : []);
      })
      .catch(() => alive && setEquipos([]));
    return () => {
      alive = false;
    };
  }, []);

  const ready = equipos !== null;
  const list = equipos ?? [];
  const disponibles = list.filter((e) => e.estado !== "vendido");

  const pcs = disponibles
    .filter((e) => e.categoria === "pc-armada" && e.recomendada)
    .slice(0, 4);
  const notebooks = disponibles
    .filter((e) => e.categoria === "notebook")
    .slice(0, 4);

  if (ready && pcs.length === 0 && notebooks.length === 0) return null;

  return (
    <section className="container-page space-y-14 py-16 lg:py-20">
      <StockRow
        title="PC armadas recomendadas"
        href="/stock?categoria=pc-armada"
        items={pcs}
        loading={!ready}
        accent
      />
      <StockRow
        title="Notebooks"
        href="/stock?categoria=notebook"
        items={notebooks}
        loading={!ready}
      />
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
          <p className="eyebrow">Stock</p>
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
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className={`group flex flex-col overflow-hidden rounded-2xl border shadow-soft transition-shadow hover:shadow-soft-lg ${
                    accent ? "border-primary/20 bg-accent/30" : "bg-card"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {item.imagenes[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagenes[0]}
                        alt={item.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                      {item.nombre}
                    </h3>
                    <p className="text-xl font-bold">{currency(price)}</p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-auto w-full"
                      variant={accent ? "secondary" : "default"}
                    >
                      <Link href={href}>
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
