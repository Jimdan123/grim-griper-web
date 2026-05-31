// QA pass — comprehensive capture for 2026-05-30 evening dispatch.
// Drives the full play loop (outside → door → enter → walk through
// nave → sacristy) and surfaces every state the bug-hunter wants to
// look at. Console errors + pageerrors are surfaced at the end.
//
// Output: .scratch/screenshots/qa-2026-05-30/<NN>-<state>.png
//
// Usage: dev server must be running on http://localhost:5173/.
//   node tools/vp/capture-qa-2026-05-30.mjs

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";
const OUT = resolve(REPO_ROOT, ".scratch", "screenshots", "qa-2026-05-30");

async function shot(page, name) {
  await page.screenshot({ path: resolve(OUT, name) });
  // eslint-disable-next-line no-console
  console.log("  shot:", name);
}

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  const warnings = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    const t = m.type();
    if (t === "error") errors.push(`console.error: ${m.text()}`);
    else if (t === "warning") warnings.push(`console.warn: ${m.text()}`);
  });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");

  // 1) Boot — immediate
  await shot(page, "01-boot.png");

  // 2) Outside initial — wait 1s
  await page.waitForTimeout(1000);
  await shot(page, "02-outside-initial.png");

  // 3) Walk right — capture mid-walk + at door
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1500);
  await shot(page, "03-walk-mid.png");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyD");
  await shot(page, "04-at-door.png");

  // 4) EntryPrompt visible — confirm
  await page.waitForTimeout(300);
  await shot(page, "05-entry-prompt.png");

  // 5) Press E to enter — capture during transition + at completion
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  await shot(page, "06-fade-mid.png");
  await page.waitForTimeout(800);
  await shot(page, "07-after-fade.png");

  // 6) Inside chapel — wait 1s
  await page.waitForTimeout(1000);
  await shot(page, "08-inside-spawn.png");

  // 7) Walk right toward altar
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyD");
  await shot(page, "09-near-altar.png");

  // 8) Reaper Sight ON
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(300);
  await shot(page, "10-sight-on-altar.png");

  // 9) Collect chalice (E near altar with sight on)
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(400);
  await shot(page, "11-after-chalice.png");
  await page.keyboard.up("ShiftLeft");

  // 10) Continue right to lectern
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(300);
  await shot(page, "12-sight-on-lectern.png");

  // 11) Collect sermon book
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(400);
  await shot(page, "13-after-sermon-book.png");
  await page.keyboard.up("ShiftLeft");

  // 12) Continue right to confession booth (ledger hidden; ghost should show under SHIFT)
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(300);
  await shot(page, "14-sight-on-booth.png");
  await page.keyboard.up("ShiftLeft");

  // 13) Continue right into sacristy via door arch
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyD");
  await shot(page, "15-sacristy-no-sight.png");

  // 14) Hold SHIFT in sacristy (lime spade hidden; ghost should show)
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(300);
  await shot(page, "16-sight-on-sacristy.png");

  // 15) Release SHIFT
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(300);
  await shot(page, "17-sight-released.png");

  // 16) Press TAB — only 2/4 collected, should be rejected
  await page.keyboard.press("Tab");
  await page.waitForTimeout(500);
  await shot(page, "18-after-tab-reject.png");

  // 17) Resize to portrait (745x1696)
  await ctx.close(); // need new context to change viewport
  const ctxP = await browser.newContext({
    viewport: { width: 745, height: 1696 },
    deviceScaleFactor: 1,
  });
  const pageP = await ctxP.newPage();
  pageP.on("pageerror", (e) => errors.push(`pageerror(portrait): ${e.message}`));
  pageP.on("console", (m) => {
    const t = m.type();
    if (t === "error") errors.push(`console.error(portrait): ${m.text()}`);
  });
  await pageP.goto(URL, { waitUntil: "networkidle" });
  await pageP.waitForSelector("canvas");
  await pageP.waitForTimeout(1500);
  await pageP.screenshot({ path: resolve(OUT, "19-portrait-745x1696.png") });
  // eslint-disable-next-line no-console
  console.log("  shot: 19-portrait-745x1696.png");

  // 18) Resize to ultra-wide (2560x720)
  await ctxP.close();
  const ctxW = await browser.newContext({
    viewport: { width: 2560, height: 720 },
    deviceScaleFactor: 1,
  });
  const pageW = await ctxW.newPage();
  pageW.on("pageerror", (e) => errors.push(`pageerror(wide): ${e.message}`));
  pageW.on("console", (m) => {
    const t = m.type();
    if (t === "error") errors.push(`console.error(wide): ${m.text()}`);
  });
  await pageW.goto(URL, { waitUntil: "networkidle" });
  await pageW.waitForSelector("canvas");
  await pageW.waitForTimeout(1500);
  await pageW.screenshot({ path: resolve(OUT, "20-ultrawide-2560x720.png") });
  // eslint-disable-next-line no-console
  console.log("  shot: 20-ultrawide-2560x720.png");

  await ctxW.close();
  await browser.close();

  // eslint-disable-next-line no-console
  console.log("\n=== ERRORS ===");
  if (errors.length === 0) console.log("  (none)");
  for (const e of errors) console.log("  " + e);
  // eslint-disable-next-line no-console
  console.log("\n=== WARNINGS ===");
  if (warnings.length === 0) console.log("  (none)");
  for (const w of warnings) console.log("  " + w);
}

go().catch((e) => {
  console.error(e);
  process.exit(1);
});
