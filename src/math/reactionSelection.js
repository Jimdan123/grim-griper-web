// reactionSelection.js
// Owner: #3 Haunt AI + #6 Math & Test Author. Slice 4.
//
// Pure function: given a wrong-waypoint haunt firing on a NEUTRAL victim,
// what reaction state do we transition to?
//
// Spec sources:
//   - docs/PRD.md §6.6 "Reaction Selection (bucket + bias)"
//   - docs/PRD.md §14.2 #4–#7 (dual-bucket model; bias override)
//   - docs/PRD.md §10.6 "Haunts" schema (lowFearTendency/highFearTendency)
//   - docs/PRD.md §10.7 "Victim" schema (personality.bias)
//
// Algorithm (§6.6):
//   1. Bucket pick: fear < threshold → "low"; fear ≥ threshold → "high".
//   2. Tendency lookup: haunts[hauntId].lowFearTendency or .highFearTendency.
//   3. Bias override: roll rng() once. If hit (< probability), use the bias
//      state. Else use the bucket-default tendency.
//
// Pure. No FSM mutation, no side effects, no I/O. The Victim FSM calls this
// to decide its next state on a wrong-waypoint NEUTRAL haunt.

/**
 * @param {object} args
 * @param {string} args.haunt              Haunt id e.g. 'SHATTER'.
 * @param {string} args.waypoint           Victim's current waypoint id.
 * @param {object} args.stageData          Normalized stage JSON. Reads
 *                                          `stageData.haunts[haunt]`,
 *                                          `stageData.fearBucketThreshold`,
 *                                          `stageData.victim.personality.bias`.
 * @param {number} args.fear               Current fear value 0..100.
 * @param {() => number} args.rng          Source of randomness; returns [0,1).
 * @returns {{
 *   stateId: 'AGGRESSIVE'|'FLEEING'|'CALLING_FOR_HELP'|'PRAYING'|'RITUAL'|'HIDING',
 *   biasHit: boolean,
 *   bucket: 'low'|'high',
 *   bucketDefault: string,
 * }}
 *   - stateId:        the chosen reaction state
 *   - biasHit:        true iff the bias roll succeeded (state = bias override)
 *   - bucket:         which bucket was picked
 *   - bucketDefault:  the haunt's tendency for that bucket (used when biasHit=false)
 */
export function pickReaction({ haunt, waypoint, stageData, fear, rng }) {
  // Reaction selection only runs on a wrong-waypoint haunt. The caller (Victim
  // FSM) guards this; here we treat the inputs as already filtered.
  void waypoint;

  const hauntCfg = stageData.haunts && stageData.haunts[haunt];
  if (!hauntCfg) {
    throw new Error(`pickReaction: stageData.haunts missing entry for "${haunt}"`);
  }

  const threshold = Number.isFinite(stageData.fearBucketThreshold)
    ? stageData.fearBucketThreshold
    : 50;
  const bucket = fear < threshold ? 'low' : 'high';
  const bucketDefault =
    bucket === 'low' ? hauntCfg.lowFearTendency : hauntCfg.highFearTendency;

  // Bias override roll. Personality bias is optional; absent → no override.
  const bias = stageData.victim?.personality?.bias;
  let biasHit = false;
  let stateId = bucketDefault;
  if (bias && typeof bias.probability === 'number' && bias.wrongWaypointReactsAs) {
    const draw = rng();
    if (draw < bias.probability) {
      biasHit = true;
      stateId = bias.wrongWaypointReactsAs;
    }
  }

  return { stateId, biasHit, bucket, bucketDefault };
}
