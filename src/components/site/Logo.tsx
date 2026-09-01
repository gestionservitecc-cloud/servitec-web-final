import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAssetUrl } from "@/lib/asset-url";

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
          "grid h-9 w-9 place-items-center overflow-hidden rounded-xl shadow-soft transition-transform group-hover:scale-105",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("logo.png")}
          alt=""
          className="h-full w-full object-contain"
        />
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
