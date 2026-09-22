"use client";

import { useEffect, useRef } from "react";
import type { gsap as Gsap } from "gsap";
import styles from "./AmbientBackground.module.css";

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let ctx: ReturnType<typeof Gsap.context> | undefined;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;
    void import("@/lib/animations/gsap").then(({ gsap, pageScrollRange }) => {
      if (disposed || !ref.current) return;
      const root = ref.current;
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
          if (conditions?.reduce || !conditions?.desktop) return;
          const lights = root.querySelectorAll("[data-ambient-light]");
          const tween = gsap.fromTo(lights, { x: -20, y: -12, scale: 1 }, {
            x: index => index ? -36 : 48, y: index => index ? 24 : 42, scale: 1.08,
            ease: "none", scrollTrigger: { ...pageScrollRange(), scrub: 0.25 },
          });
          const resize = new ResizeObserver(() => tween.scrollTrigger?.refresh());
          resize.observe(document.body);
          return () => resize.disconnect();
        });
      }, root);
    }).catch(() => {});
    return () => { disposed = true; mm?.revert(); ctx?.revert(); };
  }, []);
  return <div ref={ref} className={styles.ambient} aria-hidden="true" data-ambient-background>
    <span className={styles.blue} data-ambient-light />
    <span className={styles.cyan} data-ambient-light />
  </div>;
}
