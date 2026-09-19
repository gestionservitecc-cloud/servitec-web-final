/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getProductShareData, type ProductShareType } from "@/lib/product-share";

export const alt = "Producto ServiTec";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id: rawId } = await params;
  const type: ProductShareType = tipo === "componente" ? "componente" : "equipo";
  const product = await getProductShareData(type, decodeURIComponent(rawId));
  const name = product?.name || "Producto ServiTec";
  const category = product?.category || "Tecnología";

  return new ImageResponse(
    <div style={{ background: "#07101f", color: "white", display: "flex", height: "100%", width: "100%", padding: 52, position: "relative" }}>
      <div style={{ background: "#b01825", borderRadius: 999, height: 360, opacity: 0.3, position: "absolute", right: -100, top: -120, width: 360 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: product?.image ? "53%" : "100%", zIndex: 1 }}>
        <div style={{ color: "#55d1de", display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>SERVITEC · {category}</div>
        <div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#ffffff", display: "flex", fontSize: 66, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>{name}</div><div style={{ color: "#cbd5e1", display: "flex", fontSize: 28, marginTop: 24 }}>Consultá disponibilidad y opciones en ServiTec.</div></div>
        <div style={{ color: "#fda4af", display: "flex", fontSize: 24, fontWeight: 700 }}>servitecbsas.com</div>
      </div>
      {product?.image ? <div style={{ alignItems: "center", background: "white", borderRadius: 32, display: "flex", justifyContent: "center", marginLeft: 44, overflow: "hidden", width: "47%" }}><img src={product.image} alt={name} width="500" height="500" style={{ height: "100%", objectFit: "contain", width: "100%" }} /></div> : null}
    </div>,
    size,
  );
}
