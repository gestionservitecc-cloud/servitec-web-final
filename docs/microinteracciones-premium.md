# Ambientación y microinteracciones de ServiTec

Entrega del 22/09/2026 en `feat/servitec-logo-3d-scroll`. Preview local: http://127.0.0.1:3100. Sin publicación en producción.

## Implementación por archivos

| Archivo | Cambio |
|---|---|
| `src/lib/animations/gsap.ts` | Registro central de ScrollTrigger y rango de scroll de documento compartido. |
| `src/components/site/AmbientBackground.tsx` y `.module.css` (nuevos) | Dos luces difusas azul/cyan detrás del GLB; una luz estática en pantallas pequeñas. |
| `src/components/site/AnimatedButton.tsx` y `.module.css` (nuevos) | Reutilizan Button; texto vertical de 450 ms, icono discreto, foco y feedback táctil. Nombre accesible estable y ancho reservado. |
| `src/components/site/SmoothScroll.tsx` (nuevo) | Carga diferida de Lenis únicamente en escritorio con puntero fino y sin movimiento reducido. |
| `src/components/site/HomeReveals.tsx` (nuevo) | Entradas de título, introducción y títulos seleccionados; los CTA permanecen disponibles. |
| `app/(site)/layout.tsx` | Monta SmoothScroll en el sitio público. |
| `app/(site)/page.tsx` | Integra ambiente, reveals y botones; mejora feedback de cards existentes. |
| `app/(site)/servicios/page.tsx` | Botones reutilizables y hover sobrio en cards; conserva contenido y destinos. |
| `src/components/site/HomeLogoScene.tsx` | Rotación explícita de 0 a 2π con fromTo, estable al refrescar medidas. |
| `src/components/site/HomeLogo.module.css` | Capas de profundidad, hero oscuro y degradado hacia la sección siguiente. |
| `src/components/site/Header.tsx` | Tratamiento oscuro exclusivo de Inicio y fondo translúcido al desplazar; conserva logo y navegación. |
| `src/components/site/AnimatedSectionBackground.tsx` | Reutiliza el registro central de GSAP; conserva los fondos de las otras páginas. |
| `src/components/site/FeaturedStock.tsx` | Zoom de imagen limitado a 1.04 y condicionado a movimiento permitido. |
| `src/components/site/motion.tsx` | Feedback breve sin resorte. |
| `src/styles/globals.css` | Cards con desplazamiento de 4 px; evita interpolación CSS simultánea con Lenis. |
| `package.json`, `package-lock.json` | Única dependencia añadida: Lenis 1.3.26. |
| `scripts/review-premium.mjs` (nuevo) | Validación automatizada de interacción, responsive y rendimiento indicativo. |
| `scripts/review-logo.mjs` | Distingue las dependencias 3D exclusivas de Inicio de GSAP, compartido por los fondos públicos. |

## Scroll y GLB

Se conserva Three.js y el recurso real `/servitec_logo_3d.glb`. No se agrega otro canvas. El rango va desde scroll 0 hasta `ScrollTrigger.maxScroll(window)`: arriba, rotación 0; mitad, π; final del documento, 2π. Subir revierte el movimiento. Ambos extremos explícitos evitan que un refresh acumule una orientación nueva. Las luces usan el mismo rango, con interpolación sutil.

Lenis usa `autoRaf: false`; su avance se ejecuta desde el ticker de GSAP con tiempo absoluto. El evento de scroll actualiza ScrollTrigger. No se cambia globalmente lagSmoothing ni se agrega otro RAF continuo. El RAF del GLB sigue siendo a demanda. Lenis respeta el scroll-margin de anclas, se detiene con diálogos y pestaña oculta y se destruye al cambiar de ruta o condición responsive. Observadores, listeners y callbacks propios se eliminan al desmontar. GSAP usa context/matchMedia y cleanup local, sin killAll.

## Mobile y accesibilidad

Scroll nativo en dispositivos táctiles y pantallas menores de 1024 px. Una sola luz estática con blur menor, reveals de 8 px y 450 ms, sin efectos de mouse ni tilt. DPR del modelo limitado a 1.5; sin sombras adicionales. Botones con nombre accesible estable, foco visible y sin contenido necesario exclusivo del hover.

Con movimiento reducido: sin Lenis, reveals ni desplazamiento ambiental; se conserva el fallback PNG original del logo ya existente. También se usa ante fallo del modelo o ausencia de WebGL. El modelo continúa activo en mobile con movimiento permitido. La escena y el archivo GLB no se solicitan fuera de Inicio.

## Validación

- Build de producción local y TypeScript: correctos.
- Lint: 0 errores; 19 advertencias preexistentes.
- Vitest: 25 pruebas aprobadas.
- Regresión ampliada en navegador: 61 comprobaciones aprobadas, con rutas públicas en 360, 390, 768 y 1440 px, especialidades de reparación, presupuesto, fichas, carrito y persistencia de filtros.
- Pruebas de estados: 7 flujos críticos aprobados, incluidos carrito, stock vendido, filtros y compatibilidad del configurador; datos de prueba interceptados, sin escrituras a producción.
- GLB en 1440 y 390 px: frente, media vuelta, vuelta completa, reversa, detención, resize, DPR y suspensión de render en reposo. Dos ciclos de navegación con limpieza de listeners y contexto. Fallbacks de movimiento reducido, carga fallida y WebGL ausente correctos.
- Interacciones: rueda responde dentro de 100 ms en la prueba local; carrito bloquea y restaura scroll, ancla de servicios conserva separación del header, foco de teclado y PageDown operativos. URL de WhatsApp preservada; no se envió ningún mensaje.
- Responsive 390 y 768 px: GLB visible, scroll nativo, menú y CTA funcionales, sin overflow horizontal. Sin errores de página/hydration en las rutas probadas.
- Medición indicativa en Chrome headless, 1440×900, tres segundos de desplazamiento: media inicial 16.76 ms/frame, con mejoras aproximadamente 16.67 ms/frame; p95 16.8 ms en ambas muestras. No sustituye pruebas de FPS en dispositivos físicos.

Capturas y resultados locales: `artifacts/qa/premium-home-*.png`, `premium-results.json`, `premium-baseline.json` y `premium-performance.json` (artefactos ignorados por Git).

## Límites y refinamientos recomendados

Revisar intensidad de luz y transición oscuro/claro junto al cliente en pantallas reales. Validar Safari/iOS y Android de gama media físicamente; la emulación no garantiza su rendimiento. Evaluar posteriormente compresión del video original, que no se modificó en esta entrega. Se evitó agregar movimiento autónomo continuo, tilt, SplitText o shaders: el GLB conserva la jerarquía principal.

Esta etapa no cambia datos, stock, precios, fórmulas, formularios, autenticación ni permisos. Los cambios locales preexistentes del video y `public/3d.png` quedan fuera del commit.
