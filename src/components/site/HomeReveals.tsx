"use client";

import { useEffect, useRef } from "react";
import type { gsap as Gsap } from "gsap";

export function HomeReveals() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let disposed = false;
    let ctx: ReturnType<typeof Gsap.context> | undefined;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;
    void import("@/lib/animations/gsap").then(({ gsap }) => {
      const root = marker.current?.parentElement;
      if (disposed || !root) return;
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        mm.add({ desktop: "(min-width: 1024px)", small: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
          if (conditions?.reduce) return;
          root.querySelectorAll<HTMLElement>("[data-premium-reveal]").forEach(element => {
            gsap.fromTo(element, { opacity: .65, y: conditions?.desktop ? 18 : 8 }, {
              opacity: 1, y: 0, duration: conditions?.desktop ? .8 : .45, ease: "power3.out",
              clearProps: "opacity,transform",
              scrollTrigger: { trigger: element, start: "top 94%", once: true },
            });
          });
        });
      }, root);
    }).catch(() => {});
    return () => { disposed = true; mm?.revert(); ctx?.revert(); };
  }, []);
  return <span ref={marker} hidden />;
}
