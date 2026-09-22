# Corrección del ambiente global y los CTA

## Arquitectura y continuidad

`app/layout.tsx` monta `PublicVisualShell` dentro de Providers. El shell monta una única instancia de `GlobalAmbientBackground` en todas las rutas públicas reales, incluido `/armar-pc`, que está fuera del grupo `(site)`. Se excluyen `/admin` y sus descendientes. Carrito y checkout son diálogos existentes, no rutas nuevas.

El componente no lleva key por pathname y su efecto principal tiene dependencias vacías. Cambiar de ruta modifica únicamente la intensidad mediante un atributo CSS: no remonta las capas ni reinicia sus tiempos. La prueba conserva un ElementHandle y comprueba que sigue conectado al navegar Inicio → Servicios → Contacto → Armá tu PC.

Se eliminó el AmbientBackground exclusivo de Inicio. El hero y header de Inicio vuelven al diseño claro. Los encabezados con fotografías existentes conservan sus imágenes; sus efectos anteriores no sustituyen el campo global. Las superficies grandes claras dejan pasar el ambiente; tarjetas y formularios conservan superficies legibles. El footer conserva su identidad, con transparencia leve.

## Capas y movimiento

1. Base blanca fija y campo ambiental, por debajo del contenido público.
2. Tres campos elípticos grandes, parcialmente fuera del viewport: hielo, teal derivado de `--secondary` y azul desaturado. Gradientes superpuestos, sin siluetas circulares.
3. Movimiento autónomo independiente de 19, 27 y 23 segundos, yoyo y easing sinusoidal; transformaciones únicamente.
4. Contenedor exterior con desplazamiento por scroll de hasta 40 px verticales y 20 px horizontales. Al animar un padre distinto, el scroll se suma al movimiento autónomo sin sobrescribirlo.
5. GLB de Inicio por encima del ambiente; HTML y navegación conservan sus capas interactivas. El ambiente tiene `pointer-events: none` y `aria-hidden`.

El scroll ambiental usa el mismo `pageScrollRange()` que el GLB: de cero al máximo del documento. La vuelta de 0 a 2π del modelo no se modifica. Se comparte el progreso conceptual sin incorporar Three.js al fondo global ni crear otra escena. Lenis conserva su integración con el ticker GSAP.

## Referencia y botón

Se inspeccionó el botón real de [Tope Akintola](https://www.devakintola.com/) en navegador: alto 46 px, borde rojo de 1 px, radio aproximado 10.4 px, texto de 14 px en mayúsculas con espaciado y tres capas diagonales de relleno. La referencia actual no tiene rolling text ni flecha: estos dos detalles se agregan por el pedido específico de ServiTec.

`AnimatedButton.tsx` reutiliza Button y admite enlaces, asChild y botones nativos con handlers, submit y disabled. Conserva Inter y la paleta existente. Alto 46 px, radio 10 px, borde 1 px, padding 26 px; tamaño compacto de 40 px para tarjetas/header. Texto de 12 px para acomodar etiquetas españolas, 11 px en compacto/mobile.

Estructura: tres capas de relleno decorativas, viewport de texto de 20 px con dos filas y viewport de icono con dos copias. Ambas etiquetas se desplazan juntas 20 px en 550 ms; easing `cubic-bezier(.76,0,.24,1)`. La segunda etiqueta es aria-hidden. Una copia del icono sale diagonalmente y la otra entra; no altera ancho ni nombre accesible. El relleno entra desde la izquierda con tres tonos derivados del mismo color. Los botones sobre paneles oscuros y WhatsApp conservan relleno para asegurar contraste.

Se normalizan los hijos con React.Children antes de identificar el enlace asChild: esto conserva la misma estructura al hidratar contenido procedente de Server Components.

CTA migrados: entradas de Inicio, header de presupuesto/WhatsApp, servicios y especialidades, consultas de contacto/conocenos/FAQs/formas de pago, destacados, agregar desde tienda y ficha, consulta de reacondicionados, revisión/envío de consulta, inicio del pedido, envío del checkout y cotización del configurador. Se mantienen controles de filtros, cantidades, cerrar, compartir e icon buttons.

## Mobile, accesibilidad y rendimiento

- Menos de 1024 px: dos campos, blur fijo de 36 px y recorridos menores; el tercero no se anima. Sin pointer effects.
- Dispositivos sin hover: no hay rolling ni relleno por hover; feedback de tap de 0.98. Foco visible independiente del hover.
- Movimiento reducido: gradientes estáticos; sin loops ni parallax. Etiqueta e icono inmóviles, botones funcionales. Se mantiene el fallback accesible previo del GLB.
- Pestaña oculta: loops pausados. Cleanup local de matchMedia/context, ResizeObserver y listener; sin eliminar animaciones ajenas.
- Sin nuevas dependencias, canvas, shaders, RAF manual ni filtros animados. GSAP se carga de forma diferida.

## Validación y alcance

Build, TypeScript y 25 pruebas unitarias aprobados. Lint: 0 errores, 19 advertencias existentes. Pruebas del GLB en escritorio/mobile: vuelta completa, reversa, reposo, resize, navegación, cleanup, reduced motion y fallos de carga/WebGL aprobados. Siete flujos críticos y 61 comprobaciones de navegador aprobados, con capturas de las rutas reales y las once especialidades. Se revisaron también carrito, checkout, scroll largo y footer.

`review-global-ambient.mjs` comprueba persistencia real entre rutas, movimiento autónomo, geometría/hover/foco del botón, reduced motion, mobile, exclusión del admin y carrito sin enviar pedidos. `review-browser.mjs` captura las rutas revisadas en `artifacts/qa/global-route-*.png`. Otras capturas muestran Inicio, scroll largo, footer, carrito, checkout y la referencia del botón.

La validación de navegador usa Chrome con datos interceptados. No acredita rendimiento en dispositivos físicos ni Safari; las capturas locales con catálogo simulado no representan disponibilidad real. La preview aislada desactiva Blob: el catálogo real y las cuatro fotos remotas de Conocenos requieren configurar el almacenamiento al desplegar. No se cambian fórmulas, precios, stock, autenticación ni fuentes de datos. El video modificado previamente y `public/3d.png` quedan fuera de esta entrega. Sin push ni despliegue.
