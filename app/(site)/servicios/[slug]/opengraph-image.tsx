import { ImageResponse } from "next/og";
import { getService } from "@/content/services";

export const alt = "Servicio técnico ServiTec";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ServiceOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const service = getService((await params).slug);
  const name = service?.shortTitle || "Servicio técnico";
  const description = service?.description || "Diagnóstico y reparación con garantía.";

  return new ImageResponse(
    <div style={{ alignItems: "stretch", background: "#07101f", color: "white", display: "flex", height: "100%", overflow: "hidden", padding: 56, position: "relative", width: "100%" }}>
      <div style={{ background: "#1698aa", borderRadius: 999, height: 520, opacity: 0.35, position: "absolute", right: -180, top: -150, width: 520 }} />
      <div style={{ background: "#b01825", borderRadius: 999, bottom: -180, height: 400, left: -160, opacity: 0.3, position: "absolute", width: 400 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", zIndex: 1 }}><div style={{ color: "#55d1de", display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>SERVITEC · SERVICIO TÉCNICO</div><div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}><div style={{ display: "flex", fontSize: 70, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>Reparación de {name}</div><div style={{ color: "#dbeafe", display: "flex", fontSize: 30, lineHeight: 1.3, marginTop: 26 }}>{description}</div></div><div style={{ display: "flex", fontSize: 25, fontWeight: 700 }}>Diagnóstico claro · Garantía escrita · Buenos Aires</div></div>
    </div>,
    size,
  );
}
