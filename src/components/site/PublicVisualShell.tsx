"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GlobalAmbientBackground } from "./GlobalAmbientBackground";

export function PublicVisualShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const internal = pathname === "/admin" || pathname.startsWith("/admin/");
  return <div className={internal ? undefined : "public-visual-shell"}>
    {!internal && <GlobalAmbientBackground />}
    <div className={internal ? undefined : "public-content"}>{children}</div>
  </div>;
}
