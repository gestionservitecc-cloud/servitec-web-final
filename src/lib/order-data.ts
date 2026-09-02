export type PedidoItem = {
  nombre: string;
  cantidad: number;
  precio: number;
};

export type PedidoStored = {
  id: string;
  numeroPedido: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  items: PedidoItem[];
  total: number;
  createdAt: string;
  origen: "tienda" | "armado";
};

export type ClienteStored = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  createdAt: string;
};

export const formatPedidoNumero = (numeroPedido: number) => `#${numeroPedido.toLocaleString("es-AR")}`;

export const getNextPedidoNumber = (items: Array<{ numeroPedido?: number } | undefined> = []) => {
  const max = items.reduce((acc, item) => Math.max(acc, Number(item?.numeroPedido || 0)), 0);
  return max > 0 ? max + 1 : 10000;
};

export const buildPedidoMessage = ({
  numeroPedido,
  items,
  total,
  nombre,
}: {
  numeroPedido: number;
  items: PedidoItem[];
  total: number;
  nombre?: string;
}) => {
  const lines = [
    "Hola ServiTec, quiero confirmar este pedido.",
    `Pedido ${formatPedidoNumero(numeroPedido)}`,
    nombre ? `Cliente: ${nombre}` : undefined,
    "",
    ...items.map((item) => `${item.cantidad} x ${item.nombre} — $${Number(item.precio || 0).toLocaleString("es-AR")}`),
    "",
    `Total: $${Number(total || 0).toLocaleString("es-AR")}`,
    "Envío: consultar",
  ].filter(Boolean);

  return lines.join("\n");
};

export const pedidoStorageKey = "servitec-pedidos";
export const clienteStorageKey = "servitec-clientes";

export const readStoredPedidos = (): PedidoStored[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(pedidoStorageKey) || "[]");
  } catch {
    return [];
  }
};

export const saveStoredPedidos = (pedidos: PedidoStored[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(pedidoStorageKey, JSON.stringify(pedidos));
};

export const readStoredClientes = (): ClienteStored[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(clienteStorageKey) || "[]");
  } catch {
    return [];
  }
};

export const saveStoredClientes = (clientes: ClienteStored[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(clienteStorageKey, JSON.stringify(clientes));
};
