# Revisión rápida — 22/09/2026

Cambios:
- Eliminados 23 archivos de `legacy/`: antigua aplicación Vite, excluida del proyecto actual y sin consumidores activos. Recuperables mediante Git.
- Eliminado el paquete npm `git`, sin imports y con [inyección de comandos conocida](https://github.com/advisories/GHSA-9gqr-xp86-f87h).
- Overrides de versiones correctivas dentro de la misma versión mayor: `tar` 7.5.22 y `js-yaml` 4.3.2. Retirada la alerta crítica detectada en tar.
- Headers `nosniff` y `strict-origin-when-cross-origin`. Assets privados publicados por la ruta de imágenes reciben CSP sandbox sin scripts, incluida la apertura directa de SVG.
- El build vuelve a comprobar errores TypeScript; ya no los ignora.
- Retiradas referencias de configuración a legacy y espacios finales sobrantes. Se conserva la sangría y el contenido de literales.

Verificaciones: build y TypeScript correctos; 26 pruebas aprobadas; lint sin errores, con 19 advertencias existentes. Cinco endpoints de lectura privados responden 401 sin sesión. Sin archivos `.env` versionados. Comprobadas restricciones de rutas de assets, allowlist de correo admin y verificación de correo Google. No se hicieron escrituras a producción.

Pendientes reales:
- `npm audit` completo: 30 entradas, 20 altas, 8 moderadas, 2 bajas, cero críticas. Varias corresponden al árbol de la CLI Vercel; los recuentos incluyen paquetes afectados indirectamente y no equivalen a 30 vías explotables del sitio.
- `xlsx` utilizado por importaciones mantiene alertas de prototype pollution y [ReDoS](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9). Requiere una actualización controlada con archivos de importación representativos.
- POST de pedidos es público, recibe importes desde el cliente y no implementa límites de frecuencia en el handler. Son solicitudes, no cobros; conviene validación server-side y protección antiabuso en una tarea separada, preservando las reglas comerciales.
- La persistencia de pedidos usa lectura y posterior escritura de JSON: debe revisarse la concurrencia para evitar pérdida de altas simultáneas.

Alcance limitado a revisión rápida del repositorio y comprobaciones locales; no es un pentest ni una certificación de ausencia de vulnerabilidades. No se eliminaron assets dinámicos, pruebas ni archivos cuya inutilidad no pudo demostrarse.
