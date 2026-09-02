import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const PEDIDOS_PATH = "servitec-data/pedidos.json";
const CLIENTES_PATH = "servitec-data/clientes.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ pedidos: [], clientes: [] }, { status: 200 });
    }

    const [pedidosBlob, clientesBlob] = await Promise.all([
      fetch(`https://blob.vercel-storage.com/${PEDIDOS_PATH}`).catch(() => null),
      fetch(`https://blob.vercel-storage.com/${CLIENTES_PATH}`).catch(() => null),
    ]);

    const pedidos = pedidosBlob && pedidosBlob.ok ? await pedidosBlob.json() : [];
    const clientes = clientesBlob && clientesBlob.ok ? await clientesBlob.json() : [];

    return NextResponse.json({ pedidos, clientes });
  } catch (error) {
    console.error("pedidos: unable to read blob-backed data", error);
    return NextResponse.json({ pedidos: [], clientes: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pedidos = Array.isArray(body?.pedidos) ? body.pedidos : [];
    const clientes = Array.isArray(body?.clientes) ? body.clientes : [];

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, message: "Falta el token de Blob para guardar pedidos." }, { status: 503 });
    }

    if (pedidos.length > 0) {
      await put(PEDIDOS_PATH, JSON.stringify(pedidos, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    }

    if (clientes.length > 0) {
      await put(CLIENTES_PATH, JSON.stringify(clientes, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    }

    return NextResponse.json({ ok: true, pedidos: pedidos.length, clientes: clientes.length });
  } catch (error) {
    console.error("pedidos: unable to persist", error);
    return NextResponse.json({ ok: false, message: "No se pudieron guardar los datos del pedido." }, { status: 500 });
  }
}
