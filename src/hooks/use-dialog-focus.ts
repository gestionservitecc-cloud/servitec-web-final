"use client";

import { useEffect, useRef } from "react";

/** Keyboard containment and focus restoration for the existing portal dialogs. */
export function useDialogFocus(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('button, input, a[href], [tabindex="0"]')?.focus();
    });
    const handle = (event: KeyboardEvent) => {
      const dialog = ref.current;
      if (!dialog || !dialog.contains(document.activeElement)) return;
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex="0"]')).filter(el => el.getClientRects().length);
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handle);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", handle); previous?.focus(); };
  }, [open]);
  return ref;
}
