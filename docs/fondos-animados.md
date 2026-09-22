# Fondos animados por sección

Integración sobre Next.js App Router, React y Tailwind existentes; CSS Module local para capas y overlays. Se reutiliza PageHero sin alterar su contenido, tamaño, navbar ni tipografías. Se integra en Servicios, Reacondicionados, Tienda y Conocenos: comienza en el encabezado y, cuando este sale por completo de la pantalla, continúa como fondo fijo detrás del contenido de la página.

## Recursos reales

Los archivos suministrados son PNG, no JPG. Se usan sin renombrar ni recodificar:

| Ruta | Fondo | Preset | Overlay |
|---|---|---|---|
| /servicios | /backgrounds/servicios.png | servicios | light-image |
| /reacondicionados | /backgrounds/reacondicionados.png | reacondicionados | light-image |
| /tienda (todas sus variantes) | /backgrounds/tienda.png | tienda | dark-image |
| /conocenos | /backgrounds/nosotros.png | nosotros | dark-image |

No se agregaron dependencias: se aprovechan GSAP y ScrollTrigger instalados. El efecto importa las librerías de forma diferida y conserva la imagen estática si esa carga falla.

## Comportamiento y protección

- Presets con los valores solicitados, sin rotación. Máximo recorrido: 40 px por eje.
- MatchMedia: escritorio 100%, tablet 70%, móvil 50% de desplazamiento y zoom.
- ScrollTrigger desde `top bottom` hasta `bottom top`, `scrub: 1`, easing lineal. No hay RAF manual, pin ni scroll personalizado.
- Capas decorativas fuera del flujo y sin eventos de puntero. Inset de 24 px más zoom evita bordes vacíos.
- Movimiento reducido: ningún ScrollTrigger para el fondo, transform none y escala natural. Se aplica también al cambiar la preferencia durante la sesión.
- `mm.revert()` y `ctx.revert()` revierten únicamente sus propios efectos al desmontar o cambiar parámetros. La carga asíncrona comprueba que el componente siga montado.
- Sin cambios en catálogo, stock, precios, fórmulas, formularios, carrito, autenticación ni datos remotos. Sin publicación en producción.

## Archivos nuevos: código completo

### src/components/site/AnimatedSectionBackground.tsx

```tsx
"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { gsap as Gsap } from "gsap";
import { cn } from "@/lib/utils";
import styles from "./AnimatedSectionBackground.module.css";

const motionPresets = {
  servicios: { from: { scale: 1.12, x: -20, y: -10 }, to: { scale: 1.03, x: 20, y: 10 } },
  reacondicionados: { from: { scale: 1.1, x: 20, y: -15 }, to: { scale: 1.02, x: -20, y: 15 } },
  tienda: { from: { scale: 1.12, x: -10, y: -20 }, to: { scale: 1.02, x: 15, y: 20 } },
  nosotros: { from: { scale: 1.08, x: -8, y: -10 }, to: { scale: 1.02, x: 8, y: 10 } },
};

export type AnimatedBackgroundOptions = {
  image: string;
  preset?: keyof typeof motionPresets;
  direction?: "left" | "right";
  /** 0–1: values above 1 are clamped to preserve the subtle movement limits. */
  intensity?: number;
  overlay?: "light-image" | "dark-image" | false;
};

export function AnimatedSectionBackground({
  image, children, direction, intensity = 1, preset = "servicios",
  overlay = "light-image", className,
}: AnimatedBackgroundOptions & { children: ReactNode; className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const pageLayerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let active = true;
    let ctx: ReturnType<typeof Gsap.context> | undefined;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;
    // Other PageHero users do not download GSAP for this effect.
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      const section = sectionRef.current;
      const layer = backgroundRef.current;
      const page = pageRef.current;
      const pageLayer = pageLayerRef.current;
      if (!active || !section || !layer || !page || !pageLayer) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        mm.add({
          desktop: "(min-width: 1024px)",
          tablet: "(min-width: 768px) and (max-width: 1023px)",
          mobile: "(max-width: 767px)",
          reduce: "(prefers-reduced-motion: reduce)",
        }, context => {
          const conditions = context.conditions!;
          if (conditions.reduce) {
            gsap.set(layer, { clearProps: "transform" });
            return;
          }
          const strength = (conditions.desktop ? 1 : conditions.tablet ? 0.7 : 0.5)
            * (Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 1);
          const motion = motionPresets[preset];
          const currentDirection = motion.to.x > motion.from.x ? "right" : "left";
          const sign = direction && direction !== currentDirection ? -1 : 1;
          const values = (point: typeof motion.from) => ({
            scale: 1 + (point.scale - 1) * strength,
            x: point.x * strength * sign,
            y: point.y * strength,
          });
          gsap.fromTo(layer, values(motion.from), {
            ...values(motion.to), ease: "none",
            scrollTrigger: {
              trigger: section, start: "top bottom", end: "bottom top",
              scrub: 1, invalidateOnRefresh: true,
            },
          });
          // Only reveal the page background after the entire heading has left
          // the viewport. Reversing scroll reverses the handoff as well.
          const reveal = gsap.fromTo(page, { opacity: 0 }, {
            opacity: conditions.mobile ? 0.1 : 0.14, ease: "none",
            scrollTrigger: {
              trigger: section, start: "bottom top",
              end: () => `+=${conditions.mobile ? 96 : 160}`,
              scrub: 0.6, invalidateOnRefresh: true,
            },
          });
          const continuation = gsap.fromTo(pageLayer, values(motion.from), {
            ...values(motion.to), ease: "none",
            scrollTrigger: {
              trigger: section, start: "bottom top",
              end: () => Math.max(section.getBoundingClientRect().bottom + scrollY + 1, ScrollTrigger.maxScroll(window)),
              scrub: 1, invalidateOnRefresh: true,
            },
          });
          // Catalogues and images may change the document's height after load.
          const observer = new ResizeObserver(() => {
            reveal.scrollTrigger?.refresh();
            continuation.scrollTrigger?.refresh();
          });
          observer.observe(document.body);
          return () => observer.disconnect();
        }, section);
      }, section);
    }).catch(() => { /* Keep the static CSS background if the animation chunk fails. */ });
    return () => { active = false; mm?.revert(); ctx?.revert(); };
  }, [direction, intensity, preset]);

  return (
    <>
    <section ref={sectionRef} className={cn(styles.section, className)} data-animated-background={preset}>
      <div ref={backgroundRef} className={styles.background} style={{ backgroundImage: `url(${JSON.stringify(image)})` }} aria-hidden="true" data-background-layer />
      {overlay && <div className={cn(styles.overlay, overlay === "light-image" ? styles.lightImage : styles.darkImage)} aria-hidden="true" />}
      <div className={styles.content}>{children}</div>
    </section>
    <div ref={pageRef} className={styles.pageBackground} aria-hidden="true" data-page-background={preset}>
      <div ref={pageLayerRef} className={styles.background} style={{ backgroundImage: `url(${JSON.stringify(image)})` }} data-page-background-layer />
    </div>
    </>
  );
}

```

### src/components/site/AnimatedSectionBackground.module.css

```css
.section {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.background {
  position: absolute;
  inset: -24px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  will-change: transform;
}

.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lightImage {
  background: linear-gradient(90deg, rgba(15, 23, 42, .82) 0%, rgba(15, 23, 42, .76) 45%, rgba(15, 23, 42, .32) 100%);
}

.darkImage {
  background: linear-gradient(90deg, rgba(15, 23, 42, .5) 0%, rgba(15, 23, 42, .38) 45%, rgba(15, 23, 42, .2) 100%);
}

.content { position: relative; }

/* Scope the layering to routes that actually mount this background. Cards,
   filters and text paint above it; section background colors stay beneath. */
:global(main):has(.pageBackground) {
  position: relative;
  isolation: isolate;
}

:global(main):has(.pageBackground) :global(section:not([data-animated-background])) > * {
  position: relative;
  z-index: 1;
}

.pageBackground {
  position: fixed;
  inset: 65px 0 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
}

@media (max-width: 767px) {
  .lightImage { background: rgba(15, 23, 42, .78); }
  .darkImage { background: rgba(15, 23, 42, .45); }
}

@media (prefers-reduced-motion: reduce) {
  .background { transform: none !important; will-change: auto; }
  .pageBackground { display: none; }
}

```

## Componente compartido modificado: código completo

### src/components/site/PageHero.tsx

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedSectionBackground, type AnimatedBackgroundOptions } from "./AnimatedSectionBackground";

export function PageHero({ eyebrow, title, description, children, className, align = "left", fullWidth = false, background }: {
  eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode;
  className?: string; align?: "center" | "left"; fullWidth?: boolean;
  background?: AnimatedBackgroundOptions;
}) {
  const content = (
    <div className={cn("container-page py-9 sm:py-12", fullWidth && "max-w-none", align === "center" && "text-center")}>
      {eyebrow && <p className="eyebrow text-red-300">{eyebrow}</p>}
      <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
  const sectionClass = cn("border-b bg-sidebar text-sidebar-foreground", className);
  return background
    ? <AnimatedSectionBackground {...background} className={sectionClass}>{content}</AnimatedSectionBackground>
    : <section className={sectionClass}>{content}</section>;
}

```

## Puntos de integración modificados

El resto de cada archivo se conserva. Propiedades agregadas al PageHero existente:

### app/(site)/servicios/page.tsx
```tsx
background={{ image: "/backgrounds/servicios.png", preset: "servicios", overlay: "light-image" }}
```

### app/(site)/conocenos/page.tsx
```tsx
background={{ image: "/backgrounds/nosotros.png", preset: "nosotros", overlay: "dark-image" }}
```

### src/components/tienda/TiendaClient.tsx
```tsx
background={{ image: "/backgrounds/tienda.png", preset: "tienda", overlay: "dark-image" }}
```

### src/components/stock/StockClient.tsx
```tsx
background={isReconditionedRoute ? {
  image: "/backgrounds/reacondicionados.png",
  preset: "reacondicionados",
  overlay: "light-image",
} : undefined}
```

## Reutilización

```tsx
<AnimatedSectionBackground
  image="/backgrounds/servicios.png"
  preset="servicios"
  direction="right"
  intensity={1}
  overlay="light-image"
  className="text-white"
>
  <div className="container-page py-12">Contenido de la sección</div>
</AnimatedSectionBackground>
```

`direction` permite invertir el eje X del preset. `intensity` se limita a 0–1. `overlay={false}` permite prescindir del degradado cuando el contenido lo permita.

## Validación y preview

- `node scripts/preview-local.mjs --build`: aprobado.
- `npx tsc --noEmit`: aprobado.
- `npm run lint`: 0 errores y 19 advertencias existentes.
- `npm test`: 25 pruebas aprobadas.
- `scripts/review-backgrounds.mjs`: revisión reproducible con Chrome; capas, imágenes reales, movimientos y valores finales, retorno al subir, bordes, responsive 1440/900/390, cambios de breakpoint, movimiento reducido y navegación.
- Capturas: `artifacts/qa/background-{ruta}-{ancho}.png`; resultados: `artifacts/qa/background-results.json`.

Preview: ejecutar `node scripts/preview-local.mjs` y abrir http://127.0.0.1:3100/servicios. La preview aísla las credenciales Blob; la QA intercepta el catálogo con fixtures y no permite escrituras. No se probó en móviles físicos/Safari ni se midieron Core Web Vitals. Los PNG originales conservan su peso.

Referencia de API: [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/).

## Continuidad del fondo al salir del encabezado

Se conserva la capa original del encabezado y se añade una segunda capa decorativa fija, sin eventos de puntero. Cuando el borde inferior del encabezado cruza el borde superior del viewport, ScrollTrigger revela gradualmente el fondo de página durante 160 px en escritorio/tablet y 96 px en móvil. Opacidad máxima: 0,14 / 0,10. El cambio es reversible al subir.

La capa fija mantiene el preset de movimiento sutil desde ese punto hasta el final real del scroll del documento, incluido el footer. Un ResizeObserver actualiza los límites si la carga del catálogo cambia la altura de página. Las capas de contenido quedan por encima. No se añaden espacios, pin ni bloqueos de scroll.

Con movimiento reducido, el fondo del encabezado queda estático y la continuación fija se oculta. Los nuevos triggers, observador y estilos se limpian junto con matchMedia/context al salir. No se modifican datos, operaciones del admin ni el logo 3D de Inicio.

QA reproducible: `node scripts/review-background-handoff.mjs`. Evidencia: `artifacts/qa/background-page-results.json` y `background-page-{ruta}-{ancho}.png`. Incluye las cuatro rutas en 1440/390 px, umbral de salida completa, movimiento hasta el final, retorno al subir, bordes, movimiento reducido y navegación sin duplicados.
