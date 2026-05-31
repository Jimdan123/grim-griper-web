// smokeBoot.test.js
//
// Refactor safety net (RFC issue #1, Phase 0, commit 0.1).
//
// The point of this test is to catch the mechanical regressions that a
// refactor introduces most often: a renamed export, a moved file with a
// stale import path, an accidentally-deleted re-export during a barrel
// teardown, or a circular dep introduced by a misplaced extraction. It
// does that by importing every module under src/ (minus the entrypoint)
// and asserting nothing throws during module evaluation.
//
// What this test does NOT do:
//   - It does not run the game loop. PIXI needs WebGL which jsdom does
//     not provide; standing up a real renderer in tests is more work
//     than it's worth at this stage.
//   - It does not exercise main.js. main.js is the entrypoint and its
//     async IIFE touches document.* / window.* at evaluation time — it
//     is validated by the human play-test gate (see REFACTOR.md), not
//     by this smoke. The smoke's job is to prove that every module
//     main.js orchestrates still evaluates cleanly.
//   - It does not assert on behavior. The existing pure-sim tests
//     (fearMath, scoreRun, SightBudget, VictimFSM, saveMigrate) cover
//     behavior; this one only covers "can the module system load."
//
// Discovery is filesystem-driven (not a hardcoded list) so the test
// keeps working as the refactor moves files into new directories.

import { describe, test, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, '..', 'src');

// Modules excluded from the import-all sweep, with reasons.
// Anything excluded here is validated by play-test, not by this smoke.
const EXCLUDED = new Set([
  // Entrypoint: top-level async IIFE calls `new Application()` and
  // `document.getElementById('app').appendChild(...)` at evaluation
  // time. Cannot run in pure Node.
  'main.js',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const allModules = walk(SRC_ROOT)
  .map((abs) => ({ abs, rel: relative(SRC_ROOT, abs).split(sep).join('/') }))
  .filter(({ rel }) => !EXCLUDED.has(rel));

describe('smoke: every src/ module evaluates without throwing', () => {
  // Sanity: refuse to silently pass on an empty src/. If a refactor
  // accidentally moved everything out of src/, the smoke should fail
  // loudly rather than report 0 modules checked + green.
  test('discovered a non-trivial number of modules', () => {
    expect(allModules.length).toBeGreaterThan(10);
  });

  for (const { abs, rel } of allModules) {
    test(`imports ${rel}`, async () => {
      const url = pathToFileURL(abs).href;
      await expect(import(url)).resolves.toBeDefined();
    });
  }
});
