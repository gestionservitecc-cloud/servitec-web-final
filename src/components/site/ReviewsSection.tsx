"use client";

import { Star } from "lucide-react";
import { CONTACT } from "./site-config";
import { reviews } from "@/content/reviews";

function ReviewCard({ name, text }: { name: string; text: string }) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col gap-3 rounded-2xl border bg-card p-6 shadow-soft sm:w-[360px]">
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <blockquote className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
        “{text}”
      </blockquote>
      <figcaption className="mt-auto text-sm font-semibold">{name}</figcaption>
    </figure>
  );
}

export function ReviewsSection() {
  const loop = [...reviews, ...reviews];
  return (
    <section className="overflow-hidden border-y bg-muted/40 py-16 sm:py-20">
      <div className="container-page text-center">
        <p className="eyebrow justify-center">Opiniones reales</p>
        <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          Lo que dicen nuestros clientes
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Reseñas verificadas en Google
        </p>
      </div>

      <div
        className="group relative mt-10 flex overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex shrink-0 animate-marquee gap-5 pl-5 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {loop.map((r, i) => (
            <ReviewCard key={`${r.name}-${i}`} name={r.name} text={r.text} />
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <a
          href={CONTACT.reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-secondary hover:underline"
        >
          Ver todas las reseñas en Google →
        </a>
      </div>
    </section>
  );
}
