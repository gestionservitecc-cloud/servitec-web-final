"use client";
import React, { useEffect, useState } from "react";
import { componentCatalogKeys, componentCatalogLabels, type ComponentCatalogKey } from "@/lib/component-catalog";
import CategoryPriceRules, { type PriceRule } from "./CategoryPriceRules";

type PriceRules = Partial<Record<ComponentCatalogKey, PriceRule[]>>;

export default function BulkUploadDialog({ onClose, onUploaded, persistent, initialCategory, priceRules: initialPriceRules }: { onClose: () => void; onUploaded: () => void; persistent: boolean; initialCategory?: ComponentCatalogKey; priceRules?: PriceRules; }) {
  const [collection] = useState("componentes");
  const [category, setCategory] = useState<ComponentCatalogKey>(initialCategory ?? componentCatalogKeys[0]);
  const [rulesByCategory, setRulesByCategory] = useState<PriceRules>(initialPriceRules || {});
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<string, string>>({});
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "confirm">("select");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urls = Object.fromEntries(imageFiles.map((file) => [file.name, URL.createObjectURL(file)]));
    // Object URLs are browser resources synchronized from the selected files.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImagePreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const submit = async () => {
    if (!dataFile) return setMessage("Seleccioná un archivo .csv");
    if (!persistent) return setMessage("El almacenamiento no está configurado en este entorno.");
      setLoading(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("collection", collection);
        if (collection === "componentes") fd.append("category", category as string);
      fd.append("priceRules", JSON.stringify(rulesByCategory[category] || []));
      fd.append("data", dataFile);
      imageFiles.forEach((file) => fd.append("images", file));
      const res = await fetch("/api/admin/bulk-upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Error al subir");
      setMessage("Subida completada");
      onUploaded();
      handleClose();
    } catch (err) {
      setStep("preview");
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const parseDataForPreview = async () => {
    if (!dataFile) return setMessage("Seleccioná un archivo .csv");
    try {
      const text = await dataFile.text();
      let arr: any[] = [];
      if (!/\.csv$/i.test(dataFile.name)) throw new Error("La carga masiva solo admite archivos .csv");
      {
        // parse CSV
        const rows = parseCsvRows(text);
        if (rows.length < 1) return setMessage("El CSV no tiene filas");
        const headers = rows[0].map((h) => String(h || "").trim());
        arr = rows.slice(1).map((row) => {
          const obj: any = {};
          for (let i = 0; i < headers.length; i++) obj[headers[i]] = row[i] ?? "";
          return obj;
        });
      }
      // basic image matching by filename / id / name
      setParsedPreview(arr.map((item) => ({ item })));
      setStep("preview");
      setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
  };

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
        if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
        row = [];
        current = "";
        continue;
      }

      current += char;
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
    }

    return rows;
  };

  const confirmAndUpload = async () => {
    if (!dataFile) return setMessage("Seleccioná un archivo .csv");
    setStep("confirm");
    await submit();
  };

  const Spinner = (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );

  const handleClose = () => {
    onClose();
  };

  const selectImages = (files: FileList | null) => {
    const sorted = Array.from(files || []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );
    setImageFiles(sorted);
  };

  const previewImageFor = (item: any, index: number) => {
    const itemId = String(item?.id || "");
    const itemNumber = itemId.match(/(?:^|[-_])(\d+)(?:[-_]|$)/)?.[1] || String(index + 1);
    const file = imageFiles.find((candidate) => {
      const source = `${candidate.name} ${(candidate as File & { webkitRelativePath?: string }).webkitRelativePath || ""}`;
      const number = source.match(/(?:foto|image|img)[ _-]?(\d+)/i)?.[1] || source.match(/(?:^|[\\/_-])(\d+)(?:[\\/_-]|\.)/)?.[1];
      return number === itemNumber;
    }) || imageFiles[index];
    return file ? imagePreviewUrls[file.name] : "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" aria-busy={loading}>
      <div className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Carga masiva de componentes (CSV)</h3>
          <a href="/plantillas/componentes.csv" download className="text-sm font-semibold text-sky-700 hover:underline">Descargar plantilla</a>
        </div>
        <div className="overflow-auto pr-2">
          <div className="mb-3">
            <label className="block text-sm font-semibold text-slate-800">Colección</label>
            <div className="mt-1 w-full rounded border bg-slate-50 px-3 py-2 text-slate-900">Componentes</div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold text-slate-800">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ComponentCatalogKey)} className="mt-1 w-full rounded border px-3 py-2 bg-white text-slate-900">
              {componentCatalogKeys.map((k) => (
                <option key={k} value={k}>{componentCatalogLabels[k].toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-800">AUMENTO PARA ESTA CATEGORÍA</div>
            <CategoryPriceRules
              rules={rulesByCategory[category] || []}
              onChange={(next) => setRulesByCategory((current) => ({ ...current, [category]: next }))}
            />
          </div>
          <div className="mb-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Imagenes de componentes</p>
                <p className="mt-1 text-xs text-slate-600">Se vinculan por numero: foto1 al componente con ID 1, foto2 al ID 2. Si el archivo no tiene numero, se usa su posicion.</p>
              </div>
              <label className="cursor-pointer rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                Seleccionar imagenes
                <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => selectImages(event.target.files)} />
              </label>
            </div>
            {imageFiles.length > 0 && (
              <p className="mt-2 text-xs font-medium text-sky-800">
                {imageFiles.length} imagen{imageFiles.length === 1 ? "" : "es"} seleccionada{imageFiles.length === 1 ? "" : "s"}. Se cargarn junto con el CSV.
              </p>
            )}
          </div>
        {step === "select" && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-slate-800">Archivo CSV</label>
              <div className="mt-2 flex items-center gap-2">
                <input type="file" accept=".csv,text/csv" onChange={(e) => setDataFile(e.target.files?.[0] || null)} className="hidden" id="component-csv-input" />
                <button
                  type="button"
                  onClick={() => document.getElementById("component-csv-input")?.click()}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Seleccionar CSV
                </button>
                <div className="text-sm text-slate-800">{dataFile ? dataFile.name : "Ningún archivo seleccionado"}</div>
              </div>
            </div>
          </>
        )}

        {step === "preview" && parsedPreview && (
          <div className="space-y-4">
            <div className="mb-2 text-sm text-slate-700">
              <strong>Componentes encontrados:</strong> {parsedPreview.length}
              <br />
            </div>
            <div className="mb-2">
              <strong className="block text-sm mb-2">Vista previa de componentes</strong>
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedPreview.map((entry: any, i: number) => {
                  const it = entry.item || entry;
                  const cost = Number(it.precioCosto ?? it.precio ?? it.price ?? 0) || 0;
                  const rule = (rulesByCategory[category] || []).find((item) => cost >= (item.min || 0) && (item.max == null || cost < item.max));
                  const percentage = rule?.pct || 0;
                  const increase = Math.round(cost * percentage / 100);
                  const finalPrice = cost + increase;
                  return (
                    <div key={i} className="flex gap-3 rounded-md border p-3">
                      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {previewImageFor(it, i) ? <img src={previewImageFor(it, i)} alt="" className="h-full w-full object-contain" /> : <span className="px-2 text-center text-[10px] text-slate-400">Sin imagen</span>}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="font-medium text-rose-600">{it.nombre || it.title || it.name}</div>
                          <div className="text-xs text-slate-600">{componentCatalogLabels[category]}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex flex-col text-slate-800"><span className="text-xs text-slate-600">Precio costo</span><span className="font-semibold">{new Intl.NumberFormat('es-AR').format(cost)}</span></div>
                          <div className="flex flex-col text-slate-800"><span className="text-xs text-slate-600">Aumento</span><span className="font-semibold">{percentage}%</span></div>
                          <div className="flex flex-col text-slate-800"><span className="text-xs text-slate-600">Monto aumento</span><span className="font-semibold">{new Intl.NumberFormat('es-AR').format(increase)}</span></div>
                          <div className="flex flex-col text-slate-900 ml-auto text-right"><span className="text-xs text-slate-600">Efectivo / transferencia</span><span className="font-semibold">{new Intl.NumberFormat('es-AR').format(finalPrice)}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* footer actions moved to sticky footer */}
          </div>
        )}
        {step === "confirm" && loading && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <svg className="h-10 w-10 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <div>
              <p className="font-semibold text-slate-900">Importando componentes...</p>
              <p className="mt-1 text-sm text-slate-500">No cierres esta ventana hasta finalizar.</p>
            </div>
          </div>
        )}
        {message && <p className="text-sm text-rose-600 mb-2">{message}</p>}
        </div>
        {/* Footer with actions (outside scroll area) */}
        <div className="mt-4 w-full border-t bg-white py-3">
          <div className="mx-auto flex max-w-[640px] flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {step === "select" && (
              <>
                <button onClick={handleClose} disabled={loading} className="min-h-11 rounded border px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
                <button onClick={parseDataForPreview} disabled={loading || !dataFile} className="min-h-11 rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : null}
                  <span>{loading ? "Cargando..." : "Previsualizar"}</span>
                </button>
              </>
            )}
            {step === "preview" && (
              <>
                <button onClick={() => setStep("select")} disabled={loading} className="rounded border px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">Volver</button>
                <button onClick={confirmAndUpload} disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : null}
                  <span>{loading ? "Importando..." : "Confirmar e importar"}</span>
                </button>
              </>
            )}
            {step === "confirm" && (
              <button onClick={handleClose} disabled className="rounded bg-slate-400 px-4 py-2 text-white">Procesando...</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
