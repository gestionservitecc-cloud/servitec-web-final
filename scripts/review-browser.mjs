import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// QA-only dependency installed outside the app; never imported by production.
const require = createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const results = [];
const equipment = { id: "qa-equipo", orden: 1, categoria: "notebook", nombre: "Notebook de prueba aislada · 16 GB RAM · SSD 512 GB", marca: "QA", modelo: "Prueba", detail: "Descripción extensa de prueba para verificar el diseño sin modificar el catálogo real.", condition: "Sellado", estado: "disponible", original: 90000, promo: 75000, recomendada: true, warranty: "Garantía de fixture aislado", imagenes: [], specs: { ram: "16 GB", almacenamiento: "512 GB" }, componentes: [], stock: 4 };
let fixtures = [equipment, { ...equipment, id: "qa-used", orden: 2, nombre: "Unidad reacondicionada de prueba", condition: "Reacondicionado", estado: "vendido" }];
const catalog = { processor: [{ id: "qa-cpu", nombre: "Procesador de prueba aislada", precio: 75000, imagen: "", imagenes: [], specs: { socket: "AM4" }, categoria: "processor" }] };
await context.route("**/api/**", async route => {
  const request = route.request(); const path = new URL(request.url()).pathname;
  if (request.method() !== "GET") throw new Error(`QA forbids writes: ${path}`);
  if (path === "/api/equipos") return route.fulfill({ json: fixtures });
  if (path === "/api/componentes") return route.fulfill({ json: { catalog } });
  if (path === "/api/productos") return route.fulfill({ json: [] });
  return route.continue();
});
await context.addInitScript(() => { window.open = url => { window.__qaWhatsApp = String(url); return null; }; });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));
page.on("console", message => { if (message.type() === "error" && /hydration|hydrated|useEffect.*return/i.test(message.text())) pageErrors.push(message.text()); });
await mkdir("artifacts/qa", { recursive: true });
async function visit(path) {
  await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("main main").count(), 0, `nested main ${path}`);
  assert.ok(await page.locator("h1").count() >= 1, `h1 ${path}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, `overflow ${path}`);
  assert.equal(await page.locator('[data-global-ambient]').count(), 1, `global field ${path}`);
  await page.screenshot({ path: `artifacts/qa/global-route-${page.viewportSize().width}-${path.replace(/[^a-z0-9]/gi, '_') || 'home'}.png` });
}
try {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/tienda", "/tienda?tipo=pc-armada", "/tienda?tipo=componentes", "/tienda?tipo=accesorios", "/reacondicionados", "/presupuesto", "/armar-pc", "/producto/equipo/qa-equipo", "/servicios/notebooks"]) {
      await visit(path);
      results.push({ width, path, layout: "pass" });
    }
    await visit("/");
    await page.locator("h1").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/qa/inicio-${width}.png`, fullPage: true });
    await page.screenshot({ path: `artifacts/qa/inicio-viewport-${width}.png` });
  }
  for (const slug of ["iphone", "ipad", "macbook", "samsung", "motorola", "huawei", "xiaomi", "notebooks", "drones", "consolas", "smart-tv"]) {
    await visit(`/servicios/${slug}`);
    await page.getByRole("button", { name: "No sé mi modelo", exact: true }).click();
    await page.locator("form button[aria-pressed]").first().click();
    await page.getByLabel("Tu nombre", { exact: true }).fill("QA sin envío");
    await page.getByRole("button", { name: "Enviar por WhatsApp", exact: true }).click();
    const url = await page.evaluate(() => window.__qaWhatsApp);
    assert.ok(decodeURIComponent(url).includes("No sé mi modelo"));
    results.push({ slug, inquiry: "pass; window.open intercepted" });
  }
  for (const path of ["/servicios", "/conocenos", "/contacto", "/faqs", "/formas-de-pago", "/condiciones", "/politica-de-privacidad"]) { await visit(path); results.push({ path, layout: "pass" }); }
  await visit("/presupuesto");
  await page.getByLabel("Tu nombre", { exact: true }).fill("QA");
  await page.getByLabel("Dispositivo", { exact: true }).fill("Mi equipo");
  await page.getByLabel("¿Qué necesitás?", { exact: true }).fill("No enciende");
  await page.getByRole("button", { name: "Revisar consulta", exact: true }).click();
  await page.getByRole("button", { name: "Abrir WhatsApp con esta consulta" }).waitFor();
  results.push({ budget: "summary before WhatsApp pass" });
  await visit("/producto/equipo/qa-equipo");
  await page.getByRole("button", { name: /Tarjeta de crédito/ }).click();
  await page.getByRole("button", { name: "Agregar al carrito", exact: true }).click();
  let cart = await page.evaluate(() => JSON.parse(localStorage.getItem("servitec-tienda-carrito")));
  assert.equal(cart[0].precio, 100000); assert.equal(cart[0].paymentMethod, "tarjeta");
  fixtures = fixtures.map(item => item.id === "qa-equipo" ? { ...item, promo: 150000 } : item);
  await page.getByRole("button", { name: /Abrir carrito/ }).filter({ visible: true }).first().click();
  await page.getByText("Precios verificados al abrir el carrito.").waitFor();
  cart = await page.evaluate(() => JSON.parse(localStorage.getItem("servitec-tienda-carrito")));
  assert.equal(cart[0].precio, 200000);
  await page.getByRole("button", { name: "Agregar una unidad" }).click();
  assert.equal(await page.getByRole("dialog").getByText("$400.000", { exact: true }).count(), 2);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  results.push({ cart: "payment, admin price propagation, quantity, escape pass" });
  await visit("/tienda?tipo=equipos");
  await page.getByLabel("Buscar producto", { exact: true }).fill("Notebook");
  await page.waitForURL(/q=Notebook/);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Buscar producto", { exact: true }).inputValue(), "Notebook");
  results.push({ filters: "URL and reload pass" });
  await page.screenshot({ path: "artifacts/qa/tienda-1440.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 });
  await visit("/servicios/ipad");
  await page.locator("#consulta").click({ position: { x: 10, y: 10 } });
  await page.locator("#consulta").screenshot({ path: "artifacts/qa/consulta-390.png" });
  await visit("/producto/equipo/qa-equipo");
  await page.screenshot({ path: "artifacts/qa/producto-390.png", fullPage: true });
  assert.deepEqual(pageErrors, [], "browser errors");
} finally {
  await writeFile("artifacts/qa/results.json", JSON.stringify({ results, pageErrors }, null, 2));
  await browser.close();
}
console.log(`${results.length} browser checks passed; screenshots in artifacts/qa`);
