// PuzzleScene.test.js
//
// Unit tests for the PuzzleScene solve-detection logic (#23b). Pure helpers
// only — no Pixi rendering involved. The component-level drag interactions
// are validated by the human play-test gate (see REFACTOR.md).
//
// Public surface under test:
//   checkPlacement(pieceId, slotId, correctMap) → 'correct' | 'wrong'
//   isSolved(placements, correctMap) → boolean
//   findSlotAt(x, y, slots) → slot | null
//
// Spec sources:
//   - .scratch/.../issues/23-zoom-puzzle-rooms.md §"#23b — Puzzle subsystem"
//   - src/stages/puzzles/booth.json + sacristy.json (seeded puzzle data)

import { describe, test, expect } from 'vitest';
import boothPuzzle from '../src/stages/puzzles/booth.json' with { type: 'json' };
import sacristyPuzzle from '../src/stages/puzzles/sacristy.json' with { type: 'json' };
import {
  checkPlacement,
  isSolved,
  findSlotAt,
} from '../src/puzzles/PuzzleScene.js';

describe('checkPlacement', () => {
  const correctMap = { p_opening: 'slot1', p_sin: 'slot2' };

  test('matching pair returns "correct"', () => {
    expect(checkPlacement('p_opening', 'slot1', correctMap)).toBe('correct');
    expect(checkPlacement('p_sin', 'slot2', correctMap)).toBe('correct');
  });

  test('mismatched pair returns "wrong"', () => {
    expect(checkPlacement('p_opening', 'slot2', correctMap)).toBe('wrong');
    expect(checkPlacement('p_sin', 'slot1', correctMap)).toBe('wrong');
  });

  test('unknown piece returns "wrong" (does not throw)', () => {
    expect(checkPlacement('p_ghost', 'slot1', correctMap)).toBe('wrong');
  });

  test('missing correctMap returns "wrong"', () => {
    expect(checkPlacement('p_opening', 'slot1', null)).toBe('wrong');
    expect(checkPlacement('p_opening', 'slot1', undefined)).toBe('wrong');
  });
});

describe('isSolved', () => {
  const correctMap = {
    p_opening: 'slot1',
    p_sin: 'slot2',
    p_promise: 'slot3',
    p_price: 'slot4',
  };

  test('returns false when no pieces placed', () => {
    expect(isSolved({}, correctMap)).toBe(false);
  });

  test('returns false when only some pieces are correctly placed', () => {
    const partial = { p_opening: 'slot1', p_sin: 'slot2' };
    expect(isSolved(partial, correctMap)).toBe(false);
  });

  test('returns false when all placed but one is wrong', () => {
    const placements = {
      p_opening: 'slot1',
      p_sin: 'slot3', // wrong
      p_promise: 'slot2', // wrong
      p_price: 'slot4',
    };
    expect(isSolved(placements, correctMap)).toBe(false);
  });

  test('returns true when every piece is in its correct slot', () => {
    const placements = {
      p_opening: 'slot1',
      p_sin: 'slot2',
      p_promise: 'slot3',
      p_price: 'slot4',
    };
    expect(isSolved(placements, correctMap)).toBe(true);
  });

  test('empty correctMap returns false (defensive — never legitimately empty)', () => {
    expect(isSolved({}, {})).toBe(false);
  });
});

describe('findSlotAt', () => {
  const slots = [
    { id: 'slot1', x: 0, y: 0, w: 100, h: 50 },
    { id: 'slot2', x: 0, y: 60, w: 100, h: 50 },
  ];

  test('returns the slot whose rect contains the point', () => {
    expect(findSlotAt(50, 25, slots).id).toBe('slot1');
    expect(findSlotAt(50, 80, slots).id).toBe('slot2');
  });

  test('returns null when the point is outside every slot', () => {
    expect(findSlotAt(200, 200, slots)).toBe(null);
    expect(findSlotAt(50, 55, slots)).toBe(null); // gap between slots
  });

  test('treats edges as inclusive (point on boundary counts as inside)', () => {
    expect(findSlotAt(0, 0, slots).id).toBe('slot1');
    expect(findSlotAt(100, 50, slots).id).toBe('slot1');
  });
});

describe('booth puzzle JSON — solve order matches ticket spec', () => {
  // From ticket #23 "Per-room puzzles" §booth: the fragments stack
  // chronologically top-to-bottom. The JSON encodes that ordering so the
  // puzzle is solvable; this test pins the expected mapping.
  test('correctMap places fragments in chronological order', () => {
    // Slot1 = opening, slot4 = "three silver crowns" (final line).
    expect(boothPuzzle.correctMap.p_opening).toBe('slot1');
    expect(boothPuzzle.correctMap.p_sin).toBe('slot2');
    expect(boothPuzzle.correctMap.p_promise).toBe('slot3');
    expect(boothPuzzle.correctMap.p_price).toBe('slot4');
  });

  test('full solve: every piece in its slot triggers isSolved', () => {
    expect(isSolved(boothPuzzle.correctMap, boothPuzzle.correctMap)).toBe(true);
  });
});

describe('sacristy puzzle JSON — burial-rite order', () => {
  // From ticket #23 "Per-room puzzles" §sacristy:
  //   spade → body-shroud → quicklime → floor-flag
  test('correctMap matches the locked burial-rite order', () => {
    expect(sacristyPuzzle.correctMap.p_spade).toBe('slot1');
    expect(sacristyPuzzle.correctMap.p_shroud).toBe('slot2');
    expect(sacristyPuzzle.correctMap.p_quicklime).toBe('slot3');
    expect(sacristyPuzzle.correctMap.p_floorflag).toBe('slot4');
  });

  test('full solve: every piece in its slot triggers isSolved', () => {
    expect(isSolved(sacristyPuzzle.correctMap, sacristyPuzzle.correctMap)).toBe(true);
  });

  test('swapping any two pieces breaks the solve', () => {
    const placements = { ...sacristyPuzzle.correctMap };
    // Swap spade ↔ shroud.
    placements.p_spade = 'slot2';
    placements.p_shroud = 'slot1';
    expect(isSolved(placements, sacristyPuzzle.correctMap)).toBe(false);
  });
});
