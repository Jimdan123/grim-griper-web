// Seeded RNG utility for deterministic tests.
//
// `mulberry32(seed)` returns a function () → float in [0, 1) using the
// Mulberry32 PRNG. Identical output for identical seed across runs / Node
// versions / browsers — exactly what VictimFSM tests need to pin bias rolls.
//
// Why Mulberry32 over Math.random? Math.random is implementation-defined
// (no seeding), so a "60% bias hit" test would either flake or require
// stubbing the entire Math.random surface. Mulberry32 is 6 lines, fast,
// and good enough for slot-machine-grade rolls (1 draw per applyHaunt).
//
// Reference: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32

export function mulberry32(seed) {
  let s = seed | 0;
  return function next() {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
