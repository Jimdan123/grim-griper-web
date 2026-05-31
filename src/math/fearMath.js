// fearMath.js
// Owner: #6 Math & Test Author. Consumer: #3 Haunt AI (Stage HAUNT step,
// Victim FSM in slice 4), #4 UI/HUD (FearBar updates).
//
// Spec sources:
//   - docs/PRD.md §"Haunt rules" (lines 114-124)
//   - .scratch/grim-griper-puzzle-mvp/issues/07-test-compute-haunt-fear-delta.md
//   - tests/computeHauntFearDelta.test.js (the test is the spec)
//
// Two exports:
//   1. applyFearGain(base, traits)             — the multiplier chokepoint.
//      All fear additions in the game flow through this single site so the
//      future debt-loop trait-degradation system can scale fear gain by
//      adjusting `traits.fearGainMultiplier` only.
//   2. computeHauntFearDelta({ haunt, waypoint, recentHaunts, victimState,
//      traits, now }) — pure decision: what fear delta does this haunt
//      produce, given the current world snapshot? Always calls applyFearGain
//      internally so the multiplier path is never bypassed.
//
// Correct-waypoint mapping is sourced from confession-room.json's `haunts`
// block (`haunts.SHATTER.correctWaypointId === 'altar'`). MVP ships a single
// stage so a static import is sufficient; a future multi-stage refactor will
// pass the stage's haunts block in as a parameter without touching the
// chokepoint contract.

import stage from '../stages/confession-room.json' with { type: 'json' };

const SAME_HAUNT_COOLDOWN_MS = 15_000;
const BASE_CORRECT_WAYPOINT = 35;
const BASE_WRONG_WAYPOINT = 5;

/**
 * The single chokepoint for converting a base fear value into a scaled delta.
 * Trivial today; intentionally a function so future trait-degradation logic
 * can be added in one place.
 *
 * @param {number} base    base fear value before the Reaper's trait multiplier
 * @param {{ fearGainMultiplier: number }} traits Reaper traits block
 * @returns {number} scaled fear delta
 */
export function applyFearGain(base, traits) {
  return base * traits.fearGainMultiplier;
}

/**
 * Pure: given the haunt that fired, the victim's current target waypoint,
 * the recent-haunts cooldown map, the victim FSM state, the Reaper traits,
 * and the current ms timestamp, return the fear delta to add to the
 * victim's fear meter.
 *
 * Rules (PRD §"Haunt rules" lines 117-121):
 *   - correct waypoint, NEUTRAL victim         → 35 * fearGainMultiplier
 *   - wrong   waypoint, NEUTRAL victim         →  5 * fearGainMultiplier
 *   - same haunt re-fired within 15000 ms      → 0
 *   - any non-NEUTRAL victim state             → 0
 *
 * The wrong-waypoint reaction roll (slice 4) is NOT this module's job —
 * it lives in VictimFSM. This module returns the fear delta only.
 *
 * @param {object} args
 * @param {'SHATTER'|'VOICE'|'WHISPER'|'RISE'} args.haunt   haunt fired
 * @param {string} args.waypoint                            current waypoint id
 * @param {Record<string, number>} args.recentHaunts        hauntId → lastFiredAtMs
 * @param {string} args.victimState                         FSM state, e.g. 'NEUTRAL'
 * @param {{ fearGainMultiplier: number }} args.traits      Reaper traits block
 * @param {number} args.now                                 current ms timestamp
 * @returns {number} fear delta
 */
export function computeHauntFearDelta({
  haunt,
  waypoint,
  recentHaunts,
  victimState,
  traits,
  now,
}) {
  // Any non-NEUTRAL state pauses fear gain entirely (PRD line 121).
  if (victimState !== 'NEUTRAL') return 0;

  // 15s same-haunt cooldown (PRD line 120; issue 07 acceptance lines 25-26).
  // Boundary: at exactly 15000ms the cooldown has expired → full delta.
  const lastFired = recentHaunts ? recentHaunts[haunt] : undefined;
  if (typeof lastFired === 'number' && now - lastFired < SAME_HAUNT_COOLDOWN_MS) {
    return 0;
  }

  // Correct- vs wrong-waypoint base value, sourced from the stage's haunts
  // block so a future stage with a different mapping doesn't require a code
  // change here.
  const hauntConfig = stage.haunts[haunt];
  const correctWaypointId = hauntConfig ? hauntConfig.correctWaypointId : null;
  const base =
    waypoint === correctWaypointId ? BASE_CORRECT_WAYPOINT : BASE_WRONG_WAYPOINT;

  return applyFearGain(base, traits);
}
