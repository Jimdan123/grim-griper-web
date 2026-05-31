# Reaper's Debt MVP — Roles

Source of truth: [`docs/PRD.md`](../PRD.md). Tickets: [`.scratch/grim-griper-puzzle-mvp/issues/`](../../.scratch/grim-griper-puzzle-mvp/issues/).

## How to boot a role

The user opens one terminal per role. In each terminal, from the project root, run plain `claude`. First message in the session:

> `You are the <role>. Read docs/agents/roles.md, find your section, then proceed.`

Do **not** pass `--config ~/.claude/teams/...`. Coordination is **file-based only**:

- Tickets at `.scratch/grim-griper-puzzle-mvp/issues/NN-<slug>.md` carry `Status:`, `Owner:`, and a `## How to play-test` section the role appends before handoff.
- No `SendMessage` between sessions. No in-process subagents. Use shared files.
- Cross-role notes live in `CONTEXT.md` (created on demand) and `docs/adr/` (ADR-style decision records).

## Play-test gate

Each slice (1–5) ends with a **human play-test** in the dev server. Slice N+1 is not dispatched until the user clears slice N in the browser. Within a slice, multiple roles work in parallel.

`dotnet test` / `npm test` / headless boots are **not** the gate — the gate is the user playing the slice. Code-level QA via the Math & Test Author is supplementary.

## Roles

### #0 Team Lead

**Owns:** project-wide tonal and architectural arbitration. Triages stage proposals, gates slice handoffs alongside the play-test, defends the *quiet dispassionate horror* line, and arbitrates cross-role disagreements (e.g., a UI/HUD instinct that contradicts an Art Lead anchor).

**Persona spec:** [`docs/agents/team-lead.md`](team-lead.md). Adopt this voice for review/triage/dispatch decisions; revert to the per-role voices below for execution work.

**Boundary:** the Team Lead does **not** replace the play-test gate, write production code, or override the PRD without filing a revision (see PRD §"Resolved Design Questions" for the precedent — every locked pivot lives in a dated subsection).

### #1 Foundation Engineer

**Owns:** `src/main.js` boot, `GameLoop`, `StateMachine`, `InputManager`, fit/letterbox, FPS overlay, save store + migrator wiring (slice 5), `AudioManager` (slice 5), trait plumbing (slice 5).

**Tickets:**
- [01 — Slice 1: Movement & landscape canvas](../../.scratch/grim-griper-puzzle-mvp/issues/01-slice-movement-canvas.md)
- Co-owns Slice 5 with UI/HUD: [05 — Persistence, menu, pause, audio, splash](../../.scratch/grim-griper-puzzle-mvp/issues/05-slice-persistence-menu-pause-audio.md) (save/migrator/audio/trait halves)

**First playtestable deliverable:** Reaper walks left/right in landscape chapel; FPS pinned at 60.

### #2 Investigation Engineer

**Owns:** `SightFSM` + `SightBudget` + Sight FX (`ColorMatrixFilter`, `OutlineFilter`), `EvidenceItem`, `GhostReplay`, TAB phase-advance gate, `StageLoader`.

**Tickets:**
- [02 — Slice 2: Investigation phase](../../.scratch/grim-griper-puzzle-mvp/issues/02-slice-investigation.md)

**First playtestable deliverable:** SHIFT desaturates, 4 evidence glow, ghosts appear, E collects, TAB rejected at 0 evidence.

### #3 Haunt AI Engineer

**Owns:** `VictimFSM`, `Victim` routine walker, `HauntSource`, AGGRESSIVE smash, interrupt routing, FLEEING / CALLING_FOR_HELP fail conditions.

**Tickets:**
- Co-owns [03 — Slice 3: Phase 2 skeleton](../../.scratch/grim-griper-puzzle-mvp/issues/03-slice-phase2-skeleton.md) (routine walker + SHATTER wire-up)
- [04 — Slice 4: Full victim FSM](../../.scratch/grim-griper-puzzle-mvp/issues/04-slice-full-victim-fsm.md)

**First playtestable deliverable:** Aldric walks the routine; FEAR fills on correct waypoint; reactions + interrupts behave per spec.

### #4 UI/HUD Engineer

**Owns:** `RadialHauntMenu`, `FearBar`, `SightMeter`, `EndScreen`, `PauseOverlay`, `MenuScene`, `DesktopOnlySplash`.

**Tickets:**
- Co-owns [03 — Slice 3: Phase 2 skeleton](../../.scratch/grim-griper-puzzle-mvp/issues/03-slice-phase2-skeleton.md) (radial menu + fear bar + placeholder end screen)
- Co-owns [05 — Slice 5: Persistence, menu, pause, audio, splash](../../.scratch/grim-griper-puzzle-mvp/issues/05-slice-persistence-menu-pause-audio.md) (menu, pause, splash, star reveal anim halves)

**First playtestable deliverable:** Overlays as Pixi `Container`s; star reveal animates; pause truly freezes.

### #5 Stage + Art Lead

**Owns:** `src/stages/confession-room.json`, placeholder style guide, primitive sprites (Reaper, Aldric, chalice, lectern, etc.), palette, scale ratios. Placeholder-first per [[grim-griper-constraints]]: every asset is `PIXI.Graphics` primitives or solid sprites; finished art comes later via a license-tracked upgrade pass.

**Tickets:**
- Co-owns Slice 1: minimal stage data (waypoints + chapel bounds) for [01](../../.scratch/grim-griper-puzzle-mvp/issues/01-slice-movement-canvas.md)
- Co-owns Slice 2: expanded data (evidence + ghosts + chalice + lectern) for [02](../../.scratch/grim-griper-puzzle-mvp/issues/02-slice-investigation.md)
- Co-owns Slice 3: any new sprites needed for haunts/death anim placeholder for [03](../../.scratch/grim-griper-puzzle-mvp/issues/03-slice-phase2-skeleton.md)

**First playtestable deliverable:** Chapel reads at a glance — Reaper distinct from Aldric, waypoints labeled, evidence glow obvious.

### #6 Math & Test Author

**Owns:** `fearMath` (`applyFearGain` chokepoint + `computeHauntFearDelta`), `Scoring` (`scoreRun`), `saveMigrate`, full Vitest suite against real `confession-room.json`. Tests are supplementary; the play-test gate stays primary.

**Tickets:**
- [06 — Test module: scoreRun](../../.scratch/grim-griper-puzzle-mvp/issues/06-test-score-run.md) (parallel w/ slice 3)
- [07 — Test module: computeHauntFearDelta](../../.scratch/grim-griper-puzzle-mvp/issues/07-test-compute-haunt-fear-delta.md) (parallel w/ slice 3)
- [08 — Test module: VictimFSM](../../.scratch/grim-griper-puzzle-mvp/issues/08-test-victim-fsm.md) (parallel w/ slice 4)
- [09 — Test module: saveMigrate](../../.scratch/grim-griper-puzzle-mvp/issues/09-test-save-migrate.md) (parallel w/ slice 5)

**First playtestable deliverable:** Green test report; numbers in `EndScreen` breakdown match expectation.

### #7 Visual Polish Lead

**Owns:** Screenshot-driven layout and feel review of every slice. Acts as the senior game-dev eye between role-author handoff and user play-test — composition, silhouette, screen-space anchoring, animation curves, readability under the worst window aspect, and tonal fit with the Happy Hills touchstone.

**Toolchain:** A tiny Playwright (or Puppeteer) script at `tools/vp/capture.mjs` (added by VP on first run) loads `http://localhost:5173`, drives the game into named states (boot, sight-on, sight-off, mid-haunt, end-screen, pause, splash), and writes PNGs to `.scratch/screenshots/slice-NN/<state>.png`. VP reads them back via the Read tool, critiques inline, and either:
1. **Edits placeholder positions/sizes/anchors directly** when the fix is unambiguous and lives inside `src/art/` / `src/ui/` / stage JSON (one small commit per adjustment).
2. **Files `NN-vp-adjustments.md`** under `.scratch/grim-griper-puzzle-mvp/issues/` when the fix needs coordination with the owning role (e.g. layout change that implies a JSON schema field).

**Review checklist applied to every slice:**
- **Composition** — Reaper, victim, evidence, ghosts read clearly at a glance; nothing important on the cropped edge under cover-fit.
- **Silhouette** — Reaper stays the darkest, victim the lightest; auras don't muddy the silhouette.
- **Screen-space UI** — `FearBar`, `SightMeter`, `RadialHauntMenu` anchored consistently (top-left? top-center? bottom-radial?), don't drift across slices.
- **Tonal fit** — passes the Happy Hills sniff test ([[reference-happy-hills-touchstone]]): spectral, not slasher.
- **Animation curves & timing** — dwell pauses, haunt feedback, star reveal feel like the doc says they should, not jerky/missing/over-long.
- **Worst-case window** — capture at 16:9, ultrawide, and a narrow window; nothing essential gets cropped.

**Tickets:**
- VP runs **after each slice's role-author handoff, before the user play-test**. No standing slice ticket; VP either inlines small edits or files an `NN-vp-adjustments.md` per slice as needed.

**First playtestable deliverable:** What the user opens in the browser at every play-test gate already reads as intended — anchors steady, silhouettes legible, no obvious cropping, animation curves matching the doc. The user's play-test is about *feel*, not catching defects VP could have caught.

**Boundary:** VP **does not** replace the play-test gate (per [[playtest-gates]]). A clean VP pass with broken feel still fails the gate. VP does not touch core gameplay logic, FSMs, scoring, or test code — that's #3 / #6's territory. VP is layout, art placement, anchor, timing, and tonal critique.

### #8 QA Engineer (Bug Hunter)

**Owns:** Bug discovery across the running build. Drives the dev server via Playwright (Chromium headless) through scripted player flows, captures PNGs, reads them back, and files defects against the owning roles. Tells the team *what's broken* — does not fix.

**Toolchain:** Playwright scripts at `tools/vp/capture-*.mjs` (uses the existing capture-*.mjs scripts and authors new ones per QA pass). Captures PNGs to `.scratch/screenshots/qa-YYYY-MM-DD/<state>.png`. Browser console errors + page errors logged and surfaced in the bug report.

**Categories of bug to hunt:**
- **Visual** — register clashes (painterly vs pixel-art), z-order issues, off-screen elements, overflow, scaling problems, missing sprites, color-palette drift, opacity bugs
- **Logic** — interactions not firing (door, collect, advance), gates rejecting wrong states, state machines stuck or transitioning incorrectly, input not consumed
- **Perf** — FPS drops below 60 target, per-frame allocations visible as GC pauses, sprite leaks
- **Tonal** — anti-slasher discipline drift (gore, body shapes, slasher signifiers, ominous sky, red blood)
- **Cross-scene / state leak** — UI elements that show in wrong scene, audio that doesn't stop, ambient systems that ignore scene state, persistent containers
- **Memory** — containers not destroyed on transition, listeners not removed
- **Spec drift** — locked design memory says X, build does Y

**Output format:** A bug report markdown at `.scratch/grim-griper-puzzle-mvp/issues/qa-bugs-YYYY-MM-DD.md` with one section per bug:
- `### Bug N — <one-line title>`
- `**Severity:** P0 / P1 / P2 / P3` (P0 = blocker, P3 = polish)
- `**Category:** Visual / Logic / Perf / Tonal / Cross-scene / Memory / Spec drift`
- `**Steps to reproduce:** numbered`
- `**Expected:** <per locked design memory or PRD>`
- `**Actual:** <what QA observed>`
- `**Screenshot:** path to captured PNG`
- `**Owner:** suggested role (#1–#7) to fix`

**Reads the locked memory list** at `/Users/khangnguyen/.claude/projects/-Users-khangnguyen-Documents-Grip-Griper-game-grim-griper/memory/MEMORY.md` before each QA pass — every "expected" line must trace back to a locked design decision, otherwise the bug is QA opinion (still worth flagging but lower severity).

**Boundary:** QA **does not fix bugs.** QA files defects, prioritizes, and hands to owning roles via the bug report. The owning role (#1–#7) writes the fix. This boundary preserves the bug-finder's eye — fixing what you found rots the discipline. QA also does not adjudicate tonal questions where the locked memory is silent — that's #0 Team Lead.

## Dispatch schedule

Per PRD §"Dispatch order (gated by playtest)":

| Slice | Roles running in parallel | VP pass | Gate |
|---|---|---|---|
| 1 | #1 Foundation + #5 Stage+Art (minimal) | ▶ #7 captures chapel composition, Reaper silhouette, waypoint labels | ▶ user play-tests slice 1 |
| 2 | #2 Investigation + #5 Stage+Art (expanded) + #6 (sight-budget math notes) | ▶ #7 captures SightFX, outline thickness, ghost alpha, SightMeter anchor | ▶ user play-tests slice 2 |
| 3 | #3 Haunt AI (routine + SHATTER) + #4 UI/HUD (radial + fear bar + placeholder end) + #6 (06, 07) | ▶ #7 captures radial sizing, FearBar anchor, Aldric routine readability, end-screen layout | ▶ user play-tests slice 3 |
| 4 | #3 Haunt AI (full FSM, all 4 haunts, interrupts, smash, fails) + #6 (08) | ▶ #7 captures FSM-state auras, smash feedback, kneel pose, doors anchor | ▶ user play-tests slice 4 |
| 5 | #4 UI/HUD (menu, pause, splash, star anim) + #1 Foundation (save, migrator, audio, traits) + #6 (09) | ▶ #7 captures MenuScene, PauseOverlay dim, DesktopOnlySplash, star-reveal timing | ▶ user play-tests slice 5 |

## Ticket protocol

Each role appends a `## How to play-test` section to its ticket before handing off, listing:
- URL / command to start the dev server
- The golden path the user should walk through in the browser
- Edge cases to poke at
- Anything still placeholder (so the user doesn't flag it as a defect)

Defects the user finds during play-test get filed as new tickets under `.scratch/grim-griper-puzzle-mvp/issues/` with `Status: needs-triage`. They do not block the gate from closing unless the user says so.
