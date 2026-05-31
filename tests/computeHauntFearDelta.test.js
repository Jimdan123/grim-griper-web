// computeHauntFearDelta.test.js
// Spec for `computeHauntFearDelta({ haunt, waypoint, recentHaunts, victimState,
// traits, now }) → number`. Pure function, routes through the real
// `applyFearGain(base, traits) = base * traits.fearGainMultiplier` chokepoint.
//
// Module landing slice: 3.
//
// Spec sources:
//   - docs/PRD.md §"Haunt rules" (lines 114-124)
//   - docs/PRD.md §"Testing Decisions" → "Modules under test" #2 (lines 192-194)
//   - .scratch/grim-griper-puzzle-mvp/issues/07-test-compute-haunt-fear-delta.md
//
// Correct-waypoint mapping (PRD §"Haunt rules" line 116):
//   SHATTER → Altar
//   VOICE   → ConfessionBooth
//   WHISPER → Lectern
//   RISE    → Sacristy
//
// Fear deltas (PRD lines 117-121):
//   correct waypoint, NEUTRAL victim → 35 (before fearGainMultiplier)
//   wrong waypoint,   NEUTRAL victim → 5
//   re-used within 15s,  NEUTRAL     → 0
//   any non-NEUTRAL victim            → 0
//
// Mapping must be sourced from the real `confession-room.json`, not duplicated
// here as a literal (issue 07 acceptance criteria line 27).

import { describe, test, expect } from 'vitest';
import stage from '../src/stages/confession-room.json' with { type: 'json' };
import { computeHauntFearDelta, applyFearGain } from '../src/math/fearMath.js';

const TRAITS_DEFAULT = {
  sightDurationMs: 8000,
  hauntSlotCount: 4,
  moveSpeed: 220,
  fearGainMultiplier: 1.0,
  footstepsAudible: false,
};

describe('computeHauntFearDelta — correct/wrong waypoint baseline', () => {
  // Correct waypoint + NEUTRAL → 35 * multiplier. PRD line 118.
  // SHATTER → altar pulled from confession-room.json so a future stage with
  // a different mapping is auto-covered (issue 07 line 27).
  test('SHATTER at Altar + NEUTRAL → 35', () => {
    const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: altarWp,
      recentHaunts: {},
      victimState: 'NEUTRAL',
      traits: TRAITS_DEFAULT,
      now: 1_000_000,
    });
    expect(delta).toBe(35);
  });

  // Wrong waypoint + NEUTRAL → 5 * multiplier. PRD line 119.
  test('SHATTER at Lectern + NEUTRAL → 5', () => {
    const lecternWp = stage.waypoints.find(w => w.kind === 'Lectern').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: lecternWp,
      recentHaunts: {},
      victimState: 'NEUTRAL',
      traits: TRAITS_DEFAULT,
      now: 1_000_000,
    });
    expect(delta).toBe(5);
  });

  // Every haunt × its correct waypoint = 35.
  test('every haunt at its correct waypoint + NEUTRAL → 35', () => {
    const expectedMapping = {
      SHATTER: 'Altar',
      VOICE: 'ConfessionBooth',
      WHISPER: 'Lectern',
      RISE: 'Sacristy',
    };
    for (const [haunt, kind] of Object.entries(expectedMapping)) {
      const wp = stage.waypoints.find(w => w.kind === kind);
      expect(wp, `confession-room.json missing waypoint of kind ${kind}`).toBeTruthy();
      const delta = computeHauntFearDelta({
        haunt,
        waypoint: wp.id,
        recentHaunts: {},
        victimState: 'NEUTRAL',
        traits: TRAITS_DEFAULT,
        now: 1_000_000,
      });
      expect(delta, `${haunt} at ${kind} should be 35`).toBe(35);
    }
  });
});

describe('computeHauntFearDelta — 15s same-haunt cooldown', () => {
  // Same haunt fired again with now - lastFired < 15000 → 0.
  // PRD line 120; issue 07 acceptance line 22.
  test('same haunt re-used at 14999ms → 0', () => {
    const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: altarWp,
      recentHaunts: { SHATTER: 1_000_000 },
      victimState: 'NEUTRAL',
      traits: TRAITS_DEFAULT,
      now: 1_000_000 + 14_999,
    });
    expect(delta).toBe(0);
  });

  // Boundary: at exactly 15000ms, the cooldown has expired → full delta.
  // Issue 07 acceptance line 23 explicitly pins this boundary.
  test('same haunt re-used at exactly 15000ms → full 35 delta', () => {
    const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: altarWp,
      recentHaunts: { SHATTER: 1_000_000 },
      victimState: 'NEUTRAL',
      traits: TRAITS_DEFAULT,
      now: 1_000_000 + 15_000,
    });
    expect(delta).toBe(35);
  });

  // A different haunt is not affected by another haunt's recentHaunts entry.
  test('different haunt within 15s of unrelated haunt → unaffected', () => {
    const lecternWp = stage.waypoints.find(w => w.kind === 'Lectern').id;
    const delta = computeHauntFearDelta({
      haunt: 'WHISPER',
      waypoint: lecternWp,
      recentHaunts: { SHATTER: 1_000_000 },
      victimState: 'NEUTRAL',
      traits: TRAITS_DEFAULT,
      now: 1_000_000 + 1_000,
    });
    expect(delta).toBe(35);
  });
});

describe('computeHauntFearDelta — non-NEUTRAL victim', () => {
  // Any non-NEUTRAL state pauses fear gain. PRD line 121, line 53 (story #26).
  test.each(['AGGRESSIVE', 'FLEEING', 'CALLING_FOR_HELP'])(
    'victim in %s → 0 regardless of waypoint match',
    (state) => {
      const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
      const delta = computeHauntFearDelta({
        haunt: 'SHATTER',
        waypoint: altarWp,
        recentHaunts: {},
        victimState: state,
        traits: TRAITS_DEFAULT,
        now: 1_000_000,
      });
      expect(delta).toBe(0);
    }
  );
});

describe('computeHauntFearDelta — fearGainMultiplier scaling', () => {
  // Confirms the result flows through applyFearGain. PRD line 124.
  test('fearGainMultiplier = 0.5 halves correct-waypoint delta to 17.5', () => {
    const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: altarWp,
      recentHaunts: {},
      victimState: 'NEUTRAL',
      traits: { ...TRAITS_DEFAULT, fearGainMultiplier: 0.5 },
      now: 1_000_000,
    });
    expect(delta).toBe(17.5);
  });

  test('fearGainMultiplier = 0 zeros the result', () => {
    const altarWp = stage.waypoints.find(w => w.kind === 'Altar').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: altarWp,
      recentHaunts: {},
      victimState: 'NEUTRAL',
      traits: { ...TRAITS_DEFAULT, fearGainMultiplier: 0 },
      now: 1_000_000,
    });
    expect(delta).toBe(0);
  });

  test('fearGainMultiplier = 0.5 also scales wrong-waypoint delta (5 → 2.5)', () => {
    const lecternWp = stage.waypoints.find(w => w.kind === 'Lectern').id;
    const delta = computeHauntFearDelta({
      haunt: 'SHATTER',
      waypoint: lecternWp,
      recentHaunts: {},
      victimState: 'NEUTRAL',
      traits: { ...TRAITS_DEFAULT, fearGainMultiplier: 0.5 },
      now: 1_000_000,
    });
    expect(delta).toBe(2.5);
  });

  // Sanity: confirms applyFearGain is exported and is the literal multiplier
  // operation (chokepoint contract).
  test('applyFearGain(35, { fearGainMultiplier: 0.5 }) === 17.5', () => {
    expect(applyFearGain(35, { fearGainMultiplier: 0.5 })).toBe(17.5);
  });
});
