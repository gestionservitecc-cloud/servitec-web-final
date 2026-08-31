import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BatteryCharging,
  Cpu,
  Fan,
  Gamepad2,
  HardDrive,
  Laptop,
  ScreenShare,
  Smartphone,
  Wrench,
} from "lucide-react";
import StorageImage from "@/components/StorageImage";

const serviceGroups = [
  {
    title: "Celulares",
    description:
      "Reparamos todas las marcas y también ofrecemos equipos sellados.",
    icon: Smartphone,
    items: [
      [
        ScreenShare,
        "Cambio de pantalla",
        "Reemplazo de display y táctil para todas las marcas.",
      ],
      [
        BatteryCharging,
        "Cambio de batería",
        "Baterías originales y de alta calidad con garantía.",
      ],
      [
        Cpu,
        "Reparación de placa",
        "Microsoldadura y diagnóstico avanzado de componentes.",
      ],
      [
        Smartphone,
        "Equipos nuevos",
        "Celulares sellados de fábrica con garantía oficial.",
      ],
    ],
  },
  {
    title: "Computadoras",
    description: "Reparaciones, armado de PC y mantenimiento completo.",
    icon: Laptop,
    items: [
      [
        Cpu,
        "Armado de PC a medida",
        "Configuraciones gaming, oficina y diseño con los mejores componentes.",
      ],
      [
        Laptop,
        "Reparación de notebooks",
        "Pantalla, teclado, bisagras, carga y más.",
      ],
      [
        HardDrive,
        "Upgrade de componentes",
        "Ampliación de RAM, SSD y optimización de rendimiento.",
      ],
      [
        Fan,
        "Mantenimiento preventivo",
        "Limpieza interna, coolers y cambio de pasta térmica.",
      ],
    ],
  },
  {
    title: "Consolas",
    description: "Especialistas en PlayStation 4, PlayStation 5 y Xbox.",
    icon: Gamepad2,
    items: [
      [
        Gamepad2,
        "Reparación de mandos",
        "Joysticks, botones y drift de analógicos para PS4, PS5 y Xbox.",
      ],
      [
        Cpu,
        "Fallas de encendido",
        "Reparación de fuentes y microsoldadura en placa base.",
      ],
      [
        Fan,
        "Limpieza y pasta térmica",
        "Evitá sobrecalentamientos con nuestro service premium.",
      ],
      [
        Wrench,
        "Diagnóstico general",
        "Identificamos y solucionamos cualquier falla de tu consola.",
      ],
    ],
  },
] as const;

const Servicios = () => (
  <Layout>
      <section className="relative overflow-hidden py-24 text-white">
        <StorageImage
          storagePath="BAN-IN.png"
          alt="Banner Servicios"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-slate-950/60" />
      <div className="container relative z-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          Servicios
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
          Todo lo que podemos hacer por tus celulares, computadoras y consolas.
        </p>
      </div>
    </section>

    <section className="py-12 sm:py-16">
      <div className="container grid gap-8 lg:grid-cols-3">
        {serviceGroups.map((group) => (
          <article key={group.title}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <group.icon size={24} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {group.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {group.items.map(([Icon, title, description]) => (
                <Card key={title}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <Icon size={20} className="mt-1 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-display font-semibold">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="container mt-10 text-center">
        <Button asChild>
          <a
            href="https://wa.me/5491124873190?text=Hola,%20quiero%20consultar%20por%20los%20servicios"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar servicios <ArrowRight size={18} />
          </a>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Servicios;
