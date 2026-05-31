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
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, "01-outside-boot.png") });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: resolve(OUT, "02-outside-stable.png") });
  // Walk to door (longer this time)
  await page.keyboard.down("KeyD"); await page.waitForTimeout(3700); await page.keyboard.up("KeyD");
  await page.screenshot({ path: resolve(OUT, "03-at-door.png") });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1300);
  await page.screenshot({ path: resolve(OUT, "04-inside.png") });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: resolve(OUT, "05-inside-stable.png") });
  await ctx.close();
  await browser.close();
}
go().catch(e => { console.error(e); process.exit(1); });
