"use client";

import { useEffect, useRef } from "react";

export function HomeVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      const video = videoRef.current;
      if (!video) return;
      video.autoplay = !preference.matches;
      if (preference.matches) video.pause();
      else void video.play().catch(() => { /* Respect browser autoplay restrictions. */ });
    };
    syncPlayback();
    preference.addEventListener("change", syncPlayback);
    return () => preference.removeEventListener("change", syncPlayback);
  }, []);

  return (
    <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" aria-label="Conocé el local de ServiTec" className="aspect-[4/3] w-full bg-slate-900 object-cover">
      <source src="/videos/frente-servitec.mp4" type="video/mp4" />
    </video>
  );
}
