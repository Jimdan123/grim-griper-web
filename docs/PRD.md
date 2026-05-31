---
title: Reaper's Debt — MVP
status: ready-for-agent
type: PRD
scope: single-stage MVP — The Confession Room (Father Aldric). Stages 2–6 sketched at docs/narrative/post-mvp/ are post-MVP roadmap. (Reverted 2026-05-30 from same-day six-stage expansion after slice-1+2 play-test surfaced narrative-framing gaps — polish stage 1 before adding more. See team-lead persona at docs/agents/team-lead.md §"Six great Stages beats nine uneven ones.")
---

# Reaper's Debt — MVP PRD

## Problem Statement

A player who wants a short, atmospheric 2D puzzle-horror session has limited options that combine **investigation** and **active hauntcraft** in one tight loop. Existing horror games either let the player be the monster with arbitrary powers (no investigation), or be the detective with no agency over the victim's fate (no hauntcraft). The player wants a single 5–8 minute stage that asks them to *understand* a victim's crime first, then *use that understanding* to drive the victim to a fated death — with skill expression through timing, waypoint matching, and reading a reactive AI.

A secondary problem: the player wants their performance to *mean* something across a longer arc, but no commitment to a metagame should be required to enjoy a single session. The MVP must seed a future debt-payment loop without forcing the player to engage with it now.

## Solution

Build "Reaper's Debt" as a 2D side-view, desktop-only web game in which the player controls the imprisoned Grim Reaper across a single hand-authored stage, *The Confession Room*. Each stage is a fixed-camera chapel with two phases.

In **Phase 1 (Investigation)** the player walks left/right, holds **Reaper Sight** to desaturate the world and reveal glowing **Evidence** items plus translucent ghost imagery of the past crime, and collects evidence to unlock **Haunts**. Each evidence piece grants exactly one haunt (1:1 mapping in MVP). The player advances to Phase 2 when ready.

In **Phase 2 (Haunt)** the same chapel is now occupied by the **Victim** (Father Aldric), walking a looping waypoint routine. The player triggers their unlocked haunts via the 1–4 keys at specific moments and locations. Each haunt at its **correct waypoint** delivers large FEAR; at a wrong waypoint, small FEAR but risks pushing the victim into a **Reaction State** (Aggressive, Fleeing, or Calling for Help) which pauses FEAR gain. The player can **Interrupt** reactions with counter-haunts to keep the priest off-balance and steer him back toward the **Fated Death**. The stage ends when FEAR hits 100 (soul claimed, star grade awarded) or the victim escapes via the chapel doors or completes a prayer for help (soul escaped, stage fails).

Persistence saves total souls collected and best star grade per stage. The save schema includes a complete `reaperTraits` block from day one so the next build can wire a debt-payment loop in which submitting souls progressively weakens the Reaper.

## User Stories

1. As a Reaper, I want to enter a chapel from a fixed side-view camera, so that I can focus on movement and observation without managing depth.
2. As a Reaper, I want to walk left and right using A/D or arrow keys, so that I can traverse the chapel between the four waypoints (Altar, Lectern, Confession Booth, Sacristy).
3. As a Reaper, I want a single landscape canvas (1280×720 logical) that letterboxes to fit any desktop window, so that the experience looks intentional on any screen.
4. As a Reaper, I want to hold SHIFT to enter Reaper Sight, so that the world desaturates and reveals what is hidden to the living.
5. As a Reaper, I want Reaper Sight to highlight nearby Evidence with a visible glow or outline, so that I can identify what to collect.
6. As a Reaper, I want translucent ghost imagery to appear near each Evidence under Reaper Sight, so that I receive a silent storytelling beat about the crime.
7. As a Reaper, I want a visible Sight budget bar that drains while I hold SHIFT and recharges at double speed when I release, so that I must spend sight deliberately.
8. As a Reaper, I want my Sight budget capped at 8 seconds in this MVP, so that I get the intended tension; the cap is read from `reaperTraits` so a future debt loop can shorten it.
9. As a Reaper, I want to press E near a highlighted Evidence to collect it, so that collection is a deliberate input rather than ambient pickup.
10. As a Reaper, I want each collected Evidence to grant exactly one Haunt in this MVP, so that the connection between investigation and hauntcraft is unmistakable.
11. As a Reaper, I want to press TAB to advance from Investigation to Haunt phase, so that I control the pacing of my own readiness.
12. As a Reaper, I want TAB to be rejected unless I have collected **all 4 Evidence**, so that Phase 2 is a proper investigation puzzle rather than a skip-ahead. *(Re-locked 2026-05-30, supersedes the earlier "at least one" gate.)*
13. As a Reaper, I want Phase 2 to take place in the same chapel without a loading break, so that the world feels continuous and the haunting is layered onto what I just investigated.
14. As a Reaper, I want the Victim (Father Aldric) to walk a looping waypoint routine (Altar → Lectern → Confession Booth → Sacristy → Altar) with ~3s dwell per stop and ~2s walk between, so that I have predictable opportunities to time my haunts.
15. As a Reaper, I want a Haunt menu rendered as a radial of four wedges around my avatar with 1–4 key bindings, so that I see at a glance which haunts are equipped, on cooldown, or unavailable.
16. As a Reaper, I want a wedge to appear greyed-out if I never collected the matching evidence, so that I am reminded of what I skipped.
17. As a Reaper, I want a SHATTER haunt at the Altar to land +35 FEAR, so that I am rewarded for matching haunt to the correct waypoint.
18. As a Reaper, I want a haunt at the wrong waypoint to land +5 FEAR and roll a Reaction trigger biased by the victim's personality, so that misplaced haunts cost me both score and control.
19. As a Reaper, I want re-using the same haunt within 15 seconds to grant 0 FEAR, so that I am pushed to vary my approach.
20. As a Reaper, I want the Victim to react with one of four states (NEUTRAL, AGGRESSIVE, FLEEING, CALLING_FOR_HELP) when I provoke him, so that he feels alive rather than a static fear bar.
21. As a Reaper, I want FEAR gain to pause while the Victim is in any non-NEUTRAL state, so that I must end the reaction before the fear loop resumes.
22. As a Reaper, I want each primary haunt to have a default Reaction tendency (RISE→FLEEING, WHISPER→AGGRESSIVE, SHATTER→FLEEING, VOICE→CALLING_FOR_HELP), so that I can predict and exploit each haunt's secondary effect.
23. As a Reaper, I want Father Aldric biased 60% toward CALLING_FOR_HELP when wrong-waypoint triggers fire, so that this specific priest's character shapes my strategy and future victims feel distinct.
24. As a Reaper, I want SHATTER to interrupt the priest's prayer into FLEEING, VOICE to interrupt his aggression into CALLING_FOR_HELP, and RISE to interrupt fleeing back into AGGRESSIVE, so that I have explicit counters to bad situations.
25. As a Reaper, I want each interrupt to cancel the old timer and start the new state's full fresh timer, so that the rules are clear and exploitable.
26. As a Reaper, I want a haunt triggered during a reaction to apply only its Interrupt effect (no FEAR), so that I don't accidentally double-dip and so the rules are transparent.
27. As a Reaper, I want the AGGRESSIVE priest to smash a nearby haunt-source object if one is in range, so that mistakes have permanent consequences.
28. As a Reaper, I want a smashed haunt-source to permanently disable that haunt's slot for the rest of the run, so that I feel the loss visually in the radial menu (greyed wedge).
29. As a Reaper, I want a FLEEING priest to reach the chapel doors in ~6 seconds, so that I have a window to interrupt before the soul escapes.
30. As a Reaper, I want a CALLING_FOR_HELP priest to complete prayer in 8 seconds, so that I have a window to shatter the chalice before help arrives.
31. As a Reaper, I want a FEAR meter rendered prominently in Phase 2, so that I always know how close I am to claiming the soul.
32. As a Reaper, I want the Victim to enter a Fated Death animation at FEAR=100, so that I see the moment my craft pays off.
33. As a Reaper, I want a 3-star end-of-stage screen showing my star grade, total score, and breakdown (speed bonus, efficiency bonus, accuracy bonus, mistake penalty), so that I understand exactly why I scored what I did.
34. As a Reaper, I want the `secondsToMax` clock to start on my first haunt trigger (not on phase entry), so that observation time is not penalized.
35. As a Reaper, I want stars revealed via an animated reveal, so that the moment of judgment feels weighty.
36. As a Reaper, I want RETRY and RETURN TO MENU buttons on the end-of-stage screen, so that I can immediately try for a better grade or step away.
37. As a Reaper, I want a "Soul Escaped" outcome (0 stars) when FLEEING completes or CALLING_FOR_HELP completes, so that failure is unambiguous.
38. As a Reaper, I want to press ESC for a pause menu with RESUME and RETURN TO MENU options, so that I can step away without losing progress.
39. As a Reaper, I want pausing to fully freeze gameplay (no timer drift, no input bleed), so that pause is a true pause.
40. As a Reaper, I want my total souls collected and best stars per stage to persist across sessions in localStorage, so that my progress is durable.
41. As a Reaper, I want returning to the menu mid-run to save before exiting, so that quitting deliberately is safe.
42. As a Reaper, I want a main menu showing my total souls collected and best stars per stage, so that I see my career at a glance.
43. As a Reaper, I want all art rendered as primitive shapes in this MVP (rects, circles, labels), so that the game ships and the developer can swap in art later without rework.
44. As a Reaper, I want consistent diegetic audio for actions (collection, sight on/off, haunt fires, fear ticks, state entries, fated death, end), so that the chapel feels haunted even with placeholder art.
45. As a Reaper, I want the Reaper's footsteps to be silent in this MVP by default, so that I move as a wraith; the footstep behavior is gated by a `reaperTraits.footstepsAudible` flag so the future debt loop can break that silence.
46. As a player on a touch device, I want a clear "desktop required" splash so that I am not confused by unresponsive controls.
47. As a player who likes to experiment, I want my save state to be a single versioned JSON blob at `reapers-debt.save.v1`, so that I (or modders) can inspect and edit it; the loader runs through a versioned migrator so future schema changes don't wipe me.
48. As a developer, I want every fear-gain computation to flow through a single chokepoint that multiplies by `reaperTraits.fearGainMultiplier`, so that the future debt loop can degrade fear gain with no other code changes.
49. As a developer, I want stage data (waypoints, evidence positions, ghost positions, victim routine, personality bias) authored in a per-stage JSON file, so that future stages are pure data additions, not code branches.
50. As a developer, I want a single InputManager exposing semantic actions (MOVE_LEFT, MOVE_RIGHT, SIGHT, COLLECT, ADVANCE, HAUNT_1..4, PAUSE), so that future rebinding or touch overlays are a binding swap, not a system rewrite.
51. As a developer, I want a hand-rolled FSM class shared by Stage phase, Victim, and SightController, so that there is one mental model for state across the game.
52. As a developer, I want the build sliced into five thin vertical playable cuts, each play-tested in the browser by the user before the next, so that we hold the play-test gate mandated by team memory.
53. As a developer, I want pure, headless-testable modules for the scoring formula, haunt-fear math, victim FSM, and save migrator, so that the most invisible-to-eyeball gameplay rules are pinned by tests and the playtest gate stays focused on feel.

## Implementation Decisions

**Stack & boot**
- Pixi.js v8 (already in project). Vite for dev/build (already configured). Vanilla JS, no framework.
- Logical canvas: landscape **1280×720**, letterboxed to window via the existing fit/scale callback in `src/main.js`.
- Single `Application`, single root world `Container`, scenes mounted/unmounted as children.

**Entity architecture**
- Lightweight component-OOP. Entities are small JS classes (Player, Victim, EvidenceItem, GhostReplay) holding Pixi sprite/Graphics refs and a small bag of behavior components plus an optional `StateMachine`. No formal ECS, no archetype storage. The Unity-flavored "cache references at construction, never resolve inside update" rule from the `/game-developer` skill is preserved.

**Game loop & dt**
- A single `GameLoop` wraps `app.ticker` and exposes one `update(dtMs)` per frame to all systems. `dtMs` is clamped to ≤ 50ms to absorb tab-blur jumps.
- All timers (3s dwell, 6s flee, 8s prayer, 15s cooldown, 8s sight budget) count down in `dtMs`.

**State machines**
- One `StateMachine` class (`enter(prev)`, `update(dt)`, `exit(next)`) used by:
  - **Phase FSM** on Stage: `INVESTIGATION → HAUNT → SCORE`.
  - **Victim FSM**: `NEUTRAL / AGGRESSIVE / FLEEING / CALLING_FOR_HELP`. Public API: `applyHaunt(haunt, waypoint)`, `interrupt(haunt)`, `tick(dt)`.
  - **Sight FSM (binary)**: `OFF / ON` with budget + recharge.

**Reaper Sight FX**
- `ColorMatrixFilter` applied to the world Container for desaturation while sight is ON.
- `OutlineFilter` (from `pixi-filters` package) on each EvidenceItem sprite while sight is ON and the evidence is still uncollected.
- `GhostReplay` is a static translucent sprite (`alpha` ≈ 0.4) per evidence; pre-positioned via stage JSON; visible only when sight is ON.

**Sight budget**
- Hold-to-sustain. Budget capacity = `gameState.reaperTraits.sightDurationMs` (8000 default). Drain rate = 1 ms per ms held. Recharge rate = 2× when SHIFT released. Cannot exceed capacity.

**Level data (stage JSON)**
- Per-stage JSON file under `src/stages/`. First file: `confession-room.json`. Schema includes: `id`, `displayName`, `chapelBounds`, `waypoints[]` (id, x, isAltar/Lectern/Booth/Sacristy), `evidence[]` (id, hauntId, x, y, ghostX, ghostY, hauntSourceWaypointId), `victim.routine[]` (waypoint ids in walk order), `victim.dwellMs`, `victim.walkMs`, `victim.personality.bias` (`{wrongWaypointReactsAs: "CALLING_FOR_HELP", probability: 0.6, fallback: "AGGRESSIVE"}`), `doors.x`.
- `StageLoader` parses and instantiates `Stage`.

**Haunt rules**
- Four haunts, one per evidence: `RISE`, `WHISPER`, `SHATTER`, `VOICE`.
- Correct-waypoint mapping: `SHATTER→Altar`, `VOICE→ConfessionBooth`, `WHISPER→Lectern`, `RISE→Sacristy`.
- Fear delta:
  - Correct waypoint, NEUTRAL victim: `+35` (before fearGainMultiplier).
  - Wrong waypoint, NEUTRAL victim: `+5` and roll a Reaction (see Personality bias).
  - Re-used within 15s (same haunt id), NEUTRAL victim: `0`.
  - Triggered during any non-NEUTRAL state: `0`, apply Interrupt routing only.
- Primary reaction tendency by haunt: `RISE→FLEEING`, `WHISPER→AGGRESSIVE`, `SHATTER→FLEEING`, `VOICE→CALLING_FOR_HELP`.
- Interrupt routing (only when victim is currently in the matching reaction): `SHATTER` cancels `CALLING_FOR_HELP` → enter `FLEEING`; `VOICE` cancels `AGGRESSIVE` → enter `CALLING_FOR_HELP`; `RISE` cancels `FLEEING` → enter `AGGRESSIVE`. New state always starts with its full fresh timer.
- All fear math routes through `applyFearGain(base, traits) = base * traits.fearGainMultiplier`.

**Personality bias**
- On a wrong-waypoint haunt against a NEUTRAL victim, sample once: with `victim.personality.bias.probability` enter `wrongWaypointReactsAs` state; else enter the haunt's primary reaction tendency.
- *Supersession (2026-05-30):* this single-tendency rule is replaced by the fear-bucket → bias-override routing in §"Resolved Design Questions (clarifier round, 2026-05-30)". That section is the authoritative selection logic for the 7-state FSM.

**Victim reactions**
- `AGGRESSIVE`: stops, swings; if within range of an Evidence object whose haunt is currently unlocked, smash it. Smashing permanently disables that haunt for the run (slot greyed). Duration: configurable in stage JSON, default ~4s if not smashing, ends immediately on smash.
- `FLEEING`: runs toward doors at speed that covers door distance in 6s. On arrival → STAGE_FAIL (Soul Escaped).
- `CALLING_FOR_HELP`: walks to Altar (if not already), kneels, holds for 8s. On completion → STAGE_FAIL (Help Arrived).
- All non-NEUTRAL states gate fear gain off.

**Scoring**
- Formula (all integer math after rounding):
  - `score = (fearMaxed ? 1000 : 0) + max(0, 90 - secondsToMax) * 5 + max(0, 4 - hauntsUsed) * 100 + correctWaypointHits * 75 - reactionsTriggered * 50`
- Stars: `≥1500 = 3★`, `≥1100 = 2★`, `>0 = 1★`, `STAGE_FAIL = 0★`.
- `secondsToMax` clock starts at the **first haunt trigger** of Phase 2, not at phase entry.
- `Scoring` module is event-driven: receives `hauntFired`, `correctWaypointHit`, `reactionTriggered`, `fearMaxed` events and computes the final breakdown on stage end.

**Input**
- `InputManager` maps DOM keyboard events to actions. Action set: `MOVE_LEFT`, `MOVE_RIGHT`, `SIGHT`, `COLLECT`, `ADVANCE`, `HAUNT_1`, `HAUNT_2`, `HAUNT_3`, `HAUNT_4`, `PAUSE`. API: `isPressed(action)`, `wasPressedThisFrame(action)`. No system reads raw keys.

**Audio**
- Howler.js wrapped by `AudioManager.play(id, opts)`. Footstep behavior gated by `reaperTraits.footstepsAudible` (default `false` in MVP).

**End-of-stage UI and pause**
- End screen and pause are Pixi Containers rendered as overlays over the world. Pause stops `app.ticker`; resume restarts it. Returning to menu always writes save first.

**Persistence**
- localStorage key: `reapers-debt.save.v1`. Schema:
  - `version: 1`
  - `totalSoulsCollected: number`
  - `submittedSouls: number` (always 0 in MVP)
  - `reaperTraits: { sightDurationMs, hauntSlotCount, moveSpeed, fearGainMultiplier, footstepsAudible }` (defaults: `8000, 4, 220, 1.0, false`)
  - `bestStarsPerStage: { [stageId: string]: 0|1|2|3 }`
- `saveMigrate(raw) → CurrentSave`: read `version`, run registered migrators sequentially. v1→v1 is identity. Missing fields fall back to defaults so a hand-edited save can't brick the boot.

**Platform**
- Desktop-only MVP. UA touch detection → `DesktopOnlySplash` blocks gameplay with a static message.

**Build slices (each playtested by user before next)**
1. Movement & camera (landscape canvas, InputManager, Player walks chapel floor, FPS overlay).
2. Investigation phase (stage JSON, 4 evidence, Reaper Sight w/ filters & budget, E to collect, ghost overlays, TAB advance).
3. Phase 2 skeleton (victim routine walk, radial menu, SHATTER haunt only, fear math, fear bar, fated death placeholder, end screen).
4. Full victim FSM, all 4 haunts, interrupts, Aldric bias, AGGRESSIVE smash, both fail conditions.
5. Persistence + migrator, MenuScene, PauseOverlay, AudioManager, DesktopOnlySplash, 60 FPS profile pass, meta-layer hooks manually verified.

**Future meta-layer hooks built now (no UI in MVP)**
- `GameState` carries the full `reaperTraits` block and `submittedSouls`.
- `applyFearGain` is the only path that converts a base fear value to delta — degrading `fearGainMultiplier` later requires no other change.
- `SightBudget` reads capacity from traits at Phase 1 start.
- `RadialHauntMenu` reads slot count from traits at Phase 2 start; if `hauntSlotCount` < collected evidence count, the lowest-priority haunts are equipped first (priority order: SHATTER, VOICE, WHISPER, RISE).
- `Player.moveSpeed` and `AudioManager` footstep toggle read from traits at Stage init.

## Testing Decisions

**Definition of a good test in this codebase**

A good test exercises the externally observable behavior of a pure or near-pure module — the same inputs always produce the same outputs, and the assertion is on the output, not on which internal helper was called. Tests are headless (no Pixi `Application`, no DOM, no Howler), run under Vitest (to be added), and live next to the module they test (`<module>.test.js`). Tests must not mock the formula they are exercising — they must use the real `applyFearGain` chokepoint and the real `confession-room.json` stage data where possible.

Memory note: per `feedback_playtest_gates.md`, automated tests are **supplementary**, not the validation gate. A passing test suite does not authorize moving to the next slice — a human play-test in the dev server does.

**Modules under test (confirmed by user)**

1. **`scoreRun(events) → { score, breakdown, stars }`**
   - Inputs: an ordered list of event objects (`hauntFired`, `correctWaypointHit`, `reactionTriggered`, `fearMaxed{atMs}`, `stageFailed`).
   - Outputs: full breakdown plus star grade.
   - Cases: 3★ floor (1500), 2★ floor (1100), 1★ on minimal success, 0★ on `stageFailed`, speed-bonus clamp at 0 when `secondsToMax ≥ 90`, efficiency clamp at 0 when `hauntsUsed ≥ 4`, mistake penalty stacking, "no haunts fired but somehow fearMaxed" edge case (should not be reachable but test asserts safe behavior).

2. **`computeHauntFearDelta({ haunt, waypoint, recentHaunts, victimState, traits, now }) → number`**
   - Pure function; no global state.
   - Cases: correct-waypoint NEUTRAL = 35 × multiplier; wrong-waypoint NEUTRAL = 5 × multiplier; same haunt re-used at `now - lastFired < 15000` = 0; non-NEUTRAL victim = 0 regardless; `fearGainMultiplier = 0.5` halves the result; `fearGainMultiplier = 0` zeros it.

3. **`VictimFSM`**
   - Constructed with a seeded RNG (so the 60% bias is deterministic in tests) and a personality config.
   - Test surface: `applyHaunt(hauntId, waypointId) → { stateAfter, fearDelta, sideEffects }` and `tick(dtMs)` advancing timers.
   - Cases: every (haunt × waypoint) combo in NEUTRAL produces the documented next state; the three interrupt routes (SHATTER on CALLING_FOR_HELP, VOICE on AGGRESSIVE, RISE on FLEEING) transition cleanly and start a full fresh timer; haunts on non-matching reactions are no-ops; Aldric's 60% bias is hit with a seeded RNG over a sufficient sample to confirm the threshold; FLEEING timer to doors = 6000ms; CALLING_FOR_HELP timer = 8000ms; AGGRESSIVE smashes the nearest unlocked haunt-source and disables it.

4. **`saveMigrate(rawJson) → CurrentSave`**
   - Cases: `null` / undefined → default save; missing version → assume v1; v1 passthrough; unknown extra fields preserved or dropped per the migrator contract; corrupted JSON → defaults (not crash); future-shaped v2 input gracefully downgraded or rejected with a clear thrown error.

**Modules verified by playtest only (not unit-tested in MVP)**

Pixi entity classes (Player, Victim, EvidenceItem, GhostReplay), all UI containers (`RadialHauntMenu`, `FearBar`, `SightMeter`, `EndScreen`, `PauseOverlay`, `MenuScene`, `DesktopOnlySplash`), Stage composition, `InputManager` (DOM-coupled), `AudioManager` (Howler-coupled), `GameLoop` (Pixi-coupled), `SightController`'s filter wiring (the budget math inside is pure and is exercised by scoring/haunt tests indirectly via integration).

**Prior art**

No existing tests in this codebase yet; this PRD establishes the bar. The chosen modules were picked specifically because they are pure functions or pure-data state machines — they need no test scaffolding beyond Vitest itself.

## Out of Scope

- Any additional stages beyond *The Confession Room*. The architecture supports them via stage JSON; authoring them is not in this MVP.
- The debt-payment meta-loop UI (submitting souls, trait-degradation animations, run summaries across stages). The data shape is built; the UI is the next build.
- Touch / mobile controls. UA-blocked with a splash.
- Save sync across devices. localStorage only.
- Configurable key bindings UI. Action layer exists; settings UI does not.
- Procedural ghost replays recorded from a hidden victim simulation. Ghosts are static sprites only.
- Final art, character animations, sound design. Placeholder Graphics primitives and placeholder SFX only.
- Localization. English strings inlined.
- Analytics, telemetry, error reporting.
- Anti-tampering on save (intentionally inspect-and-edit-friendly).

## Resolved Design Questions (from grill-me, 2026-05-29)

Five ambiguities raised during interview, locked in by user. These supplement the User Stories and Implementation Decisions above — they do not override; they fill in the gaps.

1. **Spatial trigger model — victim-anchored.** "Correct waypoint" is whichever waypoint Aldric is currently at. Reaper position is irrelevant for haunt evaluation.
2. **Walk-state — next-waypoint-sticky.** The instant Aldric leaves a waypoint, the *next* waypoint in his routine becomes his "current" waypoint. Firing SHATTER while he is walking from Altar to Lectern is evaluated against the **Lectern** (wrong, since SHATTER's correct is Altar). Rewards prediction.
3. **Reaper in Phase 2 — free-roam + Sight aura.** Reaper walks freely; position has no mechanical effect on haunt evaluation. Reaper Sight remains available in Phase 2 and reveals: (a) Aldric's FSM state as a colored aura — red AGGRESSIVE, blue FLEEING, gold CALLING_FOR_HELP; (b) a cooldown-readout ring on each haunt-source object. Sight budget rules unchanged.
4. **Phase 2 entry — Altar spawn, full 3s dwell, 1s grace.** Aldric always spawns at the Altar with a full 3s dwell ahead of him. A 1s grace window after TAB during which Aldric is stationary; then his routine begins. `secondsToMax` still starts on first haunt trigger, not on TAB.
5. **Personality bias else-branch — haunt's primary tendency.** On a wrong-waypoint NEUTRAL haunt: with `personality.bias.probability` enter `wrongWaypointReactsAs`; **else enter the haunt's primary reaction tendency** (not a `fallback` field). The `fallback` key is therefore removed from `confession-room.json`'s personality block.

## Resolved Design Questions (clarifier round, 2026-05-30)

A second clarifier round expanded Phase 2's victim behavior set substantially. Decisions below **supersede** the conflicting earlier rules (PRD §"Haunt rules", §"Personality bias", §"Victim reactions", and User Stories #12, #16, #20, #22–#24). Where earlier text is silent (not contradicted), it still holds.

1. **Evidence gate.** Phase 2 unlocks only when **all 4 evidence** are collected. The "greyed haunt slot if you skipped evidence" loop (User Story #16) is removed — skipping is no longer possible.

2. **Setting reframe — hybrid / timeless.** The medieval-gothic look (style guide, narrative, roster) remains the *default visual register* but no longer rigidly constrains content. Modern signifiers (e.g., "cops" as the entity arriving on CALLING_FOR_HELP completion) are permitted where they read well in-fiction.

3. **Victim FSM grows from 4 to 7 states.** New: `PRAYING`, `RITUAL`, `HIDING`. Retained: `NEUTRAL`, `AGGRESSIVE`, `FLEEING`, `CALLING_FOR_HELP`.

4. **Fear-bucket selection (replaces single `primaryReactionTendency`).** On a wrong-waypoint haunt against a NEUTRAL victim, in order:
   - **Bucket pick.** `fear < 50` → low bucket; `fear ≥ 50` → high bucket. Threshold authored per stage (`fearBucketThreshold`, default 50).
   - **Tendency lookup.** Each haunt authors **two** tendencies: `lowFearTendency ∈ { AGGRESSIVE, PRAYING }` and `highFearTendency ∈ { FLEEING, HIDING }`. The bucket lookup picks the matching one as the **default** outcome.
   - **Bias override.** The victim's personality bias rolls once (Aldric: 60% → `RITUAL`). On hit, the bias state **overrides** the bucket default. On miss, the bucket default stands.

5. **RITUAL — Aldric's new signature.** Aldric's `bias.wrongWaypointReactsAs` becomes `"RITUAL"` (was `"CALLING_FOR_HELP"`); `probability: 0.6` unchanged. RITUAL completes after **8000ms** → `STAGE_FAIL (Soul Saved)` — a third fail condition alongside Soul Escaped (FLEEING) and Help Arrived (CALLING_FOR_HELP). CALLING_FOR_HELP remains in the FSM for other victims (notably Master Ode in `docs/narrative/post-mvp/schoolmaster.md`); for Aldric it is no longer reachable.

6. **PRAYING.** Triggered via low-bucket lookup. While active, the Reaper's Sight budget drains at **3× normal rate** (effectively unusable). Auto-ends after **6000ms** → victim returns to NEUTRAL. Any haunt interrupts (no FEAR delta) and returns the victim to NEUTRAL.

7. **HIDING.** Triggered via high-bucket lookup. Victim ducks at the nearest waypoint and goes still; FEAR ticks **+1/s** while hidden. Reaper passes within **80px** of the hide spot with Sight ON → HIDING ends and victim transitions immediately into `FLEEING`. No auto-timeout — the +1/s FEAR drift is the only pressure if the player can't find them.

8. **Interrupt routing simplified.** Any haunt fired during any non-NEUTRAL reaction acts as a clean Interrupt: it ends the current reaction (no FEAR delta from that fire) and the victim returns to NEUTRAL. This replaces the haunt-specific routing in User Story #24 (`SHATTER↯CALLING→FLEEING`, etc.) — that routing was tractable for 4 states; for 7 it becomes opaque. Trade-off accepted in exchange for FSM readability.

9. **Confession Room default haunt tendencies** (authored into `confession-room.json`; tunable in playtest). These replace the single `primaryReactionTendency` field:

   | Haunt | Correct waypoint | `lowFearTendency` | `highFearTendency` |
   |---|---|---|---|
   | SHATTER | Altar           | PRAYING    | FLEEING |
   | VOICE   | ConfessionBooth | PRAYING    | HIDING  |
   | WHISPER | Lectern         | AGGRESSIVE | HIDING  |
   | RISE    | Sacristy        | AGGRESSIVE | FLEEING |

   Narrative justification per haunt → tendency lives in `docs/narrative/confession-room.md`.

10. **Stage JSON schema delta.** `confession-room.json` adds:
    - A top-level `haunts` block keyed by haunt id, each with `correctWaypointId`, `lowFearTendency`, `highFearTendency`.
    - `fearBucketThreshold` (number, default 50).
    - `victim.personality.bias.wrongWaypointReactsAs: "RITUAL"`.

    `personality.bias.fallback` remains removed.

11. **Slice impact.** Slice 4 ("Full victim FSM") absorbs the new states. Roles #3 (Haunt AI) and #6 (Math & Test) scope grows but slice count and dispatch order are unchanged. `VictimFSM` test cases extend to cover PRAYING/HIDING/RITUAL transitions, fear-bucket selection, bias-override on hit/miss, and Sight-drain effect during PRAYING.

## Team & Dispatch Plan

### Roles

| # | Role | Owns | First playtestable deliverable |
|---|------|------|--------------------------------|
| 1 | Foundation Engineer | `main.js` boot, `GameLoop`, `StateMachine`, `InputManager`, fit/letterbox, FPS overlay | Slice 1: Reaper walks left/right in landscape chapel, FPS pinned at 60 |
| 2 | Investigation Engineer | `SightFSM` + `SightBudget` + `SightFX`, `EvidenceItem`, `GhostReplay`, TAB-gate, `StageLoader` | Slice 2: SHIFT desaturates, 4 evidence glow, ghosts appear, E collects, TAB rejected at 0 evidence |
| 3 | Haunt AI Engineer | `VictimFSM`, `Victim` routine walker, `HauntSource`, AGGRESSIVE smash, interrupt routing | Slices 3–4: priest walks routine, FEAR fills on correct waypoint, reactions + interrupts behave per spec |
| 4 | UI/HUD Engineer | `RadialHauntMenu`, `FearBar`, `SightMeter`, `EndScreen`, `PauseOverlay`, `MenuScene`, `DesktopOnlySplash` | Overlays as Pixi Containers; star reveal animates; pause truly freezes |
| 5 | Stage + Art Lead | `confession-room.json`, placeholder style guide, primitive sprites (Reaper, Aldric, chalice, lectern, etc.), palette + scale ratios | Chapel reads at a glance — Reaper distinct from Aldric, waypoints labeled, evidence glow obvious |
| 6 | Math & Test Author | `fearMath`, `Scoring`, `saveMigrate`, full Vitest suite against real `confession-room.json` | Green test report; numbers in EndScreen breakdown match expectation |
| 7 | Visual Polish Lead | Screenshot-driven layout & feel review of every slice. Captures the running game via a small Playwright/Puppeteer script, reviews against `docs/art/style-guide.md` + `docs/narrative/confession-room.md` + [[reference-happy-hills-touchstone]], and either edits placeholder positions/sizes/anchors directly or files an adjustments ticket. Senior game-dev judgment on composition, readability, silhouette, animation timing curves, and screen-space anchoring — the "does it feel right" eye that headless tests can't deliver. | Per-slice screenshot bundle in `.scratch/screenshots/slice-NN/` + an inline adjustments diff or a `NN-vp-adjustments.md` ticket; net result is that what the user opens in the browser already reads as intended. |

### Dispatch order (gated by playtest)

Subagents cannot all run in parallel — the human play-test is the gate between slices ([[playtest-gates]]). Within a slice, parallel is fine. After role-authors finish a slice, **#7 Visual Polish Lead** runs a screenshot-driven layout pass before the user is asked to play-test, so the slice arrives at the gate already composed. The VP pass is supplementary; it does not replace the user play-test gate (a clean VP pass with broken feel still fails the gate).

- **Slice 1**: #1 Foundation + #5 Stage+Art (minimal first pass: chapel bounds, 4 waypoint markers, Reaper placeholder) — parallel
- ▶ #7 Visual Polish pass (chapel composition, Reaper silhouette, waypoint label legibility)
- ▶ human play-tests slice 1
- **Slice 2**: #2 Investigation + #5 Stage+Art (expanded: evidence + ghost shapes + chalice + lectern) + #6 Math&Test (sight-budget math) — parallel
- ▶ #7 Visual Polish pass (SightFX desaturation level, outline thickness, ghost alpha, SightMeter anchor)
- ▶ human play-tests slice 2
- **Slice 3**: #3 Haunt AI (routine walker + SHATTER only) + #4 UI/HUD (radial menu + fear bar + placeholder end screen) + #6 Math&Test (scoring formula) — parallel
- ▶ #7 Visual Polish pass (RadialHauntMenu radius/wedge sizing, FearBar anchor, Aldric routine readability, end-screen layout)
- ▶ human play-tests slice 3
- **Slice 4**: #3 Haunt AI (full FSM, all 4 haunts, interrupts, AGGRESSIVE smash, both fail conditions) + #6 Math&Test (VictimFSM tests with seeded RNG) — parallel
- ▶ #7 Visual Polish pass (FSM-state aura colors + intensity, smash feedback, kneel pose, doors anchor)
- ▶ human play-tests slice 4
- **Slice 5**: #4 UI/HUD (menu, pause, splash, star reveal animation) + #1 Foundation (save store, migrator, audio manager, trait plumbing) + #6 Math&Test (saveMigrate tests) — parallel
- ▶ #7 Visual Polish pass (MenuScene layout, PauseOverlay dimming, DesktopOnlySplash legibility, star-reveal timing)
- ▶ human play-tests slice 5

### Workflow

Each subagent writes its work + a **"How to play-test"** checklist into a ticket at `.scratch/grim-griper-puzzle-mvp/issues/NN-<slug>.md`. No cross-subagent SendMessage; coordination is file-based only ([[file-based-workflow]]). Tickets reference this PRD as source of truth.

### Known cleanup in slice 1

- `src/main.js:3-4` declares portrait `720 × 1280`; PRD requires landscape `1280 × 720`. Foundation Engineer fixes on first edit.

## Art Reference Handoff (2026-05-30)

A first-pass art reference doc was gathered on 2026-05-30 and lives at [`docs/art/references/confession-room.md`](art/references/confession-room.md). Four sections: (1) Happy Hills touchstone URLs (Steam, Giant Bomb, Glitchwave, etc.); (2) chapel-interior tileset shortlist (Candle Cathedral, Pixel Art Medieval Interior, CraftPix castle backgrounds, etc.); (3) 2D dispassionate-horror tonal companions (Limbo, Inside, Darkest Dungeon); (4) hooded-Reaper silhouette references (SamuelLee's animated pixel-art Reaper, Vecteezy/iStock silhouette samples). Three URLs were deep-fetched 2026-05-30; findings reflected inline in that doc.

### Direction for the receiving roles

- **#5 Stage + Art Lead.** When authoring placeholder sprites (Reaper, Aldric, chalice, lectern, etc.), use §4 (Reaper silhouettes) to validate the current `24×96 + 32×28 hood` placeholder reads as "covered figure" at thumbnail. Use the **Candle Cathedral asset list** in §2 (animated candles, chandeliers, columns, archways, stained-glass windows, altarpieces, coffins, ossuary elements) as a *checklist* for whether the placeholder chapel is missing any silhouettes a viewer would expect from a gothic chapel. Do **not** adopt any third-party asset without an explicit license check (and Candle Cathedral specifically is **disqualified** on perspective — it is top-down, our game is side-view; use its content list, not its tiles).
- **#7 Visual Polish Lead.** At each slice's screenshot pass, scan §3 (Limbo / Inside / Darkest Dungeon) as the tonal-neighbor sample. If a screenshot does not feel like a sibling of those references, the slice has a tonal slip — flag it in the VP pass before the user play-test.
- **Future texture-upgrade artist (post-MVP, no role assigned yet).** §1 (Happy Hills) is the composition contract — start there and re-read `docs/art/scene-composition-spec.md` Part A before authoring anything. §2 is the chapel-tileset shortlist; every entry needs a license + perspective check before adoption. §4 is the Reaper shortlist; **SamuelLee's permissive-license Reaper set is the strongest starting point** for animation-timing reference, but **recolor the red hood to the spectral cold value** (`REAPER_HOOD #16162a`) before any in-game use, and **do not import the hostile/attack animations** — the Reaper does not attack, per [[reference-happy-hills-touchstone]].

### Constraints that still hold (do not relax)

- **Placeholder-first workflow** ([[grim-griper-constraints]]) — final art does not land in MVP. The texture-upgrade pass is a post-MVP build.
- **Anti-slasher discipline** (`docs/art/scene-composition-spec.md` §"Anti-slasher discipline") — Happy Hills' compositional grammar is cribbed; its overt gore is not. No blood in present-tense scenes; implication only.
- **Spectral-not-slasher Reaper** ([[reference-happy-hills-touchstone]]) — no oversized scythe iconography, no skull-grin reveal, no hostile-state animation for the Reaper himself.
- **License check before adoption** — every shortlisted asset (chapel tilesets, Reaper sprite sets) needs an explicit license verification before any byte enters the repo. Permissive ≠ unrestricted.

### Template for new stages (post-MVP)

When stages 2–6 enter authoring, copy the four-axis structure of `docs/art/references/confession-room.md` into `docs/art/references/<stage-slug>.md` and re-fill per stage. The split (touchstone → setting tileset → tonal companions → key character silhouette) generalizes across the roster. The "Out of scope (this doc)" section at the bottom of the template carries forward unchanged — same constraints, same per-stage license discipline.

## Further Notes

- The `/game-developer` skill in `.agents/skills/game-developer/` is written in Unity/C# vernacular. The patterns adopted here (state machine class, component caching at construction, dt-driven update, data files over hardcoded values, object pooling) are ported one-for-one to JS. ECS is intentionally *not* adopted — the entity count for a one-victim stage does not justify the abstraction.
- The play-test gate at every slice boundary is enforced by team memory ([[playtest-gates]]) and overrides any temptation to bundle slices.
- The file-based workflow ([[file-based-workflow]]) means subsequent tickets — one per slice plus one per testable module — should be created under `.scratch/grim-griper-puzzle-mvp/issues/NN-<slug>.md`. This PRD is the source of truth they reference.
- The placeholder-first art workflow ([[grim-griper-constraints]]) holds: no textures land in MVP; the artist swaps placeholders later without gameplay churn.
- A short ADR may be worth filing for the choice of component-OOP over ECS so the decision survives the next architectural pressure.
