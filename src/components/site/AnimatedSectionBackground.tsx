"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { gsap as Gsap } from "gsap";
import { cn } from "@/lib/utils";
import styles from "./AnimatedSectionBackground.module.css";

const motionPresets = {
  servicios: { from: { scale: 1.12, x: -20, y: -10 }, to: { scale: 1.03, x: 20, y: 10 } },
  reacondicionados: { from: { scale: 1.1, x: 20, y: -15 }, to: { scale: 1.02, x: -20, y: 15 } },
  tienda: { from: { scale: 1.12, x: -10, y: -20 }, to: { scale: 1.02, x: 15, y: 20 } },
  nosotros: { from: { scale: 1.08, x: -8, y: -10 }, to: { scale: 1.02, x: 8, y: 10 } },
};

export type AnimatedBackgroundOptions = {
  image: string;
  preset?: keyof typeof motionPresets;
  direction?: "left" | "right";
  /** 0–1: values above 1 are clamped to preserve the subtle movement limits. */
  intensity?: number;
  overlay?: "light-image" | "dark-image" | false;
};

export function AnimatedSectionBackground({
  image, children, direction, intensity = 1, preset = "servicios",
  overlay = "light-image", className,
}: AnimatedBackgroundOptions & { children: ReactNode; className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let active = true;
    let ctx: ReturnType<typeof Gsap.context> | undefined;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;
    // Other PageHero users do not download GSAP for this effect.
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      const section = sectionRef.current;
      const layer = backgroundRef.current;
      if (!active || !section || !layer) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        mm.add({
          desktop: "(min-width: 1024px)",
          tablet: "(min-width: 768px) and (max-width: 1023px)",
          mobile: "(max-width: 767px)",
          reduce: "(prefers-reduced-motion: reduce)",
        }, context => {
          const conditions = context.conditions!;
          if (conditions.reduce) {
            gsap.set(layer, { clearProps: "transform" });
            return;
          }
          const strength = (conditions.desktop ? 1 : conditions.tablet ? 0.7 : 0.5)
            * (Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 1);
          const motion = motionPresets[preset];
          const currentDirection = motion.to.x > motion.from.x ? "right" : "left";
          const sign = direction && direction !== currentDirection ? -1 : 1;
          const values = (point: typeof motion.from) => ({
            scale: 1 + (point.scale - 1) * strength,
            x: point.x * strength * sign,
            y: point.y * strength,
          });
          gsap.fromTo(layer, values(motion.from), {
            ...values(motion.to), ease: "none",
            scrollTrigger: {
              trigger: section, start: "top bottom", end: "bottom top",
              scrub: 1, invalidateOnRefresh: true,
            },
          });
        }, section);
      }, section);
    }).catch(() => { /* Keep the static CSS background if the animation chunk fails. */ });
    return () => { active = false; mm?.revert(); ctx?.revert(); };
  }, [direction, intensity, preset]);

  return (
    <section ref={sectionRef} className={cn(styles.section, className)} data-animated-background={preset}>
      <div ref={backgroundRef} className={styles.background} style={{ backgroundImage: `url(${JSON.stringify(image)})` }} aria-hidden="true" data-background-layer />
      {overlay && <div className={cn(styles.overlay, overlay === "light-image" ? styles.lightImage : styles.darkImage)} aria-hidden="true" />}
      <div className={styles.content}>{children}</div>
    </section>
  );
}
