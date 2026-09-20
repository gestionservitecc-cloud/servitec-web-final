import { cartItemPrice, type PricedCartItem } from "./cart-pricing";
import type { Equipo, Producto } from "./types";
import type { CatalogProduct } from "./pc-catalog";

export type RefreshableCartItem = PricedCartItem & {
  id: string; nombre: string; productId?: string; productType?: string;
  stock?: number; unavailable?: boolean;
};

export function checkCartQuantities<T extends RefreshableCartItem>(items: T[]): (T & { unavailable: boolean })[] {
  return items.map(item => {
    const quantity = items.filter(other => (other.productId || other.id) === (item.productId || item.id) && other.productType === item.productType).reduce((sum, other) => sum + other.cantidad, 0);
    return { ...item, unavailable: item.stock !== undefined ? quantity > item.stock : Boolean(item.unavailable) };
  });
}

export function refreshCart<T extends RefreshableCartItem>(items: T[], equipos: Equipo[], productos: Producto[], components: CatalogProduct[]): (T & { unavailable: boolean })[] {
  return checkCartQuantities(items.map(item => {
    const id = item.productId || item.id;
    const equipment = equipos.find(row => String(row.id) === id);
    const component = components.find(row => String(row.id) === id);
    const accessory = productos.find(row => String(row.id) === id);
    // Explicit type disambiguates any IDs shared by different collections.
    const record = item.productType === "equipo" ? equipment : item.productType === "componente" ? component : item.productType === "producto" ? accessory : equipment || component || accessory;
    if (!record) return { ...item, stock: 0, unavailable: true };
    const isEquipment = record === equipment;
    const base = isEquipment ? Number(equipment.promo || equipment.original || 0) : record === component ? Math.round(Number(component.precio || 0) * 1.08) : Number(accessory.precio || 0);
    const stock = base <= 0 || (isEquipment && equipment.estado === "vendido") ? 0 : typeof record.stock === "number" ? record.stock : undefined;
    const unavailable = base <= 0 || (isEquipment && equipment.estado === "vendido") || stock === 0 || (stock !== undefined && item.cantidad > stock);
    const updated = { ...item, precioBase: base, stock, unavailable };
    return { ...updated, precio: cartItemPrice(updated) };
  }));
}
