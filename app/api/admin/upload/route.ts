import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Falta conectar Vercel Blob para subir imágenes." },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen supera los 8 MB." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const pathname = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await put(pathname, file, { access: "private", contentType: file.type });

    return NextResponse.json({ url: `/api/assets/${pathname}` });
  } catch (error) {
    console.error("admin/upload: Blob upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo subir la imagen a Vercel Blob." },
      { status: 502 },
    );
  }
}
