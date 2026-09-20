# Entrega local de ServiTec

Rama: `feat/servitec-experiencia-premium`.
Base: `18f7452569cf502e69250368e53e1689ce546a72`.
No hubo push, merge, despliegue ni escrituras de prueba a producción.

## Qué cambió

| Área | Cambios |
|---|---|
| Inicio | Tres entradas claras: tienda, reparación y PC. Video real del local con reproducción automática, sin sonido ni controles y repetición infinita. Respeta la preferencia de movimiento reducido. Destacados por categorías, selección y orden del admin, tarjetas compactas, proceso de reparación en lugar de un bloque promocional repetido. |
| Compartidos | Encabezados compactos, navegación activa, menú móvil, salto al contenido, foco visible, menor movimiento, contraste, proporciones de imágenes y estado sin foto. WhatsApp no tapa fichas ni consultas de especialidad. |
| Servicios | Catálogo orientado al cliente. Las 11 especialidades solicitadas usan el mismo flujo corregido; conserva reparaciones y familias existentes, acepta modelo personalizado o desconocido, resumen sincronizado, teléfono alternativo opcional y validación de nombre. Ayudas específicas para iPad, MacBook, familias Android, notebook, consola/mando, dron y TV. Se eliminan `main` anidados y títulos con concordancia incorrecta. |
| Presupuesto y contacto | Revisión de la consulta antes de abrir WhatsApp; no simula cotización automática. Edición conserva campos. Horarios centralizados con los valores existentes. |
| Tienda y variantes | Entradas a equipos, PC armadas, componentes y accesorios; encabezado menor, conteo, limpieza y persistencia de búsqueda/orden/categoría/rango en URL. Título enlaza a ficha aun sin foto; retorno desde ficha conserva parámetros. Carrito unificado. |
| Reacondicionados / stock | Orden manual cuando no se elige ordenar por precio, errores diferenciados, búsqueda y orden persistentes, conteo, garantía/accesorios reales cuando existen y consulta por alternativas para vendidos. |
| Fichas | Medio elegido conservado, precio efectivo y total con tarjeta identificados, cuotas aproximadas y total con el redondeo vigente, selección accesible, garantía desde el registro y consulta cuando falta. Venta bloqueada para vendido/stock cero. Galería completa, fallback de imagen, retorno a filtros. |
| Carrito | Cantidades y persistencia existentes. Verificación de precio/disponibilidad al abrir, cuenta stock combinado del mismo producto aunque se use más de un medio de pago, bloquea solicitud con datos no verificables o cantidad no disponible. Diálogo con Escape, foco contenido y restauración. |
| Configurador | Mantiene fórmulas y reglas. Búsqueda sin reindexar opciones; explica el motivo de incompatibilidad, distingue carga/error/vacío, respeta recomendaciones y orden del admin, elimina rotación automática y caché indefinida. Total estimado visible durante selección; logo local y modales accesibles. |
| Informativas | `/conocenos`, `/contacto`, `/faqs`, `/formas-de-pago`, `/condiciones`, `/politica-de-privacidad`: encabezado y tipografía compartidos, canonical propio y lectura responsive. No se cambian términos legales. |

## Relación admin → público

Se mantienen Vercel Blob, colecciones, IDs de catálogo, relaciones, normalización y APIs. No se agrega catálogo paralelo, seed de productos, migración ni dependencia de ejecución. Los datos artificiales existen **solo en las pruebas**, no en la aplicación entregada.

- APIs públicas: costos/notas permanecen privados; se amplió la exclusión de campos privados en componentes. Errores de almacenamiento responden 503, distintos de una colección vacía válida.
- Datos mutables: `Cache-Control: no-store` y lectura Blob `useCache: false`; el configurador vuelve a consultar al cargar la vista. Las imágenes conservan su caché existente. Esto aumenta lecturas frente a la caché anterior; no se midió carga de producción.
- Los cambios aparecen en nuevas cargas de vista y al abrir el carrito. No se implementó sincronización en tiempo real de una pestaña que permanece abierta.
- Los IDs compuestos se usan únicamente para distinguir líneas locales de carrito y medios de pago; `productId` conserva el ID real. Se soportan carritos antiguos.
- Precios: se conserva el recargo vigente del 8% de componentes, `calculateInstallmentPrice` y `calculateNationalPrice`. Para líneas con medio ya elegido se conserva el precio unitario de ficha; para líneas cuyo pago se elige en el pedido se mantiene el redondeo agregado anterior. No se financia dos veces.
- Se corrigió `normalizedBody` fuera de alcance en el handler de guardado de equipos. También tres incompatibilidades de tipos de Zod bajo `strictNullChecks: false`, después de la validación existente. No se cambian autenticación, roles ni validación de negocio.
- Si falla la lectura de metadata, la ficha sigue disponible para mostrar su estado de reintento.

## Verificación

Estado inicial: build aprobado (con chequeo TypeScript desactivado por configuración preexistente); lint sin errores y 20 advertencias; 11 pruebas aprobadas. El chequeo adicional de tipos identificó defectos preexistentes en handlers admin que fueron corregidos.

Pruebas añadidas:

- Guardado mediante handler real del admin con almacenamiento y autorización simulados; comprobación de precio, estado, fotos, orden y destacados en la API pública.
- Proyecciones públicas sin costos ni notas; error de lectura frente a colección vacía y bypass de caché Blob.
- Precio de carrito, medios mixtos, redondeo, cambio de precio, vendido/eliminado, cantidades y stock combinado.
- Metadata tolerante a fallos de almacenamiento.

Comandos y evidencia:

```powershell
npm test
npm run lint
npx tsc --noEmit
node scripts/preview-local.mjs --build
```

Los resultados de navegador están en `artifacts/qa/results.json` y `artifacts/qa/state-results.json`. Incluyen escritorio/móvil en 360, 390, 768 y 1440 px; rutas principales y variantes de tienda; las 11 especialidades; páginas informativas; búsqueda y retorno; pago desde ficha; cantidades; actualización de precio; bloqueo de vendido; carga/error/vacío; incompatibilidad AM4/AM5; teclado y navegación móvil. `window.open` se intercepta. No se envían mensajes, no se pulsa el envío final de pedidos y se prohíben requests de escritura en las pruebas de navegador.

Resultado final: build aislado y TypeScript aprobados; lint con 0 errores y 19 advertencias; 23 pruebas unitarias y de contratos aprobadas. Las verificaciones de navegador cubren 61 comprobaciones de rutas y recorridos, 7 de estados críticos y 4 del video (autoplay y reinicio real al terminar en 390/1440 px, sin controles, y pausa por movimiento reducido). Se corrigieron además un retorno inválido de efecto y una diferencia de hidratación detectados durante QA.

Capturas generadas:

- `artifacts/qa/inicio-viewport-1440.png` y `inicio-viewport-390.png`: portada.
- `artifacts/qa/inicio-360.png`, `inicio-768.png`: páginas completas.
- `artifacts/qa/tienda-1440.png`: tienda.
- `artifacts/qa/producto-390.png`, `consulta-390.png`, `configurador-390.png`: recorridos móviles.
- `artifacts/qa/inicio-desktop-real.png`: preview sin interceptar catálogos, muestra el estado de falta de conexión.

Las capturas de catálogo usan fixtures aislados explícitamente rotulados como prueba. No representan stock ni condiciones comerciales reales. Son archivos locales ignorados por Git. Las capturas de desarrollo pueden contener el indicador de Next.js.

## Cómo revisar

```powershell
node scripts/preview-local.mjs
```

Abrir `http://127.0.0.1:3100`. El script deja vacías las credenciales/base URL de Blob, usa `.next-preview` y no interfiere con `.next` ni con el servidor previo del puerto 3000. Si el puerto está ocupado por esta misma preview, usar la que ya está abierta. Sin un Blob de prueba, los catálogos muestran correctamente falta de conexión; no se reemplazan por datos inventados.

Para reproducir pruebas visuales (Chrome instalado):

```powershell
npm install --prefix "$env:TEMP/servitec-qa-tools" --no-save playwright
node scripts/review-browser.mjs
node scripts/review-states.mjs
node scripts/review-video.mjs
```

Playwright se instala fuera del proyecto solo como herramienta de QA; no modifica `package.json` ni el lockfile. La preview debe estar ejecutándose.

## Límites y pendientes

- No hay un entorno Blob de prueba confirmado: falta comprobar login admin real, permisos con las cuentas reales, persistencia remota y propagación sobre ese almacenamiento. Las pruebas aisladas no sustituyen esa aceptación.
- No se enviaron pedidos ni mensajes reales. La integración de registro y WhatsApp se preservó, pero no se probó su entrega externa.
- No se midieron Core Web Vitals ni carga a escala, ni se hizo una auditoría automatizada completa WCAG. Persisten advertencias de ESLint, principalmente imágenes HTML y hooks preexistentes.
- Se identificaron contradicciones comerciales: presupuesto sin cargo frente a diagnóstico con posible cargo, promesas de respuesta/24–48 h frente al diagnóstico por caso, duración y alcance de garantías, logística de TV y vigencia de valoración 4.9. Se conservan términos existentes y se remite a condiciones; hace falta decisión del negocio.
- No se inventan estados «oculto», «publicado» o «a pedido»: el modelo no tiene controles explícitos para ellos. Se respetan los estados existentes; stock numérico de componentes se aplica cuando está informado.
- Se evaluaron comparación, guía por presupuesto y guardado/compartido de PC: no se agregan en esta entrega por heterogeneidad de specs e identificación de selecciones por índices. Requieren normalización adicional antes de prometer compatibilidad o persistencia entre actualizaciones del catálogo.
- Se preservó un cambio concurrente ajeno en `public/videos/frente-servitec.mp4` (archivo local de aproximadamente 29,5 MB), fuera de los commits de esta tarea. No se optimizó ni sobrescribió. La vista usa el recurso existente con autoplay; conviene revisar ese peso al decidir publicar el video.

La auditoría y matriz inicial están en `experiencia-premium.md`.
