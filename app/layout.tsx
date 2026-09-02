import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { getAssetUrl } from "@/lib/asset-url";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://servitec-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ServiTec — Equipos, PC a medida y componentes en CABA",
    template: "%s · ServiTec",
  },
  description:
    "Comprá notebooks, celulares y PC armadas con stock real. Armá tu PC a medida, sumá componentes y accesorios. Y si algo falla, servicio técnico con garantía escrita. Saavedra, CABA.",
  keywords: [
    "comprar notebook",
    "PC armada",
    "armar PC",
    "PC gamer",
    "componentes de PC",
    "accesorios de computación",
    "servicio técnico",
    "reparación celulares",
    "Saavedra",
    "CABA",
  ],
  authors: [{ name: "ServiTec" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "ServiTec",
    title: "ServiTec — Comprá, armá y potenciá tu tecnología",
    description:
      "Notebooks, celulares y PC armadas con stock real. Configurá tu PC a medida y sumá accesorios. Servicio técnico con garantía escrita.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiTec — Equipos, PC a medida y componentes",
    description:
      "Comprá equipos con stock real, armá tu PC y sumá accesorios. Servicio técnico con garantía escrita en CABA.",
  },
  icons: {
    icon: getAssetUrl("favicon.png"),
    apple: getAssetUrl("favicon.png"),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
