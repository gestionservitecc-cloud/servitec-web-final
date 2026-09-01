import { getAssetUrl } from "@/lib/asset-url";

const MAP: Record<string, string> = {};

/**
 * Resolves a legacy Firebase Storage asset name (e.g. "BAN-IN.png",
 * "ARMADOS/PC-GAMER.png") to its local /img path. Falls back to the raw value
 * so already-local ("/img/..") and remote ("https://..") URLs pass through.
 */
export function asset(name: string): string {
  if (!name) return "";
  if (name.startsWith("/") || /^(?:https?:|data:|blob:)/i.test(name)) return name;
  return MAP[name] || getAssetUrl(name);
}
