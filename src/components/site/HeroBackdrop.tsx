"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Animated decorative glow orbs for the hero. Purely aesthetic. */
export function HeroBackdrop() {
  const reduce = useReducedMotion();

  const orbs = [
    {
      className: "-left-20 top-4 h-52 w-52 bg-primary/30 sm:-left-32 sm:h-72 sm:w-72",
      anim: { x: [0, 20, 0], y: [0, -16, 0] },
      duration: 14,
    },
    {
      className: "right-[-3rem] top-20 h-48 w-48 bg-secondary/25 sm:right-[-6rem] sm:top-24 sm:h-64 sm:w-64",
      anim: { x: [0, -18, 0], y: [0, 16, 0] },
      duration: 18,
    },
    {
      className: "left-1/3 bottom-[-3rem] h-44 w-44 bg-primary/20 sm:bottom-[-4rem] sm:h-56 sm:w-56",
      anim: { x: [0, 12, 0], y: [0, 8, 0] },
      duration: 16,
    },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.12] surface-grid" />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          animate={reduce ? undefined : orb.anim}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
