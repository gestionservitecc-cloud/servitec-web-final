import { describe, expect, it } from "vitest";
import {
  calculateNationalPrice,
  isAccessoryCategoryValue,
  isPcArmadaCategoryValue,
  normalizeCsvProductName,
  normalizeStockCategoryValue,
  shouldIgnoreCsvProduct,
} from "./utils";
import {
  componentCatalogLabels,
  matchesMonitorProduct,
  matchesProductKeywords,
  matchesSpeakerProduct,
} from "./pc-catalog";

describe("calculateNationalPrice", () => {
  it("divide por 1,21 para el precio nacional", () => {
    expect(calculateNationalPrice(121)).toBe(100);
    expect(calculateNationalPrice(242)).toBe(200);
    expect(calculateNationalPrice(1000)).toBeCloseTo(826.45, 2);
  });
});

describe("csv product import helpers", () => {
  it("normaliza nombres y omite articulos que no deben importarse", () => {
    expect(normalizeCsvProductName("  CLEAR - MATE  ")).toBe("clear mate");
    expect(shouldIgnoreCsvProduct("CLEAR")).toBe(true);
    expect(shouldIgnoreCsvProduct("MATE ANTIESPIA")).toBe(true);
    expect(shouldIgnoreCsvProduct("MATE 10 Pro")).toBe(true);
    expect(shouldIgnoreCsvProduct("Samsung Galaxy A55")).toBe(false);
  });
});

describe("stock category normalization", () => {
  it("trata todos los aliases de PC armada como la misma categoria", () => {
    expect(normalizeStockCategoryValue("pc")).toBe("pc-armada");
    expect(normalizeStockCategoryValue("pc-armada")).toBe("pc-armada");
    expect(normalizeStockCategoryValue("pc armadas")).toBe("pc-armada");
    expect(isPcArmadaCategoryValue("pc")).toBe(true);
    expect(isPcArmadaCategoryValue("pc-armada")).toBe(true);
  });
});

describe("catalog labels", () => {
  it("expone etiquetas legibles para cada tipo de componente", () => {
    expect(componentCatalogLabels.graphics).toBe("Placa de video");
    expect(componentCatalogLabels.power).toBe("Fuente");
    expect(componentCatalogLabels.case).toBe("Gabinete");
  });
});

describe("accessory inventory filtering", () => {
  it("solo considera categorias de accesorios para el valor de inventario", () => {
    expect(isAccessoryCategoryValue("ACCESORIOS")).toBe(true);
    expect(isAccessoryCategoryValue("CARGADORES")).toBe(true);
    expect(isAccessoryCategoryValue("ARTICULOS")).toBe(true);
    expect(isAccessoryCategoryValue("GABINETE")).toBe(false);
    expect(isAccessoryCategoryValue("FUENTE")).toBe(false);
    expect(isAccessoryCategoryValue("") ).toBe(true);
  });
});

describe("peripheral product matching", () => {
  it("detecta monitores y parlantes con nombres reales del catálogo", () => {
    expect(matchesMonitorProduct("Monitor Gamer ASUS VY229HF-J 22 FHD IPS 100Hz")).toBe(true);
    expect(matchesSpeakerProduct("Parlantes Logitech Z407 2.1")).toBe(true);
    expect(matchesProductKeywords("Teclado mecánico RGB", ["teclado", "keyboard"])).toBe(true);
    expect(matchesSpeakerProduct("Monitor LG 24BR550Y 24 IPS FHD 75Hz parlantes integrados")).toBe(false);
    expect(matchesMonitorProduct("Teclado para monitor gamer")).toBe(false);
  });
});
