"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./HomeLogo.module.css";

const LogoScene = dynamic(() => import("./HomeLogoScene"), { ssr: false });

export function HomeLogo() {
  const track = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    if (track.current) observer.observe(track.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);

  return (
    <div ref={track} className={styles.track} data-home-logo data-static={!enabled || failed}>
      <div className={styles.stage} role="img" aria-label="Logo de ServiTec">
        {/* The original PNG stays visible until the first successful WebGL frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={512} height={512} className={styles.fallback} />
        {enabled && nearby && !failed && <LogoScene track={track} onError={fail} />}
      </div>
    </div>
  );
}
