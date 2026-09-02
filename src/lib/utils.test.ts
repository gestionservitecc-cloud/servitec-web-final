import { describe, expect, it } from "vitest";
import {
  calculateInstallmentPrice,
  calculateNationalPrice,
  isAccessoryCategoryValue,
  isPcArmadaCategoryValue,
  normalizeCsvProductName,
  normalizeImportedCategory,
  normalizeStockCategoryValue,
  shouldIgnoreCsvProduct,
} from "./utils";
import {
  componentCatalogLabels,
  matchesMonitorProduct,
  matchesProductKeywords,
  matchesSpeakerProduct,
} from "./pc-catalog";
import { hasCatalogPrice, normalizeCatalogProduct, resolveCatalogImagePath } from "./component-catalog";
import { buildPedidoMessage, formatPedidoNumero, getNextPedidoNumber } from "./order-data";

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

  it("normaliza categorias importadas desde CSV de otras apps", () => {
    expect(normalizeImportedCategory("accesorios")).toBe("ACCESORIOS");
    expect(normalizeImportedCategory("Cargadores")).toBe("ACCESORIOS");
    expect(normalizeImportedCategory("pc armada")).toBe("PC-ARMADA");
  });
});

describe("catalog labels", () => {
  it("expone etiquetas legibles para cada tipo de componente", () => {
    expect(componentCatalogLabels.graphics).toBe("Placa de video");
    expect(componentCatalogLabels.power).toBe("Fuente");
    expect(componentCatalogLabels.case).toBe("Gabinete");
  });
});

describe("catalog image path resolution", () => {
  it("usa la subcarpeta de imagenes real del blob para cada categoria", () => {
    expect(resolveCatalogImagePath("foto1.jpg", "cooling")).toBe("componentes/COOLER/cooler_img/foto1.jpg");
    expect(resolveCatalogImagePath("cooler_img/foto1.jpg", "cooling")).toBe("componentes/COOLER/cooler_img/foto1.jpg");
    expect(resolveCatalogImagePath("componentes/COOLER/cooler_img/foto1.jpg", "cooling")).toBe("componentes/COOLER/cooler_img/foto1.jpg");
    expect(resolveCatalogImagePath("foto1.jpg", "graphics")).toBe("componentes/GRAFICA/grafica_img/foto1.jpg");
  });

  it("asigna la foto numerada cuando el producto no trae imagen", () => {
    const product = normalizeCatalogProduct(
      { nombre: "Producto de prueba", precio: 1000, imagenes: [] },
      "motherboard",
      0,
    );
    expect(product.imagen).toBe("/api/assets/componentes/MOTHERBOARD/motherboard_img/foto1.jpg");
  });
});

describe("installment price calculation", () => {
  it("calcula el valor en 3/6 cuotas a partir del precio efectivo", () => {
    expect(calculateInstallmentPrice(1500)).toBe(2000);
    expect(calculateInstallmentPrice(2000)).toBe(2666.67);
    expect(calculateInstallmentPrice(0)).toBe(0);
  });
});

describe("catalog price validation", () => {
  it("descarta productos sin precio real para la tienda", () => {
    expect(hasCatalogPrice(0)).toBe(false);
    expect(hasCatalogPrice(undefined)).toBe(false);
    expect(hasCatalogPrice(1500)).toBe(true);
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

describe("pedido message formatting", () => {
  it("genera el número y el texto del pedido con el formato esperado", () => {
    expect(formatPedidoNumero(10000)).toBe("#10.000");
    expect(getNextPedidoNumber([{ numeroPedido: 10000 }, { numeroPedido: 10001 }])).toBe(10002);
    expect(buildPedidoMessage({
      numeroPedido: 10000,
      items: [{ nombre: "SSD 1TB", cantidad: 1, precio: 12000 }],
      total: 12000,
    })).toContain("Pedido #10.000");
    expect(buildPedidoMessage({
      numeroPedido: 10000,
      items: [{ nombre: "SSD 1TB", cantidad: 1, precio: 12000 }],
      total: 12000,
    })).toContain("Hola ServiTec");
  });
});
