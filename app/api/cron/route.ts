import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Call internal recompute endpoint; pass admin token if available
    const adminToken = process.env.ADMIN_CRON_TOKEN || process.env.CRON_SECRET;
    const url = new URL("/api/admin/recompute-prices", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-admin-token": adminToken || "",
      },
      // no-store to force fresh
      cache: "no-store",
    });
    const body = await resp.json().catch(() => null);
    return NextResponse.json({ ok: true, result: body }, { status: resp.status });
  } catch (e) {
    console.error("cron error", e);
    return new Response("Error", { status: 500 });
  }
}
