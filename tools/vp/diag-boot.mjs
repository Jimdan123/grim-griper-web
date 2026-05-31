// Quick boot diagnostic — same pattern as the other capture-*.mjs scripts
// in this folder. Visits the dev server, captures any console / page errors,
// and reports canvas presence + the first few console messages.
import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:5174/";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const consoleMsgs = [];
page.on("pageerror", (e) => errors.push(`PAGE ERROR: ${e.message}\n${e.stack ?? ""}`));
page.on("console", (m) => {
  const line = `[${m.type()}] ${m.text()}`;
  consoleMsgs.push(line);
  if (m.type() === "error") errors.push(`CONSOLE ERROR: ${m.text()}`);
});
try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2500);
} catch (e) {
  console.log("GOTO FAILED:", e.message);
}
console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n---\n") : "(none)");
console.log("\n=== CONSOLE (last 25) ===");
console.log(consoleMsgs.slice(-25).join("\n"));
const canvas = await page.$("canvas");
console.log("\n=== CANVAS PRESENT ===", !!canvas);
await browser.close();
