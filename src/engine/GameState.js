// Per-run game state holder. In-memory only for slice 2; slice 5 wires the
// localStorage save store. Defaults match PRD §"Persistence" (lines 154–157)
// so that the future debt-loop can degrade these values via the save migrator
// with no other code changes.

const DEFAULT_REAPER_TRAITS = Object.freeze({
  sightDurationMs: 8000,
  hauntSlotCount: 4,
  moveSpeed: 220,
  fearGainMultiplier: 1.0,
  footstepsAudible: false,
});

export class GameState {
  constructor(overrides = {}) {
    this.reaperTraits = { ...DEFAULT_REAPER_TRAITS, ...(overrides.reaperTraits || {}) };
    this.unlockedHaunts = new Set();
    this.collectedEvidence = new Set();
    // Per-run record of which puzzle-doors the Pilgrim has already solved.
    // Drives "don't re-mount the puzzle on re-entry" in actionHandlers and
    // matches ticket #23 §"Wire to evidence reveal + Sight integration":
    // "Puzzle state persists per-run in `gameState.puzzlesSolved`". Cleared
    // implicitly on `new GameState()` at stage init / new run.
    this.puzzlesSolved = new Set();

    // Phase 2 / Haunt state. Slice 3 owns these (see issue 03 §"What to build"):
    //   - fear:                       0..100 scalar, drives FearBar + SCORE trigger
    //   - recentHaunts:               array of {hauntId, timeMs} for the 15s same-haunt
    //                                 cooldown. Array (not Map) because computeHauntFearDelta
    //                                 in slice 4 may want to inspect the full history, and
    //                                 the array form matches the event-log shape consumed by
    //                                 scoreRun.
    //   - phase2FirstHauntTimeMs:     wall-clock ms at which the FIRST haunt of Phase 2 fired.
    //                                 Drives `secondsToMax` per PRD line 137 — clock starts on
    //                                 first haunt trigger, NOT on TAB.
    //   - phase2EventLog:             ordered events consumed by scoreRun on FEAR=100. Slice 3
    //                                 pushes `hauntFired`, `correctWaypointHit`, `fearMaxed`.
    //                                 `reactionTriggered` lands in slice 4 with VictimFSM.
    this.fear = 0;
    this.recentHaunts = [];
    this.phase2FirstHauntTimeMs = null;
    this.phase2EventLog = [];
  }
}

export { DEFAULT_REAPER_TRAITS };
