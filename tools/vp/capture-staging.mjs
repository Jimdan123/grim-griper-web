import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "staging-eval");

const errors = [];
async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(300);
  // Capture during entry walk-in
  await page.screenshot({ path: resolve(OUT, "01-entry-walkin.png") });
  // Wait for entry to finish (~2.5s)
  await page.waitForTimeout(2700);
  await page.screenshot({ path: resolve(OUT, "02-after-walkin.png") });
  // Walk right toward altar
  await page.keyboard.down("KeyD"); await page.waitForTimeout(800); await page.keyboard.up("KeyD");
  await page.screenshot({ path: resolve(OUT, "03-near-altar.png") });
  // Hold SHIFT for Reaper Sight
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(OUT, "04-sight-on-altar.png") });
  await page.keyboard.up("ShiftLeft");
  // Walk further right to lectern
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1500); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT, "05-sight-on-lectern.png") });
  await page.keyboard.up("ShiftLeft");
  // Continue right to confession booth
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1500); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT, "06-sight-on-booth.png") });
  await page.keyboard.up("ShiftLeft");
  // Continue right into sacristy
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1800); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT, "07-sight-on-sacristy.png") });
  await page.keyboard.up("ShiftLeft");
  // Wide-view final
  await page.screenshot({ path: resolve(OUT, "08-sacristy-no-sight.png") });
  if (errors.length) {
    console.log("RUNTIME ERRORS / WARNINGS:");
    for (const e of errors) console.log("  " + e);
  } else {
    console.log("no runtime errors");
  }
  await ctx.close();
  await browser.close();
}
go().catch(e => { console.error(e); process.exit(1); });
