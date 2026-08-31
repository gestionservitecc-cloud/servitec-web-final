import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  Cpu,
  Fan,
  Gamepad2,
  HardDrive,
  Laptop,
  MessageCircle,
  ScreenShare,
  Smartphone,
  Wrench,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import { waLink } from "@/components/site/site-config";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Reparación de celulares, computadoras y consolas: cambio de pantalla y batería, microsoldadura, armado de PC, upgrades, mantenimiento y reparación de mandos.",
};

const serviceGroups = [
  {
    title: "Celulares",
    description: "Reparamos todas las marcas y también ofrecemos equipos sellados.",
    icon: Smartphone,
    items: [
      [ScreenShare, "Cambio de pantalla", "Reemplazo de display y táctil para todas las marcas."],
      [BatteryCharging, "Cambio de batería", "Baterías de alta calidad con garantía."],
      [Cpu, "Reparación de placa", "Microsoldadura y diagnóstico avanzado de componentes."],
      [Smartphone, "Equipos nuevos", "Celulares sellados de fábrica con garantía oficial."],
    ],
  },
  {
    title: "Computadoras",
    description: "Reparaciones, armado de PC y mantenimiento completo.",
    icon: Laptop,
    items: [
      [Cpu, "Armado de PC a medida", "Configuraciones gaming, oficina y diseño con los mejores componentes."],
      [Laptop, "Reparación de notebooks", "Pantalla, teclado, bisagras, carga y más."],
      [HardDrive, "Upgrade de componentes", "Ampliación de RAM, SSD y optimización de rendimiento."],
      [Fan, "Mantenimiento preventivo", "Limpieza interna, coolers y cambio de pasta térmica."],
    ],
  },
  {
    title: "Consolas",
    description: "Especialistas en PlayStation 4, PlayStation 5 y Xbox.",
    icon: Gamepad2,
    items: [
      [Gamepad2, "Reparación de mandos", "Joysticks, botones y drift de analógicos para PS4, PS5 y Xbox."],
      [Cpu, "Fallas de encendido", "Reparación de fuentes y microsoldadura en placa base."],
      [Fan, "Limpieza y pasta térmica", "Evitá sobrecalentamientos con nuestro service premium."],
      [Wrench, "Diagnóstico general", "Identificamos y solucionamos cualquier falla de tu consola."],
    ],
  },
] as const;

export default function ServiciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Todo lo que hacemos por tus dispositivos"
        description="Celulares, computadoras y consolas. Diagnóstico, reparación y mantenimiento con garantía escrita."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <a
              href={waLink("Hola ServiTec, quiero consultar por los servicios")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> Consultar por WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/presupuesto">Presupuesto online</Link>
          </Button>
        </div>
      </PageHero>

      <section className="container-page space-y-14 py-16 lg:py-24">
        {serviceGroups.map((group) => (
          <Reveal key={group.title}>
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <group.icon className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{group.title}</h2>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>

            <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map(([Icon, title, desc]) => (
                <StaggerItem
                  key={title as string}
                  className="rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft-lg"
                >
                  <Icon className="size-5 text-primary" />
                  <h3 className="mt-3 font-display font-semibold">{title as string}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc as string}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        ))}
      </section>

      <section className="border-t bg-muted/40 py-14">
        <div className="container-page flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-bold">¿Tu equipo necesita atención?</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Escribinos y coordinamos el ingreso. Presupuesto sin cargo y diagnóstico profesional.
          </p>
          <Button asChild size="lg">
            <a
              href={waLink("Hola ServiTec, quiero coordinar el ingreso de un equipo")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Coordinar ingreso <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
