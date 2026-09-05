import Link from "next/link";
import { ArrowUpRight, Radio, Sparkles } from "lucide-react";
import { Reveal } from "./motion";

/** Visual campaign banner. Product and pricing data remain in their existing flows. */
export function CyberMondayBanner() {
  return (
    <section className="cyber-campaign-banner border-b" aria-label="Campaña CyberMonday">
      <div className="container-page flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-3">
        <Reveal className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="cyber-campaign-icon" aria-hidden="true">
            <Radio className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="size-3.5 text-cyan-300" />
              CyberMonday
              <span className="cyber-live-dot" aria-hidden="true" />
              Evento activo
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Tecnología, stock real y asesoramiento para elegir mejor.
            </p>
          </div>
        </Reveal>
        <Link
          href="/stock"
          className="cyber-campaign-link inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-cyan-200 sm:self-auto"
        >
          Explorar oportunidades <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
