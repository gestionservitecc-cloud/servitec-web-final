"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Lightweight decorative layers for the Halloween hero. */
export function HalloweenBackdrop() {
  const reduce = useReducedMotion();
  const particles = Array.from({ length: 12 });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="halloween-grid absolute inset-0" />
      <motion.div
        className="halloween-moon absolute -right-16 top-10 size-48 rounded-full sm:right-[8%] sm:top-16 sm:size-64"
        animate={reduce ? undefined : { y: [0, -10, 0], opacity: [0.78, 0.95, 0.78] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="halloween-fog halloween-fog--one absolute -bottom-12 -left-20 h-40 w-[130%]"
        animate={reduce ? undefined : { x: [0, 30, 0], scaleX: [1, 1.04, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="halloween-fog halloween-fog--two absolute bottom-10 -right-20 h-32 w-[120%]"
        animate={reduce ? undefined : { x: [0, -24, 0], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      {particles.map((_, index) => (
        <span
          key={index}
          className="halloween-particle absolute"
          style={{
            left: `${8 + ((index * 37) % 86)}%`,
            top: `${14 + ((index * 29) % 72)}%`,
            animationDelay: `${(index % 5) * -0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
