# Logo 3D de Inicio

Rama: `feat/servitec-logo-3d-scroll`. Base: `407af527fd2e60ddb235fd7fdd295fd33379c42e`.

## Recursos y alcance

- Modelo real: `public/servitec_logo_3d.glb` (534.000 bytes), sin modificar.
- Alternativa original: `public/logo.png`. `public/3d.png` es una lámina de referencias y no se utiliza.
- Solo `app/(site)/page.tsx` monta el componente, centrado al pie de la sección inicial y antes de destacados. Se conservan textos, enlaces, video, header y contenido posterior.
- Ningún cambio en admin, fuentes de datos, stock, precios, fórmulas, carrito, configurador, formularios, permisos o autenticación. Sin opción nueva en admin ni migraciones.
- Three.js y GSAP no existían en el manifiesto ni en node_modules al iniciar: se agregaron `three@0.186.0`, `gsap@3.15.0` y `@types/three@0.186.0` (desarrollo), con lockfile actualizado. Se mantiene Next/React y el resto del stack.

## Comportamiento

`HomeLogo` conserva el PNG y el espacio reservado desde el HTML inicial. Solo cerca de la sección, y sin movimiento reducido, monta `HomeLogoScene` mediante `next/dynamic` sin SSR; Three, GLTFLoader y GSAP quedan en esa carga diferida.

El modelo original mira hacia +Z. Su centro geométrico se resta de la posición y se coloca dentro de un pivote que gira en Y de 0 a 2π. ScrollTrigger vincula el recorrido con `scrub: 0.25`, sin reproducción automática. CSS sticky mantiene la escena visible durante 260 px de desplazamiento en escritorio y 110 px en móvil. No se secuestra el scroll ni se fija el contenido compartido. El tamaño reservado no cambia al llegar el GLB.

Canvas transparente, DPR máximo 1,5, encuadre que conserva el modelo completo durante la vuelta, iluminación de estudio calculada una vez, sin sombras ni posprocesado. Render solicitado mediante RAF únicamente al cambiar orientación/tamaño/visibilidad; no hay bucle continuo. Al quedar fuera de vista o esconder la pestaña, se suspende su trigger y el render.

Movimiento reducido (también al cambiarlo durante la sesión), error HTTP/parseo, ausencia de WebGL o pérdida de contexto muestran el PNG. El contenido y los enlaces siguen funcionando durante la carga. Al desmontar se aborta la petición, se desconectan observers y listeners propios, se cancela RAF, se elimina solo el ScrollTrigger/tween propio y se liberan geometrías, materiales, texturas, ImageBitmap, entorno y renderer/contexto. No se usa `killAll` ni se alteran animaciones ajenas.

Referencias técnicas: [Next local: lazy loading](../node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), [Three.js](https://threejs.org/docs/), [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

## Validación

- Build aislado aprobado: `node scripts/preview-local.mjs --build`.
- `npx tsc --noEmit`: aprobado por separado; el proyecto mantiene su configuración previa de omitir tipos dentro del build.
- `npm run lint`: 0 errores, 19 advertencias existentes.
- `npm test`: 25 pruebas aprobadas.
- `node scripts/review-logo.mjs`: Chrome, 1440 y 390 px, redimensionado a 1100 y 360 px, DPR simulado 3 y canvas limitado a 1,5. Frente → dorso → vuelta completa → retroceso, parada sin frames nuevos, sin render fuera de pantalla, dos ciclos Inicio/Tienda/Inicio por ancho sin duplicar escenas ni listeners propios y con liberación del contexto. Sin errores de página.
- PNG verificado con movimiento reducido, HTTP 404 del GLB y WebGL deshabilitado. Visitas directas a Tienda, Conocenos y Admin sin escena ni requests del modelo/dependencias 3D.
- Prueba adicional de navegación mientras el GLB está pendiente y cambio de movimiento reducido durante la sesión.

Resultados: `artifacts/qa/logo-results.json`. Capturas: `logo-front-1440.png`, `logo-back-1440.png`, `logo-front-390.png`, `logo-back-390.png`, `logo-reduced.png`, `logo-failed.png`, `logo-no-webgl.png`, en `artifacts/qa/` (evidencia local ignorada por Git).

## Preview y límites

Ejecutar `node scripts/preview-local.mjs` y abrir http://127.0.0.1:3100/. Desplazarse hasta el pie de la portada para ver el giro. La preview deja vacías las credenciales Blob y no escribe en producción; el GLB y el PNG son locales. Los catálogos pueden mostrar falta de conexión en esta preview aislada.

La QA usa Chrome de escritorio con tamaños móviles, no dispositivos físicos ni Safari/iOS. No se midieron Core Web Vitals en producción. El detalle/relieve proviene del GLB suministrado; no se remodeló ni se sustituyó su textura. No hubo push, merge ni despliegue. El video modificado previamente y la lámina `3d.png` se conservan fuera de este commit.
