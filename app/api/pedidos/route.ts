import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getNextPedidoNumber } from "@/lib/order-data";

const PEDIDOS_PATH = "servitec-data/pedidos.json";
const CLIENTES_PATH = "servitec-data/clientes.json";

export const dynamic = "force-dynamic";

type StoredOrder = {
  id: string;
  numeroPedido: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  total: number;
  formaPago?: "efectivo" | "tarjeta";
  createdAt: string;
  origen: "tienda" | "armado";
};

type StoredClient = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  createdAt: string;
};

const text = (value: unknown, max = 160) => String(value || "").trim().slice(0, max);

async function readPrivateJson<T>(path: string, fallback: T): Promise<T> {
  const blob = await get(path, { access: "private" }).catch(() => null);
  if (!blob) return fallback;
  const payload = await new Response(blob.stream).json().catch(() => fallback);
  return payload as T;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ pedidos: [], clientes: [] });

  const [pedidos, clientes] = await Promise.all([
    readPrivateJson<StoredOrder[]>(PEDIDOS_PATH, []),
    readPrivateJson<StoredClient[]>(CLIENTES_PATH, []),
  ]);
  return NextResponse.json({ pedidos, clientes });
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "El almacenamiento no está configurado." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const source = Array.isArray(body?.pedidos) ? body.pedidos[0] : null;
    if (!source || !Array.isArray(source.items) || source.items.length === 0) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const items = source.items.slice(0, 100).map((item: Record<string, unknown>) => ({
      nombre: text(item.nombre, 200),
      cantidad: Math.min(99, Math.max(1, Number(item.cantidad) || 1)),
      precio: Math.max(0, Number(item.precio) || 0),
    })).filter((item: { nombre: string }) => item.nombre);
    if (items.length === 0) return NextResponse.json({ error: "El pedido no contiene productos válidos." }, { status: 400 });

    const nombre = text(source.nombre, 80);
    const apellido = text(source.apellido, 80);
    const dni = text(source.dni, 40);
    const email = text(source.email, 160).toLowerCase();
    const telefono = text(source.telefono, 60);
    const direccion = text(source.direccion, 240);
    if (!nombre || !apellido || !dni || !/^\S+@\S+\.\S+$/.test(email) || !telefono || !direccion) {
      return NextResponse.json({ error: "Datos del cliente incompletos." }, { status: 400 });
    }

    const pedidos = await readPrivateJson<StoredOrder[]>(PEDIDOS_PATH, []);
    const clientes = await readPrivateJson<StoredClient[]>(CLIENTES_PATH, []);
    const numeroPedido = getNextPedidoNumber(pedidos);
    const createdAt = new Date().toISOString();
    const pedido: StoredOrder = {
      id: `pedido-${crypto.randomUUID()}`,
      numeroPedido,
      nombre,
      apellido,
      dni,
      email,
      telefono,
      direccion,
      items,
      total: Math.max(0, Number(source.total) || 0),
      formaPago: source.formaPago === "tarjeta" ? "tarjeta" : source.formaPago === "efectivo" ? "efectivo" : undefined,
      createdAt,
      origen: source.origen === "armado" ? "armado" : "tienda",
    };
    const cliente: StoredClient = { id: `cliente-${crypto.randomUUID()}`, nombre, apellido, dni, email, telefono, direccion, createdAt };

    await Promise.all([
      put(PEDIDOS_PATH, JSON.stringify([...pedidos, pedido], null, 2), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }),
      put(CLIENTES_PATH, JSON.stringify([...clientes.filter((item) => item.dni !== dni && item.email !== email), cliente], null, 2), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }),
    ]);
    return NextResponse.json({ ok: true, numeroPedido });
  } catch (error) {
    console.error("pedidos: unable to persist validated order", error);
    return NextResponse.json({ error: "No se pudo guardar el pedido." }, { status: 500 });
  }
}
