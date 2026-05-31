// Diagnostic: real-Chrome-like probe of input wiring. See if window keydown
// fires + Reaper moves when D is held. Captures console errors + pageerrors.
import { chromium } from "playwright";

const URL = "http://localhost:5173/";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => {
  const t = m.type();
  if (t === "error" || t === "warning") errs.push(`${t}: ${m.text()}`);
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.waitForTimeout(800);

// Snapshot listener-count + canvas info before key.
const pre = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  return {
    canvasTabindex: canvas ? canvas.getAttribute("tabindex") : "no canvas",
    activeElTag: document.activeElement ? document.activeElement.tagName : "none",
    appChildren: document.getElementById("app")
      ? document.getElementById("app").children.length
      : -1,
  };
});

// DO NOT click canvas — real users boot the page and just press a key.
// If clicking is required for input to work, that's our bug.
await page.screenshot({ path: "/tmp/diag-before.png" });

// Hold D for 1s → should move Reaper ~220 px right.
await page.keyboard.down("KeyD");
await page.waitForTimeout(1000);
await page.keyboard.up("KeyD");
await page.waitForTimeout(150);

await page.screenshot({ path: "/tmp/diag-after-D.png" });

// Now press TAB to see if phase advances (it should be REJECTED with 0 evidence
// but at least confirms TAB reaches the bus). Then SHIFT to confirm sight.
await page.keyboard.press("Tab");
await page.waitForTimeout(150);
await page.screenshot({ path: "/tmp/diag-after-tab.png" });
await page.keyboard.down("ShiftLeft");
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/diag-after-shift.png" });
await page.keyboard.up("ShiftLeft");

console.log("PRE:", JSON.stringify(pre, null, 2));
console.log("ERRORS:", errs.length === 0 ? "(none)" : "");
for (const e of errs) console.log("  " + e);

await browser.close();
