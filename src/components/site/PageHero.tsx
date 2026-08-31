"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  const reduce = useReducedMotion();
  const item = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease, delay },
        };

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-white/5 bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] surface-grid"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        animate={reduce ? undefined : { x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, -20, 0], y: [0, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className={cn(
          "container-page relative py-16 sm:py-20 md:py-24",
          align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        )}
      >
        {eyebrow ? (
          <motion.p className="eyebrow mb-4 text-primary/90" {...item(0)}>
            {eyebrow}
          </motion.p>
        ) : null}
        <motion.h1
          className="font-display text-3xl font-bold leading-tight text-balance sm:text-4xl md:text-5xl"
          {...item(0.06)}
        >
          {title}
        </motion.h1>
        {description ? (
          <motion.p
            className={cn(
              "mt-4 text-base text-sidebar-foreground/70 sm:text-lg",
              align === "center" && "mx-auto max-w-2xl",
            )}
            {...item(0.12)}
          >
            {description}
          </motion.p>
        ) : null}
        {children ? (
          <motion.div className="mt-8" {...item(0.18)}>
            {children}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
