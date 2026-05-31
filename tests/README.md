# Tests — Reaper's Debt

Vitest suite for the four pure / pure-data modules pinned by `docs/PRD.md` §"Testing Decisions":

| Module                  | Test file                          | Lands in slice |
|-------------------------|------------------------------------|----------------|
| `scoreRun`              | `tests/scoreRun.test.js`           | 3              |
| `computeHauntFearDelta` | `tests/computeHauntFearDelta.test.js` | 3           |
| `VictimFSM`             | `tests/VictimFSM.test.js`          | 4              |
| `saveMigrate`           | `tests/saveMigrate.test.js`        | 5              |

## How to run

```
npm test          # watch mode
npm run test:run  # single pass, CI-style
```

All tests are currently `test.skip()` because the modules they exercise have not landed yet (slice 1 only at time of writing). As each implementation arrives, the corresponding `test.skip` blocks should be flipped to `test` and any `// TODO unskip when <module> lands` imports uncommented.

## What is tested here vs. what is playtest-only

Per `docs/PRD.md` §"Testing Decisions" and the user-memory note `feedback_playtest_gates.md`:

**Unit-tested here** — pure functions and pure-data state machines whose correctness is invisible to the eyeball:

- `scoreRun(events) → { score, breakdown, stars }` — scoring formula and star thresholds
- `computeHauntFearDelta(...)` — fear math chokepoint, routes through real `applyFearGain`
- `VictimFSM` — seeded-RNG state machine, transition matrix, interrupt routes, timers, AGGRESSIVE smash, 60% Aldric bias as a statistical property
- `saveMigrate(rawJson) → CurrentSave` — versioned migrator, corrupt-JSON safety, default fallbacks

**Playtest-only** — anything where the validation is "does it look / feel right in the browser":

- Pixi entity classes (`Player`, `Victim`, `EvidenceItem`, `GhostReplay`)
- All UI containers (`RadialHauntMenu`, `FearBar`, `SightMeter`, `EndScreen`, `PauseOverlay`, `MenuScene`, `DesktopOnlySplash`)
- `Stage` composition, `StageLoader`
- `InputManager` (DOM-coupled)
- `AudioManager` (Howler-coupled)
- `GameLoop` (Pixi-coupled)
- `SightController` filter wiring (the budget math inside is exercised indirectly via the haunt / scoring tests)

## Status as gate

**Tests are supplementary, not the gate.** Per the team memory note `feedback_playtest_gates.md`, `npm test` passing does **not** authorize moving to the next slice. The gate is a human play-test in the dev server. A green test report with broken feel still fails the gate; a red test report with green feel still blocks the gate.

This suite exists so the invisible-to-eyeball rules (numeric scoring, fear deltas, FSM transitions, save migration) are pinned by code rather than re-checked by hand every slice.

## Style rules (per PRD)

- Tests must **not** mock the formula they exercise. Use the real `applyFearGain` chokepoint.
- Tests must use the real `src/stages/confession-room.json` data where possible — no duplicated literal mappings.
- Headless only: no Pixi `Application`, no DOM, no Howler.
- Pure inputs → pure assertions on outputs, not on which internal helper was called.
