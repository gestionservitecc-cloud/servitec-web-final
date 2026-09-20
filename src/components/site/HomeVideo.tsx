"use client";

import { useEffect, useRef } from "react";

export function HomeVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startPlayback = () => {
      const video = videoRef.current;
      if (!video || document.visibilityState === "hidden") return;
      video.muted = true;
      video.defaultMuted = true;
      void video.play().catch(() => { /* Retry when ready, visible or after interaction. */ });
    };
    const video = videoRef.current;
    startPlayback();
    video?.addEventListener("canplay", startPlayback);
    document.addEventListener("visibilitychange", startPlayback);
    document.addEventListener("pointerdown", startPlayback);
    return () => {
      video?.removeEventListener("canplay", startPlayback);
      document.removeEventListener("visibilitychange", startPlayback);
      document.removeEventListener("pointerdown", startPlayback);
    };
  }, []);

  return (
    <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" aria-label="Conocé el local de ServiTec" className="aspect-[4/3] w-full bg-slate-900 object-cover">
      <source src="/videos/frente-servitec.mp4" type="video/mp4" />
    </video>
  );
}
