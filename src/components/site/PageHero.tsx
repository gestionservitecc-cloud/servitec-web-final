import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedSectionBackground, type AnimatedBackgroundOptions } from "./AnimatedSectionBackground";

export function PageHero({ eyebrow, title, description, children, className, align = "left", fullWidth = false, background }: {
  eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode;
  className?: string; align?: "center" | "left"; fullWidth?: boolean;
  background?: AnimatedBackgroundOptions;
}) {
  const content = (
    <div className={cn("container-page py-9 sm:py-12", fullWidth && "max-w-none", align === "center" && "text-center")}>
      {eyebrow && <p className={cn("eyebrow", background ? "text-red-300" : "text-primary")}>{eyebrow}</p>}
      <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {description && <p className={cn("mt-3 max-w-2xl text-sm leading-relaxed sm:text-base", background ? "text-slate-300" : "text-muted-foreground")}>{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
  const sectionClass = cn("border-b", background ? "bg-sidebar text-sidebar-foreground" : "text-foreground", className);
  return background
    ? <AnimatedSectionBackground {...background} className={sectionClass}>{content}</AnimatedSectionBackground>
    : <section className={sectionClass}>{content}</section>;
}
