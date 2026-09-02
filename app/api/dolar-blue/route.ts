import { NextResponse } from "next/server";

export const revalidate = 300;

type BluelyticsResponse = {
  blue?: {
    value_buy?: number;
    value_sell?: number;
  };
};

export async function GET() {
  try {
    const response = await fetch("https://api.bluelytics.com.ar/v2/latest", {
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Bluelytics respondió ${response.status}`);

    const data = (await response.json()) as BluelyticsResponse;
    const compra = Number(data.blue?.value_buy);
    const venta = Number(data.blue?.value_sell);
    if (!Number.isFinite(compra) || compra <= 0 || !Number.isFinite(venta) || venta <= 0) {
      throw new Error("Cotización blue inválida");
    }

    const base = compra;
    return NextResponse.json({ compra, venta, base });
  } catch (error) {
    console.error("dolar-blue: unable to load quote", error);
    return NextResponse.json({ error: "No se pudo obtener el dólar blue." }, { status: 502 });
  }
}
