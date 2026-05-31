// VictimFSM.test.js
// Spec for `VictimFSM`. Constructed with a seeded RNG + personality config
// (sourced from confession-room.json). Public surface: `applyHaunt(haunt,
// waypoint) → { stateAfter, fearDelta, sideEffects }` and `tick(dtMs)`.
//
// Module landing slice: 4. Until impl lands, every test is `.skip`.
//
// Spec sources:
//   - docs/PRD.md §"State machines" (line 99) — Victim FSM API
//   - docs/PRD.md §"Haunt rules" (lines 122-123) — reaction tendencies, interrupts
//   - docs/PRD.md §"Personality bias" (line 127)
//   - docs/PRD.md §"Victim reactions" (lines 129-133) — timers + smash
//   - docs/PRD.md §"Testing Decisions" → "Modules under test" #3 (lines 196-199)
//   - .scratch/grim-griper-puzzle-mvp/issues/08-test-victim-fsm.md
//
// Primary reaction tendencies (PRD line 122):
//   RISE    → FLEEING
//   WHISPER → AGGRESSIVE
//   SHATTER → FLEEING
//   VOICE   → CALLING_FOR_HELP
//
// Interrupt routes (PRD line 123):
//   SHATTER on CALLING_FOR_HELP → FLEEING
//   VOICE   on AGGRESSIVE       → CALLING_FOR_HELP
//   RISE    on FLEEING          → AGGRESSIVE
// Each new state always starts with a full fresh timer.
//
// Reaction timers (PRD lines 130-132):
//   AGGRESSIVE         → ~4s default, ends immediately on smash
//   FLEEING            → 6000ms to doors → STAGE_FAIL_SOUL_ESCAPED
//   CALLING_FOR_HELP   → 8000ms          → STAGE_FAIL_HELP_ARRIVED

import { describe, test, expect } from 'vitest';
import stage from '../src/stages/confession-room.json' with { type: 'json' };

// TODO unskip when VictimFSM lands (slice 4, owner #3 Haunt AI).
// Adjust path when #3 commits — likely src/ai/VictimFSM.js but could be
// src/victim/VictimFSM.js depending on directory choices made during slice 3.
// import { VictimFSM } from '../src/ai/VictimFSM.js';
// import { mulberry32 } from '../src/util/rng.js'; // seeded RNG helper

// NOTE on confession-room.json: slice 1's JSON does not yet carry
// `victim.routine`, `victim.personality.bias`, or evidence hauntSource bindings.
// Stage+Art Lead expands it during slice 2 (evidence) and slice 3-4 (victim).
// Once expanded, these tests should pull personality straight from
// `stage.victim.personality` (issue 08 acceptance line 27).

describe('VictimFSM — transitions from NEUTRAL on correct waypoint', () => {
  // Correct waypoint, NEUTRAL → state stays NEUTRAL, fearDelta = 35.
  // (Reactions only roll on wrong-waypoint per PRD line 119.)
  test.skip('SHATTER at Altar + NEUTRAL → stays NEUTRAL, fearDelta = 35', () => {
    // const fsm = new VictimFSM({
    //   rng: mulberry32(1),
    //   personality: stage.victim.personality,
    //   routine: stage.victim.routine,
    // });
    // const result = fsm.applyHaunt('SHATTER', 'altar');
    // expect(result.stateAfter).toBe('NEUTRAL');
    // expect(result.fearDelta).toBe(35);
    // expect(result.sideEffects).toEqual([]);
  });
});

describe('VictimFSM — wrong-waypoint reactions in NEUTRAL', () => {
  // Wrong waypoint → fearDelta 5, then roll a Reaction biased by personality.
  // With Aldric's 60% CALLING_FOR_HELP bias, the else branch enters the
  // haunt's primary reaction tendency (PRD §"Resolved Design Questions" #5,
  // line 233 — the `fallback` key is REMOVED; else branch uses primary).
  //
  // Seeded RNG = mulberry32(seed) with first draw < 0.6 ⇒ CALLING_FOR_HELP,
  // first draw >= 0.6 ⇒ haunt's primary tendency.
  test.skip('SHATTER at Lectern + NEUTRAL, RNG draw 0.3 → CALLING_FOR_HELP (bias hit)', () => {
    // const fsm = new VictimFSM({
    //   rng: () => 0.3, // deterministic single-call stub
    //   personality: stage.victim.personality,
    //   routine: stage.victim.routine,
    // });
    // const result = fsm.applyHaunt('SHATTER', 'lectern');
    // expect(result.stateAfter).toBe('CALLING_FOR_HELP');
    // expect(result.fearDelta).toBe(5);
  });

  test.skip('SHATTER at Lectern + NEUTRAL, RNG draw 0.8 → FLEEING (SHATTER primary)', () => {
    // const fsm = new VictimFSM({
    //   rng: () => 0.8,
    //   personality: stage.victim.personality,
    //   routine: stage.victim.routine,
    // });
    // const result = fsm.applyHaunt('SHATTER', 'lectern');
    // expect(result.stateAfter).toBe('FLEEING');
  });

  test.skip('WHISPER at Altar + NEUTRAL, RNG draw 0.8 → AGGRESSIVE (WHISPER primary)', () => {
    // RNG 0.8 ≥ 0.6 bias threshold → fall through to haunt's primary tendency.
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // const result = fsm.applyHaunt('WHISPER', 'altar');
    // expect(result.stateAfter).toBe('AGGRESSIVE');
  });

  test.skip('RISE at Altar + NEUTRAL, RNG draw 0.8 → FLEEING (RISE primary)', () => {
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // const result = fsm.applyHaunt('RISE', 'altar');
    // expect(result.stateAfter).toBe('FLEEING');
  });

  test.skip('VOICE at Altar + NEUTRAL, RNG draw 0.8 → CALLING_FOR_HELP (VOICE primary, also matches bias coincidentally)', () => {
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // const result = fsm.applyHaunt('VOICE', 'altar');
    // expect(result.stateAfter).toBe('CALLING_FOR_HELP');
  });
});

describe('VictimFSM — interrupt routing (PRD line 123)', () => {
  // Each interrupt cancels old timer and starts the new state's full fresh
  // timer (issue 08 acceptance line 20).
  test.skip('SHATTER while CALLING_FOR_HELP → FLEEING with fresh 6000ms timer', () => {
    // const fsm = new VictimFSM({ rng: () => 0.3, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('VOICE', 'altar'); // → CALLING_FOR_HELP
    // fsm.tick(3000); // burn 3s of the 8s call timer
    // const result = fsm.applyHaunt('SHATTER', 'lectern');
    // expect(result.stateAfter).toBe('FLEEING');
    // expect(result.fearDelta).toBe(0); // interrupt during non-NEUTRAL → 0 fear
    // // FLEEING completes at full 6000ms from interrupt, not residual:
    // fsm.tick(5999);
    // expect(fsm.state).toBe('FLEEING');
    // fsm.tick(1);
    // // emits STAGE_FAIL_SOUL_ESCAPED on completion
  });

  test.skip('VOICE while AGGRESSIVE → CALLING_FOR_HELP with fresh 8000ms timer', () => {
    // const fsm = new VictimFSM({ rng: () => 0.3, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('WHISPER', 'altar'); // RNG 0.3 → bias hits CALLING_FOR_HELP; want AGGRESSIVE primary instead
    // // Use rng 0.8 to fall through to WHISPER primary = AGGRESSIVE.
    // const fsm2 = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm2.applyHaunt('WHISPER', 'altar'); // → AGGRESSIVE
    // const result = fsm2.applyHaunt('VOICE', 'altar');
    // expect(result.stateAfter).toBe('CALLING_FOR_HELP');
  });

  test.skip('RISE while FLEEING → AGGRESSIVE with fresh timer', () => {
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('SHATTER', 'lectern'); // → FLEEING (RNG 0.8 fall-through, SHATTER primary)
    // const result = fsm.applyHaunt('RISE', 'altar');
    // expect(result.stateAfter).toBe('AGGRESSIVE');
  });

  // Non-matching interrupt: haunt fired in a reaction it does not counter.
  // PRD line 121, issue 08 line 21.
  test.skip('VOICE during FLEEING → no-op (no interrupt match), fearDelta 0, state unchanged', () => {
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('SHATTER', 'lectern'); // → FLEEING
    // const result = fsm.applyHaunt('VOICE', 'altar');
    // expect(result.stateAfter).toBe('FLEEING');
    // expect(result.fearDelta).toBe(0);
    // expect(result.sideEffects).toEqual([]);
  });
});

describe('VictimFSM — Aldric 60% bias as a statistical property', () => {
  // Issue 08 acceptance line 22: over N=1000 seeded wrong-waypoint NEUTRAL
  // samples, CALLING_FOR_HELP count is within a tolerance window of 600.
  // ±50 (i.e. 550..650) is the placeholder window — pin the actual bound when
  // the impl ships its RNG choice.
  test.skip('1000 wrong-waypoint NEUTRAL samples: CALLING_FOR_HELP count ∈ [550, 650]', () => {
    // const rng = mulberry32(42); // fixed seed for reproducibility
    // let callCount = 0;
    // for (let i = 0; i < 1000; i++) {
    //   const fsm = new VictimFSM({ rng, personality: stage.victim.personality, routine: stage.victim.routine });
    //   const result = fsm.applyHaunt('SHATTER', 'lectern'); // wrong waypoint for SHATTER
    //   if (result.stateAfter === 'CALLING_FOR_HELP') callCount++;
    // }
    // expect(callCount).toBeGreaterThanOrEqual(550);
    // expect(callCount).toBeLessThanOrEqual(650);
  });
});

describe('VictimFSM — tick timers', () => {
  // PRD line 131; issue 08 line 23.
  test.skip('FLEEING reaches doors in 6000ms → emits STAGE_FAIL_SOUL_ESCAPED', () => {
    // const fsm = new VictimFSM({ rng: () => 0.8, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('SHATTER', 'lectern'); // → FLEEING
    // const events = [];
    // fsm.on?.('stageFail', e => events.push(e));
    // fsm.tick(5999);
    // expect(events).toHaveLength(0);
    // fsm.tick(1);
    // expect(events).toContainEqual(expect.objectContaining({ type: 'STAGE_FAIL_SOUL_ESCAPED' }));
  });

  // PRD line 132; issue 08 line 24.
  test.skip('CALLING_FOR_HELP completes in 8000ms → emits STAGE_FAIL_HELP_ARRIVED', () => {
    // const fsm = new VictimFSM({ rng: () => 0.3, personality: stage.victim.personality, routine: stage.victim.routine });
    // fsm.applyHaunt('VOICE', 'altar'); // → CALLING_FOR_HELP
    // const events = [];
    // fsm.on?.('stageFail', e => events.push(e));
    // fsm.tick(7999);
    // expect(events).toHaveLength(0);
    // fsm.tick(1);
    // expect(events).toContainEqual(expect.objectContaining({ type: 'STAGE_FAIL_HELP_ARRIVED' }));
  });
});

describe('VictimFSM — AGGRESSIVE smash side-effect', () => {
  // PRD line 130; issue 08 line 25.
  // AGGRESSIVE smashes the nearest in-range unlocked haunt-source, permanently
  // disabling that haunt's slot for the rest of the run.
  test.skip('AGGRESSIVE smash disables nearest unlocked haunt-source, emits hauntSlotDisabled', () => {
    // const fsm = new VictimFSM({
    //   rng: () => 0.8,
    //   personality: stage.victim.personality,
    //   routine: stage.victim.routine,
    //   evidence: stage.evidence, // includes hauntSourceWaypointId per PRD line 111
    // });
    // fsm.applyHaunt('WHISPER', 'altar'); // → AGGRESSIVE (RNG 0.8 fall-through)
    // const events = [];
    // fsm.on?.('hauntSlotDisabled', e => events.push(e));
    // fsm.tick(10); // smash fires on first tick if a source is in range
    // expect(events).toHaveLength(1);
    // expect(events[0].hauntId).toBeDefined();
    //
    // // Subsequent applyHaunt for the disabled hauntId behaves as if greyed:
    // const disabledHauntId = events[0].hauntId;
    // const correctWp = /* waypoint matching disabledHauntId */ '';
    // const result = fsm.applyHaunt(disabledHauntId, correctWp);
    // expect(result.fearDelta).toBe(0);
  });

  test.skip('AGGRESSIVE with no in-range source → ends after ~4s default duration, no smash event', () => {
    // const fsm = new VictimFSM({
    //   rng: () => 0.8,
    //   personality: stage.victim.personality,
    //   routine: stage.victim.routine,
    //   evidence: [], // no sources in range
    // });
    // fsm.applyHaunt('WHISPER', 'altar'); // → AGGRESSIVE
    // const events = [];
    // fsm.on?.('hauntSlotDisabled', e => events.push(e));
    // fsm.tick(4000);
    // expect(fsm.state).toBe('NEUTRAL');
    // expect(events).toHaveLength(0);
  });
});

describe('VictimFSM — fearDelta during non-NEUTRAL is always 0 (PRD line 121)', () => {
  test.skip.each(['AGGRESSIVE', 'FLEEING', 'CALLING_FOR_HELP'])(
    'applyHaunt during %s → fearDelta 0',
    (state) => {
      // Setup omitted — once impl lands, force state, then call applyHaunt
      // with a non-interrupting haunt and assert fearDelta === 0.
    }
  );
});
