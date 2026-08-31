import type { Metadata } from "next";
import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { CONTACT, waLink } from "@/components/site/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Ubicación, horarios de atención y canales de contacto de ServiTec en Saavedra, CABA.",
};

const hours = [
  ["Lunes a Jueves", "10:00 – 19:00", "open"],
  ["Viernes", "10:00 – 18:00", "open"],
  ["Sábados", "10:00 – 14:00", "open"],
  ["Domingos", "Cerrado", "closed"],
  ["Feriados", "Consultar", "maybe"],
] as const;

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        description="Acercate al local o escribinos por WhatsApp. Presupuestos sin cargo."
      />

      <section className="container-page grid gap-8 py-16 lg:grid-cols-2 lg:py-20">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border shadow-soft">
            <iframe
              src="https://www.google.com/maps?q=Av.+Garc%C3%ADa+del+R%C3%ADo+4001,+Saavedra,+CABA&output=embed"
              title="Mapa de ubicación de ServiTec"
              className="h-[320px] w-full sm:h-[380px]"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ContactCard
              icon={MapPin}
              title="Dirección"
              value={CONTACT.address}
              href={CONTACT.mapsUrl}
              cta="Cómo llegar"
            />
            <ContactCard
              icon={Phone}
              title="Teléfono / WhatsApp"
              value={CONTACT.whatsappDisplay}
              href={waLink("Hola ServiTec, quiero hacer una consulta")}
              cta="Escribir"
            />
            <ContactCard
              icon={Instagram}
              title="Instagram"
              value="@servi.tecbsas"
              href={CONTACT.instagram}
              cta="Seguir"
            />
            <ContactCard
              icon={MessageCircle}
              title="Presupuesto online"
              value="Respuesta en el día"
              href="/presupuesto"
              cta="Pedir presupuesto"
              internal
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-2.5">
              <Clock className="size-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Horarios de atención</h2>
            </div>
            <ul className="mt-5 divide-y">
              {hours.map(([day, time, state]) => (
                <li
                  key={day}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium">{day}</span>
                  <span
                    className={
                      state === "closed"
                        ? "font-semibold text-destructive"
                        : state === "maybe"
                          ? "font-semibold text-amber-600 dark:text-amber-400"
                          : "font-semibold text-whatsapp"
                    }
                  >
                    {time}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-6 w-full gap-2 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
            >
              <a
                href={waLink("Hola ServiTec, quiero coordinar una visita")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Coordinar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  href,
  cta,
  internal = false,
}: {
  icon: typeof MapPin;
  title: string;
  value: string;
  href: string;
  cta: string;
  internal?: boolean;
}) {
  return (
    <a
      href={href}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
      className="group rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      <p className="mt-2 text-xs font-semibold text-primary group-hover:underline">
        {cta} →
      </p>
    </a>
  );
}
