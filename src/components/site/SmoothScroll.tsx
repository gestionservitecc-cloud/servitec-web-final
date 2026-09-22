"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    let started = false;
    const query = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const load = () => {
      if (!query.matches || started || disposed) return;
      started = true;
      void Promise.all([import("lenis"), import("@/lib/animations/gsap")]).then(([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
        if (disposed) return;
        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
          const lenis = new Lenis({
            autoRaf: false, lerp: 0.18, smoothWheel: true, syncTouch: false,
            // Lenis already honors the existing scroll-margin on anchor targets.
            anchors: true, stopInertiaOnNavigate: true,
            prevent: node => Boolean(node.closest('[role="dialog"], [role="listbox"], [data-lenis-prevent]')),
          });
          const update = () => ScrollTrigger.update();
          // One shared clock; absolute time avoids changing GSAP's global lag settings.
          const tick = () => lenis.raf(performance.now());
          lenis.on("scroll", update);
          gsap.ticker.add(tick);
          const syncLock = () => {
            const locked = document.body.style.overflow === "hidden" || document.documentElement.style.overflow === "hidden" || document.hidden;
            if (locked) lenis.stop(); else lenis.start();
          };
          const observer = new MutationObserver(syncLock);
          observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
          observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
          document.addEventListener("visibilitychange", syncLock);
          syncLock();
          return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", syncLock);
            gsap.ticker.remove(tick);
            lenis.off("scroll", update);
            lenis.destroy();
          };
        });
        cleanup = () => mm.revert();
      }).catch(() => { /* Native scroll remains available if the optional chunk fails. */ });
    };
    query.addEventListener("change", load);
    load();
    return () => { disposed = true; query.removeEventListener("change", load); cleanup(); };
  }, [pathname]);
  return null;
}
