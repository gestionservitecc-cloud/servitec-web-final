import { describe, expect, it } from "vitest";
import { cartTotal } from "./cart-pricing";

describe("cart payment contracts", () => {
  it("preserves quantities and the card selection without financing twice", () => {
    expect(cartTotal([{ precio: 10000, precioBase: 7500, paymentMethod: "tarjeta", cantidad: 2 }], "tarjeta")).toBe(20000);
  });
  it("supports old carts and mixed explicit selections", () => {
    expect(cartTotal([{ precio: 7500, cantidad: 2 }], "tarjeta")).toBe(20000);
    expect(cartTotal([{ precio: 7500, paymentMethod: "efectivo", cantidad: 1 }, { precio: 10000, precioBase: 7500, paymentMethod: "tarjeta", cantidad: 1 }])).toBe(17500);
  });
  it("recalculates from an updated base with existing rounding", () => {
    expect(cartTotal([{ precio: 10000, precioBase: 7501, paymentMethod: "tarjeta", cantidad: 1 }])).toBe(10002);
    expect(cartTotal([{ precio: 7501, cantidad: 2 }], "tarjeta")).toBe(20003);
  });
});
