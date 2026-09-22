"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Reveal on scroll, with a visible fallback so an observer failure never hides
 * a complete section from the page.
 */
function useReveal(rootMargin = "-80px") {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, {
    once: true,
    margin: rootMargin as never,
  });
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForced(true), 900);
    return () => clearTimeout(t);
  }, []);

  return { ref, show: inView || forced };
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  as = "div",
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: ElementType;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const { ref } = useReveal();
  const MotionTag = (motion[as as "div"] ?? motion.div) as typeof motion.div;

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref } = useReveal("-60px");

  return (
    <motion.div
      ref={ref as never}
      className={className}
      initial="show"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Restrained hover/tap feedback for the existing cards and CTAs. */
export function Pressable({
  children,
  className,
  lift = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  lift?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      tabIndex={-1}
      whileHover={reduce ? undefined : lift ? { y: -4 } : { scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "tween", duration: 0.22, ease }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
