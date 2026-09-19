"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { CONTACT } from "./site-config";
import { reviews } from "@/content/reviews";

function ReviewCard({ name, rating, text }: { name: string; rating: number; text: string }) {
  return (
    <figure className="mx-auto flex min-h-[250px] w-full max-w-2xl flex-col gap-4 rounded-2xl border bg-card p-6 text-left shadow-soft sm:min-h-[230px] sm:p-8">
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" aria-hidden="true" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        “{text}”
      </blockquote>
      <figcaption className="mt-auto text-sm font-semibold">{name}</figcaption>
    </figure>
  );
}

export function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % reviews.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const goTo = (index: number) => {
    setActiveIndex((index + reviews.length) % reviews.length);
  };

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
        <a
          href={CONTACT.reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 transition-colors hover:bg-amber-100"
        >
          <span className="flex gap-0.5 text-amber-500" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-3.5 fill-current" />)}
          </span>
          4.9 en Google Maps
        </a>
      </div>

      <div
        className="relative mx-auto mt-10 max-w-4xl px-12 sm:px-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-roledescription="carrusel"
        aria-label="Opiniones de clientes"
      >
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-0 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background text-foreground shadow-soft transition hover:bg-muted"
          aria-label="Opinión anterior"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div
          className="overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
        >
          <div
            className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div key={review.name} className="w-full shrink-0 px-1">
                <ReviewCard {...review} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-0 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border bg-background text-foreground shadow-soft transition hover:bg-muted"
          aria-label="Opinión siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2" aria-label="Seleccionar opinión">
        {reviews.map((review, index) => (
          <button
            key={review.name}
            type="button"
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all ${activeIndex === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"}`}
            aria-label={`Ver opinión de ${review.name}`}
            aria-current={activeIndex === index ? "true" : undefined}
          />
        ))}
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
