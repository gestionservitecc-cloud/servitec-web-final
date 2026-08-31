import Layout from "@/components/Layout";

const Condiciones = () => (
  <Layout>
    <section className="bg-gradient-to-br from-foreground to-foreground/95 py-20 text-background">
      <div className="container max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold">Condiciones Generales</h1>
        <p className="mt-4 text-lg text-background/70">Política de garantía, plazos y condiciones del servicio técnico.</p>
      </div>
    </section>

 <section className="py-16">
  <div className="container prose prose-neutral mx-auto max-w-2xl">

    <h2 className="font-display">Aceptación de Términos</h2>
    <p className="font-bold text-red-600 uppercase tracking-wide mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
      ACLARACIÓN: El cliente acepta los términos y condiciones generales al momento de entregar su equipo.
    </p>
    <p>
      Las condiciones generales de servicio se encuentran disponibles para su lectura en nuestros medios de comunicación. 
      ServiTec se reserva el derecho de modificar estas condiciones sin previo aviso para satisfacer las necesidades de los clientes y del personal.
    </p>

    <h2 className="font-display">Formas de Pago</h2>
    <p>Aceptamos la mayoría de los medios de pago disponibles:</p>
    <ul>
      <li><strong>Efectivo</strong> (con gran descuento)</li>
      <li>Débito</li>
      <li>Crédito</li>
      <li>Transferencias</li>
    </ul>
    <p>
      El descuento aplica únicamente abonando el total en efectivo y/o transferencia.
      ServiTec se reserva el derecho de aceptar pagos con tarjeta de crédito.
    </p>

    <h2 className="font-bold text-red-600 uppercase tracking-wide">Diagnósticos e Intervenciones</h2>
    <p className="font-display text-red-600 tracking-wide">
      Al realizar cualquier intervención de sistema y/o hardware, el equipo será sometido a pruebas para verificar el estado de las fallas.
      Todos los procedimientos se realizan con herramientas específicas y personal capacitado, aunque pueden existir márgenes de error no prevenibles.
    </p>
    <p className="font-display text-red-600 tracking-wide">
      Los diagnósticos pueden borrar total o parcialmente la información almacenada. ServiTec no se responsabiliza por la pérdida de datos.
      El cliente exonera a ServiTec de toda responsabilidad respecto a dicha información.
    </p>
    <p className="font-display text-red-600 tracking-wide">
      Se solicitará clave/pin/patrón con fines estrictamente profesionales para diagnóstico y testeo del equipo.
      En caso de no facilitar acceso, podrá realizarse un formateo/restablecimiento de fábrica para continuar la reparación.
    </p>

    <h2 className="font-display">Señas y Presupuestos</h2>
    <p>
      Para solicitar repuestos se requiere una seña del 50% del valor presupuestado (puede variar según stock o inflación).
      La seña se toma con efectivo, débito o transferencia.
      Con tarjeta de crédito deberá abonarse el 100% por adelantado.
    </p>
    <p>
      Diagnósticos pueden demorar hasta 5 días hábiles, reparaciones hasta 15 días hábiles,
      y trabajos con importación de repuestos hasta 45 días hábiles.
    </p>
    <p>
      ServiTec podrá cobrar un monto fijo por diagnóstico en caso de no aceptación del presupuesto o equipo sin reparación.
    </p>

    <h2 className="font-display">Garantías</h2>
    <p>
      La garantía cubre exclusivamente el repuesto instalado por ServiTec y tiene una duración de 60 días corridos desde la entrega.
    </p>
    <ul>
      <li>No cubre daños físicos, golpes, humedad, calor excesivo o intervención de terceros.</li>
      <li>No cubre fallas de software ni componentes no reemplazados.</li>
      <li>Las etiquetas de garantía no deben estar alteradas.</li>
    </ul>
    <p>
      Se ofrece un plazo de prueba de 3 días hábiles desde la entrega para verificar el correcto funcionamiento.
    </p>

    <h2 className="font-display">Almacenamiento y Abandono</h2>
    <p>
      Los equipos no retirados dentro de los 30 días desde notificada la reparación deberán abonar un arancel diario en concepto de almacenaje.
    </p>
    <p>
      Pasados 60 días corridos sin ser retirados, los equipos se considerarán abandonados,
      adquiriendo ServiTec su dominio conforme a la normativa vigente.
    </p>

    <h2 className="font-display">Equipos Mojados o con Intervención</h2>
    <p>
      Equipos con signos de humedad, intervención de terceros o apertura previa quedan fuera de garantía.
      Los trabajos que impliquen exposición de placa madre pueden conllevar riesgo de que el equipo no vuelva a encender.
    </p>

    <h2 className="font-display">Compra / Venta en Consignación</h2>
    <p>
      ServiTec ofrece servicio de compra directa o venta en consignación de equipos y repuestos.
    </p>
    <ul>
      <li><strong>Compra directa:</strong> Se cotiza y abona el monto acordado sin reembolso posterior.</li>
      <li><strong>Consignación:</strong> Comisión del 35% sobre el valor de venta o pago de posicionamiento fijo.</li>
    </ul>
    <p>
      Publicaciones en plataformas pueden tener demoras de liberación de pagos.
      Pasados 60 días sin concretar la venta, el cliente dispone de 15 días hábiles para renovar o retirar el equipo.
    </p>

    <p className="font-bold text-red-600 tracking-wide mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
      ACLARACIÓN: Al retirar el equipo reparado deberá abonarse el total del presupuesto sin excepción.
      El cliente acepta las condiciones generales al momento de ingresar su equipo.
    </p>

  </div>
</section>
  </Layout>
);


export default Condiciones;
