// reactionSelection.test.js
// Spec for `pickReaction({ haunt, waypoint, stageData, fear, rng })`.
// Pure function — no Pixi, no DOM, no Math.random. Uses real
// `confession-room.json` for the haunt + victim config so a future stage
// schema change is auto-covered (issue 06.5 / PRD §10.6 / §10.7 / §6.6).
//
// Algorithm under test (PRD §6.6):
//   1. Bucket pick: fear < threshold → 'low'; fear ≥ threshold → 'high'.
//   2. Tendency lookup: lowFearTendency / highFearTendency per haunt.
//   3. Bias override: rng() < bias.probability → bias state. Else → bucket default.
//
// Aldric bias: { wrongWaypointReactsAs: 'RITUAL', probability: 0.6 }.

import { describe, test, expect } from 'vitest';
import stage from '../src/stages/confession-room.json' with { type: 'json' };
import { pickReaction } from '../src/math/reactionSelection.js';

// Aldric's per-haunt tendencies (sourced from confession-room.json directly
// inside the tests below; this table is just a cross-reference for the reader):
//
//   SHATTER:  low=PRAYING,    high=FLEEING
//   VOICE:    low=PRAYING,    high=HIDING
//   WHISPER:  low=AGGRESSIVE, high=HIDING
//   RISE:     low=AGGRESSIVE, high=FLEEING

describe('pickReaction — bucket pick respects fearBucketThreshold', () => {
  const ALL_HAUNTS = ['SHATTER', 'VOICE', 'WHISPER', 'RISE'];

  // Bias-miss path (rng() ≥ 0.6) so we observe pure bucket defaults.
  const rngMiss = () => 0.99;

  test.each(ALL_HAUNTS)(
    '%s at fear=0 (low bucket) → matches lowFearTendency on bias miss',
    (haunt) => {
      const result = pickReaction({
        haunt,
        waypoint: 'altar', // irrelevant for selection logic
        stageData: stage,
        fear: 0,
        rng: rngMiss,
      });
      expect(result.bucket).toBe('low');
      expect(result.biasHit).toBe(false);
      expect(result.stateId).toBe(stage.haunts[haunt].lowFearTendency);
      expect(result.bucketDefault).toBe(stage.haunts[haunt].lowFearTendency);
    },
  );

  test.each(ALL_HAUNTS)(
    '%s at fear=99 (high bucket) → matches highFearTendency on bias miss',
    (haunt) => {
      const result = pickReaction({
        haunt,
        waypoint: 'altar',
        stageData: stage,
        fear: 99,
        rng: rngMiss,
      });
      expect(result.bucket).toBe('high');
      expect(result.biasHit).toBe(false);
      expect(result.stateId).toBe(stage.haunts[haunt].highFearTendency);
    },
  );

  test('bucket boundary at fear = threshold (50) → high bucket', () => {
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'altar',
      stageData: stage,
      fear: stage.fearBucketThreshold,
      rng: rngMiss,
    });
    expect(result.bucket).toBe('high');
    expect(result.stateId).toBe('FLEEING'); // SHATTER.highFearTendency
  });

  test('bucket boundary at fear = threshold-1 (49) → low bucket', () => {
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'altar',
      stageData: stage,
      fear: stage.fearBucketThreshold - 1,
      rng: rngMiss,
    });
    expect(result.bucket).toBe('low');
    expect(result.stateId).toBe('PRAYING'); // SHATTER.lowFearTendency
  });
});

describe('pickReaction — bias override (Aldric → RITUAL @ 60%)', () => {
  // RNG hit < 0.6 → bias overrides bucket default to RITUAL.
  test('SHATTER at fear=0, rng=0.3 → RITUAL (bias hit, overrides PRAYING)', () => {
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: stage,
      fear: 0,
      rng: () => 0.3,
    });
    expect(result.biasHit).toBe(true);
    expect(result.stateId).toBe('RITUAL');
    expect(result.bucketDefault).toBe('PRAYING');
  });

  // RNG miss ≥ 0.6 → bias does NOT override.
  test('SHATTER at fear=0, rng=0.59 → RITUAL (boundary just inside bias)', () => {
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: stage,
      fear: 0,
      rng: () => 0.59,
    });
    expect(result.biasHit).toBe(true);
    expect(result.stateId).toBe('RITUAL');
  });

  test('SHATTER at fear=0, rng=0.6 → bucket default PRAYING (just at miss boundary)', () => {
    // Probability is a strict "<" check — rng() exactly at probability is miss.
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: stage,
      fear: 0,
      rng: () => 0.6,
    });
    expect(result.biasHit).toBe(false);
    expect(result.stateId).toBe('PRAYING');
  });

  // Bias overrides every (haunt × bucket) combo for Aldric since probability
  // is 60% across the board.
  test.each([
    ['SHATTER', 0, 'PRAYING'],
    ['SHATTER', 99, 'FLEEING'],
    ['VOICE', 0, 'PRAYING'],
    ['VOICE', 99, 'HIDING'],
    ['WHISPER', 0, 'AGGRESSIVE'],
    ['WHISPER', 99, 'HIDING'],
    ['RISE', 0, 'AGGRESSIVE'],
    ['RISE', 99, 'FLEEING'],
  ])(
    '%s at fear=%d, bias hit (rng 0.0) → RITUAL (overrides %s)',
    (haunt, fear, expectedDefault) => {
      const result = pickReaction({
        haunt,
        waypoint: 'altar',
        stageData: stage,
        fear,
        rng: () => 0.0,
      });
      expect(result.biasHit).toBe(true);
      expect(result.stateId).toBe('RITUAL');
      expect(result.bucketDefault).toBe(expectedDefault);
    },
  );

  test.each([
    ['SHATTER', 0, 'PRAYING'],
    ['SHATTER', 99, 'FLEEING'],
    ['VOICE', 0, 'PRAYING'],
    ['VOICE', 99, 'HIDING'],
    ['WHISPER', 0, 'AGGRESSIVE'],
    ['WHISPER', 99, 'HIDING'],
    ['RISE', 0, 'AGGRESSIVE'],
    ['RISE', 99, 'FLEEING'],
  ])(
    '%s at fear=%d, bias miss (rng 0.99) → bucket default %s',
    (haunt, fear, expectedDefault) => {
      const result = pickReaction({
        haunt,
        waypoint: 'altar',
        stageData: stage,
        fear,
        rng: () => 0.99,
      });
      expect(result.biasHit).toBe(false);
      expect(result.stateId).toBe(expectedDefault);
    },
  );
});

describe('pickReaction — edge cases', () => {
  test('absent personality.bias → bucket default always wins', () => {
    const noBiasStage = {
      ...stage,
      victim: { ...stage.victim, personality: {} },
    };
    const result = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: noBiasStage,
      fear: 0,
      rng: () => 0.0, // would normally hit
    });
    expect(result.biasHit).toBe(false);
    expect(result.stateId).toBe('PRAYING');
  });

  test('unknown haunt id throws', () => {
    expect(() =>
      pickReaction({
        haunt: 'BOGUS',
        waypoint: 'altar',
        stageData: stage,
        fear: 0,
        rng: () => 0.5,
      }),
    ).toThrow(/BOGUS/);
  });

  test('default threshold fallback (50) when fearBucketThreshold absent', () => {
    const noThresholdStage = { ...stage };
    delete noThresholdStage.fearBucketThreshold;
    const lowResult = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: noThresholdStage,
      fear: 49,
      rng: () => 0.99,
    });
    expect(lowResult.bucket).toBe('low');
    const highResult = pickReaction({
      haunt: 'SHATTER',
      waypoint: 'lectern',
      stageData: noThresholdStage,
      fear: 50,
      rng: () => 0.99,
    });
    expect(highResult.bucket).toBe('high');
  });
});
