import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/blue", {
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`DolarAPI respondió ${response.status}`);

    const data = (await response.json()) as { venta?: number };
    const venta = Number(data.venta);
    if (!Number.isFinite(venta) || venta <= 0) throw new Error("Cotización blue inválida");

    const base = Number(process.env.COMPONENTS_BASE_BLUE_RATE) || venta;
    return NextResponse.json({ venta, base });
  } catch (error) {
    console.error("dolar-blue: unable to load quote", error);
    return NextResponse.json({ error: "No se pudo obtener el dólar blue." }, { status: 502 });
  }
}
