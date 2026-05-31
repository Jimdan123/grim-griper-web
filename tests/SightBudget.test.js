// SightBudget.test.js
// Spec for `SightBudget` — pure-ish budget math for Reaper Sight.
//
// Module landing slice: 2 (Investigation). Until impl lands, every test is
// `.skip` and the import is commented out behind a TODO marker so this file
// loads cleanly under `vitest run`.
//
// Spec sources:
//   - docs/PRD.md §"Sight budget" (line 108): hold-to-sustain, capacity =
//     gameState.reaperTraits.sightDurationMs (8000 default), drain 1ms/ms,
//     recharge 2× on release, cannot exceed capacity.
//   - docs/PRD.md §"State machines" (line 100): Sight FSM (binary) OFF / ON
//     with budget + recharge.
//   - .scratch/grim-griper-puzzle-mvp/plans/slice-2-investigation-design.md
//     §3 "SightBudget contract".
//   - .scratch/grim-griper-puzzle-mvp/issues/02-slice-investigation.md
//     acceptance: drains to empty in 8s of continuous hold; recharges 2× on
//     release; never exceeds capacity.
//
// Public surface under test (per slice-2 brief from coordinator):
//   const b = new SightBudget(capacityMs);
//   b.tick(dtMs, sightOn: boolean) → void
//   b.getMs() → number   // current remaining ms, clamped [0, capacity]
//   b.isExhausted() → boolean
//     // true iff getMs() === 0 AND sight was ON during the most recent tick.
//
// Rates (PRD line 108):
//   - sightOn  → drains 1ms per ms of dt
//   - sightOff → recharges 2ms per ms of dt
// Both clamped to [0, capacityMs].
//
// API NOTE: #2's design doc (slice-2-investigation-design.md §3) shows a
// different surface (drain/recharge/value/capacity/ratio). The coordinator
// pinned the wrapper API (tick + getMs + isExhausted) for these tests; if
// #2 ships only the lower-level surface, that's a glue gap for #2 to bridge,
// not a test rewrite for #6. Per brief: failures are #2's to fix.

import { describe, test, expect, beforeEach } from 'vitest';

// Path matches plans/slice-2-investigation-design.md §1 file table.
import { SightBudget } from '../src/sight/SightBudget.js';

describe('SightBudget — construction + initial state', () => {
  // PRD §"Sight budget" line 108 + design doc §3 "Initial value: full
  // capacity at Phase 1 enter."
  test('starts full at capacityMs', () => {
    const budget = new SightBudget(8000);
    expect(budget.getMs()).toBe(8000);
    expect(budget.isExhausted()).toBe(false);
  });
});

describe('SightBudget — drain (sight ON)', () => {
  // PRD §"Sight budget" line 108: "Drain rate = 1 ms per ms held."
  test('drains 1ms per ms held', () => {
    const budget = new SightBudget(8000);
    budget.tick(100, true);
    expect(budget.getMs()).toBe(7900);
  });

  // PRD §"Sight budget" line 108 + design doc §3 clamping invariant.
  test('clamps at 0 — cannot go below zero', () => {
    const budget = new SightBudget(8000);
    budget.tick(10_000, true); // 10s of drain on an 8s budget
    expect(budget.getMs()).toBe(0);
  });
});

describe('SightBudget — recharge (sight OFF)', () => {
  // PRD §"Sight budget" line 108: "Recharge rate = 2× when SHIFT released."
  // Starting from 7900 (post-drain), 100ms off → +200ms, clamped to 8000.
  test('recharges 2× released time, clamped to capacity', () => {
    const budget = new SightBudget(8000);
    budget.tick(100, true);   // 7900
    budget.tick(100, false);  // +200 → 8100, clamped to 8000
    expect(budget.getMs()).toBe(8000);
  });

  // PRD §"Sight budget" line 108: "Cannot exceed capacity."
  test('cannot exceed capacity — repeated recharge from full stays at capacity', () => {
    const budget = new SightBudget(8000);
    for (let i = 0; i < 10; i++) budget.tick(1000, false);
    expect(budget.getMs()).toBe(8000);
  });
});

describe('SightBudget — exhaustion signal', () => {
  // Design doc §2 "Drain ordering rule: drain first, then check value === 0,
  // so a single frame can both drain to zero and transition ON → OFF."
  // `isExhausted()` is the signal the FSM uses for that auto-cutoff.
  test('isExhausted() true when drain hits 0 during a tick(_, true)', () => {
    const budget = new SightBudget(8000);
    budget.tick(10_000, true); // drains to 0 while ON
    expect(budget.getMs()).toBe(0);
    expect(budget.isExhausted()).toBe(true);
  });

  // Once SHIFT is released, the FSM should not still be reading "exhausted"
  // as a latched flag — it's a per-tick signal driven by the most recent
  // (ON + zero) condition. A recharging tick clears it even if value is
  // still 0 mid-tick (in this case it goes 0 → +dt*2, so non-zero anyway).
  test('isExhausted() false on the next tick(_, false) (recharging)', () => {
    const budget = new SightBudget(8000);
    budget.tick(10_000, true);   // → 0, exhausted
    expect(budget.isExhausted()).toBe(true);
    budget.tick(50, false);      // recharging, +100 → 100
    expect(budget.isExhausted()).toBe(false);
  });
});

describe('SightBudget — sub-frame accumulation', () => {
  // Float-math invariant: 100 calls of tick(8, true) should match one
  // tick(800, true) within 1ms. Guards against rounding drift from any
  // future "divide-by-frame" micro-optimization.
  test('many small drains sum to the same as one big drain (±1ms)', () => {
    const small = new SightBudget(8000);
    for (let i = 0; i < 100; i++) small.tick(8, true);
    const big = new SightBudget(8000);
    big.tick(800, true);
    expect(Math.abs(small.getMs() - big.getMs())).toBeLessThanOrEqual(1);
    // And the absolute value should match the math: 8000 - 800 = 7200.
    expect(Math.abs(small.getMs() - 7200)).toBeLessThanOrEqual(1);
  });
});

describe('SightBudget — mixed drain + recharge sequences', () => {
  // Realistic play loop: drain a chunk, partial recharge (2× gain but NOT
  // clamped because we're still below capacity), drain again to exhaustion.
  //
  //   start:        8000
  //   drain 4000:   4000  (8000 - 4000)
  //   recharge 1000: 6000 (4000 + 2*1000, well under cap → no clamp)
  //   drain 6000:   0     (6000 - 6000 = 0 exactly → exhausted)
  test('drain 4000 → recharge 1000 (+2000) → drain 6000 = 0 exhausted', () => {
    const budget = new SightBudget(8000);
    budget.tick(4000, true);
    expect(budget.getMs()).toBe(4000);
    budget.tick(1000, false);
    expect(budget.getMs()).toBe(6000); // 4000 + 2*1000, no clamp
    budget.tick(6000, true);
    expect(budget.getMs()).toBe(0);
    expect(budget.isExhausted()).toBe(true);
  });
});
