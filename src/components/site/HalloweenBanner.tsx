import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Reveal } from "./motion";

/** Visual campaign banner. It does not alter product, price, or stock data. */
export function HalloweenBanner() {
  return (
    <section className="halloween-campaign-banner border-b" aria-label="Campaña de Halloween">
      <div className="container-page flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-3">
        <Reveal className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="halloween-campaign-icon" aria-hidden="true">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
              Halloween tech
              <span className="halloween-live-dot" aria-hidden="true" />
              Experiencia especial
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Tecnología, misterio y asesoramiento para elegir mejor.
            </p>
          </div>
        </Reveal>
        <Link
          href="/stock"
          className="halloween-campaign-link inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-orange-200 sm:self-auto"
        >
          Explorar el stock <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
