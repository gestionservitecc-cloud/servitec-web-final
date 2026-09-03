import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Call internal recompute endpoint; prefer using the request origin, then VERCEL_URL, then NEXT_PUBLIC_BASE_URL
    const adminToken = process.env.ADMIN_CRON_TOKEN || process.env.CRON_SECRET;
    const reqUrl = new URL(request.url);
    // Prefer the Vercel runtime URL, then Host header (actual request host), then NEXT_PUBLIC_BASE_URL, then request origin
    const hostHeader = request.headers.get("host");
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : hostHeader
      ? `${reqUrl.protocol}//${hostHeader}`
      : process.env.NEXT_PUBLIC_BASE_URL || reqUrl.origin;
    console.log("cron: chosen origin", origin);
    const url = new URL("/api/admin/recompute-prices", origin);
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-admin-token": adminToken || "",
      },
      cache: "no-store",
    });
    let body: unknown = null;
    try { body = await resp.json(); } catch (e) { body = await resp.text().catch(() => null); }
    if (!resp.ok) {
      console.error("cron: recompute failed", resp.status, body);
      return new Response(JSON.stringify({ error: "recompute_failed", status: resp.status, body }), { status: 502, headers: { "Content-Type": "application/json" } });
    }
    return NextResponse.json({ ok: true, result: body }, { status: 200 });
  } catch (e) {
    console.error("cron error", e);
    return new Response(JSON.stringify({ error: "internal_error", message: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
