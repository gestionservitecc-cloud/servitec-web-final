import Layout from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Qué clase de equipos reparan?",
    answer:
      "Reparamos celulares, notebooks, PCs, consolas y equipos de oficina en general. También realizamos diagnósticos y mantenimiento preventivo según la necesidad del cliente.",
  },
  {
    question: "¿Cuánto tarda un diagnóstico?",
    answer:
      "Los diagnósticos pueden demorar hasta 5 días hábiles según la complejidad del equipo, la disponibilidad de repuestos y la cantidad de tareas a revisar.",
  },
  {
    question: "¿Qué pasa si no acepto el presupuesto?",
    answer:
      "Si el cliente no acepta la reparación, se puede aplicar un monto fijo por diagnóstico, según el caso y el trabajo realizado para evaluar el equipo.",
  },
  {
    question: "¿Aceptan efectivo, transferencia o tarjeta?",
    answer:
      "Sí. Aceptamos efectivo, transferencia, débito y crédito. El descuento por efectivo/transferencia aplica según el servicio o producto, y las condiciones pueden variar según el caso.",
  },
  {
    question: "¿Cuánto dura la garantía?",
    answer:
      "La garantía cubre exclusivamente el repuesto instalado por ServiTec y tiene una duración de 60 días corridos desde la entrega del equipo reparado.",
  },
  {
    question: "¿Qué pasa si el equipo tiene humedad o intervención previa?",
    answer:
      "Los equipos con signos de humedad, golpes severos o intervención de terceros quedan fuera de garantía y pueden tener riesgos adicionales durante la reparación.",
  },
  {
    question: "¿Necesito dejar la clave del equipo?",
    answer:
      "En muchos casos sí, especialmente para realizar diagnósticos y pruebas de funcionamiento. La clave se usa con fines estrictamente profesionales y para evitar interferencias durante la revisión.",
  },
  {
    question: "¿Qué ocurre si el equipo no se retira?",
    answer:
      "Los equipos no retirados dentro del plazo informado pueden generar costos de almacenamiento, y si pasan un período determinado pueden considerarse abandonados según las condiciones vigentes.",
  },
];

const FAQs = () => (
  <Layout>
    <section className="bg-gradient-to-br from-foreground to-foreground/95 py-20 text-background">
      <div className="container max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold">FAQs</h1>
        <p className="mt-4 text-lg text-background/70">
          Preguntas frecuentes sobre reparaciones, pagos, garantías y atención.
        </p>
      </div>
    </section>

    <section className="bg-slate-50 py-16 dark:bg-slate-900/50 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900/80 sm:p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline dark:text-white sm:text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  </Layout>
);

export default FAQs;
