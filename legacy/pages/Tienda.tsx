"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { motion } from "framer-motion";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "../lib/firebase";
import StorageImage from "@/components/StorageImage";
import { calculateNationalPrice, isAccessoryCategoryValue } from "@/lib/utils";
import {
  catalogProductImage,
  componentCatalogLabels,
  componentCatalogSources,
  loadComponentCatalog,
  type ComponentCatalogKey,
} from "@/lib/pc-catalog";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
  precio: number;
  stock: number;
}

interface CartItem extends Producto {
  cantidad: number;
}

const CART_STORAGE_KEY = "servitec-tienda-carrito";

const loadStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) as CartItem[] : [];
  } catch {
    return [];
  }
};

const Tienda = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [componentes, setComponentes] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"" | "asc" | "desc">("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [carrito, setCarrito] = useState<CartItem[]>(loadStoredCart);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [searchParams] = useSearchParams();
  const tipoTienda = searchParams.get("tipo") === "componentes" ? "componentes" : "accesorios";

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    setCategoriaFiltro("");
  }, [tipoTienda]);

  useEffect(() => {
    if (tipoTienda === "componentes") {
      setLoading(true);
      void loadComponentCatalog().then((catalog) => {
        const items = Object.entries(catalog).flatMap(([key, products]) =>
          products.map((product, index) => ({
            id: `${key}-${index}-${product.nombre}`,
            nombre: product.nombre,
            categoria: componentCatalogLabels[key as ComponentCatalogKey],
            imagen: catalogProductImage(product, componentCatalogSources[key as ComponentCatalogKey]),
            precio: Number(product.precio || 0),
            stock: 1,
          })),
        );
        setComponentes(items);
        setLoading(false);
      }).catch(() => {
        setComponentes([]);
        setLoading(false);
      });
      return;
    }

    setLoading(true);
    const stockQuery = query(collection(db, "stock"), orderBy("nombre"));
    const unsub = onSnapshot(stockQuery, (querySnapshot) => {
      const items = querySnapshot.docs
        .map((stockDoc) => ({
          id: stockDoc.id,
          ...stockDoc.data(),
        }))
        .filter((producto) => isAccessoryCategoryValue(String((producto as Producto).categoria ?? ""))) as Producto[];

      setProductos(items);
      setLoading(false);
    });

    return () => unsub();
  }, [tipoTienda]);

  const productosActuales = tipoTienda === "componentes" ? componentes : productos;
  const categoriasDisponibles = useMemo(
    () => [...new Set(productosActuales.map((producto) => producto.categoria || "Sin categoría"))]
      .sort((a, b) => a.localeCompare(b, "es")),
    [productosActuales],
  );

  const productosFiltrados = useMemo(() => {
    const lista = productosActuales.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      && (!categoriaFiltro || (p.categoria || "Sin categoría") === categoriaFiltro)
    );

    if (orden === "asc") {
      lista.sort((a, b) => a.precio - b.precio);
    }

    if (orden === "desc") {
      lista.sort((a, b) => b.precio - a.precio);
    }

    return lista;
  }, [productosActuales, busqueda, orden, categoriaFiltro]);

  const productosAgrupados = useMemo(
    () =>
      Array.from(
        productosFiltrados.reduce((mapa, producto) => {
          const lista = mapa.get(producto.categoria) ?? [];
          lista.push(producto);
          mapa.set(producto.categoria, lista);
          return mapa;
        }, new Map<string, Producto[]>())
      ),
    [productosFiltrados]
  );

  const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0);
  const totalCarrito = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((actual) => {
      const existente = actual.find((item) => item.id === producto.id);
      if (existente) return actual.map((item) => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      return [...actual, { ...producto, cantidad: 1 }];
    });
  };
  const cambiarCantidad = (id: string, cambio: number) => {
    setCarrito((actual) => actual.flatMap((item) => {
      if (item.id !== id) return [item];
      const cantidad = item.cantidad + cambio;
      return cantidad > 0 ? [{ ...item, cantidad }] : [];
    }));
  };
  const iniciarPedido = () => {
    const detalle = carrito.map((item) => `${item.cantidad} x ${item.nombre} - $${(item.precio * item.cantidad).toLocaleString("es-AR")}`).join("\n");
    const mensaje = `Hola ServiTec, quiero realizar este pedido:\n${detalle}\n\nTotal final: $${totalCarrito.toLocaleString("es-AR")}\nEnvío: Consultar`;
    window.open(`https://wa.me/5491124873190?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <section className="relative overflow-hidden py-24 text-white">
        <StorageImage
          storagePath="BAN-IN.png"
          alt="Banner Tienda"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="container relative z-10 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Tienda</h1>
          <p className="mt-4 text-base text-background/70 sm:text-lg">Stock actualizado en tiempo real.</p>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 py-20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="container">
          <div className="mb-5 flex justify-end">
            <Button type="button" onClick={() => setCarritoAbierto(true)} className="relative gap-2 bg-primary text-primary-foreground hover:bg-primary/90" aria-label={`Abrir carrito, ${totalArticulos} artículos`}>
              <ShoppingCart size={18} /> Carrito
              {totalArticulos > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{totalArticulos}</span>}
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl sm:p-8 dark:border-zinc-700 dark:bg-zinc-900/90">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/10" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-500/10" />

            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full rounded-xl border border-slate-300 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800 md:w-auto">
              {[
                ["accesorios", "Accesorios"],
                ["componentes", "Componentes"],
              ].map(([value, label]) => (
                <a
                  key={value}
                  href={`/tienda?tipo=${value}`}
                  className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition md:flex-none ${tipoTienda === value ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-950 dark:text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </a>
              ))}
            </div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 md:max-w-sm"
              aria-label="Buscar producto por nombre"
            />

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:w-auto"
              aria-label="Filtrar productos por categoría"
            >
              <option value="">Todas las categorías</option>
              {categoriasDisponibles.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as "" | "asc" | "desc")}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:w-auto"
              aria-label="Ordenar productos por precio"
            >
              <option value="">Ordenar</option>
              <option value="asc">Precio menor a mayor</option>
              <option value="desc">Precio mayor a menor</option>
            </select>
          </div>

          {loading && (
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          )}

          {!loading && productosAgrupados.length === 0 && (
            <p className="text-center text-muted-foreground">No hay productos encontrados.</p>
          )}

          {!loading &&
            productosAgrupados.map(([categoria, productosDeCategoria]) => (
              <div key={categoria} className="mb-16">
                <h2 className="mb-8 inline-flex rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-xl font-bold text-slate-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                  {categoria}
                </h2>

                <motion.div
                  layout
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {productosDeCategoria.map((producto) => (
                      <motion.div
                        key={producto.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="group overflow-hidden border-slate-200 bg-white/90 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-900/90">
                          {producto.imagen && (
                            <div className="flex h-52 w-full items-center justify-center bg-white p-3 dark:bg-white">
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            </div>
                          )}

                          <CardContent className="p-6">
                            <h3 className="text-lg font-semibold">{producto.nombre}</h3>

                            {tipoTienda === "accesorios" && (producto.stock === 0 ? (
                              <p
                                className="mt-2 text-xl font-extrabold uppercase tracking-wide text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                aria-label="Sin stock"
                              >
                                Sin stock
                              </p>
                            ) : (
                              <div className="mt-3 space-y-1">
                                <p className="text-xl font-bold text-primary">
                                  ${producto.precio.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Precio sin impuestos nac. ${calculateNationalPrice(producto.precio).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  En stock
                                </p>
                              </div>
                            ))}

                            {tipoTienda === "componentes" && (
                              <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Precio
                                </p>
                                <p className="text-xl font-bold text-primary">
                                  ${producto.precio.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Precio sin impuestos nac. ${calculateNationalPrice(producto.precio).toLocaleString()}
                                </p>
                              </div>
                            )}

                            <Button
                              type="button"
                              onClick={() => agregarAlCarrito(producto)}
                              size="sm"
                              disabled={tipoTienda === "accesorios" && producto.stock === 0}
                              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <ShoppingCart size={16} className="mr-2" />
                              Añadir al carrito
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {carritoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-zinc-700">
              <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Tu selección</p><h2 id="cart-title" className="text-2xl font-bold">Carrito</h2></div>
              <button type="button" onClick={() => setCarritoAbierto(false)} aria-label="Cerrar carrito" className="rounded-full p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5">
              {carrito.length === 0 ? <p className="py-12 text-center text-muted-foreground">Tu carrito está vacío.</p> : <div className="space-y-3">
                {carrito.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-700">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2 dark:bg-white"><img src={item.imagen} alt="" className="h-full w-full object-contain" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.nombre}</p><p className="text-sm text-muted-foreground">${item.precio.toLocaleString("es-AR")} c/u</p><p className="font-bold text-primary">${(item.precio * item.cantidad).toLocaleString("es-AR")}</p></div>
                  <div className="flex items-center gap-2 self-center"><button type="button" onClick={() => cambiarCantidad(item.id, -1)} aria-label={`Quitar una unidad de ${item.nombre}`} className="rounded border p-1"><Minus size={14} /></button><span className="min-w-5 text-center text-sm font-bold">{item.cantidad}</span><button type="button" onClick={() => cambiarCantidad(item.id, 1)} aria-label={`Agregar una unidad de ${item.nombre}`} className="rounded border p-1"><Plus size={14} /></button></div>
                </div>)}
              </div>}
            </div>
            <div className="border-t border-slate-200 p-5 dark:border-zinc-700"><div className="flex items-center justify-between"><span className="text-muted-foreground">Total final</span><strong className="text-2xl font-black text-orange-500">${totalCarrito.toLocaleString("es-AR")}</strong></div><p className="mt-1 text-xs text-muted-foreground">Envío: Consultar</p><Button type="button" onClick={iniciarPedido} disabled={carrito.length === 0} className="mt-4 w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">Iniciar pedido</Button></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Tienda;
