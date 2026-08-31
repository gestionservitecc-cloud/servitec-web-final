import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";

const Presupuesto = () => (
  <Layout>
    {/* Header */}
    <section className="bg-gradient-to-br from-primary to-emerald-600 py-20 text-white">
      <div className="container max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          Presupuesto Online
        </h1>
        <p className="mt-4 text-lg text-white/80">
          Contanos qué necesitás y te respondemos a la brevedad.
        </p>
      </div>
    </section>

    {/* Formulario */}
    <section className="relative py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container max-w-lg">
        <div className="rounded-3xl bg-background p-8 shadow-2xl shadow-primary/10 backdrop-blur">

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const msg = `Hola, soy ${fd.get("nombre")}. Quiero presupuesto para mi ${fd.get("dispositivo")}: ${fd.get("problema")}`;
              window.open(
                `https://wa.me/5491124873190?text=${encodeURIComponent(msg)}`,
                "_blank"
              );
            }}
          >
            <Input
              name="nombre"
              placeholder="Tu nombre"
              required
              className="h-12 rounded-xl"
            />

            <Input
              name="dispositivo"
              placeholder="Dispositivo (ej: iPhone 14, PS5, Notebook)"
              required
              className="h-12 rounded-xl"
            />

            <Textarea
              name="problema"
              placeholder="Describí brevemente el problema o lo que necesitás"
              rows={5}
              required
              className="rounded-xl"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:shadow-emerald-500/50"
            >
              Enviar por WhatsApp <MessageCircle size={18} className="ml-2" />
            </Button>
          </form>

        </div>
      </div>
    </section>
  </Layout>
);

export default Presupuesto;
