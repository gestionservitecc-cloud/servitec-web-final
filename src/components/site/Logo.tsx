import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="ServiTec — Inicio"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl text-sm font-bold shadow-soft transition-transform group-hover:scale-105",
          invert ? "bg-white text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        ST
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          invert ? "text-white" : "text-foreground",
        )}
      >
        Servi<span className="text-primary">Tec</span>
      </span>
    </Link>
  );
}
