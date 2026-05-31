# Refactor Safety Gates

Tracks the safety protocol for the structural refactor in
[issue #1](https://github.com/Jimdan123/grim-griper-web/issues/1).

## Per-commit machine gate

Run after every commit. Fast, no human eyes needed.

```
npm run test:run
```

What it covers:

- `tests/smokeBoot.test.js` — imports every module under `src/` (minus
  `main.js`) and asserts no module throws on evaluation. Catches broken
  imports, missing exports, renamed files with stale call sites, and
  circular deps introduced by an extraction.
- The pre-existing sim tests (`fearMath`, `scoreRun`, `SightBudget`,
  `VictimFSM`, `saveMigrate`) keep behavior pinned.

A red machine gate is a hard stop. Fix or revert before moving on.

## Per-phase play-test gate

Run at the end of each phase listed in the RFC, before opening the next
phase's commits. This is the human's job — the smoke test does not
exercise the browser, PIXI rendering, input gestures, scene transitions,
or any of the audio/animation/visual surface.

```
npm run dev
# open http://localhost:5173 in a browser
```

Happy-path checklist:

- [ ] App boots, no console errors
- [ ] Outside-chapel scene paints; hooded Reaper walks toward the door
- [ ] Scene swaps to inside chapel; daytime ambient + parishioner NPCs
      + chatter bubbles visible; Aldric at the altar
- [ ] WASD / arrow keys move the player
- [ ] Hold SHIFT — Reaper Sight reveals glowing evidence
- [ ] E collects each of the four evidence items; counter increments
- [ ] After 4/4, TAB advances to the HAUNT phase
- [ ] Radial haunt menu visible; FearBar visible; SightMeter hidden
- [ ] Pressing `1` fires SHATTER; fear bar ticks up
- [ ] Fear reaches 100 → end-screen appears with score + stars
- [ ] No regressions in features that were *not* the target of the
      phase (e.g. after the art-data split, sprites still render
      identically; after the UI normalize, HUD elements still show /
      hide at the right phases)

If anything in the checklist fails, file a bug under
`.scratch/grim-griper-puzzle-mvp/issues/` with `Status: needs-triage`
and pause refactor dispatch until it is resolved or explicitly deferred.

## Phase order

Per the RFC, phases run sequentially — never in parallel — so any
regression that surfaces in a play-test points unambiguously at one
phase's commits.

1. Phase 0 — this file + the smoke test
2. Phase 1 — remove Stage.js factory-injection seams (9 commits)
3. Phase 2 — split pixelPalette.js and placeholders.js (14 commits)
4. Phase 3 — normalize the UI layer (14 commits)
5. Phase 4 — decompose main.js (10 commits)
