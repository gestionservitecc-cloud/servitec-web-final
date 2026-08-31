# ServiTec — Sitio web

Sitio institucional y catálogo de ServiTec (servicio técnico y venta de equipos,
PC a medida y componentes en Saavedra, CABA). **Next.js 16 (App Router)**, sin
dependencias de servicios externos: los datos viven en el proyecto y, en
producción, en **Vercel Blob**.

## Stack

- **Next.js 16** (App Router, React 19) — deploy en **Vercel**
- **Tailwind CSS** + shadcn/ui (Radix) + framer-motion
- **Datos**: `src/data/` (semilla en el repo) + **Vercel Blob** para lo editable
- **Auth del panel**: contraseña + cookie firmada (sin proveedor externo)

## Cómo funcionan los datos

| Dato | Dónde vive | Cómo se edita |
| --- | --- | --- |
| Equipos (celulares, notebooks, PC armadas, TVs) | Vercel Blob · fallback `src/data/seed/equipos.json` | Panel `/admin` |
| Accesorios / periféricos | Vercel Blob · fallback `src/data/seed/productos.json` | Panel `/admin` |
| Catálogo de componentes para "Armá tu PC" | `src/data/catalog/index.json` (estático) | Editando el archivo |
| Imágenes existentes | `public/img/` (en el repo) | — |
| Imágenes nuevas del panel | Vercel Blob | Subida desde `/admin` |

Sin `BLOB_READ_WRITE_TOKEN`, el sitio sirve los JSON del repo y el panel queda
en **modo solo lectura**. Con la integración conectada, el panel guarda en Blob
y el sitio lee de ahí.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # definir al menos ADMIN_PASSWORD para probar /admin
npm run dev
```

## Deploy en Vercel

1. Importar el repo (framework detectado: Next.js).
2. En **Storage → Blob**, crear un store y conectarlo al proyecto
   (Vercel setea `BLOB_READ_WRITE_TOKEN` solo).
3. En **Settings → Environment Variables** agregar:
   - `ADMIN_PASSWORD` — contraseña del panel `/admin`
   - `NEXT_PUBLIC_SITE_URL` — la URL final del sitio
4. Deploy. El primer deploy ya sirve los datos de `src/data/seed`; cuando
   guardes algo desde el panel, pasa a leer de Blob.

## Estructura

```
app/
  (site)/            Rutas públicas (Header + Footer compartidos)
  armar-pc/          Configurador de PC (layout propio)
  admin/             Panel: login + dashboard (equipos y accesorios)
  api/
    equipos, productos            GET públicos
    admin/{login,logout,equipos,productos,upload}
src/
  data/seed/         equipos.json, productos.json, assets.json (semilla)
  data/catalog/      index.json (catálogo de componentes)
  lib/               store.ts (Blob), auth.ts, types.ts, pc-catalog.ts
  components/site/    Header, Footer, Hero, secciones, animaciones
  components/admin/   Dashboard, editores, subida de imágenes
public/img/          Imágenes (migradas desde el Storage anterior)
legacy/              Código Vite anterior (referencia, no se compila)
```

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` · `npm test`
