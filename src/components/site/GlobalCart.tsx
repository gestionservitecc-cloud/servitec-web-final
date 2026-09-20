"use client";

import { refreshCart, checkCartQuantities, type RefreshableCartItem } from "@/lib/cart-refresh";
import Link from "next/link";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PedidoCheckoutModal } from "@/components/shared/PedidoCheckoutModal";
import { getNextPedidoNumber, readStoredPedidos } from "@/lib/order-data";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";

const CART_KEY = "servitec-tienda-carrito";
const CART_EVENT = "servitec-cart-updated";
const money = (value: number) => `$${Number(value || 0).toLocaleString("es-AR")}`;

type CartItem = RefreshableCartItem & { id: string; nombre: string; precio: number; imagen?: string; cantidad: number; precioBase?: number; paymentMethod?: "efectivo" | "tarjeta" };

const readCart = (): CartItem[] => {
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === "string" && item.cantidad > 0 && Number.isFinite(item.precio)) : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
};

export function GlobalCart() {
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLockBodyScroll(open || checkoutOpen);
  const dialogRef = useDialogFocus(open, () => setOpen(false));

  useEffect(() => {
    // Portal hydration must start only after the browser document exists.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const openCart = async () => {
    setOpen(true);
    setCheckError("");
    const current = readCart();
    if (!current.length) return;
    setChecking(true);
    try {
      const equipmentNeeded = current.some(item => !item.productType || item.productType === "equipo");
      const componentNeeded = current.some(item => !item.productType || item.productType === "componente");
      const accessoryNeeded = current.some(item => !item.productType || item.productType === "producto");
      const read = async (url: string) => { const response = await fetch(url, { cache: "no-store" }); if (!response.ok) throw new Error(); return response.json(); };
      const [equipos, components, productos] = await Promise.all([
        equipmentNeeded ? read("/api/equipos") : [], componentNeeded ? read("/api/componentes") : { catalog: {} }, accessoryNeeded ? read("/api/productos") : [],
      ]);
      // Re-read to preserve edits made while the request was pending.
      writeCart(refreshCart(readCart(), equipos, productos, Object.values(components.catalog || {}).flat() as never[]));
    } catch { setCheckError("No pudimos verificar los precios y la disponibilidad. Cerrá y volvé a abrir el carrito para reintentar."); }
    finally { setChecking(false); }
  };
  const totalItems = items.reduce((total, item) => total + (item.cantidad || 0), 0);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0), [items]);
  const pedidoNumero = useMemo(() => getNextPedidoNumber(readStoredPedidos()), [items.length]);
  const changeQuantity = (id: string, delta: number) =>
    writeCart(
      checkCartQuantities(items.flatMap((item) => {
        if (item.id !== id) return [item];
        const quantity = item.cantidad + delta;
        return quantity > 0 ? [{ ...item, cantidad: quantity, unavailable: item.stock !== undefined ? item.stock < quantity : item.unavailable }] : [];
      })),
    );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void openCart()}
        className="relative gap-2"
        aria-label={`Abrir carrito, ${totalItems} articulos`}
      >
        <ShoppingCart className="size-4" />
        <span className="hidden sm:inline">Carrito</span>
        {totalItems > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-secondary-foreground">
            {totalItems}
          </span>
        )}
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div ref={dialogRef} className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Carrito">
            <div className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <p className="eyebrow">Tu selección</p>
                  <h2 className="font-display text-xl font-bold">Carrito</h2>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar carrito">
                  <X className="size-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                <p role="status" className="mb-4 text-xs text-muted-foreground">{checking ? "Verificando precios y disponibilidad…" : checkError || "Precios verificados al abrir el carrito."}</p>
                {items.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">Tu carrito está vacáo.</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-3 rounded-xl border p-3">
                        <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-white p-1.5">
                          {item.imagen && <img src={item.imagen} alt="" className="h-full w-full object-contain" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 break-words text-sm font-semibold">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">{money(item.precio)} c/u</p>
                          {item.unavailable && <p className="text-xs font-semibold text-destructive">No disponible en esta cantidad. Reducí la cantidad o quitá el artículo.</p>}
                          <p className="text-sm font-bold text-primary">{money(item.precio * item.cantidad)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 self-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label="Quitar una unidad"
                          >
                            {item.cantidad === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                          </Button>
                          <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label="Agregar una unidad"
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <strong className="font-display text-2xl font-bold">{money(total)}</strong>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Coordinamos disponibilidad y entrega por WhatsApp. No se realiza un pago online.</p>
                <Link href="/tienda" onClick={() => setOpen(false)} className="mt-3 block text-sm font-semibold text-primary underline">Seguir comprando</Link>
                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCheckoutOpen(true);
                  }}
                  disabled={!items.length || checking || Boolean(checkError) || items.some(item => item.unavailable)}
                  className="mt-4 w-full gap-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                >
                  <ShoppingCart className="size-4" /> Iniciar pedido por WhatsApp
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <PedidoCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        numeroPedido={pedidoNumero}
        origen="tienda"
      />
    </>
  );
}
