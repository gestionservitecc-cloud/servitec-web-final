import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob no está configurado." }, { status: 503 });
  }
  const { path } = await params;
  const pathname = path.join("/");
  const normalizedPath = pathname.toLowerCase();
  const allowedPrefix = ["uploads/", "componentes/", "img/", "notebooks_img/"]
    .some((prefix) => normalizedPath.startsWith(prefix));
  const allowedRootAsset = /^(?:logo|favicon)\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(normalizedPath)
    || /^local[1-4]\.png$/i.test(normalizedPath);
  const isImage = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(normalizedPath);
  if (!pathname || pathname.includes("..") || normalizedPath.startsWith("servitec-data/") || (!allowedPrefix && !allowedRootAsset) || !isImage) {
    return NextResponse.json({ error: "Ruta de asset inválida." }, { status: 400 });
  }
  const result = await get(pathname, { access: "private" });
  if (!result) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(result.stream, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Length": String(result.blob.size),
      // Uploaded SVGs must not execute scripts when opened as a document.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
    },
  });
}
