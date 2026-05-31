// One-off capture: drive into the chapel and shoot the chapel scene so
// the walled-rooms prototype can be visually inspected.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const URL = process.env.URL ?? 'http://localhost:5174/';
const OUT_DIR = resolve(REPO_ROOT, '.scratch', 'screenshots', 'walls-prototype');

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR', m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 10000 });
// Wait long enough for the entry cutscene (auto-walks Reaper 240→200 over
// 1000ms, player disabled meanwhile) to finish + a 500ms cushion.
await page.waitForTimeout(1700);

// Dispatch keyboard events directly on window — InputManager listens there,
// and Playwright's page.keyboard.press routes through DOM focus which may
// land on the wrong target inside Pixi's canvas. window-level dispatch
// bypasses the focus issue entirely.
async function holdKey(code, holdMs) {
  await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), code);
  await page.waitForTimeout(holdMs);
  await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), code);
  await page.waitForTimeout(150);
}
async function tapKey(code) {
  await page.evaluate((c) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: c }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: c }));
  }, code);
  await page.waitForTimeout(150);
}

// Walk right to chapel door. Player is at x=200 after entry cutscene; door
// interact zone is 900–996; moveSpeed 220 px/s. (996-200)/220 = 3.6s, (900-
// 200)/220 = 3.2s — so a 3.5s hold lands the Reaper inside the zone.
// Walking longer would clamp the sprite at walkBounds.right (x=1200), PAST
// the door zone, and E would silently fail because isInProximity() is false.
await holdKey('KeyD', 3500);
// E to enter — fade + teleport + fade out ≈ 2 s.
await tapKey('KeyE');
await page.waitForTimeout(2500);
await page.screenshot({ path: resolve(OUT_DIR, '01-inside-spawn.png') });

// Walk to the booth area — inside spawn ~x=160, booth waypoint x=780, so
// ~620 px at 220 px/s ≈ 2.8s.
await holdKey('KeyD', 3200);
await page.screenshot({ path: resolve(OUT_DIR, '02-near-booth.png') });

// Continue right to sacristy waypoint (x=1060) — another ~280 px ≈ 1.3s.
await holdKey('KeyD', 1800);
await page.screenshot({ path: resolve(OUT_DIR, '03-near-sacristy.png') });

await browser.close();
console.log('shots in', OUT_DIR);
