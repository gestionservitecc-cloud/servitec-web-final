"use client";

import Link from "next/link";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./AnimatedButton.module.css";

type Props = ButtonProps & { label?: string; hoverLabel?: string; href?: string; icon?: ReactNode; external?: boolean };

export function AnimatedButton({ label, hoverLabel, href, icon, variant = "default", size = "lg", className, external = false, asChild, children, ...props }: Props) {
  const resolved = Children.toArray(children);
  const child = asChild && isValidElement<{ children?: ReactNode }>(resolved[0]) ? resolved[0] : null;
  const nodes = Children.toArray(child ? child.props.children : children);
  const isIcon = (node: ReactNode) => isValidElement<{ className?: string; size?: number }>(node) && (node.props.size || /(?:size-|h-4|w-4)/.test(node.props.className || ""));
  const symbol = icon || nodes.find(isIcon);
  const text = label || nodes.filter(node => !isIcon(node));
  const content = <>
    <span className={styles.fills} aria-hidden="true"><i /><i /><i /></span>
    <span className={styles.window}>
      <span className={styles.labels}><span>{text}</span><span aria-hidden="true">{hoverLabel || text}</span></span>
    </span>
    {symbol && <span className={styles.icon} aria-hidden="true"><span>{symbol}</span><span>{symbol}</span></span>}
  </>;
  const classes = cn(styles.button, className);
  const attributes = { ...props, "data-animated-button": "", "data-variant": variant, "data-size": size };
  if (href || child) return <Button {...attributes} asChild variant={variant} size={size} className={classes}>
    {child ? cloneElement(child as ReactElement<{ children?: ReactNode }>, undefined, content) : external
      ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
      : <Link href={href!}>{content}</Link>}
  </Button>;
  return <Button {...attributes} variant={variant} size={size} className={classes}>{content}</Button>;
}
