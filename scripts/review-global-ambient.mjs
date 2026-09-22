import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const require = createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/api/**", route => {
    assert.equal(route.request().method(), "GET");
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/equipos") return route.fulfill({ json: [{ id: "qa-ambient", nombre: "Equipo de prueba visual", categoria: "notebook", estado: "disponible", condition: "Sellado", stock: 3, original: 100000, promo: 75000, imagenes: [], specs: {}, componentes: [] }] });
    if (path === "/api/productos") return route.fulfill({ json: [] });
    if (path === "/api/componentes") return route.fulfill({ json: { catalog: {} } });
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3100/");
  await page.locator("[data-ready=true]").waitFor();
  const field = await page.locator("[data-global-ambient]").elementHandle();
  const layer = page.locator("[data-ambient-layer]").first();
  await page.waitForTimeout(700);
  const initial = await layer.evaluate(e => getComputedStyle(e).transform);
  await page.waitForTimeout(1200);
  assert.notEqual(await layer.evaluate(e => getComputedStyle(e).transform), initial);
  results.push("Ambient layers move without scrolling");

  const button = page.getByRole("link", { name: "Explorar tienda", exact: true });
  const box = await button.boundingBox();
  assert.equal(box.height, 46);
  assert.equal(await button.evaluate(e => getComputedStyle(e).borderTopWidth), "1px");
  await button.screenshot({ path: "artifacts/qa/global-button-normal.png" });
  await button.hover();
  await page.waitForTimeout(900);
  assert.equal(await button.locator('[class*="labels"]').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m42), -20);
  assert.equal(await button.locator("i").last().evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m11), 1);
  assert.equal((await button.boundingBox()).width, box.width);
  await button.screenshot({ path: "artifacts/qa/global-button-hover.png" });
  await button.focus();
  assert.equal(await button.evaluate(e => getComputedStyle(e).outlineStyle), "solid");
  results.push("Button: 46px height, 1px border, layered fill, rolling labels, stable width and focus");

  for (const [name, path] of [["Servicios", "/servicios"], ["Contacto", "/contacto"], ["Armá tu PC", "/armar-pc"]]) {
    await page.getByRole("link", { name, exact: true }).first().click();
    await page.waitForURL(`**${path}`);
    await page.waitForTimeout(500);
    assert.equal(await field.evaluate(e => e.isConnected), true);
    assert.equal(await page.locator("[data-global-ambient]").count(), 1);
    await page.screenshot({ path: `artifacts/qa/global-persistent-${path.slice(1)}.png` });
  }
  results.push("Same background DOM node survives home/services/contact/builder navigation");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(400);
  assert.equal(await layer.evaluate(e => getComputedStyle(e).transform), "none");
  assert.notEqual(await layer.evaluate(e => getComputedStyle(e).backgroundImage), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  assert.equal(await page.locator("[data-ambient-layer]").last().evaluate(e => getComputedStyle(e).display), "none");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  results.push("Reduced motion keeps static gradients; small screens render only two fields");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3100/producto/equipo/qa-ambient");
  await page.getByRole("button", { name: "Agregar al carrito", exact: true }).click();
  await page.getByRole("button", { name: /Abrir carrito/ }).first().click();
  await page.getByText("Precios verificados al abrir el carrito.").waitFor();
  await page.screenshot({ path: "artifacts/qa/global-cart.png" });
  await page.getByRole("button", { name: "Iniciar pedido por WhatsApp", exact: true }).click();
  await page.getByRole("button", { name: "Enviar por WhatsApp", exact: true }).waitFor();
  await page.screenshot({ path: "artifacts/qa/global-checkout.png" });
  await page.keyboard.press("Escape");
  results.push("Migrated add-to-cart and checkout CTA preserve handlers; no order submitted");
  await page.goto("http://127.0.0.1:3100/servicios");
  await page.evaluate(() => scrollTo({ top: 950, behavior: "instant" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/qa/global-long-scroll.png" });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/qa/global-footer.png" });
  await page.goto("http://127.0.0.1:3100/stock");
  await page.locator("h1").waitFor();
  assert.equal(await page.locator("[data-global-ambient]").count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.screenshot({ path: "artifacts/qa/global-stock.png" });
  await page.goto("http://127.0.0.1:3100/admin");
  assert.equal(await page.locator("[data-global-ambient]").count(), 0);
  assert.deepEqual(errors, []);
  results.push("Admin excluded; no hydration/page errors");
  await writeFile("artifacts/qa/global-ambient-results.json", JSON.stringify(results, null, 2));
  console.log(results.join("\n"));
} finally {
  await browser.close();
}
