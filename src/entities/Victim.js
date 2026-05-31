// Victim — routine walker + FSM stub.
//
// Owner: #3 Haunt AI Engineer. Slice 3 ships ONLY the NEUTRAL state +
// routine walker + Fated Death entry. Slice 4 layers the other six FSM
// states (AGGRESSIVE, FLEEING, CALLING_FOR_HELP, PRAYING, RITUAL, HIDING)
// on top of this skeleton WITHOUT refactoring this file's structure.
//
// Spec sources:
//   - .scratch/grim-griper-puzzle-mvp/issues/03-slice-phase2-skeleton.md
//   - docs/narrative/confession-room.md — Aldric's altar→lectern→booth→sacristy
//     racket is the in-fiction routine; dwell timings encode "what he's doing"
//     at each stop.
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
// FSM future-proofing:
//   This file uses the shared StateMachine class (src/engine/StateMachine.js)
//   so adding states in slice 4 is purely additive: drop new entries into the
//   states map. NO call site in this file branches on `if (state === 'NEUTRAL')`.
//   The routine walker is gated by a `_routineActive` flag instead, so future
//   states can pause/resume it independently of FSM transitions.

import { Container } from 'pixi.js';
import { StateMachine } from '../engine/StateMachine.js';

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
   */
  constructor({
    stageData,
    gameState,
    view,
    createFatedDeathPose,
    floorY,
    onFatedDeathComplete,
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

    // FSM. Slice 3 wires only NEUTRAL. The other six states are reserved
    // slots — defining them now (as no-op stubs) means slice 4 fills in the
    // enter/update/exit bodies without touching any of the call sites here.
    this.fsm = new StateMachine(
      {
        NEUTRAL: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        AGGRESSIVE: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        FLEEING: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        CALLING_FOR_HELP: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        PRAYING: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        RITUAL: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        HIDING: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
      },
      'NEUTRAL',
    );
  }

  /** Convenience for callers (e.g. computeHauntFearDelta) that want the raw state name. */
  get state() {
    return this.fsm.currentName;
  }

  /**
   * Start the dwell→walk→dwell loop. Called by Stage after the 1s post-TAB
   * grace window. Idempotent — calling twice is a no-op.
   */
  startRoutine() {
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
