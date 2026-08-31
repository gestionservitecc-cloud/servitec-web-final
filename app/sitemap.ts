import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://servitec-web.vercel.app";

const routes = [
  "",
  "/servicios",
  "/armar-pc",
  "/tienda",
  "/stock",
  "/conocenos",
  "/contacto",
  "/faqs",
  "/formas-de-pago",
  "/condiciones",
  "/presupuesto",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/stock" || path === "/tienda" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
