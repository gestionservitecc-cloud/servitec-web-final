import { describe, expect, it } from "vitest";
import { resolveBlueReferenceFactor } from "./blue-rate";

describe("resolveBlueReferenceFactor", () => {
  it("usa la referencia de compra para recalcular el precio", () => {
    expect(resolveBlueReferenceFactor(1000, 1200)).toBeCloseTo(1.2);
  });

  it("mantiene un factor seguro cuando no hay referencia", () => {
    expect(resolveBlueReferenceFactor(0, 1200)).toBe(1);
  });
});
