import Layout from "@/components/Layout";

const FormasPago = () => (
  <Layout>
    <section className="bg-gradient-to-br from-foreground to-foreground/95 py-20 text-background">
      <div className="container max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold">Formas de Pago</h1>
        <p className="mt-4 text-lg text-background/70">
          Opciones de pago disponibles para servicios y repuestos.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto max-w-4xl px-4 text-slate-700">
        <div className="space-y-5">
          <p>Aceptamos la mayoría de los medios de pago disponibles:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Efectivo</strong> (con descuento especial)</li>
            <li>Débito</li>
            <li>Crédito</li>
            <li>Transferencias</li>
          </ul>
          <p>
            El descuento aplica únicamente abonando el total en efectivo y/o transferencia. ServiTec se reserva el derecho de aceptar
            pagos con tarjeta de crédito, según corresponda al servicio o producto.
          </p>
        </div>
      </div>
    </section>
  </Layout>
);

export default FormasPago;
