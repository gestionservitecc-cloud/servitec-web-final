import { expect, it } from "vitest";
import { refreshCart, checkCartQuantities } from "./cart-refresh";
import type { Equipo } from "./types";

it("propagates price changes, sale state and deleted records without losing quantities/payment", () => {
  const item = { id: "equipo:1:tarjeta", productId: "1", productType: "equipo", nombre: "Notebook", precio: 10000, precioBase: 7500, paymentMethod: "tarjeta" as const, cantidad: 2 };
  const equipment = { id: "1", promo: 15000, stock: 3, estado: "disponible" } as Equipo;
  const updated = refreshCart([item], [equipment], [], [])[0];
  expect(updated).toMatchObject({ precio: 20000, cantidad: 2, paymentMethod: "tarjeta", unavailable: false });
  expect(refreshCart([item], [{ ...equipment, estado: "vendido" }], [], [])[0].unavailable).toBe(true);
  expect(refreshCart([item], [], [], [])[0].unavailable).toBe(true);
  expect(refreshCart([item], [{ ...equipment, stock: 1 }], [], [])[0].unavailable).toBe(true);
});

it("counts the same product across different payment selections", () => {
  const rows = [{ id: "cash", productId: "1", productType: "equipo", nombre: "Equipo", precio: 100, cantidad: 2, stock: 2 }, { id: "card", productId: "1", productType: "equipo", nombre: "Equipo", precio: 134, cantidad: 1, stock: 2 }];
  expect(checkCartQuantities(rows).every(row => row.unavailable)).toBe(true);
  expect(checkCartQuantities(rows.map(row => ({ ...row, cantidad: 1 }))).every(row => !row.unavailable)).toBe(true);
});

it("honors equipment admin state despite legacy zero stock without changing source data", () => {
  const equipment = { id: "legacy", promo: 7500, stock: 0, estado: "disponible" } as Equipo;
  const item = { id: "equipo:legacy", productId: "legacy", productType: "equipo", nombre: "Equipo", precio: 7500, cantidad: 1, stock: 0, unavailable: true };
  expect(refreshCart([item], [equipment], [], [])[0]).toMatchObject({ unavailable: false, stock: undefined, precio: 7500 });
  expect(equipment.stock).toBe(0);
  expect(refreshCart([item], [{ ...equipment, estado: "vendido" }], [], [])[0].unavailable).toBe(true);
  const accessory = { ...equipment, precio: 7500 };
  expect(refreshCart([{ ...item, productType: "producto" }], [], [accessory as never], [])[0].unavailable).toBe(true);
  expect(refreshCart([{ ...item, productType: "componente" }], [], [], [accessory as never])[0].unavailable).toBe(true);
});
