"use client";

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

type CartItem = { id: string; nombre: string; precio: number; imagen?: string; cantidad: number };

const readCart = (): CartItem[] => {
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
};

export function GlobalCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLockBodyScroll(open || checkoutOpen);

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

  const totalItems = items.reduce((total, item) => total + (item.cantidad || 0), 0);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.precio || 0) * item.cantidad, 0), [items]);
  const pedidoNumero = useMemo(() => getNextPedidoNumber(readStoredPedidos()), [items.length]);
  const changeQuantity = (id: string, delta: number) =>
    writeCart(
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        const quantity = item.cantidad + delta;
        return quantity > 0 ? [{ ...item, cantidad: quantity }] : [];
      }),
    );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
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
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Carrito">
            <div className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <p className="eyebrow">Tu seleccion</p>
                  <h2 className="font-display text-xl font-bold">Carrito</h2>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar carrito">
                  <X className="size-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                {items.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">Tu carrito esta vacio.</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-3 rounded-xl border p-3">
                        <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-white p-1.5">
                          {item.imagen && <img src={item.imagen} alt="" className="h-full w-full object-contain" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">{money(item.precio)} c/u</p>
                          <p className="text-sm font-bold text-primary">{money(item.precio * item.cantidad)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 self-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
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
                            className="size-7"
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
                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCheckoutOpen(true);
                  }}
                  disabled={!items.length}
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
        items={items.map((item) => ({ nombre: item.nombre, cantidad: item.cantidad, precio: item.precio }))}
        total={total}
        numeroPedido={pedidoNumero}
        origen="tienda"
      />
    </>
  );
}
