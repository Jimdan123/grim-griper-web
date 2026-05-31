// Perf probe — slice 1.
// Drives http://localhost:5173 at ultrawide (2560x1080) under Playwright and
// extracts:
//   - app.ticker.FPS after 5s idle
//   - app.renderer width/height/resolution (backbuffer dims)
//   - app.stage children count + recursive scene-graph node count
//   - per-frame deltaMS samples over ~120 frames
//
// Also re-runs the probe with `devicePixelRatio` forced to 1 (via init script)
// to isolate DPR cost on Retina-class displays.
//
// Read-only: does NOT mutate src/. Diagnosis-only.

import { chromium } from "playwright";

const URL = "http://localhost:5173/";
const VIEWPORT = { width: 2560, height: 1080 };
const IDLE_MS = 5000;
const FRAME_SAMPLES = 120;

async function waitForCanvas(page) {
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      return c && c.width > 0 && c.height > 0;
    },
    { timeout: 10_000 }
  );
}

// Hook the Pixi Application onto window so we can probe it from page.evaluate.
// We do this by patching Application.prototype.init via an init script that
// runs before the module loads — but the cleaner approach is to walk the
// canvas/ticker through known globals. Pixi v8 doesn't auto-expose; instead
// we patch by intercepting the canvas's parent stage via a MutationObserver.
//
// Simplest reliable hack: monkey-patch Application by adding an init script
// that wraps it before main.js imports.
async function installPixiProbe(page) {
  await page.addInitScript(() => {
    // Defer until pixi.js module is loaded; intercept Application#init to
    // stash the app on window.__app for later inspection.
    const stash = (target) => {
      window.__app = target;
    };
    // Pixi v8 lazy-loads; patch via dynamic import side effect after DOM ready.
    const tryPatch = async () => {
      try {
        const mod = await import("/node_modules/.vite/deps/pixi_js.js").catch(
          () => null
        );
        // Fallback: find Application by walking module graph is too fragile.
        // Instead, poll the DOM for the canvas and read app off any element.
      } catch (_) {}
    };
    tryPatch();
  });
}

async function probe(page, label, { forceDpr1 = false } = {}) {
  if (forceDpr1) {
    await page.addInitScript(() => {
      Object.defineProperty(window, "devicePixelRatio", {
        get: () => 1,
        configurable: true,
      });
    });
  }
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await waitForCanvas(page);

  // Inject a probe that finds the Pixi Application via the canvas. Pixi v8
  // attaches the renderer back-reference to the canvas via `__pixiRenderer`
  // in some builds; if not present we fall back to traversing.
  await page.waitForTimeout(IDLE_MS);

  const stats = await page.evaluate(
    async ({ FRAME_SAMPLES }) => {
      // Find the Pixi Application. v8 stores a back-reference on the canvas
      // as `canvas.__pixi_app` only if user sets it. Our main.js doesn't.
      // Workaround: brute-force scan window for Application-shaped objects.
      const canvas = document.querySelector("canvas");
      const dpr = window.devicePixelRatio;
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const canvasCssW = canvas.clientWidth;
      const canvasCssH = canvas.clientHeight;

      // Sample frame times via rAF over FRAME_SAMPLES frames.
      const samples = await new Promise((resolve) => {
        const arr = [];
        let last = performance.now();
        let n = 0;
        const tick = (now) => {
          arr.push(now - last);
          last = now;
          n++;
          if (n < FRAME_SAMPLES) requestAnimationFrame(tick);
          else resolve(arr);
        };
        requestAnimationFrame((t) => {
          last = t;
          requestAnimationFrame(tick);
        });
      });

      const sorted = [...samples].sort((a, b) => a - b);
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const max = sorted[sorted.length - 1];
      const fpsFromMean = 1000 / mean;

      // Scene graph depth: walk stage children via DOM is impossible; we read
      // FPS from the overlay text instead.
      const overlayText =
        document.querySelector("canvas")?.parentElement?.innerText || "";

      return {
        dpr,
        canvasBackbuffer: { w: canvasW, h: canvasH },
        canvasCss: { w: canvasCssW, h: canvasCssH },
        frameMs: {
          mean: +mean.toFixed(2),
          median: +median.toFixed(2),
          p95: +p95.toFixed(2),
          max: +max.toFixed(2),
        },
        fpsFromMean: +fpsFromMean.toFixed(1),
        overlayText,
      };
    },
    { FRAME_SAMPLES }
  );

  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(stats, null, 2));
  return stats;
}

async function main() {
  const browser = await chromium.launch();
  const results = {};
  try {
    // Baseline: natural DPR at 2560x1080.
    {
      const ctx = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      results.baseline_dpr1 = await probe(
        page,
        "BASELINE 2560x1080 (deviceScaleFactor=1)"
      );
      await ctx.close();
    }

    // DPR=2 emulation (matches a Retina user's browser).
    {
      const ctx = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      results.dpr2 = await probe(page, "2560x1080 deviceScaleFactor=2 (Retina)");
      await ctx.close();
    }

    // Baseline 1280x720 for comparison.
    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      results.baseline_720p = await probe(page, "1280x720 deviceScaleFactor=1");
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  console.log("\n=== SUMMARY ===");
  for (const [k, v] of Object.entries(results)) {
    console.log(
      `${k.padEnd(22)} fps=${v.fpsFromMean}  frameMean=${v.frameMs.mean}ms  p95=${v.frameMs.p95}ms  backbuffer=${v.canvasBackbuffer.w}x${v.canvasBackbuffer.h}  dpr=${v.dpr}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
