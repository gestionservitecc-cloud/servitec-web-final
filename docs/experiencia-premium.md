# ServiTec: auditoría y plan de implementación

Base: `18f7452569cf502e69250368e53e1689ce546a72`. Rama: `feat/servitec-experiencia-premium`. Árbol inicial limpio. Sin push, merge ni despliegue. No hay workflows en `.github`; la vinculación externa de Vercel no es verificable desde Git, por lo que la revisión será local.

## Inventario y fuentes

Público: `/`, `/servicios`, `/servicios/[slug]` (iphone, ipad, macbook, samsung, motorola, huawei, xiaomi, notebooks, drones, consolas, smart-tv; además sony, ereaders, gopro), `/presupuesto`, `/tienda`, `/stock`, `/reacondicionados`, `/producto/[tipo]/[id]`, `/armar-pc`, `/conocenos`, `/contacto`, `/faqs`, `/formas-de-pago`, `/condiciones`, `/politica-de-privacidad`.

Administración: `/admin`, `/admin/bulk-upload`; APIs protegidas `/api/admin/{stock,equipos,productos,componentes,bulk-upload,upload}`. NextAuth y `requireAdmin` controlan permisos. No se modifican.

Persistencia: documentos JSON privados en Vercel Blob. Equipos y accesorios usan `servitec-data`; componentes usan JSON por categoría y reglas de precio. `/api/assets/[...path]` sirve imágenes. `/api/pedidos` y almacenamiento local registran pedidos; WhatsApp abre el mensaje. Formularios de reparación abren WhatsApp directamente, sin registro servidor.

| Control admin | Dato/API | Público | Esperado | Comprobación |
|---|---|---|---|---|
| Equipos, precio, condición, estado, orden | `Equipo`, `/api/equipos` | Tienda, reacondicionados, ficha, destacados, PC recomendadas | Mismos IDs y precios; orden del admin; vendido no comprable | Pruebas aisladas y revisión de consumidores |
| Fotos, specs, garantía, detalle | Mismo documento Equipo | Fichas, galerías, tarjetas | Usar campos existentes, sin inventar garantías | Fixture aislado con campos vacíos y completos |
| Destacado/recomendada | `recomendada` | Portada y configurador | Conservar selección; no sustituir por catálogo fijo | Revisión filtros y pruebas |
| Componentes y reglas | `/api/admin/componentes`, `/api/componentes` | Tienda, ficha, armador | Mismas fórmulas, categorías y compatibilidad | Utils + pruebas de precio/carrito |
| Accesorios, stock | `/api/productos` | Tienda y carrito | Conservar precio y disponibilidad | Pruebas aisladas |
| Costos y notas privadas | Proyección de APIs públicas | Ninguno | No serializar costos/notas | Pruebas de API con almacenamiento simulado |

Servicios/modelos/FAQs están en `src/content`, contactos en `site-config.ts`, reseñas en `reviews.ts`. No encontré controles del admin para banners, horarios, textos legales o servicios. No se agrega otra fuente de verdad. Precios de componentes tienen recargo vigente del 8%; cuotas e impuestos usan `utils.ts`; no se cambian fórmulas.

Caché inicial: APIs públicas 30 s + stale-while-revalidate 300 s; configurador guarda catálogo indefinidamente en memoria. Las vistas hacen fetch al montar. Actualización no es push en tiempo real. Admin comparte tipos, normalización, catálogo, validadores e imágenes con público.

## Hallazgos vigentes

- Ficha guarda precio efectivo aunque se elija tarjeta.
- Errores de red confundidos con vacío, recomendaciones vacías durante carga.
- Orden manual omitido por algunas listas; destacados separados en muchas filas.
- `main` anidados, navegación decorativa sin estado activo fiable, movimiento continuo.
- Especialidades usan «Tu Notebooks/Consolas/Drones» y obligan a repetir WhatsApp.
- Servicios describe la estructura de la web en lugar de ayudar al cliente.
- Build inicial pasa pero omite validación TypeScript (configuración existente). Lint pasa; 11 pruebas existentes pasan.
- `admin/equipos` referencia `normalizedBody` fuera de su bloque: defecto previo a corregir para preservar guardado.

## Etapas

1. Sistema visual compartido, navegación, portada y encabezados compactos.
2. Consultas con resumen; cargas y errores; orden; precio elegido y disponibilidad en carrito/ficha; configurador.
3. Pruebas aisladas de contratos y recorridos, build/lint, revisión responsive y documentación de límites.

## Referencias consultadas

- https://compragamer.com/: la extracción inicial dependía de JS. Luego se abrió en Chrome de prueba: se observaron buscador, navegación Productos/Notebooks/Armá tu PC/Outlet/Ayuda, carrito y entrada al configurador. Se tomó captura; no se operó carrito ni se verificaron sus reglas de compatibilidad.
- https://fullh4rd.com.ar/: observados buscador, categorías, acceso al armador y carrito. Adaptar acceso directo y etiquetas claras; no se probó checkout.
- https://www.mexx.com.ar/: contenido público accesible; referencia de organización comercial, sin operar compras.
- https://www.servitecbsas.com/: contenido público confirma duplicación de bloques y promesas 24/48 h. No se modifica producción.

## Decisiones comerciales pendientes

Validar promesa general de 24/48 h frente a diagnóstico por caso; alcance de «presupuesto sin cargo», garantías según condición, logística de TV y vigencia de la valoración 4.9. No se crean condiciones legales. No hay estados tipados de publicado/oculto/a pedido ni stock real en el catálogo de componentes: evitar inferir reglas nuevas. Comparación y presupuesto por uso requieren normalización adicional; no afirmar rendimiento.

## Resultado de la implementación

Ver `entrega-experiencia-premium.md` para alcance, comprobaciones finales, capturas, instrucciones y límites. La tabla anterior describe el estado inicial; la caché de datos y los errores se corrigieron durante la implementación. Se respetan cantidades de stock cuando el catálogo de componentes efectivamente las informa; no se fabrican cantidades donde faltan.
