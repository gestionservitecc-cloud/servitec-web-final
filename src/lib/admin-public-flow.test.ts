import { afterEach, beforeEach, expect, it, vi } from "vitest";

const isolated = vi.hoisted(() => ({ admin: true, equipos: [] as unknown[], blobWrites: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: async () => isolated.admin }));
vi.mock("@vercel/blob", () => ({ get: vi.fn(), put: isolated.blobWrites }));
vi.mock("@/lib/store", () => ({
  getEquipos: async () => isolated.equipos,
  saveEquipos: async (value: unknown[]) => { isolated.equipos = value; },
  storeIsPersistent: () => true,
}));
import { PUT } from "../../app/api/admin/equipos/route";
import { GET } from "../../app/api/equipos/route";

beforeEach(() => { isolated.admin = true; isolated.equipos = []; isolated.blobWrites.mockResolvedValue({}); });
afterEach(() => vi.clearAllMocks());
const request = (rows: unknown[]) => new Request("http://isolated.test/api/admin/equipos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });

it("saves through the real admin handler and exposes updated public fields without private data", async () => {
  const row = { id: "qa", categoria: "notebook", nombre: "Equipo de prueba", promo: 75000, orden: 5, recomendada: true, notasPrivadas: "private", precioCosto: 20, imagenes: ["/one.jpg"] };
  expect((await PUT(request([row]))).status).toBe(200);
  let publicRows = await (await GET()).json();
  expect(publicRows[0]).toMatchObject({ id: "qa", promo: 75000, orden: 5, recomendada: true, imagenes: ["/one.jpg"] });
  expect(publicRows[0]).not.toHaveProperty("notasPrivadas");
  expect(publicRows[0]).not.toHaveProperty("precioCosto");
  expect((await PUT(request([{ ...row, promo: 90000, estado: "vendido", recomendada: false, imagenes: ["/two.jpg"] }]))).status).toBe(200);
  publicRows = await (await GET()).json();
  expect(publicRows[0]).toMatchObject({ promo: 90000, estado: "vendido", recomendada: false, imagenes: ["/two.jpg"] });
});

it("preserves authorization and validation", async () => {
  isolated.admin = false;
  expect((await PUT(request([]))).status).toBe(401);
  isolated.admin = true;
  expect((await PUT(request([{ id: "invalid", promo: -1 }]))).status).toBe(400);
  expect(isolated.equipos).toEqual([]);
});
