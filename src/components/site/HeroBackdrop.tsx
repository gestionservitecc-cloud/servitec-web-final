"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Animated decorative glow orbs for the hero. Purely aesthetic. */
export function HeroBackdrop() {
  const reduce = useReducedMotion();

  const orbs = [
    {
      className: "-left-32 top-4 h-72 w-72 bg-primary/30",
      anim: { x: [0, 30, 0], y: [0, -20, 0] },
      duration: 14,
    },
    {
      className: "right-[-6rem] top-24 h-64 w-64 bg-secondary/25",
      anim: { x: [0, -24, 0], y: [0, 24, 0] },
      duration: 18,
    },
    {
      className: "left-1/3 bottom-[-4rem] h-56 w-56 bg-primary/20",
      anim: { x: [0, 18, 0], y: [0, 12, 0] },
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
