import Layout from "@/components/Layout";
import StorageImage from "@/components/StorageImage";

const Conocenos = () => (
  <Layout>
    <section className="bg-gradient-to-br from-foreground to-foreground/95 py-20 text-background">
      <div className="container max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold">Conocenos</h1>
        <p className="mt-4 text-lg text-background/70">
          Transparencia, profesionalismo y atención personalizada en cada servicio.
        </p>
      </div>
    </section>

    <section className="bg-slate-50 py-20 md:py-28 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Nuestra Historia
          </h2>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6 text-sm sm:text-base">
            <div>
              <h3 className="mb-3 font-display text-xl font-bold sm:text-2xl">¿Quiénes somos?</h3>
              <p className="leading-relaxed text-muted-foreground">
                Somos un servicio técnico especializado en reparación de celulares, consolas y computadoras.
                Trabajamos con herramientas profesionales, repuestos de calidad y personal capacitado para garantizar
                resultados confiables.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-display text-xl font-bold sm:text-2xl">¿Qué hacemos?</h3>

              <p className="leading-relaxed text-muted-foreground">
                En ServiTec trabajamos para que sus dispositivos recuperen plenamente su funcionalidad,
                extendiendo su vida útil y devolviéndolos al servicio de sus necesidades diarias.
              </p>

              <p className="leading-relaxed text-muted-foreground">
                Muchas veces creemos que la inversión no justifica reparar un equipo,
                pero en la mayoría de los casos existen soluciones técnicas viables.
              </p>

              <p className="leading-relaxed text-muted-foreground">
                Contamos con capacitación profesional, herramientas adecuadas y experiencia
                para ofrecer diagnósticos precisos y reparaciones confiables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StorageImage
              storagePath="Local1.png"
              alt="Interior del local ServiTec"
              className="h-32 w-full rounded-2xl object-cover transition hover:scale-105 sm:h-40 md:h-48"
              loading="lazy"
              decoding="async"
            />
            <StorageImage
              storagePath="Local2.png"
              alt="Mostrador de atención de ServiTec"
              className="h-32 w-full rounded-2xl object-cover transition hover:scale-105 sm:h-40 md:h-48"
              loading="lazy"
              decoding="async"
            />
            <StorageImage
              storagePath="Local3.png"
              alt="Espacio de trabajo técnico en ServiTec"
              className="h-32 w-full rounded-2xl object-cover transition hover:scale-105 sm:h-40 md:h-48"
              loading="lazy"
              decoding="async"
            />
            <StorageImage
              storagePath="Local4.png"
              alt="Vista general del local ServiTec"
              className="h-32 w-full rounded-2xl object-cover transition hover:scale-105 sm:h-40 md:h-48"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Conocenos;
