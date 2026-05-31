// VictimFSM.test.js
// Spec for the Victim FSM bodies (slice 4). Tests exercise the public
// `victim.applyHaunt(hauntId)` + `victim.update(dtMs)` surface against the
// real `confession-room.json` stage data. Bias rolls use a seeded
// `mulberry32` RNG for determinism (single seed re-yields the same draws).
//
// Spec sources:
//   - docs/PRD.md §6.5 "Victim FSM (7 states)"  — timers + exits + side effects
//   - docs/PRD.md §6.6 "Reaction Selection"      — bucket + bias
//   - docs/PRD.md §6.7 "Interrupt Routing"       — non-NEUTRAL haunt = clean interrupt
//   - docs/PRD.md §14.2 (round-2 clarifier)      — locks the 7-state model
//
// State coverage:
//   NEUTRAL            — default; correct waypoint stays NEUTRAL.
//   AGGRESSIVE         — smash predicate disables nearest unlocked haunt.
//   FLEEING            — walks to doors.x, emits STAGE_FAIL SOUL_ESCAPED.
//   CALLING_FOR_HELP   — timer-only fail; unreachable for Aldric (bias overrides bucket).
//   PRAYING            — 6s auto-end + 3× sight drain getter + clean interrupt.
//   RITUAL             — 8s timer → STAGE_FAIL SOUL_SAVED.
//   HIDING             — fear tick + Reaper-proximity → FLEEING.

import { describe, test, expect } from 'vitest';
import { Container } from 'pixi.js';
import { Victim } from '../src/entities/Victim.js';
import { mulberry32 } from '../src/util/rng.js';
import stage from '../src/stages/confession-room.json' with { type: 'json' };

// Minimal fake gameState — matches the real GameState shape closely enough
// for the FSM to run. (We don't import GameState because it ships with no
// argumentless constructor coupling, but mirroring the field names exactly
// is the point.)
function makeGameState({ fear = 0, unlocked = ['SHATTER', 'VOICE', 'WHISPER', 'RISE'] } = {}) {
  return {
    reaperTraits: {
      sightDurationMs: 8000,
      hauntSlotCount: 4,
      moveSpeed: 220,
      fearGainMultiplier: 1.0,
      footstepsAudible: false,
    },
    unlockedHaunts: new Set(unlocked),
    collectedEvidence: new Set(),
    fear,
    recentHaunts: [],
    phase2FirstHauntTimeMs: null,
    phase2EventLog: [],
  };
}

function makeVictim({ rng, gameState, view, fatedPose, now } = {}) {
  // Use a real Pixi Container for the view — it works fine under vitest's
  // default node env (no renderer invoked unless we mount to a stage).
  const v = new Victim({
    stageData: stage,
    gameState: gameState || makeGameState(),
    view: view || new Container(),
    createFatedDeathPose: fatedPose || (() => new Container()),
    floorY: 600,
    onFatedDeathComplete: () => {},
    rng: rng || mulberry32(1),
    now: now || (() => 0),
  });
  // Mark routine as "started at least once" so NEUTRAL re-entry re-engages it.
  // (Tests don't need routine to drive — applyHaunt is the focus — but flag
  // makes state semantics match runtime.)
  v._routineStartedAtLeastOnce = true;
  return v;
}

describe('VictimFSM — NEUTRAL: correct waypoint stays NEUTRAL', () => {
  // PRD §6.5: NEUTRAL is the only state where fear gains. Correct waypoint
  // gives +35 (= fearMath default); state stays NEUTRAL.
  test.each([
    ['SHATTER', 'altar'],
    ['VOICE', 'confessionBooth'],
    ['WHISPER', 'lectern'],
    ['RISE', 'sacristy'],
  ])('%s at %s + NEUTRAL → stays NEUTRAL, fearDelta=35', (haunt, waypoint) => {
    const v = makeVictim();
    v.currentWaypointId = waypoint;
    const r = v.applyHaunt(haunt);
    expect(r.stateAfter).toBe('NEUTRAL');
    expect(r.fearDelta).toBe(35);
  });
});

describe('VictimFSM — NEUTRAL: wrong-waypoint reactions (Aldric bias)', () => {
  // Bias-hit path (rng draw < 0.6) → RITUAL across every haunt/waypoint combo.
  test.each([
    ['SHATTER', 'lectern'],
    ['SHATTER', 'confessionBooth'],
    ['SHATTER', 'sacristy'],
    ['VOICE', 'altar'],
    ['VOICE', 'lectern'],
    ['VOICE', 'sacristy'],
    ['WHISPER', 'altar'],
    ['WHISPER', 'confessionBooth'],
    ['WHISPER', 'sacristy'],
    ['RISE', 'altar'],
    ['RISE', 'lectern'],
    ['RISE', 'confessionBooth'],
  ])('%s at %s (wrong) + NEUTRAL + bias hit → RITUAL, fearDelta=5', (haunt, waypoint) => {
    const v = makeVictim({ rng: () => 0.0 });
    v.currentWaypointId = waypoint;
    const r = v.applyHaunt(haunt);
    expect(r.stateAfter).toBe('RITUAL');
    expect(r.fearDelta).toBe(5);
  });

  // Bias-miss path (rng draw ≥ 0.6) → bucket default per haunt config.
  test.each([
    // low bucket (fear=0): lowFearTendency
    ['SHATTER', 'lectern', 0, 'PRAYING'],
    ['VOICE', 'lectern', 0, 'PRAYING'],
    ['WHISPER', 'altar', 0, 'AGGRESSIVE'],
    ['RISE', 'altar', 0, 'AGGRESSIVE'],
    // high bucket (fear=80): highFearTendency
    ['SHATTER', 'lectern', 80, 'FLEEING'],
    ['VOICE', 'lectern', 80, 'HIDING'],
    ['WHISPER', 'altar', 80, 'HIDING'],
    ['RISE', 'altar', 80, 'FLEEING'],
  ])('%s at %s, fear=%d, bias miss → %s', (haunt, waypoint, fear, expected) => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear }) });
    v.currentWaypointId = waypoint;
    const r = v.applyHaunt(haunt);
    expect(r.stateAfter).toBe(expected);
  });
});

describe('VictimFSM — Aldric 60% bias as a statistical property', () => {
  // Over 1000 wrong-waypoint NEUTRAL samples with a seeded RNG, the fraction
  // entering RITUAL should approach 60%. Window ±5% (550..650).
  test('1000 wrong-waypoint NEUTRAL samples: RITUAL count ∈ [550, 650]', () => {
    const rng = mulberry32(42);
    let ritualCount = 0;
    for (let i = 0; i < 1000; i++) {
      const v = makeVictim({ rng });
      v.currentWaypointId = 'lectern'; // wrong for SHATTER
      const r = v.applyHaunt('SHATTER');
      if (r.stateAfter === 'RITUAL') ritualCount++;
    }
    expect(ritualCount).toBeGreaterThanOrEqual(550);
    expect(ritualCount).toBeLessThanOrEqual(650);
  });
});

describe('VictimFSM — interrupt routing (clean → NEUTRAL, fearDelta=0)', () => {
  // PRD §6.7: any haunt during any non-NEUTRAL state interrupts to NEUTRAL
  // with no fear gain. Replaces the per-haunt interrupt table.
  test.each(['AGGRESSIVE', 'FLEEING', 'CALLING_FOR_HELP', 'PRAYING', 'RITUAL', 'HIDING'])(
    'haunt during %s → NEUTRAL, fearDelta=0',
    (state) => {
      const v = makeVictim();
      v.fsm.transition(state);
      expect(v.state).toBe(state);
      const r = v.applyHaunt('SHATTER');
      expect(r.stateAfter).toBe('NEUTRAL');
      expect(r.fearDelta).toBe(0);
    },
  );
});

describe('VictimFSM — RITUAL: 8000ms → STAGE_FAIL SOUL_SAVED', () => {
  test('RITUAL completes in 8000ms, emits stageFailed SOUL_SAVED', () => {
    const v = makeVictim({ rng: () => 0.0 });
    v.currentWaypointId = 'lectern';
    v.applyHaunt('SHATTER'); // → RITUAL
    expect(v.state).toBe('RITUAL');

    v.update(7999);
    expect(v.gameState.phase2EventLog).not.toContainEqual(
      expect.objectContaining({ type: 'stageFailed' }),
    );

    v.update(1);
    expect(v.gameState.phase2EventLog).toContainEqual(
      { type: 'stageFailed', reason: 'SOUL_SAVED' },
    );
    expect(v.stageFailReason).toBe('SOUL_SAVED');
  });
});

describe('VictimFSM — FLEEING: 6000ms or reach doors → STAGE_FAIL SOUL_ESCAPED', () => {
  test('FLEEING walks toward doors.x and fails when it arrives', () => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear: 80 }) });
    v.currentWaypointId = 'lectern';
    // Place victim well right of doors so we know dir is positive and short.
    // doors.x = 1180 per confession-room.json. Place at 1140 so 40px gap.
    // At moveSpeed 220 px/s = 0.22 px/ms, 40px takes ~182ms.
    v.view.x = 1140;
    v.applyHaunt('SHATTER'); // → FLEEING (highFearTendency, bias miss)
    expect(v.state).toBe('FLEEING');

    v.update(200); // overshoots doors
    expect(v.view.x).toBe(stage.doors.x);
    expect(v.gameState.phase2EventLog).toContainEqual(
      { type: 'stageFailed', reason: 'SOUL_ESCAPED' },
    );
  });

  test('FLEEING timer expires at 6000ms even if doors not reached → SOUL_ESCAPED', () => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear: 80 }) });
    v.currentWaypointId = 'lectern';
    v.view.x = 0; // very far left — can't reach 1180 within timeout at 220 px/s
    v.applyHaunt('SHATTER');
    expect(v.state).toBe('FLEEING');

    // 1180 px at 220 px/s = ~5363 ms — would actually reach doors before timeout.
    // Move start to a position that won't reach doors in 6000ms even at full speed:
    // 6000 * 220 / 1000 = 1320 px traveled. Start at -1000 so doors-x=1180 is 2180 away.
    v.view.x = -1000;
    v._stateElapsedMs = 0;
    v._stageFailEmitted = false;
    v.gameState.phase2EventLog.length = 0;

    v.update(5999);
    expect(v.gameState.phase2EventLog).not.toContainEqual(
      expect.objectContaining({ type: 'stageFailed' }),
    );
    v.update(1);
    expect(v.gameState.phase2EventLog).toContainEqual(
      { type: 'stageFailed', reason: 'SOUL_ESCAPED' },
    );
  });
});

describe('VictimFSM — CALLING_FOR_HELP: 8000ms → STAGE_FAIL HELP_ARRIVED', () => {
  test('CALLING_FOR_HELP completes in 8000ms with HELP_ARRIVED', () => {
    // Forced transition (Aldric never naturally enters this state).
    const v = makeVictim();
    v.fsm.transition('CALLING_FOR_HELP');
    expect(v.state).toBe('CALLING_FOR_HELP');

    v.update(7999);
    expect(v.gameState.phase2EventLog).not.toContainEqual(
      expect.objectContaining({ type: 'stageFailed' }),
    );

    v.update(1);
    expect(v.gameState.phase2EventLog).toContainEqual(
      { type: 'stageFailed', reason: 'HELP_ARRIVED' },
    );
  });
});

describe('VictimFSM — PRAYING: 6000ms auto-end + 3× sight drain + interrupt', () => {
  test('PRAYING auto-ends at 6000ms → NEUTRAL', () => {
    const v = makeVictim({ rng: () => 0.99 });
    v.currentWaypointId = 'lectern';
    // fear=0 + bias miss → bucket default = PRAYING for SHATTER.lowFearTendency.
    v.applyHaunt('SHATTER');
    expect(v.state).toBe('PRAYING');

    v.update(5999);
    expect(v.state).toBe('PRAYING');

    v.update(1);
    expect(v.state).toBe('NEUTRAL');
  });

  test('sightDrainMultiplier is 3× while PRAYING, 1× otherwise', () => {
    const v = makeVictim({ rng: () => 0.99 });
    expect(v.sightDrainMultiplier).toBe(1);
    v.currentWaypointId = 'lectern';
    v.applyHaunt('SHATTER');
    expect(v.state).toBe('PRAYING');
    expect(v.sightDrainMultiplier).toBe(3);
    v.fsm.transition('NEUTRAL');
    expect(v.sightDrainMultiplier).toBe(1);
  });

  test('haunt during PRAYING is a clean interrupt: → NEUTRAL, fearDelta=0', () => {
    const v = makeVictim({ rng: () => 0.99 });
    v.currentWaypointId = 'lectern';
    v.applyHaunt('SHATTER'); // → PRAYING
    expect(v.state).toBe('PRAYING');

    const r = v.applyHaunt('VOICE');
    expect(r.stateAfter).toBe('NEUTRAL');
    expect(r.fearDelta).toBe(0);
  });
});

describe('VictimFSM — AGGRESSIVE: smash predicate + slot disable', () => {
  test('AGGRESSIVE in range of unlocked evidence → smash, disable slot, return NEUTRAL', () => {
    const v = makeVictim({ rng: () => 0.99 });
    // WHISPER@altar, low bucket → AGGRESSIVE.
    v.currentWaypointId = 'altar';
    // Position victim near the chalice (SHATTER host at x=220).
    v.view.x = 220;
    v.applyHaunt('WHISPER');
    expect(v.state).toBe('AGGRESSIVE');

    // First tick — smash predicate hits since chalice@220 is at distance 0.
    v.update(10);
    expect(v.state).toBe('NEUTRAL');
    expect(v.gameState.smashedHaunts.has('SHATTER')).toBe(true);
  });

  test('AGGRESSIVE with no in-range source → returns to NEUTRAL after 4s', () => {
    // Place victim far from every evidence host x. The evidence are at
    // 220, 500, 780, 1180; pick 1500 (300px from nearest at 1180).
    const v = makeVictim({ rng: () => 0.99 });
    v.currentWaypointId = 'altar';
    v.view.x = 1500;
    v.applyHaunt('WHISPER');
    expect(v.state).toBe('AGGRESSIVE');

    v.update(3999);
    expect(v.state).toBe('AGGRESSIVE');
    expect(v.gameState.smashedHaunts.size).toBe(0);

    v.update(1);
    expect(v.state).toBe('NEUTRAL');
    expect(v.gameState.smashedHaunts.size).toBe(0);
  });

  test('smash skips already-smashed and locked haunts', () => {
    // Only SHATTER unlocked. Pre-smash SHATTER → no candidate left.
    const gs = makeGameState({ unlocked: ['SHATTER', 'WHISPER'] });
    gs.smashedHaunts = new Set(['SHATTER']);
    const v = makeVictim({ rng: () => 0.99, gameState: gs });
    v.currentWaypointId = 'altar';
    v.view.x = 220;
    v.applyHaunt('WHISPER'); // → AGGRESSIVE
    v.update(10);
    // SHATTER not re-smashed; nothing else in range of x=220 (WHISPER host at x=500 → 280px away)
    expect(v.state).toBe('AGGRESSIVE'); // still searching
    expect(gs.smashedHaunts.has('SHATTER')).toBe(true);
    expect(gs.smashedHaunts.size).toBe(1);
  });
});

describe('VictimFSM — HIDING: fear tick + Reaper-proximity → FLEEING', () => {
  test('HIDING ticks fear +1/s through applyFearGain chokepoint', () => {
    const gs = makeGameState({ fear: 80 });
    const v = makeVictim({ rng: () => 0.99, gameState: gs });
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE'); // → HIDING (highFearTendency)
    expect(v.state).toBe('HIDING');

    // No Reaper position set → no proximity flip.
    const fearBefore = gs.fear;
    v.update(1000);
    expect(gs.fear).toBeCloseTo(fearBefore + 1, 5);
  });

  test('HIDING fear tick scales by fearGainMultiplier', () => {
    const gs = makeGameState({ fear: 80 });
    gs.reaperTraits.fearGainMultiplier = 2.0;
    const v = makeVictim({ rng: () => 0.99, gameState: gs });
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE');
    expect(v.state).toBe('HIDING');

    const fearBefore = gs.fear;
    v.update(1000);
    expect(gs.fear).toBeCloseTo(fearBefore + 2, 5);
  });

  test('Reaper within 80px + Sight ON → HIDING flips to FLEEING', () => {
    const gs = makeGameState({ fear: 80 });
    const v = makeVictim({ rng: () => 0.99, gameState: gs });
    // Move victim visually to the lectern so HIDING.enter snaps to lectern.
    v.view.x = 500;
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE');
    expect(v.state).toBe('HIDING');
    expect(v.view.x).toBe(500); // snapped to nearest waypoint (lectern @ 500)
    v.setReaperX(550); // 50px away, < 80
    v.setSightOn(true);

    v.update(16);
    expect(v.state).toBe('FLEEING');
  });

  test('Reaper within 80px but Sight OFF → HIDING stays put', () => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear: 80 }) });
    v.view.x = 500;
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE');
    expect(v.state).toBe('HIDING');

    v.setReaperX(500);
    v.setSightOn(false);

    v.update(16);
    expect(v.state).toBe('HIDING');
  });

  test('Reaper > 80px even with Sight ON → HIDING stays put', () => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear: 80 }) });
    v.view.x = 500;
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE');
    expect(v.state).toBe('HIDING');

    v.setReaperX(700); // 200px from lectern@500
    v.setSightOn(true);

    v.update(16);
    expect(v.state).toBe('HIDING');
  });

  test('HIDING has no auto-timeout (state persists indefinitely)', () => {
    const v = makeVictim({ rng: () => 0.99, gameState: makeGameState({ fear: 80 }) });
    v.currentWaypointId = 'lectern';
    v.applyHaunt('VOICE');
    expect(v.state).toBe('HIDING');

    v.update(30000); // 30s of nothing happening
    // Fear gets clamped at 100.
    expect(v.gameState.fear).toBe(100);
    // Stay in HIDING — no timer-based exit.
    expect(v.state).toBe('HIDING');
  });
});

describe('VictimFSM — fearDelta during non-NEUTRAL is always 0', () => {
  test.each(['AGGRESSIVE', 'FLEEING', 'CALLING_FOR_HELP', 'PRAYING', 'RITUAL', 'HIDING'])(
    'applyHaunt during %s → fearDelta=0',
    (state) => {
      const v = makeVictim();
      v.fsm.transition(state);
      const r = v.applyHaunt('SHATTER');
      expect(r.fearDelta).toBe(0);
    },
  );
});

describe('VictimFSM — CALLING_FOR_HELP unreachable for Aldric (bias never picks it)', () => {
  // The bias is RITUAL@60%. Even on miss, the bucket defaults are
  // PRAYING/AGGRESSIVE/HIDING/FLEEING — never CALLING_FOR_HELP. This is
  // an Aldric-specific property (per PRD §6.5 + §14.2 #5).
  test('1000 seeded wrong-waypoint NEUTRAL samples produce zero CALLING_FOR_HELP', () => {
    const rng = mulberry32(7);
    const haunts = ['SHATTER', 'VOICE', 'WHISPER', 'RISE'];
    const wrongWp = { SHATTER: 'lectern', VOICE: 'altar', WHISPER: 'altar', RISE: 'altar' };
    let callCount = 0;
    for (let i = 0; i < 1000; i++) {
      const h = haunts[i % haunts.length];
      const fear = i % 2 === 0 ? 0 : 90; // alternate low/high bucket
      const v = makeVictim({ rng, gameState: makeGameState({ fear }) });
      v.currentWaypointId = wrongWp[h];
      const r = v.applyHaunt(h);
      if (r.stateAfter === 'CALLING_FOR_HELP') callCount++;
    }
    expect(callCount).toBe(0);
  });
});
