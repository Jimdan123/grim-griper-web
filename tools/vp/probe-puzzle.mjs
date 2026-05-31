import { chromium } from 'playwright';
const URL = process.env.URL ?? 'https://grim-griper-web.vercel.app/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const logs = [];
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForTimeout(2000);
async function holdKey(code, ms) {
  await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), code);
  await page.waitForTimeout(ms);
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
// Step 1: walk to chapel front door
await holdKey('KeyD', 3500);
await page.screenshot({ path: '/tmp/p1-at-door.png' });
await tapKey('KeyE');
await page.waitForTimeout(2800);
await page.screenshot({ path: '/tmp/p2-inside.png' });
// Step 2: walk to booth door (x=640 from inside spawn x=200 → 440px → 2000ms)
await holdKey('KeyD', 2000);
await page.screenshot({ path: '/tmp/p3-at-booth.png' });
await tapKey('KeyE');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/p4-after-E.png' });
console.log('ERRORS', errors);
console.log('RELEVANT LOGS', logs.filter((l) => /Puzzle|null|error|fail/i.test(l)).slice(-15));
await browser.close();
