"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { gsap as Gsap } from "gsap";
import styles from "./GlobalAmbientBackground.module.css";

export function GlobalAmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    let disposed = false;
    let ctx: ReturnType<typeof Gsap.context> | undefined;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;
    void import("@/lib/animations/gsap").then(({ gsap, pageScrollRange }) => {
      if (disposed || !ref.current) return;
      const root = ref.current;
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        mm.add({ desktop: "(min-width: 1024px)", small: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
          if (conditions?.reduce) return;
          const small = conditions?.small;
          const layers = root.querySelectorAll<HTMLElement>("[data-ambient-layer]");
          const loops = Array.from(layers).slice(0, small ? 2 : 3).map((layer, index) => gsap.fromTo(layer,
            { xPercent: [-4, 3, -2][index], yPercent: [2, -3, 1][index], scale: 1 },
            { xPercent: small ? 2 : [5, -4, 3][index], yPercent: small ? -2 : [-4, 4, -5][index], scale: small ? 1.03 : 1.08,
              duration: [19, 27, 23][index], repeat: -1, yoyo: true, ease: "sine.inOut" }));
          const scroll = gsap.fromTo(root.querySelector("[data-ambient-field]"), { y: 0, x: 0 }, {
            y: small ? -12 : -40, x: small ? 5 : 20, ease: "none",
            scrollTrigger: { ...pageScrollRange(), scrub: .8 },
          });
          const resize = new ResizeObserver(() => scroll.scrollTrigger?.refresh());
          resize.observe(document.body);
          const visibility = () => loops.forEach(loop => loop.paused(document.hidden));
          document.addEventListener("visibilitychange", visibility);
          visibility();
          return () => { resize.disconnect(); document.removeEventListener("visibilitychange", visibility); };
        });
      }, root);
    }).catch(() => {});
    return () => { disposed = true; mm?.revert(); ctx?.revert(); };
  }, []);
  const quiet = pathname === "/contacto" || pathname === "/presupuesto";
  return <div ref={ref} className={styles.ambient} data-global-ambient data-quiet={quiet} aria-hidden="true">
    <div className={styles.field} data-ambient-field>
      <span className={styles.ice} data-ambient-layer />
      <span className={styles.teal} data-ambient-layer />
      <span className={styles.blue} data-ambient-layer />
    </div>
  </div>;
}
