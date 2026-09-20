import { calculateInstallmentPrice } from "./utils";

export type PaymentMethod = "efectivo" | "tarjeta";
export type PricedCartItem = {
  precio: number;
  cantidad: number;
  precioBase?: number;
  paymentMethod?: PaymentMethod;
};

/** Legacy carts remain cash-price carts; explicit selections are never financed twice. */
export function cartItemPrice(item: PricedCartItem, fallback: PaymentMethod = "efectivo") {
  if (item.paymentMethod && item.precioBase === undefined) return item.precio;
  const base = item.precioBase ?? item.precio;
  return (item.paymentMethod ?? fallback) === "tarjeta" ? calculateInstallmentPrice(base) : base;
}

export function cartTotal(items: PricedCartItem[], fallback: PaymentMethod = "efectivo") {
  const fixed = items.filter(item => item.paymentMethod).reduce((sum, item) => sum + cartItemPrice(item) * item.cantidad, 0);
  const pending = items.filter(item => !item.paymentMethod).reduce((sum, item) => sum + (item.precioBase ?? item.precio) * item.cantidad, 0);
  // Preserve the original aggregate rounding for items paid at checkout.
  return fixed + (fallback === "tarjeta" ? calculateInstallmentPrice(pending) : pending);
}
