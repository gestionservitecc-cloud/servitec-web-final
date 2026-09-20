import type { Equipo } from "./types";

// The equipment admin controls availability through estado. Its legacy draft
// includes stock: 0 even for available equipment; no quantity field is exposed.
export function equipmentStock(equipment: Pick<Equipo, "estado" | "stock">): number | undefined {
  if (equipment.estado === "vendido") return 0;
  return typeof equipment.stock === "number" && equipment.stock > 0 ? equipment.stock : undefined;
}
