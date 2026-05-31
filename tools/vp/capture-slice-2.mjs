// VP capture script — slice 2 (Reaper Sight + Evidence + TAB phase advance).
// Drives http://localhost:5173 into named states across multiple viewport
// aspects, writes PNGs to .scratch/screenshots/slice-02/<viewport>__<state>.png
// for the Visual Polish Lead to review.
//
// Slice 2 state matrix:
//   boot                       — just landed, no input
//   walked-to-altar            — A held until Reaper sits near x=220 (altar)
//   sight-on-no-collection     — SHIFT held at altar, 4 outlines, 4 ghosts
//   sight-on-mid-collection    — collected chalice (SHATTER), then SHIFT again
//   sight-budget-exhausted     — SHIFT held ~9s → forced OFF, meter empty pulse
//   tab-rejected-empty         — fresh page, TAB pressed with 0 collected
//   tab-allowed-after-collect  — collect 1 evidence, TAB → HAUNT placeholder

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const URL = "http://localhost:5173/";

const OUT_DIR = resolve(REPO_ROOT, ".scratch", "screenshots", "slice-02");

const VIEWPORTS = [
  { name: "16x9-1280x720", width: 1280, height: 720 },
  { name: "16x9-1920x1080", width: 1920, height: 1080 },
  { name: "ultrawide-2560x1080", width: 2560, height: 1080 },
  { name: "4x3-1024x768", width: 1024, height: 768 },
  { name: "narrow-800x900", width: 800, height: 900 },
];

// Logical timings. Reaper moveSpeed = 220 px/s. Spawn at x=640 (mid of
// chapelBounds). Altar x=220, chalice x=300 (post-VP-defect-2 reposition).
// Proximity radius is 60 px (EvidenceItem.PROXIMITY_RADIUS_PX), so we need to
// land Reaper within ±60 of x=300. Walk distance to x=300 = 340 px → ~1545 ms
// at 220 px/s. Hold A for 1500 ms → lands ≈ x=310, within proximity of chalice
// AND still visually next to the altar marker (x=220).
const WALK_TO_ALTAR_MS = 1500;
const SIGHT_HOLD_SHORT_MS = 700;       // long enough to render outlines + ghosts
const SIGHT_HOLD_EXHAUST_MS = 9000;    // > 8000 ms capacity → forced OFF
const STEP = 80;                        // small post-key settle

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

async function shot(page, viewport, state) {
  const path = resolve(OUT_DIR, `${viewport.name}__${state}.png`);
  await page.screenshot({ path });
}

// Walk left until the Reaper is at the altar (x≈220). Press E (collect)
// while at the altar with sight ON — the chalice is at x=260, proximity
// radius 60 px, so altar position is comfortably in range.
async function walkToAltar(page) {
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(WALK_TO_ALTAR_MS);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(STEP);
}

async function captureSlice2(page, viewport) {
  // 1. boot — no input.
  await shot(page, viewport, "boot");

  // 6. tab-rejected-empty — fresh page, no collection, press TAB. Should be
  //    silent rejection. Capture here BEFORE walking so state is pristine.
  await page.keyboard.press("Tab");
  await page.waitForTimeout(STEP);
  await shot(page, viewport, "tab-rejected-empty");

  // 2. walked-to-altar — A held, Reaper near altar x=220.
  await walkToAltar(page);
  await shot(page, viewport, "walked-to-altar");

  // 3. sight-on-no-collection — SHIFT held at altar, 4 outlines, 4 ghosts,
  //    SightMeter draining.
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(SIGHT_HOLD_SHORT_MS);
  await shot(page, viewport, "sight-on-no-collection");
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(STEP);

  // 4. sight-on-mid-collection — re-press SHIFT, press E to collect chalice
  //    (within proximity of altar), then capture with sight still ON. 3
  //    outlines + 3 ghosts remain, 1 collected → no outline/ghost for chalice.
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(200);
  await shot(page, viewport, "sight-on-mid-collection");

  // 7. tab-allowed-after-collect — TAB now that 1 evidence collected.
  //    Release SHIFT first so the phase-transition capture is in OFF state.
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(STEP);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(300);
  await shot(page, viewport, "tab-allowed-after-collect");

  // 5. sight-budget-exhausted — capture this last as it mutates budget +
  //    phase state. Reload to a clean budget so we get the cleanest pulse.
  await page.goto(URL, { waitUntil: "networkidle" });
  await waitForCanvas(page);
  await page.keyboard.down("ShiftLeft");
  await page.waitForTimeout(SIGHT_HOLD_EXHAUST_MS);
  // Sight is forced OFF when budget hits 0; capture the empty / pulsing bar.
  await shot(page, viewport, "sight-budget-exhausted");
  await page.keyboard.up("ShiftLeft");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
      });
      await page.goto(URL, { waitUntil: "networkidle" });
      await waitForCanvas(page);
      await captureSlice2(page, vp);
      if (errors.length) {
        console.error(`[${vp.name}] ${errors.length} runtime errors:`);
        for (const e of errors) console.error("  " + e);
      } else {
        console.log(`[${vp.name}] ok — 7 states captured`);
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
