import Link from "next/link";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./AnimatedButton.module.css";

export function AnimatedButton({ label, hoverLabel = label, href, icon, variant, size = "lg", className, external = false }: {
  label: string; hoverLabel?: string; href: string; icon?: ReactNode;
  variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string; external?: boolean;
}) {
  const content = <>
    <span className={styles.window} aria-hidden="true">
      <span className={styles.labels}><span>{label}</span><span>{hoverLabel}</span></span>
    </span>
    {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
  </>;
  return <Button asChild variant={variant} size={size} className={cn(styles.button, className)}>
    {external
      ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{content}</a>
      : <Link href={href} aria-label={label}>{content}</Link>}
  </Button>;
}
