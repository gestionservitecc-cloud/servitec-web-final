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
 * Reveal on scroll, with a safety timeout: if the IntersectionObserver never
 * fires (odd embeds / prerender quirks) the content still shows after 900ms.
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
  initiallyVisible = false,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: ElementType;
  className?: string;
  initiallyVisible?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  const { ref, show } = useReveal();
  const MotionTag = (motion[as as "div"] ?? motion.div) as typeof motion.div;

  if (reduce) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...(rest as object)}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial={initiallyVisible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      animate={initiallyVisible || show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
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
  initiallyVisible = false,
}: {
  children: ReactNode;
  className?: string;
  initiallyVisible?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, show } = useReveal("-60px");

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref as never}
      className={className}
      initial={initiallyVisible ? "show" : "hidden"}
      animate={initiallyVisible || show ? "show" : "hidden"}
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
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Springy hover/tap wrapper for cards and CTAs. */
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
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={lift ? { y: -4 } : { scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
