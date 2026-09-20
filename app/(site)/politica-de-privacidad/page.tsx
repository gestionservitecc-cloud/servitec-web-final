import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  alternates: { canonical: "/politica-de-privacidad" },
  title: "Política de privacidad",
  description:
    "Conocé cómo ServiTec trata la información personal que recibimos a través de nuestro sitio web.",
};

export default function PoliticaDePrivacidadPage() {
  return (
    <>
      <PageHero
        eyebrow="Legales"
        title="Política de privacidad"
        description="Información sobre el tratamiento de los datos personales que nos compartís al usar nuestro sitio."
      />

      <section className="container-page py-16 lg:py-20">
        <article className="prose prose-slate mx-auto max-w-3xl dark:prose-invert prose-headings:font-display prose-h2:mt-10 prose-h2:text-xl">
          <p>
            Esta Política de Privacidad explica cómo ServiTec recopila, utiliza y
            protege la información personal que nos proporcionás al utilizar este
            sitio web. Al navegar o completar nuestros formularios, aceptás las
            prácticas descriptas a continuación.
          </p>

          <h2>Información que recopilamos</h2>
          <p>
            Podemos solicitar datos como nombre, teléfono, correo electrónico,
            dirección y detalles del pedido, cuando sean necesarios para responder
            una consulta, preparar un presupuesto, procesar una compra, coordinar
            una entrega o emitir una factura. También podemos recopilar información
            técnica y estadística sobre el uso del sitio mediante cookies.
          </p>

          <h2>Cómo usamos la información</h2>
          <p>Usamos los datos únicamente para:</p>
          <ul>
            <li>Responder consultas y brindar atención al cliente.</li>
            <li>Gestionar presupuestos, compras, pedidos, entregas y facturación.</li>
            <li>Mejorar nuestros productos, servicios y la experiencia en el sitio.</li>
            <li>Cumplir obligaciones legales, contables y fiscales aplicables.</li>
          </ul>
          <p>
            No vendemos ni cedemos datos personales a terceros para fines ajenos a
            estas finalidades, salvo que exista consentimiento, una obligación legal
            o sea necesario para prestar el servicio solicitado.
          </p>

          <h2>Seguridad de los datos</h2>
          <p>
            Aplicamos medidas razonables para proteger la información personal
            contra accesos no autorizados, pérdida, alteración o divulgación. Sin
            embargo, ningún sistema de transmisión o almacenamiento digital puede
            garantizar seguridad absoluta.
          </p>

          <h2>Cookies</h2>
          <p>
            Las cookies son pequeños archivos que el navegador puede almacenar en
            tu dispositivo. Nos permiten comprender, de forma estadística, cómo se
            utiliza el sitio y mejorar su funcionamiento. Podés aceptar, bloquear o
            eliminar las cookies desde la configuración de tu navegador; si las
            desactivás, algunas funcionalidades podrían no funcionar correctamente.
          </p>

          <h2>Enlaces a sitios de terceros</h2>
          <p>
            El sitio puede incluir enlaces a páginas de terceros. Al acceder a ellas,
            se aplicarán sus propias políticas de privacidad y condiciones. ServiTec
            no controla ni es responsable por el tratamiento de datos que realicen
            esos sitios.
          </p>

          <h2>Tus derechos sobre los datos personales</h2>
          <p>
            Podés solicitar acceso, actualización, rectificación o eliminación de
            tus datos personales, de acuerdo con la normativa aplicable, incluida la
            Ley 25.326 de Protección de los Datos Personales. Para realizar una
            solicitud, comunicate a través de nuestra página de contacto e indicá
            los datos necesarios para identificar tu consulta.
          </p>
          <p>
            <Link href="/contacto">Ir a contacto</Link>
          </p>

          <h2>Actualizaciones de esta política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad cuando cambien nuestros
            servicios, prácticas o requisitos legales. La versión vigente será la
            publicada en esta página.
          </p>
        </article>
      </section>
    </>
  );
}
