import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "ui-fix");

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(2500);
  // Walk in chunks; press E mid-stride to catch proximity zone
  await page.keyboard.down("KeyD"); await page.waitForTimeout(3000); await page.keyboard.up("KeyD");
  await page.waitForTimeout(50);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(OUT, "06-inside-just-arrived.png") });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT, "07-inside-stable-after-fade.png") });
  // Walk to altar and collect
  await page.keyboard.down("KeyD"); await page.waitForTimeout(500); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT, "08-inside-sight-on.png") });
  await page.keyboard.up("ShiftLeft");
  await ctx.close();
  await browser.close();
}
go().catch(e => { console.error(e); process.exit(1); });
