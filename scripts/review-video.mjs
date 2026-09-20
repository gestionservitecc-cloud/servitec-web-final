import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
    await page.goto("http://127.0.0.1:3100");
    await page.waitForFunction(() => {
      const video = document.querySelector("video");
      return video && !video.paused && video.currentTime > 0.2;
    });
    const properties = await page.locator("video").evaluate(video => ({ controls: video.controls, muted: video.muted, loop: video.loop, autoplay: video.autoplay, inline: video.playsInline }));
    assert.deepEqual(properties, { controls: false, muted: true, loop: true, autoplay: true, inline: true });
    await page.screenshot({ path: `artifacts/qa/inicio-viewport-${width}.png` });
    await page.locator("video").evaluate(video => { video.currentTime = video.duration - 0.3; });
    await page.waitForFunction(() => { const video = document.querySelector("video"); return video.currentTime < 2 && !video.paused; });
    checks.push(`Autoplay without interaction, no controls, muted and loop: ${width}px`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => !document.querySelector("video").paused);
    checks.push(`Autoplay remains enabled with reduced motion: ${width}px`);
    await page.close();
  }
  await writeFile("artifacts/qa/video-results.json", JSON.stringify({ checks }, null, 2));
  console.log(`${checks.length} video checks passed`);
} finally {
  await browser.close();
}
