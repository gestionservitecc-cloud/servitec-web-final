import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/store", () => ({ getEquipos: async () => { throw new Error("isolated storage failure"); } }));
import { getProductShareData } from "./product-share";

it("keeps the product page available for its retry UI when metadata storage fails", async () => {
  expect(await getProductShareData("equipo", "test")).toBeNull();
});
