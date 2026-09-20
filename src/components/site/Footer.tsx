import Link from "next/link";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { CONTACT, BUSINESS_HOURS } from "./site-config";

const infoLinks = [
  { label: "FAQs", href: "/faqs" },
  { label: "Formas de pago", href: "/formas-de-pago" },
  { label: "Términos y condiciones", href: "/condiciones" },
  { label: "Política de privacidad", href: "/politica-de-privacidad" },
  {
    label: "Defensa al consumidor",
    href: "https://buenosaires.gob.ar/gcaba_historico/gobierno-y-vinculo-ciudadano/defensa-al-consumidor",
    external: true,
  },
];

const aboutLinks = [
  { label: "Conocenos", href: "/conocenos" },
  { label: "Contacto", href: "/contacto" },
  { label: "Servicios", href: "/servicios" },
  { label: "Armá tu PC", href: "/armar-pc" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-sidebar text-sidebar-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo invert />
          <p className="max-w-xs text-sm leading-relaxed text-sidebar-foreground/70">
            Servicio técnico especializado en reparación de celulares, computadoras
            y consolas con garantía escrita.
          </p>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-sidebar-foreground/80 transition-colors hover:text-white"
          >
            <Instagram className="size-4" />
            @servi.tecbsas
          </a>
        </div>

        <FooterColumn title="Información útil" links={infoLinks} />
        <FooterColumn title="ServiTec" links={aboutLinks} />

        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
            Ubicación y horarios
          </h4>
          <ul className="space-y-3 text-sm text-sidebar-foreground/80">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{CONTACT.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-primary" />
              <a href={CONTACT.phoneHref} className="hover:underline">
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {BUSINESS_HOURS.map(([day, hours]) => <span key={day} className="block">{day}: {hours}</span>)}
              </span>
            </li>
          </ul>
          <a
            href={CONTACT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-secondary hover:underline"
          >
            Ver en Google Maps →
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-sidebar-foreground/50 sm:flex-row">
          <p>© {new Date().getFullYear()} ServiTec. Todos los derechos reservados.</p>
          <p>Saavedra · Ciudad Autónoma de Buenos Aires</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
        {title}
      </h4>
      <nav className="flex flex-col gap-2.5 text-sm text-sidebar-foreground/80">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
