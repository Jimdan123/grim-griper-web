// Victim — routine walker + 7-state FSM.
//
// Owner: #3 Haunt AI Engineer. Slice 3 shipped NEUTRAL + routine walker +
// Fated Death entry. Slice 4 lands the full state bodies for AGGRESSIVE,
// FLEEING, CALLING_FOR_HELP, PRAYING, RITUAL, HIDING, plus the
// `applyHaunt(hauntId, opts)` entry point that drives interrupt routing
// + reaction selection.
//
// Spec sources:
//   - docs/PRD.md §6.5  "Victim FSM (7 states)"          — timers + exits + side effects
//   - docs/PRD.md §6.6  "Reaction Selection"             — bucket + bias algorithm
//   - docs/PRD.md §6.7  "Interrupt Routing"              — non-NEUTRAL haunt = clean interrupt
//   - docs/PRD.md §6.4  "Fear Math"                      — applyFearGain chokepoint
//   - docs/PRD.md §10.6 "Haunts" schema                  — per-haunt lowFear/highFear tendencies
//   - docs/PRD.md §10.7 "Victim" schema                  — personality.bias
//
// Routine timing (data-driven from stageData.victim):
//   - dwellMs:   ~3000  (idle at the waypoint)
//   - walkMs:    ~2000  (linear lerp to next waypoint's x)
//   - 1s grace post-TAB before startRoutine() is called by Stage.
//
// Next-waypoint-sticky rule (PRD/issue 03):
//   The instant Aldric LEAVES a waypoint, his `currentWaypointId` flips to
//   the NEXT waypoint in the routine. Haunts fired during the walk-segment
//   are evaluated against the destination, not the source. This makes the
//   waypoint model victim-anchored and Reaper-position-irrelevant.
//
// FSM design:
//   This file uses the shared StateMachine class (src/engine/StateMachine.js).
//   The routine walker is gated by a `_routineActive` flag, so non-NEUTRAL
//   states can halt it without re-checking state names. Side effects (smash
//   target, fail emit, fear tick) live in the state bodies' update() methods.
//
// Public API:
//   - applyHaunt(hauntId, { now }) → { fearDelta, stateBefore, stateAfter, sideEffects }
//   - update(dtMs) — routine walker + FSM tick + fated death fade
//   - startRoutine() / enterFatedDeath() — lifecycle hooks Stage calls
//   - setReaperX(x) / setSightOn(bool) — perception inputs for HIDING
//   - state (getter) / sightDrainMultiplier (getter, 3 while PRAYING)
//
// External wiring (NOT owned by this file; flagged in the slice-4 report):
//   - actionHandlers.js should call victim.applyHaunt(hauntId) and read fearDelta
//     from the result. The current `computeHauntFearDelta` call path bypasses
//     the FSM transitions.
//   - Stage.HAUNT.update should poll victim for a STAGE_FAIL sideEffect and
//     transition to SCORE with the reason. Until that wiring lands, fail
//     events still push into gameState.phase2EventLog and scoring reads them.
//   - SightFSM should consult victim.sightDrainMultiplier to apply the 3×
//     drain while PRAYING.

import { Container } from 'pixi.js';
import { StateMachine } from '../engine/StateMachine.js';
import { applyFearGain, computeHauntFearDelta } from '../math/fearMath.js';
import { pickReaction } from '../math/reactionSelection.js';

// State timers (ms). PRD §6.5 table.
const AGGRESSIVE_TIMEOUT_MS = 4000;
const FLEEING_TIMEOUT_MS = 6000;
const CALLING_FOR_HELP_TIMEOUT_MS = 8000;
const PRAYING_TIMEOUT_MS = 6000;
const RITUAL_TIMEOUT_MS = 8000;

// AGGRESSIVE smash range — placeholder per PRD §19 #1. Tune at slice-4 playtest.
const SMASH_RANGE_PX = 80;

// HIDING — Reaper proximity that flips victim to FLEEING when Sight is ON.
const HIDING_REAPER_PROXIMITY_PX = 80;

// HIDING fear tick — +1 per second through the applyFearGain chokepoint.
// PRD §6.5 line "FEAR ticks +1 / s while active".
const HIDING_FEAR_PER_MS = 1 / 1000;

// PRAYING sight drain multiplier — surfaced via getter; integrator wires.
const PRAYING_SIGHT_DRAIN_MULT = 3;

const FATED_DEATH_FADE_MS = 1500;

export class Victim {
  /**
   * @param {object} args
   * @param {object} args.stageData            normalized stage JSON (from StageLoader)
   * @param {object} args.gameState            shared GameState
   * @param {PIXI.Container} args.view         walking-sprite container from #5
   *                                           (createAldricWalkingSprite()). Wrapped
   *                                           internally in a host Container so
   *                                           Fated Death can swap-in a different
   *                                           sprite while keeping the same
   *                                           world-mounted anchor.
   * @param {() => PIXI.Container} args.createFatedDeathPose
   *                                           factory for the still-pose container,
   *                                           swapped in on enterFatedDeath()
   * @param {number} args.floorY               world-logical y to anchor on
   *                                           (Stage.floorY)
   * @param {() => void} [args.onFatedDeathComplete]
   *                                           called after the still-pose fade
   *                                           finishes; Stage uses it to advance
   *                                           the phase FSM to SCORE.
   * @param {() => number} [args.rng]          Source of randomness for bias rolls.
   *                                           Defaults to Math.random; tests
   *                                           inject a seeded RNG for determinism.
   * @param {() => number} [args.now]          Wall-clock source. Defaults to
   *                                           performance.now; tests inject a
   *                                           stub.
   */
  constructor({
    stageData,
    gameState,
    view,
    createFatedDeathPose,
    floorY,
    onFatedDeathComplete,
    rng,
    now,
  }) {
    this.stageData = stageData;
    this.gameState = gameState;
    // Host container — what gets mounted into world. We swap the inner sprite
    // (walking → fated death pose) by replacing this host's only child. Both
    // sprite factories use bottom-center pivot anchored at (0,0) of the host,
    // so view.x = waypoint.x and view.y = floorY positions either sprite
    // correctly on the floor line.
    this.view = new Container();
    this.view.label = 'victim';
    this._spriteChild = view;
    this.view.addChild(view);
    this._createFatedDeathPose = createFatedDeathPose;
    this._onFatedDeathComplete = onFatedDeathComplete || null;

    // Deterministic-injectable rng/now for tests. Defaults safe for prod.
    this._rng = typeof rng === 'function' ? rng : Math.random;
    this._now = typeof now === 'function'
      ? now
      : () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Perception inputs for HIDING — set by integrator each frame.
    this._reaperX = null;
    this._sightOn = false;

    // Per-state runtime — timers + scratch.
    this._stateElapsedMs = 0;
    // Track smashed haunt slots on gameState so other systems (HUD,
    // actionHandlers) can read them without coupling to Victim internals.
    // Lazy-init so we don't require a GameState.js schema change.
    if (gameState && !gameState.smashedHaunts) {
      gameState.smashedHaunts = new Set();
    }

    const routine = stageData.victim.routine;
    this._routine = routine;
    this._dwellMs = stageData.victim.dwellMs;
    this._walkMs = stageData.victim.walkMs;

    // Build waypoint-id → x lookup so we don't .find() every tick.
    const wpById = new Map();
    for (const wp of stageData.waypoints) wpById.set(wp.id, wp);
    this._wpById = wpById;
    this._floorY = floorY;

    // ── Multi-room navigation (sub-slice #22a) ────────────────────────────
    // Stage data per #5's migration carries `rooms[]` and `links[]`. When a
    // walk crosses a room boundary, the lerp is split into two phases that
    // route through the connecting door tile. Read defensively — if the
    // fields are absent, _walkToWaypoint falls back to the straight-line
    // single-phase walk and behavior matches slice-3 exactly.
    this._tile = (stageData.meta && stageData.meta.tile) || 16;
    this._rooms = Array.isArray(stageData.rooms) ? stageData.rooms : [];
    this._links = Array.isArray(stageData.links) ? stageData.links : [];

    // Pre-resolve which room each waypoint sits in. Done ONCE in the
    // constructor so the per-tick walk-setup is O(1) lookups, no scans,
    // no allocations. Map: waypointId → roomId (or null if outside all rooms).
    this._wpRoomById = new Map();
    for (const wp of stageData.waypoints) {
      this._wpRoomById.set(wp.id, this._roomIdForLogicalX(wp.x));
    }

    // Pre-resolve door logical-x for each (roomA → roomB) link pair so the
    // walk-setup branch on different-rooms is also O(1). Key: "roomA|roomB".
    this._doorXByRoomPair = new Map();
    for (const link of this._links) {
      if (link.type !== 'door' || !Array.isArray(link.tile)) continue;
      const doorX = link.tile[0] * this._tile;
      // Doors are bidirectional for pathing purposes — register both directions.
      this._doorXByRoomPair.set(`${link.from}|${link.to}`, doorX);
      this._doorXByRoomPair.set(`${link.to}|${link.from}`, doorX);
    }

    // Spawn at the first waypoint in the routine (altar, per confession-room.json).
    this._routineIndex = 0;
    this.currentWaypointId = routine[0];

    const spawnWp = wpById.get(routine[0]);
    this.view.x = spawnWp.x;
    this.view.y = floorY;

    // Routine flags. _routineActive guards the dwell/walk update path so future
    // FSM states can pause Aldric without us re-checking `state` here.
    this._routineActive = false;
    this._phase = 'dwell';        // 'dwell' | 'walk'
    this._phaseElapsedMs = 0;
    this._walkFromX = spawnWp.x;
    this._walkToX = spawnWp.x;

    // Multi-room walk plan. When the upcoming walk crosses a door, _walkLegs
    // holds [{ fromX, toX, durMs }, ...] — phase 1 = nave→door, phase 2 =
    // door→destination. Single-room walks use a one-element array. The array
    // is mutated in place (its slots) so no GC pressure mid-routine.
    this._walkLegs = [
      { fromX: spawnWp.x, toX: spawnWp.x, durMs: this._walkMs },
      { fromX: spawnWp.x, toX: spawnWp.x, durMs: 0 },
    ];
    this._walkLegCount = 1;
    this._walkLegIndex = 0;

    // Fated Death pose + fade state.
    this._fatedDeathActive = false;
    this._fatedDeathElapsedMs = 0;
    this._fatedDeathCompleted = false;

    // FSM. Slice 4: full state bodies for all 7 states.
    //
    // The `update(dtMs)` of each non-NEUTRAL state increments
    // `this._stateElapsedMs`. Exits happen either on timer expiry (timed
    // states) or on a predicate (AGGRESSIVE smash range, HIDING reaper-
    // proximity). Enter halts the routine; exit re-enables it for states
    // that return to NEUTRAL.
    //
    // STAGE_FAIL terminal states (FLEEING-at-doors, CALLING_FOR_HELP timeout,
    // RITUAL timeout) call `this._emitStageFail(reason)` which pushes a
    // `stageFailed` event onto gameState.phase2EventLog. The Stage SCORE
    // transition reads this in main.js / Stage.js (out-of-scope wiring noted
    // in the slice-4 report).
    this.fsm = new StateMachine(
      {
        NEUTRAL: {
          enter: () => {
            // Re-engage the routine on re-entry. startRoutine() is idempotent
            // and a no-op if not yet started.
            if (this._routineStartedAtLeastOnce) {
              this._routineActive = true;
            }
            this._stateElapsedMs = 0;
          },
          update: () => {},
          exit: () => {
            // Halt routine for any non-NEUTRAL state. Per-state bodies will
            // do nothing on top of this.
            this._routineActive = false;
          },
        },

        AGGRESSIVE: {
          enter: () => {
            this._stateElapsedMs = 0;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            // Smash predicate: nearest unlocked, non-smashed evidence host
            // within SMASH_RANGE_PX of the victim's current x. Side effect:
            // permanently disable that haunt's slot, then return to NEUTRAL.
            const smashTargetHauntId = this._findSmashTarget();
            if (smashTargetHauntId) {
              this.gameState.smashedHaunts.add(smashTargetHauntId);
              this._pendingSideEffects.push({
                type: 'hauntSlotDisabled',
                hauntId: smashTargetHauntId,
              });
              this.fsm.transition('NEUTRAL');
              return;
            }
            // Timeout: no in-range target — fall back to NEUTRAL after 4s.
            if (this._stateElapsedMs >= AGGRESSIVE_TIMEOUT_MS) {
              this.fsm.transition('NEUTRAL');
            }
          },
          exit: () => {},
        },

        FLEEING: {
          enter: () => {
            this._stateElapsedMs = 0;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            // Walk toward doors at the same speed Player uses (traits.moveSpeed).
            // doors.x is authored in confession-room.json (PRD §10.1).
            const doorsX = this.stageData.doors?.x;
            const moveSpeed =
              (this.gameState && this.gameState.reaperTraits?.moveSpeed) || 220;
            if (Number.isFinite(doorsX)) {
              const dir = doorsX > this.view.x ? 1 : -1;
              const step = moveSpeed * (dtMs / 1000) * dir;
              const next = this.view.x + step;
              // Snap-to-doors check: if we've reached / passed doorsX, fail.
              if ((dir > 0 && next >= doorsX) || (dir < 0 && next <= doorsX)) {
                this.view.x = doorsX;
                this._emitStageFail('SOUL_ESCAPED');
                return;
              }
              this.view.x = next;
            }
            if (this._stateElapsedMs >= FLEEING_TIMEOUT_MS) {
              // Timer expired without reaching doors — per PRD §6.5 the timer
              // exit also fails the stage with SOUL_ESCAPED. (Treat as "he
              // got away through any exit.")
              this._emitStageFail('SOUL_ESCAPED');
            }
          },
          exit: () => {},
        },

        CALLING_FOR_HELP: {
          // Aldric never enters this state (bias always overrides bucket); it
          // remains here for post-MVP victims like Master Ode.
          enter: () => {
            this._stateElapsedMs = 0;
            // Walk to altar, kneel. Altar x = first routine waypoint by
            // convention.
            const altarWp = this._wpById.get(this._routine[0]);
            if (altarWp) this._callingTargetX = altarWp.x;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            if (Number.isFinite(this._callingTargetX)) {
              const moveSpeed =
                (this.gameState && this.gameState.reaperTraits?.moveSpeed) || 220;
              const dir = this._callingTargetX > this.view.x ? 1 : -1;
              const step = moveSpeed * (dtMs / 1000) * dir;
              const next = this.view.x + step;
              if (
                (dir > 0 && next >= this._callingTargetX) ||
                (dir < 0 && next <= this._callingTargetX)
              ) {
                this.view.x = this._callingTargetX;
              } else {
                this.view.x = next;
              }
            }
            if (this._stateElapsedMs >= CALLING_FOR_HELP_TIMEOUT_MS) {
              this._emitStageFail('HELP_ARRIVED');
            }
          },
          exit: () => {
            this._callingTargetX = null;
          },
        },

        PRAYING: {
          enter: () => {
            this._stateElapsedMs = 0;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            // Auto-end at 6s → NEUTRAL. Any haunt also interrupts (handled
            // by applyHaunt's non-NEUTRAL interrupt path).
            if (this._stateElapsedMs >= PRAYING_TIMEOUT_MS) {
              this.fsm.transition('NEUTRAL');
            }
          },
          exit: () => {},
        },

        RITUAL: {
          enter: () => {
            this._stateElapsedMs = 0;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            if (this._stateElapsedMs >= RITUAL_TIMEOUT_MS) {
              this._emitStageFail('SOUL_SAVED');
            }
          },
          exit: () => {},
        },

        HIDING: {
          enter: () => {
            this._stateElapsedMs = 0;
            // Snap to nearest waypoint x — the "duck at the nearest cover" beat.
            let nearestX = this.view.x;
            let nearestDist = Infinity;
            for (const wp of this.stageData.waypoints) {
              const d = Math.abs(wp.x - this.view.x);
              if (d < nearestDist) {
                nearestDist = d;
                nearestX = wp.x;
              }
            }
            this.view.x = nearestX;
          },
          update: (dtMs) => {
            this._stateElapsedMs += dtMs;
            // FEAR ticks +1 / s through the chokepoint. The integrator may
            // also drive this externally, but we apply here so the FSM is
            // self-sufficient in tests.
            if (this.gameState) {
              const traits = this.gameState.reaperTraits || { fearGainMultiplier: 1 };
              const delta = applyFearGain(HIDING_FEAR_PER_MS * dtMs, traits);
              this.gameState.fear = Math.min(100, this.gameState.fear + delta);
            }
            // Reaper-proximity check — when sight is ON and the Reaper passes
            // within 80px of the hide spot, transition to FLEEING.
            if (
              this._sightOn &&
              Number.isFinite(this._reaperX) &&
              Math.abs(this._reaperX - this.view.x) <= HIDING_REAPER_PROXIMITY_PX
            ) {
              this.fsm.transition('FLEEING');
            }
          },
          exit: () => {},
        },
      },
      'NEUTRAL',
    );

    // Pending side effects buffered between applyHaunt invocations.
    this._pendingSideEffects = [];
    // Track whether the routine has been started at least once, so re-enters
    // of NEUTRAL re-engage it (instead of a stale dwell-at-spawn).
    this._routineStartedAtLeastOnce = false;
    this._callingTargetX = null;
    // Trips on first STAGE_FAIL emission so we don't double-emit on subsequent
    // ticks if the integrator hasn't yet transitioned Stage to SCORE.
    this._stageFailEmitted = false;
  }

  /** Convenience for callers (e.g. computeHauntFearDelta) that want the raw state name. */
  get state() {
    return this.fsm.currentName;
  }

  /**
   * Sight-budget drain multiplier. The Reaper Sight subsystem reads this
   * each frame and multiplies its base drain by the returned value. Slice 4
   * surface: PRAYING → 3, all other states → 1. The integrator wires the
   * actual drain (out of this file's scope).
   */
  get sightDrainMultiplier() {
    return this.fsm.is('PRAYING') ? PRAYING_SIGHT_DRAIN_MULT : 1;
  }

  /** Perception input — call each frame from main.js. */
  setReaperX(x) {
    this._reaperX = x;
  }

  /** Perception input — call when SightFSM toggles. */
  setSightOn(isOn) {
    this._sightOn = !!isOn;
  }

  /**
   * Apply a haunt to this victim. Single entry point for the haunt → FSM
   * pipeline. Handles all three branches per PRD §6.5-§6.7:
   *   - non-NEUTRAL victim → clean interrupt to NEUTRAL, fearDelta = 0
   *   - NEUTRAL + correct waypoint → stay NEUTRAL, fearDelta = 35*mult
   *   - NEUTRAL + wrong waypoint → pickReaction (bucket + bias), transition,
   *                                fearDelta = 5*mult
   *
   * Returns a result object so callers (actionHandlers, tests) can read
   * fearDelta + accumulated sideEffects in one call.
   *
   * @param {string} hauntId  one of 'SHATTER' | 'VOICE' | 'WHISPER' | 'RISE'
   * @param {object} [opts]
   * @param {number} [opts.now]   wall-clock ms; defaults to this._now()
   * @returns {{
   *   fearDelta: number,
   *   stateBefore: string,
   *   stateAfter:  string,
   *   sideEffects: Array<object>,
   * }}
   */
  applyHaunt(hauntId, opts = {}) {
    const stateBefore = this.fsm.currentName;
    const sideEffects = [];

    // Branch 1: any non-NEUTRAL state → clean interrupt (PRD §6.7).
    if (stateBefore !== 'NEUTRAL') {
      this.fsm.transition('NEUTRAL');
      return {
        fearDelta: 0,
        stateBefore,
        stateAfter: this.fsm.currentName,
        sideEffects,
      };
    }

    // Branch 2 + 3: NEUTRAL. First compute the fear delta through the chokepoint.
    const now = Number.isFinite(opts.now) ? opts.now : this._now();
    const recentHauntsMap = this._buildRecentHauntsMap();
    const fearDelta = computeHauntFearDelta({
      haunt: hauntId,
      waypoint: this.currentWaypointId,
      recentHaunts: recentHauntsMap,
      victimState: 'NEUTRAL',
      traits: this.gameState?.reaperTraits || { fearGainMultiplier: 1 },
      now,
    });

    const hauntCfg = this.stageData.haunts && this.stageData.haunts[hauntId];
    const correctWaypointId = hauntCfg ? hauntCfg.correctWaypointId : null;

    // Branch 2: correct waypoint → stay NEUTRAL. Reactions only roll on wrong.
    if (this.currentWaypointId === correctWaypointId) {
      return {
        fearDelta,
        stateBefore,
        stateAfter: this.fsm.currentName,
        sideEffects,
      };
    }

    // Branch 3: wrong waypoint → roll reaction (bucket + bias).
    const fear = this.gameState ? this.gameState.fear : 0;
    const { stateId } = pickReaction({
      haunt: hauntId,
      waypoint: this.currentWaypointId,
      stageData: this.stageData,
      fear,
      rng: this._rng,
    });
    this.fsm.transition(stateId);
    // Drain any side effects accumulated during the state's enter().
    if (this._pendingSideEffects.length > 0) {
      sideEffects.push(...this._pendingSideEffects);
      this._pendingSideEffects.length = 0;
    }

    return {
      fearDelta,
      stateBefore,
      stateAfter: this.fsm.currentName,
      sideEffects,
    };
  }

  /**
   * Build the hauntId → ms map fearMath wants from gameState.recentHaunts.
   * (gameState.recentHaunts is an array of {hauntId, timeMs}.)
   */
  _buildRecentHauntsMap() {
    const map = {};
    const arr = this.gameState && this.gameState.recentHaunts;
    if (Array.isArray(arr)) {
      for (const entry of arr) {
        if (entry && typeof entry.hauntId === 'string') {
          map[entry.hauntId] = entry.timeMs;
        }
      }
    }
    return map;
  }

  /**
   * AGGRESSIVE smash predicate: find the nearest unlocked, non-smashed
   * Evidence whose host-object x is within SMASH_RANGE_PX of the victim's
   * current x. Returns the hauntId to disable, or null if none in range.
   */
  _findSmashTarget() {
    const evidence = Array.isArray(this.stageData.evidence)
      ? this.stageData.evidence
      : [];
    let nearest = null;
    let nearestDist = Infinity;
    const myX = this.view.x;
    const smashed = (this.gameState && this.gameState.smashedHaunts) || new Set();
    const unlocked = (this.gameState && this.gameState.unlockedHaunts) || new Set();
    for (const ev of evidence) {
      if (!ev || typeof ev.hauntId !== 'string') continue;
      // Skip already-smashed haunts. Only unlocked haunts are smashable per
      // PRD §6.5 ("nearest unlocked Evidence's host object").
      if (smashed.has(ev.hauntId)) continue;
      if (unlocked.size > 0 && !unlocked.has(ev.hauntId)) continue;
      const hostX = Number.isFinite(ev.x) ? ev.x : null;
      if (hostX === null) continue;
      const d = Math.abs(hostX - myX);
      if (d <= SMASH_RANGE_PX && d < nearestDist) {
        nearestDist = d;
        nearest = ev.hauntId;
      }
    }
    return nearest;
  }

  /**
   * Push a STAGE_FAIL event onto the phase2EventLog. Score reads it.
   * Also caches reason on the instance so Stage / main can poll if the
   * direct callback hook isn't wired yet.
   */
  _emitStageFail(reason) {
    if (this._stageFailEmitted) return;
    this._stageFailEmitted = true;
    this.stageFailReason = reason;
    if (this.gameState && Array.isArray(this.gameState.phase2EventLog)) {
      this.gameState.phase2EventLog.push({ type: 'stageFailed', reason });
    }
  }

  /**
   * Start the dwell→walk→dwell loop. Called by Stage after the 1s post-TAB
   * grace window. Idempotent — calling twice is a no-op.
   */
  startRoutine() {
    this._routineStartedAtLeastOnce = true;
    if (this._routineActive) return;
    this._routineActive = true;
    this._phase = 'dwell';
    this._phaseElapsedMs = 0;
    const wp = this._wpById.get(this.currentWaypointId);
    this._walkFromX = wp.x;
    this._walkToX = wp.x;
  }

  /**
   * Fated Death — called by Stage when FEAR hits 100. Stops the routine,
   * swaps the walking sprite for the still pose, fades the container out
   * over FATED_DEATH_FADE_MS, and (when done) calls onFatedDeathComplete
   * so Stage can transition to SCORE.
   *
   * Anti-slasher: still pose + fade only. No animation; no impact frame.
   */
  enterFatedDeath() {
    if (this._fatedDeathActive) return;
    this._fatedDeathActive = true;
    this._routineActive = false;

    // Swap the visual to the still-pose Container by replacing the host's
    // only child. The pose factory uses the same bottom-center pivot
    // convention as the walking sprite, so no further offset is needed —
    // the host's (x, y) is still the floor-anchored waypoint position.
    const pose = this._createFatedDeathPose();
    if (this._spriteChild) {
      this.view.removeChild(this._spriteChild);
    }
    this._spriteChild = pose;
    this.view.addChild(pose);
  }

  update(dtMs) {
    if (this._fatedDeathActive) {
      this._tickFatedDeath(dtMs);
      return;
    }

    // FSM tick first — slice 4 will use this to drive state-specific behavior
    // (AGGRESSIVE smash interrupts, RITUAL countdown, etc).
    this.fsm.update(dtMs);

    if (!this._routineActive) return;

    this._phaseElapsedMs += dtMs;

    if (this._phase === 'dwell') {
      if (this._phaseElapsedMs >= this._dwellMs) {
        // Leaving the waypoint. Next-waypoint-sticky: flip currentWaypointId
        // to the NEXT one in the routine the INSTANT we depart, even though
        // the visual position is still at the source. This is the haunt-eval
        // anchor (PRD: victim-anchored, next-waypoint-sticky).
        const fromWp = this._wpById.get(this.currentWaypointId);
        this._routineIndex = (this._routineIndex + 1) % this._routine.length;
        this.currentWaypointId = this._routine[this._routineIndex];
        const toWp = this._wpById.get(this.currentWaypointId);

        this._walkToWaypoint(fromWp, toWp);
      }
    } else if (this._phase === 'walk') {
      const leg = this._walkLegs[this._walkLegIndex];
      const t = leg.durMs > 0 ? Math.min(1, this._phaseElapsedMs / leg.durMs) : 1;
      this.view.x = leg.fromX + (leg.toX - leg.fromX) * t;

      if (this._phaseElapsedMs >= leg.durMs) {
        // Leg complete. Either advance to next leg (door-crossing phase 2)
        // or snap-and-dwell if this was the final leg.
        if (this._walkLegIndex + 1 < this._walkLegCount) {
          this._walkLegIndex += 1;
          this._phaseElapsedMs = 0;
          // Snap to leg-handoff x so float drift doesn't accumulate.
          this.view.x = leg.toX;
        } else {
          // Snap to destination, switch to dwell.
          this.view.x = leg.toX;
          this._phase = 'dwell';
          this._phaseElapsedMs = 0;
        }
      }
    }
  }

  /**
   * Resolve which roomId the given logical-px x falls inside. Returns null if
   * x is outside every defined room (or if rooms[] is empty — slice-3 stages).
   * Tile-coord rooms convert to logical px by multiplying by meta.tile.
   *
   * Called O(routine-length) times in the constructor — NOT per-tick — so the
   * linear scan over rooms is fine. Per-tick lookups use the precomputed
   * `_wpRoomById` map.
   *
   * @param {number} x  logical-px x
   * @returns {string | null}  roomId or null
   */
  _roomIdForLogicalX(x) {
    const tile = this._tile;
    for (let i = 0; i < this._rooms.length; i++) {
      const r = this._rooms[i];
      const left = r.x * tile;
      const right = (r.x + r.w) * tile;
      if (x >= left && x < right) return r.id;
    }
    return null;
  }

  /**
   * Set up the walk-leg plan from `fromWp` to `toWp` and enter the walk phase.
   *
   * If both waypoints share a room (or rooms[]/links[] are absent), a single
   * straight-line leg over walkMs is queued — identical to slice-3 behavior.
   *
   * If the waypoints span different rooms, the walk is split into two legs
   * routed through the connecting door tile:
   *   - leg 0: fromWp.x → doorLogicalX
   *   - leg 1: doorLogicalX → toWp.x
   * Each leg's duration is allocated proportionally to its travel distance,
   * with the total summing to walkMs — that keeps overall routine timing
   * intact while making the door-crossing visually pause-free.
   *
   * Note on next-waypoint-sticky (PRD): `currentWaypointId` was already
   * flipped at end-of-dwell BEFORE this is called. Door routing is a pure
   * position-animation concern — it does NOT re-flip the current waypoint at
   * the threshold. The destination waypoint is already the "current" for
   * haunt-eval throughout the entire walk, even the nave half.
   *
   * Leg storage is recycled — the two `_walkLegs` slots are mutated in place,
   * never replaced. No allocations per walk.
   */
  _walkToWaypoint(fromWp, toWp) {
    const fromRoom = this._wpRoomById.get(fromWp.id);
    const toRoom = this._wpRoomById.get(toWp.id);

    const legs = this._walkLegs;

    // Same room (or rooms[] absent) → single straight-line leg.
    if (!fromRoom || !toRoom || fromRoom === toRoom) {
      legs[0].fromX = fromWp.x;
      legs[0].toX = toWp.x;
      legs[0].durMs = this._walkMs;
      this._walkLegCount = 1;
      this._walkLegIndex = 0;
      this._phase = 'walk';
      this._phaseElapsedMs = 0;
      return;
    }

    // Different rooms → look up the door for this pair.
    const doorX = this._doorXByRoomPair.get(`${fromRoom}|${toRoom}`);
    if (doorX === undefined) {
      // No link found between the two rooms. Defensive fallback: walk
      // straight as if same-room. Better than NaN'ing the lerp; Team Lead
      // will catch the missing link via play-test (Aldric clipping walls).
      legs[0].fromX = fromWp.x;
      legs[0].toX = toWp.x;
      legs[0].durMs = this._walkMs;
      this._walkLegCount = 1;
      this._walkLegIndex = 0;
      this._phase = 'walk';
      this._phaseElapsedMs = 0;
      return;
    }

    // Proportional split: dur ∝ |Δx|. Total = walkMs. This keeps Aldric's
    // visual speed constant across the door and preserves routine rhythm.
    const d1 = Math.abs(doorX - fromWp.x);
    const d2 = Math.abs(toWp.x - doorX);
    const total = d1 + d2;
    const walkMs = this._walkMs;
    const dur1 = total > 0 ? (walkMs * d1) / total : walkMs * 0.5;
    const dur2 = total > 0 ? (walkMs * d2) / total : walkMs * 0.5;

    legs[0].fromX = fromWp.x;
    legs[0].toX = doorX;
    legs[0].durMs = dur1;
    legs[1].fromX = doorX;
    legs[1].toX = toWp.x;
    legs[1].durMs = dur2;
    this._walkLegCount = 2;
    this._walkLegIndex = 0;
    this._phase = 'walk';
    this._phaseElapsedMs = 0;
  }

  _tickFatedDeath(dtMs) {
    if (this._fatedDeathCompleted) return;
    this._fatedDeathElapsedMs += dtMs;
    const t = Math.min(1, this._fatedDeathElapsedMs / FATED_DEATH_FADE_MS);
    this.view.alpha = 1 - t;
    if (t >= 1) {
      this._fatedDeathCompleted = true;
      if (this._onFatedDeathComplete) this._onFatedDeathComplete();
    }
  }
}
