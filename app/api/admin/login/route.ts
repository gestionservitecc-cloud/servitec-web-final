import { NextResponse } from "next/server";
import { adminConfigured, checkPassword, createSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "El panel no está configurado. Falta la variable ADMIN_PASSWORD." },
      { status: 503 },
    );
  }
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!checkPassword(String(password || ""))) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  await createSessionCookie();
  return NextResponse.json({ ok: true });
}
