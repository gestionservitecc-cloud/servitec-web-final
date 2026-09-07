import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { get, put } from "@vercel/blob";
import { saveComponentes, saveProductos, saveEquipos } from "@/lib/store";

const folders: Record<string, string> = {
  motherboard: "MOTHERBOARD",
  processor: "PROCESADOR",
  memory: "RAM",
  storage: "DISCO",
  graphics: "GRAFICA",
  power: "FUENTE",
  case: "GABINETE",
  cooling: "COOLER",
  peripherals: "PERIFERICO",
};

const categoryKeyFromValue = (value: unknown) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return Object.entries(folders).find(([key, folder]) =>
    normalized === key || normalized === folder.toLowerCase(),
  )?.[0] || "";
};
const PRICE_RULES_PATH = "servitec-data/component-price-rules.json";

export const dynamic = "force-dynamic";

const COLLECTIONS = ["componentes", "productos", "equipos"] as const;

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Falta configurar Vercel Blob." }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const collection = String(form.get("collection") || "").trim();
    if (!COLLECTIONS.includes(collection as any)) return NextResponse.json({ error: "Colección inválida" }, { status: 400 });
    const dataFile = form.get("data");
    if (!(dataFile instanceof File)) return NextResponse.json({ error: "Falta el archivo de datos (.csv)" }, { status: 400 });
    if (!/\.csv$/i.test(dataFile.name)) return NextResponse.json({ error: "La carga masiva solo admite archivos .csv" }, { status: 400 });

    const dataText = await dataFile.text();
    let arr: any[] = [];
    {
      // simple CSV parser supporting quoted fields and CRLF
      const parseCsvRows = (text: string) => {
        const rows: string[][] = [];
        let current = "";
        let row: string[] = [];
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const next = text[i + 1];

          if (char === '"') {
            if (inQuotes && next === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
            continue;
          }

          if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") i += 1;
            row.push(current);
            if (row.some((cell) => String(cell || "").trim().length > 0)) rows.push(row);
            row = [];
            current = "";
            continue;
          }

          current += char;
        }

        if (current.length > 0 || row.length > 0) {
          row.push(current);
          if (row.some((cell) => String(cell || "").trim().length > 0)) rows.push(row);
        }

        return rows;
      };

      const rows = parseCsvRows(dataText.replace(/^[\uFEFF\uFEFF]/, ""));
      if (rows.length < 1) return NextResponse.json({ error: "CSV vacío" }, { status: 400 });
      const headers = rows[0].map((h) => String(h || "").trim());
      arr = rows.slice(1).map((row) => {
        const obj: any = {};
        for (let i = 0; i < headers.length; i++) obj[headers[i]] = row[i] ?? "";
        return obj;
      });
    }

    // Normalize CSV values without uploading or mapping image files.
    const replaced = arr.map((item: any) => {
      if (item && typeof item === 'object') {
        const out: any = Array.isArray(item) ? [] : {};
        for (const key of Object.keys(item)) {
          const v = item[key];
          if (typeof v === 'string') {
            if (key === 'specs') {
              // try to parse specs JSON
              try {
                out[key] = JSON.parse(v);
              } catch {
                out[key] = v;
              }
            } else {
              out[key] = v;
            }
          } else if (Array.isArray(v)) {
            out[key] = v;
          } else {
            out[key] = v;
          }

          // normalize numeric-ish fields
          if (['precio', 'price', 'precioCosto', 'stock', 'precioOriginal', 'originalCatalogPrice'].includes(key) && typeof out[key] === 'string') {
            const cleaned = String(out[key]).replace(/[^0-9.,-]/g, '').replace(',', '.');
            const n = Number(cleaned);
            if (!Number.isNaN(n)) out[key] = n;
          }
        }
        return out;
      }
      return item;
    });

    const requestedCategory = String(form.get('category') || '').trim().toLowerCase();
    const csvCategories = [...new Set((replaced as any[])
      .map((item) => categoryKeyFromValue(item?.categoria ?? item?.category))
      .filter(Boolean))];
    if (collection === "componentes" && csvCategories.length > 1) {
      return NextResponse.json({ error: "El CSV contiene más de una categoría de componentes." }, { status: 400 });
    }
    if (collection === "componentes" && csvCategories[0] && requestedCategory && csvCategories[0] !== requestedCategory) {
      return NextResponse.json({
        error: `La categoría seleccionada es ${requestedCategory.toUpperCase()}, pero el CSV indica ${csvCategories[0].toUpperCase()}. No se realizaron cambios.`,
      }, { status: 400 });
    }

    const imageFiles = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    const uploadedImageUrls: Record<number, string> = {};
    if (imageFiles.length > 0) {
      if (collection !== "componentes") {
        return NextResponse.json({ error: "Las imágenes masivas solo corresponden a componentes." }, { status: 400 });
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: "Falta configurar Vercel Blob para subir imágenes." }, { status: 503 });
      }
      const category = csvCategories[0] || requestedCategory;
      const folder = folders[category];
      if (!folder) return NextResponse.json({ error: "Seleccioná una categoría válida." }, { status: 400 });
      await Promise.all(imageFiles.map(async (file, index) => {
        if (!file.type.startsWith("image/")) throw new Error(`El archivo ${file.name} no es una imagen.`);
        if (file.size > 8 * 1024 * 1024) throw new Error(`La imagen ${file.name} supera los 8 MB.`);
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const pathname = `componentes/${folder}/imagenes/${String(index + 1).padStart(4, "0")}-${Date.now()}.${ext}`;
        await put(pathname, file, { access: "private", contentType: file.type, addRandomSuffix: false, allowOverwrite: true });
        const filenameNumber = file.name.match(/(?:foto|image|img)[ _-]?(\d+)/i)?.[1];
        const sourceNumber = Number(filenameNumber || index + 1);
        uploadedImageUrls[sourceNumber] = `/api/assets/${pathname}`;
      }));
    }

    // save into appropriate collection
    if (collection === 'productos') await saveProductos(replaced);
    else if (collection === 'equipos') await saveEquipos(replaced);
    else if (collection === 'componentes') {
      // if category was provided, write into the per-category productos.json
      const category = csvCategories[0] || requestedCategory;
      if (category && folders[category]) {
        const folder = folders[category];
        const pathname = `componentes/${folder}/productos.json`;
        const rulesBlob = await get(PRICE_RULES_PATH, { access: 'private' }).catch(() => null);
        const rulesPayload = rulesBlob ? await new Response(rulesBlob.stream).json().catch(() => ({})) : {};
        const submittedRules = String(form.get("priceRules") || "").trim();
        let rules = Array.isArray(rulesPayload?.[category]) ? rulesPayload[category] : [];
        if (submittedRules) {
          try {
            const parsed = JSON.parse(submittedRules);
            if (Array.isArray(parsed)) rules = parsed;
          } catch {
            return NextResponse.json({ error: "Reglas de precio inválidas" }, { status: 400 });
          }
        }
        const applyRules = (price: number) => {
          const rule = rules.find((item: { min?: number; max?: number | null }) => price >= (item.min || 0) && (item.max == null || price < item.max));
          return rule ? Math.round(price + (price * (Number(rule.pct) || 0)) / 100) : Math.round(price);
        };
        // Keep the values loaded by the administrator as the catalog base values.
        const raw = (replaced as any[]).map((it, index) => {
          const original = it.precioCosto ?? it.precio ?? it.price ?? 0;
          const { stock: _stock, ...catalogItem } = it;
          const idNumber = String(it.id || "").match(/(?:^|[-_])(\d+)(?:[-_]|$)/)?.[1];
          const image = uploadedImageUrls[Number(idNumber || index + 1)];
          return {
            ...catalogItem,
            id: it.id,
            nombre: it.nombre || it.title || it.name || "",
            precioCosto: Number(it.precioCosto ?? original) || 0,
            precio: applyRules(Number(it.precioCosto ?? original) || 0),
            precioOriginal: original,
            categoria: folder,
            ...(image ? { imagen: image, imagenes: [image] } : {}),
          };
        });
        await put(pathname, JSON.stringify(raw, null, 2), {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
        }).catch(() => null);
        await put(PRICE_RULES_PATH, JSON.stringify({ ...rulesPayload, [category]: rules }, null, 2), {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
        });
      } else {
        // fallback: write full componentes collection as admin overrides
        await saveComponentes(replaced);
      }
    }

    return NextResponse.json({ ok: true, count: replaced.length });
  } catch (err) {
    console.error('admin/bulk-upload: failed', err);
    return NextResponse.json({ error: 'No se pudo procesar la carga masiva.' }, { status: 500 });
  }
}
