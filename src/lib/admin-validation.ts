import { z } from "zod";

const finiteMoney = z.number().finite().nonnegative();
const shortText = (max: number) => z.string().max(max);

export const productoAdminSchema = z.object({
  id: z.string().min(1).max(200),
  nombre: shortText(240),
  categoria: shortText(100),
  precio: finiteMoney,
  precioCosto: finiteMoney,
  stock: z.number().finite().int().nonnegative(),
  imagen: shortText(1200),
}).strict();

const equipoComponentSchema = z.object({
  key: shortText(100),
  label: shortText(160),
  nombre: shortText(240),
  detalle: shortText(1000),
  imagen: shortText(1200),
  precio: finiteMoney.nullable(),
  cantidad: z.number().finite().int().positive(),
}).strict();

export const equipoAdminSchema = z.object({
  id: z.string().min(1).max(200),
  orden: z.number().finite(),
  categoria: shortText(100),
  nombre: shortText(240),
  marca: shortText(160),
  modelo: shortText(240),
  detail: shortText(2000),
  notasPrivadas: shortText(2000).optional(),
  condition: z.enum(["Sellado", "Reacondicionado"]),
  estado: shortText(40),
  original: finiteMoney,
  promo: finiteMoney,
  recomendada: z.boolean(),
  warranty: shortText(160).default(""),
  imagenes: z.array(shortText(1200)).max(3).default([]),
  specs: z.record(shortText(100), shortText(1000)).default({}),
  componentes: z.array(equipoComponentSchema).max(100).default([]),
  stock: z.number().finite().int().nonnegative().optional(),
  precioCosto: finiteMoney.optional(),
  originalCatalogPrice: finiteMoney.optional(),
  esNuevo: z.boolean().optional(),
  monedaCosto: z.enum(["ARS", "USD"]).optional(),
  costoBaseUsd: finiteMoney.optional(),
  cotizacionDolar: finiteMoney.optional(),
  costoActualizadoEn: shortText(80).optional(),
}).strict();

export function parseAdminProductos(value: unknown) {
  return z.array(productoAdminSchema).max(10000).safeParse(value);
}

export function parseAdminEquipos(value: unknown) {
  return z.array(equipoAdminSchema).max(10000).safeParse(value);
}

export function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Datos inválidos.";
}
