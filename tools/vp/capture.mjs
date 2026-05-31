// VP capture script — slice 1.
// Drives http://localhost:5173 into named states across multiple viewport
// aspects, writes PNGs to .scratch/screenshots/slice-NN/<state>.png for the
// Visual Polish Lead to review.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";

const SLICE = process.argv[2] || "01";
const OUT_DIR = resolve(REPO_ROOT, ".scratch", "screenshots", `slice-${SLICE}`);

const VIEWPORTS = [
  { name: "16x9-1280x720", width: 1280, height: 720 },
  { name: "16x9-1920x1080", width: 1920, height: 1080 },
  { name: "ultrawide-2560x1080", width: 2560, height: 1080 },
  { name: "4x3-1024x768", width: 1024, height: 768 },
  { name: "narrow-800x900", width: 800, height: 900 },
];

const HOLD_MS = 700;

async function waitForCanvas(page) {
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      return c && c.width > 0 && c.height > 0;
    },
    { timeout: 10_000 }
  );
  await page.waitForTimeout(400);
}

async function captureSlice1(page, viewport) {
  const stem = `${viewport.name}`;
  await page.screenshot({ path: resolve(OUT_DIR, `${stem}__boot.png`) });

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(HOLD_MS);
  await page.screenshot({ path: resolve(OUT_DIR, `${stem}__walk-right.png`) });
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(120);

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: resolve(OUT_DIR, `${stem}__right-edge.png`) });
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(120);

  await page.keyboard.down("KeyA");
  await page.waitForTimeout(8000);
  await page.screenshot({ path: resolve(OUT_DIR, `${stem}__left-edge.png`) });
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(120);

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(HOLD_MS);
  await page.screenshot({ path: resolve(OUT_DIR, `${stem}__walk-right-arrows.png`) });
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(120);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
      });
      await page.goto(URL, { waitUntil: "networkidle" });
      await waitForCanvas(page);
      await captureSlice1(page, vp);
      if (errors.length) {
        console.error(`[${vp.name}] ${errors.length} runtime errors:`);
        for (const e of errors) console.error("  " + e);
      } else {
        console.log(`[${vp.name}] ok — captured boot + 4 motion states`);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`\nScreenshots in ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
