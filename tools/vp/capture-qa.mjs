import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "qa-2026-05-30");

const errors = [];
async function shot(page, name) {
  await page.screenshot({ path: resolve(OUT, name) });
}

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(500);
  await shot(page, "01-boot.png");
  await page.waitForTimeout(2500); // wait for title card fade
  await shot(page, "02-outside-after-title.png");
  // Walk toward door
  await page.keyboard.down("KeyD"); await page.waitForTimeout(2500); await page.keyboard.up("KeyD");
  await shot(page, "03-at-door-prompt.png");
  // Sight while outside (should be no-op)
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await shot(page, "04-sight-outside.png");
  await page.keyboard.up("ShiftLeft");
  // Press E to enter
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  await shot(page, "05-fade-in.png");
  await page.waitForTimeout(900);
  await shot(page, "06-inside-arrived.png");
  // Walk to altar
  await page.keyboard.down("KeyD"); await page.waitForTimeout(400); await page.keyboard.up("KeyD");
  // Sight on
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(300);
  await shot(page, "07-sight-on-altar.png");
  // Collect chalice
  await page.keyboard.press("KeyE"); await page.waitForTimeout(200);
  await shot(page, "08-after-collect-chalice.png");
  await page.keyboard.up("ShiftLeft");
  // Walk to lectern
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1100); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(200);
  await shot(page, "09-sight-on-lectern.png");
  await page.keyboard.press("KeyE"); await page.waitForTimeout(200);
  await shot(page, "10-after-collect-sermon.png");
  await page.keyboard.up("ShiftLeft");
  // Walk to booth
  await page.keyboard.down("KeyD"); await page.waitForTimeout(1200); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(200);
  await shot(page, "11-sight-on-booth-hidden-ledger.png");
  await page.keyboard.up("ShiftLeft");
  // Walk to sacristy
  await page.keyboard.down("KeyD"); await page.waitForTimeout(2000); await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft"); await page.waitForTimeout(200);
  await shot(page, "12-sight-on-sacristy-christ-icon.png");
  await page.keyboard.up("ShiftLeft");
  // Try TAB at 2/4 (should reject)
  await page.keyboard.press("Tab"); await page.waitForTimeout(300);
  await shot(page, "13-after-tab-rejected.png");
  await ctx.close();

  // Resize test: portrait
  const ctx2 = await browser.newContext({ viewport: { width: 745, height: 1696 }, deviceScaleFactor: 1 });
  const page2 = await ctx2.newPage();
  await page2.goto(URL, { waitUntil: "networkidle" });
  await page2.waitForSelector("canvas");
  await page2.waitForTimeout(2500);
  await page2.screenshot({ path: resolve(OUT, "14-portrait-outside.png") });
  await ctx2.close();

  // Wide test
  const ctx3 = await browser.newContext({ viewport: { width: 2560, height: 720 }, deviceScaleFactor: 1 });
  const page3 = await ctx3.newPage();
  await page3.goto(URL, { waitUntil: "networkidle" });
  await page3.waitForSelector("canvas");
  await page3.waitForTimeout(2500);
  await page3.screenshot({ path: resolve(OUT, "15-wide-outside.png") });
  await ctx3.close();

  await browser.close();
  if (errors.length) {
    console.log("CONSOLE/PAGE ERRORS:");
    for (const e of errors) console.log("  " + e);
  } else {
    console.log("no console/page errors");
  }
}
go().catch(e => { console.error(e); process.exit(1); });
