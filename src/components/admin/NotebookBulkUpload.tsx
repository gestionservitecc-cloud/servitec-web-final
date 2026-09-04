"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { Equipo } from "@/lib/types";
import { calculateInstallmentPrice, normalizeStockCategoryValue } from "@/lib/utils";
import { saveStockCatalog, type PriceRule, uploadImage } from "./lib";

const parseRows = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); }
  return rows;
};

const numberValue = (value: string | undefined) => {
  const raw = String(value ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSpecs = (value: string | undefined): Record<string, string> => {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([, item]) => typeof item === "string" && item.trim()).map(([key, item]) => [key, String(item)]));
  } catch { return {}; }
};

const mapSpecs = (raw: Record<string, string>) => ({
  ...raw,
  procesador: raw.Procesador || raw.procesador,
  almacenamiento: raw.Almacenamiento || raw.almacenamiento,
  pantalla: raw.Pantalla || raw.pantalla,
  sistema: raw["Sistema Operativo"] || raw.sistema,
  ram: raw.Memoria || raw.ram,
  placaVideo: raw["Placa Gráfica"] || raw.placaVideo,
  conectividad: raw.Conectividad || raw.conectividad,
});

const calculateNotebookPrice = (cost: number, priceRules: PriceRule[]) => {
  const rule = priceRules.find(
    (item) => cost >= (item.min || 0) && (item.max == null || cost < item.max),
  );
  return rule
    ? Math.round(cost + (cost * (Number(rule.pct) || 0)) / 100)
    : Math.round(cost);
};

export default function NotebookBulkUpload({
  equipos,
  priceRules,
  dollarQuote,
  persistent,
  onSaved,
}: {
  equipos: Equipo[];
  priceRules: PriceRule[];
  dollarQuote: { valor: number; actualizadoEn: string } | null;
  persistent: boolean;
  onSaved: (equipos: Equipo[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<string[][] | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    imageInputRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  useEffect(() => {
    const urls = Object.fromEntries(imageFiles.map((image) => [image.name, URL.createObjectURL(image)]));
    setImagePreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const selectImages = (files: FileList | null) => {
    const sorted = Array.from(files || []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );
    setImageFiles(sorted);
  };

  const previewImageFor = (row: string[], headers: string[], index: number) => {
    const id = String(row[headers.indexOf("id")] || "").trim();
    const file = imageFiles.find((candidate) => {
      const relativePath = String((candidate as File & { webkitRelativePath?: string }).webkitRelativePath || "");
      return relativePath.split(/[\\/]/).includes(id) || candidate.name.startsWith(`${id}_`) || candidate.name.startsWith(`${id}-`);
    }) || imageFiles[index];
    return file ? imagePreviewUrls[file.name] : "";
  };

  const previewFile = async () => {
    if (!file) return;
    try {
      const rows = parseRows(await file.text());
      if (rows.length < 2) throw new Error("El CSV debe tener una cabecera y al menos una notebook.");
      const headers = rows[0].map((value) => value.replace(/^\uFEFF/, "").replace(/\*/g, "").trim().toLowerCase());
      const missing = ["id", "nombre", "categoria"].filter((key) => !headers.includes(key));
      if (missing.length) throw new Error(`Faltan columnas: ${missing.join(", ")}.`);
      setPreviewRows(rows);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo previsualizar el CSV.");
    }
  };

  const uploadNotebookImages = async (files: File[], rows: string[][], headers: string[]) => {
    const idIndex = headers.indexOf("id");
    const uploaded = new Map<string, string[]>();
    const rowIds = rows.map((row) => String(row[idIndex] || "").trim()).filter(Boolean);

    for (const file of files) {
      const relativePath = String((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
      const pathParts = relativePath.split(/[\\/]/).filter(Boolean);
      const stem = file.name.replace(/\.[^.]+$/, "");
      const id = rowIds.find((candidate) =>
        pathParts.slice(0, -1).includes(candidate) ||
        stem === candidate ||
        stem.startsWith(`${candidate}_`) ||
        stem.startsWith(`${candidate}-`),
      );
      if (!id) {
        throw new Error(`No se pudo vincular la imagen "${file.name}" con un ID del CSV. Usá nombres como 1_img_1.jpg.`);
      }
      const url = await uploadImage(file);
      uploaded.set(id, [...(uploaded.get(id) || []), url].slice(0, 3));
    }
    return uploaded;
  };

  const importFile = async () => {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const rows = parseRows(await file.text());
      if (rows.length < 2) throw new Error("El CSV debe tener una cabecera y al menos una notebook.");
      const headers = rows[0].map((value) => value.replace(/^\uFEFF/, "").replace(/\*/g, "").trim().toLowerCase());
      const required = ["id", "nombre", "categoria", "precio", "preciocosto", "stock", "imagen", "imagenes", "specs", "esnuevo", "originalcatalogprice"];
      const missing = required.filter((key) => !headers.includes(key));
      if (missing.length) throw new Error(`Faltan columnas: ${missing.join(", ")}.`);
      const index = (key: string) => headers.indexOf(key);
      const uploadedImages = imageFiles.length
        ? await uploadNotebookImages(imageFiles, rows.slice(1), headers)
        : new Map<string, string[]>();
      const byId = new Map(equipos.map((item) => [String(item.id), item]));
      const byName = new Map(equipos.map((item) => [item.nombre.trim().toLowerCase(), item]));
      let created = 0; let updated = 0; let skipped = 0;
      const imported: Equipo[] = [];

      for (const row of rows.slice(1)) {
        const value = (key: string) => String(row[index(key)] ?? "").trim();
        const nombre = value("nombre");
        if (!nombre || normalizeStockCategoryValue(value("categoria")) !== "notebook") { skipped += 1; continue; }
        const current = byId.get(value("id")) || byName.get(nombre.toLowerCase());
        const precio = numberValue(value("precio"));
        const precioCostoColumn = numberValue(value("preciocosto"));
        // In the notebook CSV, `precio` is the supplier cost in ARS.
        const importedCost = precio ?? precioCostoColumn;
        const hasImportedCost = importedCost !== undefined;
        const precioVenta = hasImportedCost
          ? calculateNotebookPrice(importedCost, priceRules)
          : Number(current?.promo || current?.original || 0);
        const stock = numberValue(value("stock"));
        const image = value("imagen");
        const images = value("imagenes").split(";").map((item) => item.trim()).filter(Boolean);
        const selectedImages = uploadedImages.get(value("id"));
        const specs = parseSpecs(value("specs"));
        const next: Equipo = {
          ...(current || {
            id: value("id") || `${Date.now()}-${imported.length}`,
            orden: equipos.length + imported.length,
            marca: "",
            modelo: "",
            detail: "",
            notasPrivadas: "",
            estado: "disponible",
            recomendada: false,
            warranty: "",
            componentes: [],
          }),
          id: current?.id || value("id") || `${Date.now()}-${imported.length}`,
          nombre,
          categoria: "notebook",
          promo: precioVenta,
          original: hasImportedCost
            ? calculateInstallmentPrice(precioVenta)
            : current?.original || calculateInstallmentPrice(precioVenta),
          precioCosto: importedCost ?? current?.precioCosto ?? 0,
          ...(hasImportedCost
            ? {
                monedaCosto: "ARS" as const,
                costoBaseUsd: undefined,
                cotizacionDolar: undefined,
                costoActualizadoEn: undefined,
              }
            : {}),
          stock: stock ?? current?.stock ?? 0,
          condition: value("esnuevo") ? (value("esnuevo").toLowerCase() === "true" ? "Sellado" : "Reacondicionado") : current?.condition || "Sellado",
          imagenes: selectedImages?.length ? selectedImages : images.length ? images : image ? [image] : current?.imagenes || [],
          specs: Object.keys(specs).length ? { ...(current?.specs || {}), ...mapSpecs(specs) } : current?.specs || {},
          esNuevo: value("esnuevo") ? value("esnuevo").toLowerCase() === "true" : current?.esNuevo,
          originalCatalogPrice: numberValue(value("originalcatalogprice")) ?? current?.originalCatalogPrice,
        };
        imported.push(next);
        if (current) updated += 1; else created += 1;
        byId.set(String(next.id), next); byName.set(nombre.toLowerCase(), next);
      }
      if (!imported.length) throw new Error("No se encontraron notebooks válidas para importar.");
      const importedIds = new Set(imported.map((item) => item.id));
      const nextEquipos = [...equipos.filter((item) => !importedIds.has(item.id)), ...imported];
      await saveStockCatalog(nextEquipos, priceRules, dollarQuote || undefined);
      onSaved(nextEquipos);
      setFile(null);
      setImageFiles([]);
      setMessage(`Carga completada. Creadas: ${created}. Actualizadas: ${updated}. Omitidas: ${skipped}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo importar el CSV."); }
    finally { setBusy(false); }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-sm font-semibold text-slate-900">Carga masiva de notebooks</h3><p className="mt-1 text-xs text-slate-500">Usa el formato de notebooks y conserva los datos existentes cuando una celda está vacía.</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"><Upload className="size-4" />Seleccionar CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setMessage(""); }} /></label>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Imágenes de notebooks</p>
            <p className="mt-1 text-xs text-slate-600">Seleccioná hasta 3 por notebook. Nombralas con el ID del CSV, por ejemplo: 1_img_1.jpg, 1_img_2.jpg y 1_img_3.jpg.</p>
          </div>
          <label className="w-full cursor-pointer rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto">
            Seleccionar imágenes
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => selectImages(event.target.files)} />
          </label>
        </div>
        {imageFiles.length > 0 && <p className="mt-2 text-xs font-medium text-sky-800">{imageFiles.length} imagen{imageFiles.length === 1 ? "" : "es"} seleccionada{imageFiles.length === 1 ? "" : "s"}. Se vincularán por ID al importar.</p>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-600">{file ? file.name : "Ningún archivo seleccionado"}</span>
         <button type="button" onClick={() => void previewFile()} disabled={!file || busy} className="min-h-11 w-full rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">Previsualizar</button>
         <button type="button" onClick={() => void importFile()} disabled={!file || busy || !persistent} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{busy && <Loader2 className="size-4 animate-spin" />}Importar notebooks</button>
       </div>
       {previewRows && (() => {
         const headers = previewRows[0].map((value) => value.replace(/^\uFEFF/, "").replace(/\*/g, "").trim().toLowerCase());
         const column = (row: string[], key: string) => row[headers.indexOf(key)] || "";
         return <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
           <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-900">Vista previa de notebooks</p><span className="text-xs font-semibold text-slate-500">{previewRows.length - 1} encontradas</span></div>
           <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
             {previewRows.slice(1).map((row, index) => {
               const image = previewImageFor(row, headers, index);
               return <article key={`${column(row, "id")}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 p-3 shadow-sm">
                 <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{image ? <img src={image} alt="" className="h-full w-full object-contain" /> : <span className="px-2 text-center text-[10px] text-slate-400">Sin imagen</span>}</div>
                 <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold text-slate-900">{column(row, "nombre") || "Notebook sin nombre"}</p><p className="mt-1 text-xs text-slate-500">ID: {column(row, "id") || "-"}</p><p className="mt-2 text-xs font-semibold text-emerald-700">Costo: ${column(row, "precio") || column(row, "preciocosto") || "0"}</p></div>
               </article>;
             })}
           </div>
         </div>;
       })()}
       {message && <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}
    </section>
  );
}
