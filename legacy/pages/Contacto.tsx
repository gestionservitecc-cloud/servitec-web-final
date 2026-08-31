import Layout from "@/components/Layout";

const Contacto = () => (
  <Layout>
    <section className="bg-gradient-to-br from-foreground to-foreground/95 py-20 text-background">
      <div className="container max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold">Contacto</h1>
        <p className="mt-4 text-lg text-background/70">
          Encontranos en nuestra ubicación y escribinos por WhatsApp.
        </p>
      </div>
    </section>

    <section className="bg-slate-50 py-16 dark:bg-zinc-900 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl font-bold md:text-3xl">¿Dónde nos ubicamos?</h3>
            </div>

            <div className="overflow-hidden rounded-2xl shadow-xl h-[320px] w-full sm:h-[380px] md:h-[420px]">
              <iframe
                src="https://www.google.com/maps?q=Av.+García+del+Río+4001,+Saavedra,+CABA&output=embed"
                className="h-full w-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Mapa de ubicación de ServiTec"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-display text-2xl font-bold md:text-3xl">Horarios de Atención</h3>

            <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800 md:p-8">
              <div className="space-y-6 text-sm font-medium sm:text-base">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Lunes a Jueves</span>
                  <span className="font-semibold text-green-500">10:00 - 19:00</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Viernes</span>
                  <span className="font-semibold text-green-500">10:00 - 18:00</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Sábados</span>
                  <span className="font-semibold text-green-500">10:00 - 14:00</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Domingos</span>
                  <span className="font-semibold text-red-500">Cerrado</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>Feriados</span>
                  <span className="font-semibold text-orange-500">Consultar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Contacto;
