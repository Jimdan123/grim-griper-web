import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "portrait-fix");

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 745, height: 1696 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: resolve(OUT, "portrait-after-walkin.png") });
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1000); await page.keyboard.up("KeyD");
  await page.screenshot({ path: resolve(OUT, "portrait-walked-right.png") });
  await ctx.close();
  await browser.close();
}
go().catch(e => { console.error(e); process.exit(1); });
