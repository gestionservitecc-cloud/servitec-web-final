import { NextResponse } from "next/server";
import { adminConfigured, checkPassword, createSessionCookie } from "@/lib/auth";
import { getClientIp, isLoginLocked, registerLoginFailure, registerLoginSuccess } from "@/lib/login-guard";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "El panel no está configurado. Falta la variable ADMIN_PASSWORD." },
      { status: 503 },
    );
  }
  const ip = getClientIp(req);
  const lock = isLoginLocked(ip);
  if (lock.locked) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(lock.retryAfterSeconds) } },
    );
  }
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!(await checkPassword(String(password || "")))) {
    registerLoginFailure(ip);
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  registerLoginSuccess(ip);
  await createSessionCookie();
  return NextResponse.json({ ok: true });
}
