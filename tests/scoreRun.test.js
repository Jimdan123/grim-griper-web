// scoreRun.test.js
// Spec for `scoreRun(events) → { score, breakdown, stars }`.
//
// Module landing slice: 3 (Phase 2 skeleton).
//
// Spec sources:
//   - docs/PRD.md §"Scoring" (lines 135-140)
//   - docs/PRD.md §"Testing Decisions" → "Modules under test" #1 (lines 187-190)
//   - .scratch/grim-griper-puzzle-mvp/issues/06-test-score-run.md
//
// Formula (integer math after rounding):
//   score = (fearMaxed ? 1000 : 0)
//         + max(0, 90 - secondsToMax) * 5
//         + max(0, 4 - hauntsUsed) * 100
//         + correctWaypointHits * 75
//         - reactionsTriggered * 50
//
// Stars:
//   score >= 1500 → 3
//   score >= 1100 → 2
//   score >    0  → 1
//   stageFailed   → 0
//
// `secondsToMax = (fearMaxed.atMs - firstHauntFired.atMs) / 1000`, NOT from TAB.

import { describe, test, expect } from 'vitest';

import { scoreRun } from '../src/scoring/scoreRun.js';

describe('scoreRun — formula + star thresholds', () => {
  // 3-star floor: hand-crafted event log whose computed score is exactly 1500.
  // 1000 (fearMaxed) + 4*75 (4 correctWaypointHits = 300) + (90-50)*5 = 200
  // + (4-4)*100 = 0 - 0 reactions = 1500. PRD §"Scoring" line 138.
  test('score == 1500 → 3 stars (3★ floor)', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'correctWaypointHit' },
      { type: 'hauntFired', atMs: 10_000 },
      { type: 'correctWaypointHit' },
      { type: 'hauntFired', atMs: 25_000 },
      { type: 'correctWaypointHit' },
      { type: 'hauntFired', atMs: 40_000 },
      { type: 'correctWaypointHit' },
      { type: 'fearMaxed', atMs: 50_000 },
    ];
    const result = scoreRun(events);
    expect(result.score).toBe(1500);
    expect(result.stars).toBe(3);
    expect(result.breakdown).toMatchObject({
      fearMaxedBonus: 1000,
      speedBonus: 200,
      efficiencyBonus: 0,
      accuracyBonus: 300,
      mistakePenalty: 0,
    });
  });

  // 2-star floor: exactly 1100. PRD §"Scoring" line 138.
  // 1000 (fearMaxed) + 0 (90s secondsToMax) + 100 (1 unused haunt slot)
  // + 0 (no correct hits) - 0 (no reactions) = 1100.
  test('score == 1100 → 2 stars (2★ floor)', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'hauntFired', atMs: 10_000 },
      { type: 'hauntFired', atMs: 20_000 },
      // 3 haunts used → (4-3)*100 = 100 efficiency bonus.
      { type: 'fearMaxed', atMs: 90_000 }, // secondsToMax = 90 → 0 speed bonus.
    ];
    const result = scoreRun(events);
    expect(result.score).toBe(1100);
    expect(result.stars).toBe(2);
  });

  // 1-star minimum: any positive score that is not stageFailed should be 1★.
  test('score > 0 but < 1100 → 1 star', () => {
    // Trivial positive: fearMaxed only at 90s = 1000 + 0 + 0 + 0 = 1000 → 1★.
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'hauntFired', atMs: 5_000 },
      { type: 'hauntFired', atMs: 10_000 },
      { type: 'hauntFired', atMs: 15_000 },
      // 4 haunts used → efficiency clamps to 0.
      { type: 'fearMaxed', atMs: 90_000 }, // secondsToMax = 90 → 0 speed.
    ];
    const result = scoreRun(events);
    expect(result.score).toBe(1000);
    expect(result.stars).toBe(1);
  });

  // stageFailed always overrides score → 0★, even with bonuses on the books.
  test('any event log ending in stageFailed → 0 stars', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'correctWaypointHit' },
      { type: 'stageFailed', reason: 'SOUL_ESCAPED' },
    ];
    const result = scoreRun(events);
    expect(result.stars).toBe(0);
  });
});

describe('scoreRun — clamps and stacking', () => {
  // Speed bonus clamps at 0 when secondsToMax >= 90.
  // PRD §"Scoring" line 137: max(0, 90 - secondsToMax) * 5.
  test('speed bonus clamps at 0 when secondsToMax >= 90', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'fearMaxed', atMs: 120_000 }, // 120s > 90
    ];
    const result = scoreRun(events);
    expect(result.breakdown.speedBonus).toBe(0);
  });

  // Efficiency bonus clamps at 0 when hauntsUsed >= 4.
  // PRD §"Scoring" line 137: max(0, 4 - hauntsUsed) * 100.
  test('efficiency bonus clamps at 0 when hauntsUsed >= 4', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'hauntFired', atMs: 1000 },
      { type: 'hauntFired', atMs: 2000 },
      { type: 'hauntFired', atMs: 3000 },
      { type: 'hauntFired', atMs: 4000 }, // 5 haunts
      { type: 'fearMaxed', atMs: 5000 },
    ];
    const result = scoreRun(events);
    expect(result.breakdown.efficiencyBonus).toBe(0);
  });

  // Mistake penalty stacks: -50 per reaction triggered.
  // PRD §"Scoring" line 137: - reactionsTriggered * 50.
  test('mistake penalty stacks: 3 reactions = -150', () => {
    const events = [
      { type: 'hauntFired', atMs: 0 },
      { type: 'reactionTriggered' },
      { type: 'reactionTriggered' },
      { type: 'reactionTriggered' },
      { type: 'fearMaxed', atMs: 30_000 },
    ];
    const result = scoreRun(events);
    expect(result.breakdown.mistakePenalty).toBe(-150);
  });
});

describe('scoreRun — derived fields', () => {
  // secondsToMax derived from the event log, not measured from TAB.
  // PRD §"Scoring" line 139, User Story #34 (line 61).
  test('secondsToMax = (fearMaxed.atMs - firstHauntFired.atMs) / 1000', () => {
    const events = [
      { type: 'hauntFired', atMs: 5_000 },
      { type: 'hauntFired', atMs: 10_000 },
      { type: 'fearMaxed', atMs: 35_000 },
    ];
    const result = scoreRun(events);
    expect(result.breakdown.secondsToMax).toBe(30); // (35000 - 5000) / 1000
  });
});

describe('scoreRun — edge cases', () => {
  // fearMaxed with no hauntFired before it: should not throw. PRD §"Testing
  // Decisions" line 190 says this "should not be reachable but test asserts
  // safe behavior."
  //
  // Chosen safe behavior (#6, slice 3): treat secondsToMax as the clamp
  // value (90) so speedBonus = 0 — the player cannot earn a speed bonus
  // they never triggered. fearMaxedBonus still applies because the event
  // log says fearMaxed happened. No throw.
  test('fearMaxed with zero hauntFired events — does not throw, behavior documented', () => {
    const events = [{ type: 'fearMaxed', atMs: 10_000 }];
    expect(() => scoreRun(events)).not.toThrow();
    const result = scoreRun(events);
    // SPEC: PRD calls this "should not be reachable"; #6 picked the most
    // conservative interpretation — credit the fearMaxed bonus but clamp
    // speed bonus to 0.
    expect(result.breakdown.speedBonus).toBe(0);
    expect(result.breakdown.fearMaxedBonus).toBe(1000);
  });

  // Empty event log — neither fearMaxed nor stageFailed. Document behavior.
  test('empty event log — returns zero-score, zero-star, no throw', () => {
    expect(() => scoreRun([])).not.toThrow();
    const result = scoreRun([]);
    // Empty log: no fearMaxed → no 1000 bonus; no firstHauntFired → secondsToMax = 0
    // → max(0, 90-0)*5 = 450 speed bonus; 0 haunts used → (4-0)*100 = 400 efficiency.
    // That violates the "empty → score 0" intent in the test scaffold.
    //
    // SPEC: an empty event log means the stage never started — neither
    // fearMaxed nor stageFailed fired — so the conservative choice is
    // score == 0, stars == 0. #6 implements this by short-circuiting
    // before bonuses when there are no events at all.
    expect(result.score).toBe(0);
    expect(result.stars).toBe(0);
  });
});
