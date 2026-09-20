import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const checks = [];
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && /hydration|hydrated|useEffect.*return/i.test(message.text())) errors.push(message.text()); });
let mode = "error";
let release;
let pending = Promise.resolve();
const equipo = { id: "test", orden: 1, categoria: "notebook", nombre: "Equipo aislado para prueba", marca: "QA", modelo: "QA", detail: "", condition: "Sellado", estado: "disponible", original: 75000, promo: 75000, recomendada: true, warranty: "", imagenes: [], specs: {}, componentes: [], stock: 2 };
const component = (id, name, socket) => ({ id, nombre: name, precio: 7500, imagen: "", imagenes: [], specs: { socket }, categoria: "processor" });
const catalog = { processor: [component("cpu", "CPU prueba AM4", "AM4")], motherboard: [component("mb1", "Mother prueba AM4", "AM4"), component("mb2", "Mother prueba AM5", "AM5")] };
await context.route("**/api/**", async route => {
  const path = new URL(route.request().url()).pathname;
  assert.equal(route.request().method(), "GET", "No real writes during QA");
  if (!path.match(/^\/api\/(equipos|componentes|productos)$/)) return route.continue();
  if (mode === "loading") await pending;
  if (mode === "error") return route.fulfill({ status: 503, json: { error: "isolated failure" } });
  if (path === "/api/componentes") return route.fulfill({ json: { catalog: mode === "empty" ? {} : catalog } });
  if (path === "/api/productos") return route.fulfill({ json: [] });
  return route.fulfill({ json: mode === "empty" ? [] : [{ ...equipo, estado: mode === "sold" ? "vendido" : "disponible" }] });
});
async function visit(path) { await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: "networkidle" }); }
try {
  await visit("/tienda?tipo=equipos");
  await page.getByRole("heading", { name: "No pudimos cargar el catálogo" }).waitFor();
  assert.equal(await page.getByText("No encontramos productos con esos filtros.").count(), 0);
  mode = "empty";
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await page.getByText("No encontramos productos con esos filtros.").waitFor();
  checks.push("API error distinct from empty; retry succeeds");

  mode = "loading"; pending = new Promise(resolve => { release = resolve; });
  await page.goto("http://127.0.0.1:3100/tienda?tipo=equipos", { waitUntil: "domcontentloaded" });
  await page.getByText("Cargando catálogo…", { exact: true }).waitFor();
  assert.equal(await page.getByText("No encontramos productos con esos filtros.").count(), 0);
  mode = "ready"; release();
  await page.getByRole("link", { name: equipo.nombre, exact: true }).waitFor();
  checks.push("Loading distinct from empty");
  await page.getByLabel("Buscar producto", { exact: true }).fill("aislado");
  await page.getByRole("link", { name: equipo.nombre, exact: true }).click();
  await page.getByRole("link", { name: /Volver a Notebooks/ }).click();
  assert.equal(await page.getByLabel("Buscar producto", { exact: true }).inputValue(), "aislado");
  checks.push("Product detail return restores search context");

  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: /Abrir carrito/ }).filter({ visible: true }).first().click();
  await page.getByText("Precios verificados al abrir el carrito.").waitFor();
  await page.getByRole("button", { name: "Iniciar pedido por WhatsApp" }).click();
  await page.getByRole("radio", { name: /Tarjeta de crédito/ }).click();
  assert.ok((await page.getByRole("dialog").innerText()).includes("$100.000"));
  assert.ok(await page.getByRole("button", { name: "Enviar por WhatsApp", exact: true }).isEnabled());
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  checks.push("Listing cart retains payment choice; checkout opens and closes without posting");

  mode = "sold";
  await visit("/producto/equipo/test");
  assert.ok(await page.getByRole("button", { name: "Agregar al carrito" }).isDisabled());
  await page.getByRole("button", { name: /Abrir carrito/ }).filter({ visible: true }).first().click();
  await page.getByText("Precios verificados al abrir el carrito.").waitFor();
  assert.ok(await page.getByRole("button", { name: "Iniciar pedido por WhatsApp" }).isDisabled());
  await page.keyboard.press("Escape");
  checks.push("Admin sold state blocks detail and stored cart");

  mode = "ready";
  await visit("/armar-pc");
  await page.getByRole("button", { name: /Procesador/ }).first().click();
  await page.getByLabel("Buscar componente").fill("no coincide");
  assert.equal(await page.getByRole("button", { name: /CPU prueba AM4/ }).count(), 0);
  await page.getByLabel("Buscar componente").fill("AM4");
  await page.getByRole("button", { name: /CPU prueba AM4/ }).click();
  await page.getByRole("button", { name: /Motherboard/ }).first().click();
  assert.ok(await page.getByRole("button", { name: /Mother prueba AM5/ }).isDisabled());
  assert.ok(await page.getByRole("button", { name: /Mother prueba AM4/ }).isEnabled());
  await page.keyboard.press("Escape");
  checks.push("Builder search preserves indices and AM4/AM5 incompatibility; Escape closes selector");

  await page.screenshot({ path: "artifacts/qa/configurador-390.png", fullPage: true });
  await visit("/servicios");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Ver toda la tienda", exact: true }).click();
  await page.getByRole("heading", { name: /Equipos/ }).first().waitFor();
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).pointerEvents), "auto");
  checks.push("Mobile navigation closes and restores body interaction");
  assert.deepEqual(errors, []);
} finally {
  await writeFile("artifacts/qa/state-results.json", JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
console.log(`${checks.length} state and critical-flow checks passed`);
