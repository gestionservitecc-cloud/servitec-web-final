import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  alternates: { canonical: "/condiciones" },
  title: "Condiciones generales",
  description:
    "Política de garantía, plazos, diagnósticos, señas, almacenamiento y condiciones del servicio técnico de ServiTec.",
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export default function CondicionesPage() {
  return (
    <>
      <PageHero
        eyebrow="Legales"
        title="Condiciones generales"
        description="Política de garantía, plazos y condiciones del servicio técnico."
      />

      <section className="container-page py-16 lg:py-20">
        <article className="prose prose-slate mx-auto max-w-3xl dark:prose-invert prose-headings:font-display prose-h2:text-xl prose-h2:mt-10">
          <Notice>
            El cliente acepta los términos y condiciones generales al momento de
            entregar su equipo.
          </Notice>

          <h2>Aceptación de términos</h2>
          <p>
            Las condiciones generales de servicio se encuentran disponibles para
            su lectura en nuestros medios de comunicación. ServiTec se reserva el
            derecho de modificar estas condiciones sin previo aviso para
            satisfacer las necesidades de los clientes y del personal.
          </p>

          <h2>Formas de pago</h2>
          <p>Aceptamos la mayoría de los medios de pago disponibles:</p>
          <ul>
            <li>Efectivo</li>
            <li>Débito</li>
            <li>Crédito</li>
            <li>Transferencias</li>
          </ul>
          <p>
            El descuento aplica únicamente abonando el total en efectivo y/o
            transferencia. ServiTec se reserva el derecho de aceptar pagos con
            tarjeta de crédito.
          </p>

          <h2>Productos nuevos</h2>
          <ul>
            <li>
              Todos los productos comercializados son <strong>nuevos</strong>,
              originales y cuentan con <strong>garantía oficial</strong> según
              marca y producto; la misma se entregará en la orden final.
            </li>
            <li>
              Los precios y promociones son los vigentes al momento de confirmar
              la compra y pueden variar sin previo aviso.
            </li>
            <li>
              La compra queda confirmada una vez <strong>acreditado el pago y
              validado el stock</strong>.
            </li>
            <li>
              En productos solicitados <strong>a pedido</strong>, el pedido se
              procesa una vez abonado el total y el plazo de entrega comienza
              desde la acreditación.
            </li>
            <li>
              El cliente debe verificar modelo, capacidad, color y demás
              características antes de confirmar la compra.
            </li>
            <li>
              La <strong>garantía por fallas de fabricación</strong> se gestiona
              conforme a las condiciones establecidas por el fabricante o
              servicio técnico oficial, sin afectar los derechos legales del
              consumidor.
            </li>
            <li>
              La garantía no cubre daños provocados por golpes, líquidos,
              sobretensión, mal uso, manipulación, modificaciones o daños
              externos.
            </li>
            <li>
              Para realizar una gestión de garantía puede solicitarse
              factura/comprobante, número de serie y accesorios necesarios para
              verificar el funcionamiento.
            </li>
            <li>
              Los plazos de entrega informados son estimados salvo que se indique
              expresamente una fecha determinada.
            </li>
            <li>Todos los pedidos tienen una demora aproximada de hasta 5 días hábiles.</li>
            <li>
              Las imágenes publicadas pueden ser ilustrativas; prevalecen las
              especificaciones de marca, modelo y características indicadas en la
              publicación o pedido.
            </li>
          </ul>

          <h2>Productos reacondicionados</h2>
          <ul>
            <li>
              Los productos reacondicionados son equipos previamente utilizados,
              revisados, testeados y acondicionados para su correcto
              funcionamiento.
            </li>
            <li>Stock en tiempo real.</li>
            <li>El cliente puede realizar una prueba del producto sin compromiso.</li>
            <li>
              El estado estético puede presentar marcas normales de uso, las
              cuales no afectan su funcionamiento.
            </li>
            <li>Cada producto se entrega probado y en correcto funcionamiento.</li>
            <li>
              Los productos reacondicionados cuentan con <strong>3 meses de
              garantía</strong> desde la fecha de entrega.
            </li>
            <li>La garantía cubre fallas de funcionamiento atribuibles al equipo.</li>
            <li>
              La garantía no cubre daños ocasionados por golpes, líquidos,
              humedad, sobretensión, mal uso, manipulación, modificaciones,
              roturas físicas o daños externos.
            </li>
            <li>
              La batería y demás componentes sujetos a desgaste natural podrán
              presentar una capacidad inferior a la de un producto nuevo, acorde
              al uso previo del equipo.
            </li>
            <li>
              Los accesorios y presentación pueden no ser los originales, salvo
              que se indique expresamente lo contrario.
            </li>
            <li>
              El cliente deberá verificar modelo, características y estado
              general del producto al momento de la compra.
            </li>
          </ul>
          <p>
            Puede hacer uso de su garantía desde el sitio oficial del fabricante.
            A continuación le facilitamos los enlaces:
          </p>
          <ul>
            <li><a href="https://www.amd.com/es/support/warranty.html" target="_blank" rel="noreferrer">AMD</a></li>
            <li><a href="https://www.gigabyte.com/ar/Support/Consumer/Warranty" target="_blank" rel="noreferrer">Gigabyte</a></li>
            <li><a href="https://www.lenovo.com/ar/es/servicios/servicios-pc/?orgRef=https%253A%252F%252Fwww.google.com%252F&srsltid=AfmBOoqpdfXyyUWB3psxOK7GUVvmeveGKX5gfVMDVzakQuJRBwijn3Oe" target="_blank" rel="noreferrer">Lenovo</a></li>
            <li><a href="https://www.asus.com/latin/support/" target="_blank" rel="noreferrer">ASUS</a></li>
            <li><a href="https://www.acer.com/ar-es/support" target="_blank" rel="noreferrer">Acer</a></li>
            <li><a href="https://www.hp.com/ar-es/contact-hp/contact.html" target="_blank" rel="noreferrer">HP</a></li>
            <li><a href="https://www.samsung.com/ar/support/warranty/" target="_blank" rel="noreferrer">Samsung</a></li>
          </ul>

          <h2>Diagnósticos e intervenciones</h2>
          <p>
            Al realizar cualquier intervención de sistema y/o hardware, el equipo
            será sometido a pruebas para verificar el estado de las fallas. Todos
            los procedimientos se realizan con herramientas específicas y personal
            capacitado, aunque pueden existir márgenes de error no prevenibles.
          </p>
          <p>
            Los diagnósticos pueden borrar total o parcialmente la información
            almacenada. ServiTec no se responsabiliza por la pérdida de datos. El
            cliente exonera a ServiTec de toda responsabilidad respecto a dicha
            información.
          </p>
          <p>
            Se solicitará clave/pin/patrón con fines estrictamente profesionales
            para diagnóstico y testeo del equipo. En caso de no facilitar acceso,
            podrá realizarse un formateo/restablecimiento de fábrica para
            continuar la reparación.
          </p>

          <h2>Señas y presupuestos</h2>
          <p>
            Para solicitar repuestos se requiere una seña del 50% del valor
            presupuestado (puede variar según stock o inflación). La seña se toma
            con efectivo, débito o transferencia. Con tarjeta de crédito deberá
            abonarse el 100% por adelantado.
          </p>
          <p>
            Diagnósticos pueden demorar hasta 5 días hábiles, reparaciones hasta
            15 días hábiles, y trabajos con importación de repuestos hasta 45 días
            hábiles.
          </p>
          <p>
            ServiTec podrá cobrar un monto fijo por diagnóstico en caso de no
            aceptación del presupuesto o equipo sin reparación.
          </p>

          <h2>Garantías</h2>
          <p>
            La garantía cubre exclusivamente el repuesto instalado por ServiTec y
            tiene una duración de 60 días corridos desde la entrega.
          </p>
          <ul>
            <li>
              No cubre daños físicos, golpes, humedad, calor excesivo o
              intervención de terceros.
            </li>
            <li>No cubre fallas de software ni componentes no reemplazados.</li>
            <li>Las etiquetas de garantía no deben estar alteradas.</li>
          </ul>
          <p>
            Se ofrece un plazo de prueba de 24 horas hábiles desde la entrega para
            verificar el correcto funcionamiento.
          </p>

          <h2>Almacenamiento y abandono</h2>
          <p>
            Los equipos no retirados dentro de los 30 días desde notificada la
            reparación deberán abonar un arancel diario en concepto de almacenaje.
          </p>
          <p>
            Pasados 60 días corridos sin ser retirados, los equipos se
            considerarán abandonados, adquiriendo ServiTec su dominio conforme a
            la normativa vigente.
          </p>

          <h2>Equipos mojados o con intervención</h2>
          <p>
            Equipos con signos de humedad, intervención de terceros o apertura
            previa quedan fuera de garantía. Los trabajos que impliquen exposición
            de placa madre pueden conllevar riesgo de que el equipo no vuelva a
            encender.
          </p>

          <h2>Compra / venta en consignación</h2>
          <p>
            ServiTec ofrece servicio de compra directa o venta en consignación de
            equipos y repuestos.
          </p>
          <ul>
            <li>
              <strong>Compra directa:</strong> se cotiza y abona el monto acordado
              sin reembolso posterior.
            </li>
            <li>
              <strong>Consignación:</strong> comisión del 35% sobre el valor de
              venta o pago de posicionamiento fijo.
            </li>
          </ul>
          <p>
            Publicaciones en plataformas pueden tener demoras de liberación de
            pagos. Pasados 60 días sin concretar la venta, el cliente dispone de
            15 días hábiles para renovar o retirar el equipo.
          </p>

          <Notice>
            Al retirar el equipo reparado deberá abonarse el total del presupuesto
            sin excepción. El cliente acepta las condiciones generales al momento
            de ingresar su equipo.
          </Notice>
        </article>
      </section>
    </>
  );
}
