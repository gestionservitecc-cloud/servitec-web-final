import type { MetadataRoute } from "next";
import { services } from "@/content/services";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.servitecbsas.com";

const routes = [
  "",
  "/servicios",
  "/armar-pc",
  "/tienda",
  "/reacondicionados",
  "/conocenos",
  "/contacto",
  "/faqs",
  "/formas-de-pago",
  "/condiciones",
  "/presupuesto",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [...routes, ...services.map((service) => `/servicios/${service.slug}`)].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/reacondicionados" || path === "/tienda" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
