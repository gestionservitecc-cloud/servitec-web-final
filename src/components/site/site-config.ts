export const CONTACT = {
  whatsapp: "5491124873190",
  whatsappDisplay: "11 2487-3190",
  phoneHref: "tel:+5491124873190",
  instagram: "https://instagram.com/servi.tecbsas",
  address: "Av. García del Río 4001, Saavedra, CABA",
  mapsUrl:
    "https://www.google.com/maps/place/Av.+Garc%C3%ADa+del+R%C3%ADo+4001,+C1430+CABA,+Argentina",
  reviewsUrl: "https://maps.app.goo.gl/t5uqsut8TFLtVH4m9",
};

export const waLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const stockCategories = [
  { label: "Celulares", value: "celular" },
  { label: "Notebooks", value: "notebook" },
  { label: "Tablets", value: "tablet" },
  { label: "Consolas", value: "consola" },
  { label: "PC armada", value: "pc-armada" },
  { label: "TV's", value: "tv" },
];

export const storeCategories = [
  { label: "Equipos", value: "equipos" },
  { label: "PC armadas", value: "pc-armada" },
  { label: "Componentes", value: "componentes" },
  { label: "Accesorios", value: "accesorios" },
];

export const storeEquipmentCategories = stockCategories;

// Sales-first ordering: Inicio → Stock → Tienda → Armá tu PC → Servicios (repair last).
export const primaryNav = [{ label: "Inicio", href: "/" }];

export const secondaryNav = [
  { label: "Armá tu PC", href: "/armar-pc" },
  { label: "Servicios", href: "/servicios" },
];

export const BUSINESS_HOURS = [
  ["Lunes a Jueves", "10:00 – 19:00", "open"],
  ["Viernes", "10:00 – 18:00", "open"],
  ["Sábados", "10:00 – 14:00", "open"],
  ["Domingos", "Cerrado", "closed"],
] as const;
