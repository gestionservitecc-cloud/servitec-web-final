import { afterEach, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@vercel/blob", () => ({ get: storage.get }));
import { GET } from "../../app/api/componentes/route";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it("retains component specs and IDs, removes private fields, bypasses Blob cache", async () => {
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "isolated-test-only");
  storage.get.mockImplementation(async () => ({ stream: new Response(JSON.stringify([{ id: "cpu-1", nombre: "CPU", precio: 200, stock: 0, specs: { socket: "AM4" }, precioCosto: 1, notasPrivadas: "private", originalCatalogPrice: 5, costoBaseUsd: 2, cotizacionDolar: 4, monedaCosto: "USD", costoActualizadoEn: "private" }])).body }));
  const response = await GET();
  const { catalog } = await response.json();
  const product = Object.values(catalog)[0][0];
  expect(product).toMatchObject({ id: "cpu-1", precio: 200, stock: 0, specs: { socket: "AM4" } });
  for (const field of ["precioCosto", "notasPrivadas", "originalCatalogPrice", "costoBaseUsd", "cotizacionDolar", "monedaCosto", "costoActualizadoEn"]) expect(product).not.toHaveProperty(field);
  expect(storage.get.mock.calls[0][1]).toMatchObject({ useCache: false });
});

it("distinguishes unavailable storage from an empty collection", async () => {
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "isolated-test-only");
  storage.get.mockRejectedValue(new Error("offline"));
  expect((await GET()).status).toBe(503);
  storage.get.mockResolvedValue(null);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(Object.values((await response.json()).catalog).every((rows: unknown[]) => rows.length === 0)).toBe(true);
});
