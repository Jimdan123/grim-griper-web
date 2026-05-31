import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "outside-scene");

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`); });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: resolve(OUT, "01-outside-spawn.png") });
  // Walk right to chapel door
  await page.keyboard.down("KeyD"); await page.waitForTimeout(3000); await page.keyboard.up("KeyD");
  await page.screenshot({ path: resolve(OUT, "02-at-door.png") });
  // Press E to enter
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(OUT, "03-mid-transition.png") });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT, "04-inside.png") });
  if (errors.length) {
    console.log("ERRORS:");
    for (const e of errors) console.log("  " + e);
  } else {
    console.log("no runtime errors");
  }
  await ctx.close();
  await browser.close();
}
go().catch(e => { console.error(e); process.exit(1); });
