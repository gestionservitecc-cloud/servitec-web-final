import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ equipos: [] as unknown[], productos: [] as unknown[] }));
vi.mock("@/lib/store", () => ({
  getEquipos: async () => state.equipos,
  getProductos: async () => state.productos,
  storeIsPersistent: () => true,
}));
import { GET as getEquipos } from "../../app/api/equipos/route";
import { GET as getProductos } from "../../app/api/productos/route";

describe("public admin projections (isolated storage)", () => {
  beforeEach(() => { state.equipos = []; state.productos = []; });
  it("reflects updates and retains public relations but strips private fields", async () => {
    state.equipos = [{ id: "e1", orden: 4, promo: 100, recomendada: true, estado: "vendido", imagenes: ["/real.jpg"], specs: { ram: "16GB" }, notasPrivadas: "private", precioCosto: 50, originalCatalogPrice: 60, monedaCosto: "USD", costoBaseUsd: 1, cotizacionDolar: 100, costoActualizadoEn: "private" }];
    const response = await getEquipos();
    const rows = await response.json();
    expect(rows[0]).toEqual({ id: "e1", orden: 4, promo: 100, recomendada: true, estado: "vendido", imagenes: ["/real.jpg"], specs: { ram: "16GB" } });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    state.equipos[0] = { ...state.equipos[0] as object, promo: 200, recomendada: false };
    expect((await (await getEquipos()).json())[0]).toMatchObject({ promo: 200, recomendada: false });
  });
  it("does not expose accessory costs", async () => {
    state.productos = [{ id: "a1", precio: 100, precioCosto: 20, stock: 0 }];
    expect(await (await getProductos()).json()).toEqual([{ id: "a1", precio: 100, stock: 0 }]);
  });
});
