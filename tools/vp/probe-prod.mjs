import { chromium } from 'playwright';
const URL = 'https://grim-griper-web.vercel.app/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const errors = [];
const logs = [];
page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForTimeout(3000);
// Probe — what's on stage?
const probe = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return {
    canvas: { width: c?.width, height: c?.height, clientWidth: c?.clientWidth, clientHeight: c?.clientHeight },
    bodyChildCount: document.body.childElementCount,
    docTitle: document.title,
  };
});
console.log('PROBE', JSON.stringify(probe, null, 2));
console.log('ERRORS', errors);
console.log('LOGS', logs.slice(0, 30));
await page.screenshot({ path: '/tmp/prod-probe.png', fullPage: false });
await browser.close();
