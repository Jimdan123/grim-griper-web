---
title: Reaper's Debt — MVP PRD
status: canonical-2026-05-30
scope: single-stage MVP — The Confession Room (Father Aldric). Stages 2–6 are post-MVP roadmap (`docs/narrative/post-mvp/`).
supersedes:
  - docs/PRD.md (pre-2026-05-30 evening version)
  - .scratch/grim-griper-puzzle-mvp/handoff-2026-05-30.md (folded into §"Build slice status")
  - .scratch/grim-griper-puzzle-mvp/plans/*.md (folded into §"Engine contracts" + §"UI / HUD" + §"Stage data schema")
companion_docs:
  - CONTEXT.md — glossary of project terms (read this first if new to the project)
  - REFACTOR.md — per-commit + per-phase safety gates for any code change
  - happyhills_level_map_spec.md — structural reference for stage / map authoring
  - docs/narrative/confession-room.md — narrative source of truth for stage 1
  - docs/art/style-guide.md, docs/art/scene-composition-spec.md
  - docs/agents/roles.md, docs/agents/team-lead.md
---

# Reaper's Debt — MVP PRD

A 2D side-view web puzzle-horror game. The player is the imprisoned Grim Reaper, sent to claim a single corrupt soul. The MVP ships one hand-authored stage — **The Confession Room** (Father Aldric) — wrapped in a two-phase Day/Night loop, a 7-state victim AI, a sight-based stealth model, an extinguish-to-hide candle puzzle, and a star-graded scoring system that seeds a future debt-payment metagame.

---

## 1. Problem Statement

A player who wants a short, atmospheric 2D puzzle-horror session has limited options that combine **investigation** and **active hauntcraft** in one tight loop. Existing horror games either let the player be the monster with arbitrary powers (no investigation), or be the detective with no agency over the victim's fate (no hauntcraft). We want a single 5–8 minute stage that asks the player to *understand* a victim's crime first, then *use that understanding* to drive the victim to a fated death — with skill expression through observation, timing, stealth, and reading a reactive AI.

A secondary problem: the player wants their performance to *mean* something across a longer arc, but no commitment to a metagame should be required to enjoy a single session. The MVP must seed a future debt-payment loop without forcing the player to engage with it now.

---

## 2. Solution Overview

A 2D side-view, desktop-only web game in which the player controls the imprisoned Grim Reaper across a single hand-authored stage, *The Confession Room*. The stage is a fixed-camera chapel that runs a two-phase loop wrapped in a Day/Night fiction layer:

- **Phase 1 — INVESTIGATION (Day).** The chapel is bustling. The Reaper walks in as a **hooded mortal pilgrim** (the Pilgrim disguise), moves among parishioners and Father Aldric at the altar, holds **SHIFT (Reaper Sight)** to desaturate the world and reveal glowing **Evidence** + translucent **Ghost Replays** of the past crime, presses **E** to collect each Evidence, and presses **TAB** to advance once all 4 Evidence are collected.
- **Phase 2 — HAUNT (Night).** Sundown. The Pilgrim's cloak sheds and the spectral **Reaper** is revealed. The chapel empties; only Aldric remains. A scripted cinematic intro shows Aldric preparing for bed by candlelight, then the steady-state loop engages: Aldric walks a routine (Altar → Lectern → ConfessionBooth → Sacristy), the Reaper haunts him via the 1–4 keys against waypoints he occupies, **FEAR** ticks toward 100, and a **7-state Victim FSM** drives reactions (NEUTRAL / AGGRESSIVE / FLEEING / CALLING_FOR_HELP / PRAYING / RITUAL / HIDING). Aldric is biased 60% toward **RITUAL** on wrong-waypoint haunts. A stealth layer rides on top: while Reaper Sight is ON, the Reaper is detectable to Aldric within an awareness radius `R`. Extinguishing chapel candles shrinks `R`.
- **SCORE.** FEAR reaches 100 → Aldric enters a Fated Death (still pose + alpha fade) → an EndScreen reveals a 3-star grade with a scoring breakdown. RETRY or RETURN TO MENU.

Persistence saves total souls collected and best star grade. The save schema includes a complete `reaperTraits` block from day one so the next build can wire a debt-payment loop in which submitting souls progressively weakens the Reaper.

---

## 3. Game Loop

```
Boot
  └─► MenuScene (post-MVP — slice 5)
        └─► Stage: The Confession Room
              │
              ├─ Phase: INVESTIGATION (Day)
              │     - Pilgrim walks chapel
              │     - Bustling NPCs + chatter + warm midday light
              │     - Aldric at the altar (statically visible)
              │     - SHIFT = Reaper Sight (desaturate + outline evidence + reveal ghosts)
              │     - E = collect evidence (4 total)
              │     - TAB advances (gated on 4/4 evidence)
              │
              ├─ Cloak-shed transition (HAUNT.enter)
              │     - Pilgrim sprite → Reaper sprite swap
              │     - NPCs leave; chapel empties
              │     - Lighting flips to night
              │
              ├─ Phase: HAUNT (Night)
              │     - Cinematic intro: Aldric praying / preparing for bed (slice 4+)
              │     - Routine engages: altar → lectern → booth → sacristy, dwell 3s / walk 2s
              │     - 7-state Victim FSM drives reactions
              │     - 1–4 keys fire haunts (SHATTER / WHISPER / VOICE / RISE)
              │     - FEAR ticks 0 → 100; stealth-aura risk + candle puzzle ride alongside
              │
              └─ Phase: SCORE
                    - FEAR=100 → Fated Death (still pose + alpha fade)
                    - EndScreen with stars + breakdown
                    - RETRY or RETURN TO MENU
```

The FSM is implemented as `Stage.phase ∈ {INVESTIGATION, HAUNT, SCORE}` (`src/stage/Stage.js`). Day and Night are fiction layers over the same FSM — no DAY/NIGHT states exist in code. Fail conditions live inside HAUNT: a `STAGE_FAIL` outcome transitions to SCORE with `stageFailed: true` (0★).

---

## 4. Player & Reaper Duality

The player controls a single `Player` entity throughout. Its visual register flips at the phase transition:

| Term | Phase | Visual | Behavior |
|---|---|---|---|
| **Pilgrim** | INVESTIGATION (Day) | Hooded mortal disguise. Reads as a covered figure at thumbnail. | Walks freely; collects evidence; cannot be detected by NPCs (incorporeal-passing). |
| **Reaper** | HAUNT (Night) | Spectral true form revealed by the cloak-shed beat. | Walks freely; fires haunts; **detectable by Aldric within radius `R` while Sight is ON**. |

The cloak-shed is the touchstone payoff (see `reference-happy-hills-touchstone` memory + `project-day-phase-staging-2026-05-30`). It is a single view-factory swap at `HAUNT.enter`, not a state change.

The Reaper is a **neutral debt collector**, not a slasher. He does not gloat, taunt, or narrate. Haunts are silent consequences the universe has waiting. (See `docs/narrative/confession-room.md` §"The Reaper" + scene-composition-spec §"Anti-slasher discipline".)

---

## 5. INVESTIGATION (Day) Phase

### 5.1 Setting

- Chapel reads as a working medieval-gothic church at warm midday: 4–6 ambient NPCs (parishioners, candlelighter, sacristan), ambient chatter bubbles, soft floor light, Aldric statically at the altar.
- Reaper enters as the Pilgrim from outside the chapel via a door INTERACT (E at door proximity → scene swap with fade overlay).
- Two scene containers: `worldOutside` (path + facade) and `worldInside` (chapel). Both ride the same world transform (`src/main.js`).

### 5.2 Reaper Sight

- **Hold SHIFT.** Drains a budget; recharges 2× when released. Capacity = `reaperTraits.sightDurationMs` (8000 ms default).
- Visual effects (`src/sight/SightFX.js`):
  - `ColorMatrixFilter` desaturates the world container while ON.
  - `OutlineFilter` (from `pixi-filters`) glows on each uncollected Evidence in `EVIDENCE_GLOW` (`#ffd24a`).
  - `GhostReplay` translucent sprites (alpha ≈ 0.4) become visible.
- **Auto-cutoff at budget=0**, with a latch requiring SHIFT release before re-engaging (`src/sight/SightFSM.js`).
- A `SightMeter` HUD bar renders the budget top-left under FPS counter (`src/ui/SightMeter.js`).

### 5.3 Evidence

Four objects in the chapel; each unlocks exactly one Haunt:

| Evidence | Haunt | Correct Waypoint | Crime Stage | Visible Sight-OFF? |
|---|---|---|---|---|
| Chalice (poisoned residue) | SHATTER | Altar | 2. Poison | yes |
| Sermon book (marginal notes) | WHISPER | Lectern | 1. Lure | yes |
| Confession ledger (priced) | VOICE | ConfessionBooth | 3. Extort | no (clue-hidden) |
| Lime spade (quicklime dust) | RISE | Sacristy | 4. Bury | no (clue-hidden) |

- "Plain-sight" evidence (chalice, book) appears in-world independent of Sight. "Clue-hidden" evidence (ledger, spade) requires Sight to see the host object glow. (See `project-day-phase-staging-2026-05-30`.)
- Collection: stand within proximity (default 60 px), press **E** while Sight is ON. `EvidenceItem.collect()` adds to `gameState.collectedEvidence` and `gameState.unlockedHaunts`, hides the ghost, and removes the outline.
- A small floating "<HauntId> unlocked" feedback bubble appears (`src/ui/CollectionFeedback.js`).
- An on-screen `EvidenceCounter` tracks `N/4` (`src/ui/EvidenceCounter.js`).

### 5.4 Ghost Replays

- One translucent silhouette per Evidence, depicting a frozen moment of the crime (Aldric mid-sermon, mid-pour, mid-write, mid-drag).
- Static sprites with `GHOST_OVERLAY` tint, alpha 0.4. No animation in MVP.
- Each is bound to its evidence; once collected, the ghost stays hidden even under Sight.
- Per-haunt gestural poses live in `docs/narrative/confession-room.md`; placeholder factories under `src/art/placeholders/` and `src/art/pixelPalette/ghosts/`.

### 5.5 Phase Advance

- **TAB** during INVESTIGATION calls `Stage.tryAdvancePhase()`.
- **Gate: all 4 Evidence collected.** Rejected silently otherwise. *(Re-locked 2026-05-30; supersedes the earlier "≥1" gate.)*
- On success, the phase FSM transitions `INVESTIGATION → HAUNT` and the cloak-shed beat fires.

---

## 6. HAUNT (Night) Phase

### 6.1 Cinematic Intro (slice-4+)

`HAUNT.enter` runs a scripted intro before the steady-state loop engages. Beats (per `project-day-night-loop-2026-05-30` addendum):

1. Lighting flips: warm midday → cold night. Candles become the only light sources.
2. NPCs depart the chapel; only Aldric remains.
3. Close-up of Aldric: snuffs his own candles (skipping the altar), kneels at the altar performing his cleansing rite, then retires toward the sacristy pallet.
4. The cinematic hands off to the routine walker.

The cinematic is a fixed-duration beat; no player input affects it. After it ends, the routine engages and the player may haunt.

### 6.2 Routine Walker (steady state)

After the cinematic, Aldric walks a loop authored in stage JSON:

```
victim.routine:  ["altar", "lectern", "confessionBooth", "sacristy"]
victim.dwellMs:  3000
victim.walkMs:   2000
```

- 1 s post-TAB grace before the routine begins, additive on the initial dwell.
- **Next-waypoint-sticky rule (PRD 2026-05-29):** the instant Aldric leaves a waypoint, `currentWaypointId` flips to the *next* routine entry. Haunts during the walk evaluate against the destination, not the source.
- Multi-room walks split into 2 legs through the door link (`Victim._walkToWaypoint`, `src/entities/Victim.js`).
- The routine is gated by an internal `_routineActive` flag, not by the FSM state, so non-NEUTRAL reactions can pause it without re-checking state names.

### 6.3 Haunts

Four haunts mapped 1:1 to the four Evidence:

| Haunt | Key | Correct Waypoint | Effect on Aldric's room |
|---|---|---|---|
| SHATTER | 1 | Altar | shatters the chalice |
| VOICE | 2 | ConfessionBooth | speaks dying voices back through the lattice |
| WHISPER | 3 | Lectern | parishioners' accusations whisper around the pulpit |
| RISE | 4 | Sacristy | the buried bodies rise from under the floor flags |

Fire conditions (`src/engine/actionHandlers.js`):
- `gameState.unlockedHaunts.has(hauntId)` (collected the evidence)
- Phase is HAUNT
- For slice 3 only: `HAUNTS_WIRED_THIS_SLICE` gate (currently SHATTER only — drops in slice 4)

### 6.4 Fear Math

All Fear additions route through a single chokepoint so the future debt-loop can degrade the player by changing one value:

```js
// src/math/fearMath.js
applyFearGain(base, traits) = base * traits.fearGainMultiplier
```

`computeHauntFearDelta` is a pure function that takes the haunt fired, the victim's current waypoint, the recent-haunts cooldown map, the victim FSM state, the Reaper traits, and the current ms timestamp. It returns the fear delta (rules: correct waypoint NEUTRAL = 35; wrong waypoint NEUTRAL = 5; same haunt fired within 15 s = 0; any non-NEUTRAL state = 0). The wrong-waypoint **reaction roll** is **not** this module's job — that lives in the Victim FSM.

### 6.5 Victim FSM (7 states)

A shared `StateMachine` class (`src/engine/StateMachine.js`) drives the per-victim FSM. The 7 states (locked in the 2026-05-30 clarifier round, defined as no-op stubs in slice 3, bodies land in slice 4):

| State | Trigger | Timer | Exit / Fail | Side Effects |
|---|---|---|---|---|
| `NEUTRAL` | default | none | A haunt at wrong waypoint that rolls a reaction. | Routine walker active. Fear can gain here only. |
| `AGGRESSIVE` | bucket lookup | 4000 ms (or until smash) | smash a nearest unlocked Evidence's host object → return to NEUTRAL | Halt routine. Red aura under Sight. Smash permanently disables that haunt's slot. |
| `FLEEING` | bucket lookup | 6000 ms | reach `doors.x` → `STAGE_FAIL (Soul Escaped)` | Halt routine. Blue aura. Walk toward doors. |
| `CALLING_FOR_HELP` | bucket lookup (other victims; **unreachable for Aldric**) | 8000 ms | timer → `STAGE_FAIL (Help Arrived)` | Halt routine. Gold aura. Walk to altar, kneel. Aldric's bias is RITUAL, so this state is reserved for post-MVP victims (e.g. Master Ode). |
| `PRAYING` | low-bucket lookup | 6000 ms | timer → NEUTRAL; any haunt interrupts → NEUTRAL (no fear delta) | Halt routine. Reaper Sight budget drains **3×** while active. |
| `RITUAL` | Aldric's bias override (60%, wrong-waypoint NEUTRAL haunt) | 8000 ms | timer → `STAGE_FAIL (Soul Saved)` | Halt routine. Aldric's signature state — a corrupt priest's cleansing-rite reflex. |
| `HIDING` | high-bucket lookup | none (no timeout) | Reaper passes within **80 px** of hide spot with Sight ON → transitions to `FLEEING` | Halt routine. Victim ducks at nearest waypoint. **FEAR ticks +1 / s** while active — the only soft pressure. |

### 6.6 Reaction Selection (bucket + bias)

On a wrong-waypoint haunt against a NEUTRAL victim:

1. **Bucket pick.** `fear < fearBucketThreshold` → **low bucket**; `fear ≥ threshold` → **high bucket**. Threshold authored per stage (`fearBucketThreshold`, default 50).
2. **Tendency lookup.** Each haunt authors two tendencies: `lowFearTendency` ∈ {AGGRESSIVE, PRAYING} and `highFearTendency` ∈ {FLEEING, HIDING}. The bucket-matched one is the **default outcome**.
3. **Bias override.** The victim's personality bias rolls once. On hit, the bias state overrides the bucket default. On miss, the bucket default stands.

For Aldric:

| Haunt | Correct Waypoint | `lowFearTendency` | `highFearTendency` |
|---|---|---|---|
| SHATTER | Altar | PRAYING | FLEEING |
| VOICE | ConfessionBooth | PRAYING | HIDING |
| WHISPER | Lectern | AGGRESSIVE | HIDING |
| RISE | Sacristy | AGGRESSIVE | FLEEING |

Bias: `wrongWaypointReactsAs: "RITUAL"`, `probability: 0.6`. So on a wrong-waypoint NEUTRAL haunt against Aldric, 60% → RITUAL regardless of bucket; 40% → the bucket default.

### 6.7 Interrupt Routing

Any haunt fired during any non-NEUTRAL reaction acts as a **clean interrupt**: it ends the current reaction (no FEAR delta) and the victim returns to NEUTRAL. This replaces the per-haunt interrupt routing from the original PRD (`SHATTER↯CALLING→FLEEING`, etc.), which was tractable for 4 states but opaque for 7. *(Locked in the 2026-05-30 clarifier.)*

Special case: PRAYING — any haunt interrupts to NEUTRAL (per above) and the 3× sight drain ends.

### 6.8 Stealth Model — Sight-Aura Risk

The Reaper is **visible to Aldric within an awareness radius `R`** while Reaper Sight is ON; **invisible** while Sight is OFF. Detection is omnidirectional (no vision cones); the existing `SightFSM` is reused.

Detection consequence (slice-4+): triggers a wrong-waypoint-style reaction roll on Aldric without the player firing a haunt. (Concrete bucket + bias inputs to be tuned at the slice-4 play-test gate.)

This **supersedes** the original PRD's "Phase 2 Reaper is free-roam + Sight aura reveals Aldric's state" — the aura now also reveals the *player* to Aldric. Player reads Aldric's state via the colored auras + a cooldown-readout ring on each haunt-source object (unchanged from the 2026-05-29 resolution).

### 6.9 Candle Puzzle — Extinguish to Hide

Chapel candles emit light that contributes to Aldric's awareness radius `R`. Extinguishing candles (via haunt-source interaction or a new INTERACT — TBD which) shrinks `R`, letting the Reaper use Sight more aggressively. Existing `CandleShrine` decor at x=130 and x=660 (`Stage.js:140–146`) becomes interactable in slice-4+. Mechanically analogous to the `breaker_panel` puzzle in the Happy Hills spec §6/§9.

### 6.10 Phase 2 HUD

- **FearBar** (top-center, 400 × 18 px, `src/ui/FearBar.js`): renders FEAR 0–100. Pulses on gain; desaturates while victim is non-NEUTRAL. Threshold tick at 100.
- **RadialHauntMenu** (bottom-center, follows Reaper screen-space, `src/ui/RadialHauntMenu.js`): four wedges keyed to 1–4. Equipped / cooldown (desaturated) / uncollected (grey) / smashed (grey + slash) / active-flash (white pulse).
- **SightMeter** stays visible.
- `EvidenceCounter` hides at HAUNT.

Per-haunt wedge colors track waypoint palette (SHATTER → red Altar, VOICE → blue Booth, WHISPER → ochre Lectern, RISE → green Sacristy).

---

## 7. Scoring & End Screen

### 7.1 Formula (`src/scoring/scoreRun.js`)

```
score = (fearMaxed ? 1000 : 0)
      + max(0, 90 - secondsToMax) * 5
      + max(0, 4  - hauntsUsed)   * 100
      + correctWaypointHits       * 75
      - reactionsTriggered        * 50
```

- `secondsToMax` clock starts on the **first haunt fired** in Phase 2 (not on TAB) so observation time isn't penalized.
- Stars: `≥1500` = 3★, `≥1100` = 2★, `>0` = 1★, `STAGE_FAIL` = 0★.

### 7.2 Event Log

Phase 2 emits an ordered event log into `gameState.phase2EventLog`. Event shapes:

```
{ type: 'hauntFired',         atMs: number }
{ type: 'correctWaypointHit' }
{ type: 'reactionTriggered' }
{ type: 'fearMaxed',          atMs: number }
{ type: 'stageFailed',        reason?: string }
```

`scoreRun(events) → { score, breakdown, stars }` is pure. EndScreen consumes the breakdown object directly.

### 7.3 EndScreen (`src/ui/EndScreen.js`)

- Full-screen overlay; 560 × 420 card centered.
- Title varies by outcome:
  - SOUL_CLAIMED (any star count): "The debt is paid."
  - SOUL_ESCAPED (FLEEING reaches doors): "The soul slipped the noose."
  - HELP_ARRIVED (CALLING_FOR_HELP completes): "He was heard before he broke."
  - SOUL_SAVED (RITUAL completes): "The rite held." (new for 2026-05-30 RITUAL outcome)
- Star row reveal staggered with `easeOutBack` — the headline animation.
- Breakdown table: soul-claimed, speed, efficiency, accuracy, mistake penalty, total.
- Buttons: RETRY + RETURN TO MENU.

---

## 8. Persistence

### 8.1 Save Schema (slice 5)

```
localStorage key: "reapers-debt.save.v1"

{
  "version": 1,
  "totalSoulsCollected": number,
  "submittedSouls": number,            // always 0 in MVP
  "reaperTraits": {
    "sightDurationMs":   8000,
    "hauntSlotCount":    4,
    "moveSpeed":         220,
    "fearGainMultiplier": 1.0,
    "footstepsAudible":  false
  },
  "bestStarsPerStage": { "[stageId]": 0|1|2|3 }
}
```

### 8.2 Migrator

`saveMigrate(rawJson) → CurrentSave` reads `version`, runs registered migrators sequentially. Missing fields fall back to defaults so a hand-edited save can't brick boot. Corrupted JSON → defaults (no crash). Anti-tampering is intentionally absent — the save is inspect-and-edit-friendly.

### 8.3 Future Meta-Layer Hooks (built now, no UI in MVP)

- `GameState.reaperTraits` is the entire trait block; degrading values degrades the Reaper without other code changes.
- `applyFearGain` is the only fear chokepoint — multiplying by `fearGainMultiplier` lives in exactly one place.
- `SightBudget` reads capacity from traits at Phase 1 start.
- `RadialHauntMenu.setSlotCount()` reads from traits at Phase 2 start; equip order is `SHATTER, VOICE, WHISPER, RISE` (PRD priority).
- `Player.moveSpeed` reads from traits at Stage init.
- `AudioManager` footstep toggle reads from traits at Stage init.

---

## 9. Engine Contracts

### 9.1 Stack

- **PixiJS v8** (`pixi.js` + `pixi-filters`)
- **Vite** dev/build
- **Vanilla JS ESM**, no framework
- **Vitest** for the pure-module test suite
- Logical canvas: **1280 × 720** landscape, letterbox-fit via the existing callback in `src/boot/createApp.js` + `src/main.js`.

### 9.2 GameLoop (`src/engine/GameLoop.js`)

Wraps `app.ticker`. Single `update(dtMs)` per frame. `dtMs` clamped to ≤ 50 ms to absorb tab-blur jumps. Systems register via `loop.add(system)` and tick in registration order.

### 9.3 GameState (`src/engine/GameState.js`)

Per-run mutable state:

- `reaperTraits` — see §8.1
- `unlockedHaunts: Set<string>` — populated by Evidence collection
- `collectedEvidence: Set<string>`
- `fear: number` — 0..100
- `recentHaunts: Array<{hauntId, timeMs}>` — for the 15 s same-haunt cooldown
- `phase2FirstHauntTimeMs: number | null`
- `phase2EventLog: Array<Event>` — consumed by `scoreRun` on FEAR=100

### 9.4 InputManager (`src/engine/InputManager.js`)

Semantic actions only. No system reads raw DOM keys:

| Action | Default key |
|---|---|
| `MOVE_LEFT` | A / ← |
| `MOVE_RIGHT` | D / → |
| `SIGHT` | SHIFT (hold) |
| `COLLECT` | E |
| `INTERACT` | E (context: door) |
| `ADVANCE` | TAB |
| `HAUNT_1..4` | 1, 2, 3, 4 |
| `PAUSE` | ESC |

API: `isPressed(action)`, `wasPressedThisFrame(action)`, `endFrame()`.

### 9.5 StateMachine (`src/engine/StateMachine.js`)

Shared class: `new StateMachine(states, initial)`, `transition(name)`, `is(name)`, `update(dtMs)`, `currentName`. Each state is `{ enter(prev), update(dtMs), exit(next) }`. Used by `Stage.phase`, `Victim.fsm`, `SightFSM.fsm`.

### 9.6 Sight Subsystem (`src/sight/`)

- **`SightFSM`** — binary OFF/ON. Hold-to-sustain. Latch on exhaustion (release SHIFT before re-engaging).
- **`SightBudget`** — capacity `reaperTraits.sightDurationMs` (8000 ms). Drain 1 ms / ms. Recharge 2 ms / ms.
- **`SightFX`** — `ColorMatrixFilter` desaturate on `worldInside`; `OutlineFilter` per uncollected Evidence; ghost visibility toggle.

### 9.7 Stage (`src/stage/Stage.js`)

Owns `phase: StateMachine<{INVESTIGATION, HAUNT, SCORE}>`. HAUNT.update gates a 1 s grace then starts the routine walker. SCORE.enter triggers Aldric's Fated Death animation. Painterly/pixel-art register swap on M-key (debug) via `TileRenderer.onRenderModeChange`.

### 9.8 Entities

| File | Purpose |
|---|---|
| `src/entities/Player.js` | Reaper / Pilgrim. WASD/arrows. View-factory swap per phase + render mode. |
| `src/entities/Victim.js` | Aldric. Routine walker + 7-state FSM. Multi-room door-leg pathing. Fated Death sprite swap + alpha fade. |
| `src/entities/EvidenceItem.js` | Collectable. Proximity check + `collect()` returns bool. |
| `src/entities/GhostReplay.js` | Static translucent past-crime overlay. Bound to one Evidence. |
| `src/entities/AmbientNPC.js` | Day-only chapel parishioner. Decorative + chatter-emitter. |

### 9.9 Scene Layer

| File | Purpose |
|---|---|
| `src/scene/sceneSwap.js` | Outside ↔ Inside chapel transition via door E. Fade overlay during swap. |
| `src/scene/chapelBustle.js` | Day NPC roster + chatter scheduler. Hidden during HAUNT. |
| `src/scene/ambientMounts.js` | Candle flame / dust motes / smoke wisp ambient motion systems. |

### 9.10 Art Layers (two parallel registers)

- **`src/art/placeholders/**`** — `PIXI.Graphics` primitives. Painterly register.
- **`src/art/pixelPalette/**`** — pixel-art tile/sprite register. Pixel grammar matching the Happy Hills touchstone.
- **`src/art/motion/**`** — `AmbientMotion` base class + per-motion modules.
- **`src/render/TileRenderer.js`** — `getRenderMode()` + `RENDER_MODE.PIXELART | PAINTERLY`. M-key swap (debug). N-key dayLit toggle (debug, currently no visual effect).

The two registers coexist as an A/B during the pixel-art migration. PIXELART is the intended ship register; painterly is the legacy fallback and is scheduled for retirement post-MVP.

### 9.11 UI / HUD Layer (`src/ui/`)

Every overlay attaches to **`app.stage`**, never to `world`. (The world Container is letterbox-translated; anything inside it crops at narrow aspects.) Resize handlers re-anchor per-overlay.

Z-order (top → bottom):
1. `DesktopOnlySplash` (terminal, top)
2. `PauseOverlay`
3. `EndScreen` / `StageTitleCard`
4. `MenuScene` (when active)
5. HUD: `FearBar`, `SightMeter`, `EvidenceCounter`, `RadialHauntMenu`, `FpsOverlay`, `TutorialPrompt`, `EntryPrompt`, `CollectionFeedback`, `ChatterSystem`
6. `world` (gameplay)
7. Letterbox / background

See `src/ui/setupHud.js` for wiring.

---

## 10. Stage Data Schema

Per-stage JSON in `src/stages/`. The MVP file is `src/stages/confession-room.json`.

The schema is converging on the structure documented in `happyhills_level_map_spec.md` §10 — `meta`, `rooms[]`, `links[]`, `objects[]`, `npcs[]`, `objective`. Ticket #22 (hybrid map redesign) tracks the migration; current fields are:

### 10.1 Top-Level

```json
{
  "id": "confession-room",
  "displayName": "The Confession Room",
  "meta": { "tile": 16, "width": 80, "height": 45 },
  "chapelBounds":  { "x": 80, "y": 200, "width": 1120, "height": 420 },
  "playerBounds":  { "x":  0, "y": 200, "width": 1248, "height": 420 },
  "reaperSpawn":   { "spawnX": 240, "doorInteractMinX": 900, "doorInteractMaxX": 996,
                     "entryTargetX": 200, "entryWalkDurationMs": 1000 },
  "fearBucketThreshold": 50,
  "rooms":         [ ... ],
  "links":         [ ... ],
  "waypoints":     [ ... ],
  "evidence":      [ ... ],
  "haunts":        { ... },
  "victim":        { ... },
  "doors":         { "x": 1180 }
}
```

### 10.2 Rooms (Happy Hills §4)

```json
"rooms": [
  { "id": "nave",     "name": "Nave",     "x":  5, "y": 12, "w": 60, "h": 27, "lit": true },
  { "id": "sacristy", "name": "Sacristy", "x": 65, "y": 12, "w": 14, "h": 27, "lit": true }
]
```

Tile coords, multiply by `meta.tile` for logical px. `lit: true/false` is the per-room light state the candle puzzle will toggle in slice-4+.

### 10.3 Links (Happy Hills §3)

```json
"links": [
  { "type": "door", "from": "nave", "to": "sacristy", "tile": [65, 32], "open": true, "label": "sacristy_door" }
]
```

Bidirectional. `Victim._walkToWaypoint` consults this to split cross-room walks into two legs through the door tile.

### 10.4 Waypoints

```json
"waypoints": [
  { "id": "altar",           "kind": "Altar",           "x":  220, "label": "Altar" },
  { "id": "lectern",         "kind": "Lectern",         "x":  500, "label": "Lectern" },
  { "id": "confessionBooth", "kind": "ConfessionBooth", "x":  780, "label": "Confession Booth" },
  { "id": "sacristy",        "kind": "Sacristy",        "x": 1060, "label": "Sacristy" }
]
```

Waypoint markers are not rendered in chapel (removed 2026-05-30 per the Happy Hills pivot — chapel reads as an actual chapel, not a labelled puzzle board). The DATA remains because the routine walker uses these as anchors.

### 10.5 Evidence

```json
"evidence": [
  {
    "id": "chalice", "hauntId": "SHATTER",
    "x": 220, "y": 476, "visible": true,
    "ghostX": 200, "ghostY": 520,
    "hauntSourceWaypointId": "altar"
  },
  ...
]
```

`visible: true` = plain-sight evidence (in-world independent of Sight). `visible: false` = clue-hidden evidence (only the glow under Sight reveals it).

`hauntSourceWaypointId` is the proximity anchor for the AGGRESSIVE smash predicate in slice 4.

### 10.6 Haunts

```json
"haunts": {
  "SHATTER": { "correctWaypointId": "altar",           "lowFearTendency": "PRAYING",    "highFearTendency": "FLEEING" },
  "VOICE":   { "correctWaypointId": "confessionBooth", "lowFearTendency": "PRAYING",    "highFearTendency": "HIDING"  },
  "WHISPER": { "correctWaypointId": "lectern",         "lowFearTendency": "AGGRESSIVE", "highFearTendency": "HIDING"  },
  "RISE":    { "correctWaypointId": "sacristy",        "lowFearTendency": "AGGRESSIVE", "highFearTendency": "FLEEING" }
}
```

Each haunt authors both bucket tendencies. The bucket lookup picks the default; the bias may override.

### 10.7 Victim

```json
"victim": {
  "displayName": "Father Aldric",
  "crimeBlurb": "Lured the sick. Poisoned the chalice. Buried them in quicklime.",
  "routine":   ["altar", "lectern", "confessionBooth", "sacristy"],
  "dwellMs":   3000,
  "walkMs":    2000,
  "personality": {
    "bias": {
      "wrongWaypointReactsAs": "RITUAL",
      "probability": 0.6
    }
  }
}
```

`personality.bias.fallback` is **absent** by design — the else-branch is the haunt's bucket-default tendency.

### 10.8 Future Schema Additions (ticket #22 sub-slices)

These align the schema with the Happy Hills spec §10 fully:

- `objects[]` with effects: candles (extinguishable, light-radius), hide spots, doors (LOS-blocking), windows.
- `npcs[]` with `awarenessRadius` (Aldric's `R`), `hearingRadius` (optional), state, waypoints, fail goal.
- `objective` block: `gate` (candle puzzle), `goal` (Fated Death), `win` (FEAR=100), `fail` (SOUL_ESCAPED / HELP_ARRIVED / SOUL_SAVED).

---

## 11. Audio (slice 5)

`AudioManager.play(id, opts)` wraps Howler.js. All diegetic:

- Evidence collect chime
- Sight on / off whoosh
- Each haunt's signature SFX (4)
- FEAR tick (subtle per +5 / +35)
- Reaction state entries (1 per state, 7 total)
- Fated Death cymbal swell
- EndScreen star reveal sting

Footstep audibility is gated by `reaperTraits.footstepsAudible` (default `false` — the Reaper moves as a wraith). The future debt loop can flip this to break the silence as the Reaper weakens.

---

## 12. Platform

- **Desktop-only MVP.** UA touch detection at boot → `DesktopOnlySplash` blocks gameplay with a static message.
- No mobile/touch controls. No save sync. No localization. No analytics.

---

## 13. Build Slice Status

The MVP ships in five thin vertical slices, each play-tested by the user in the browser before the next dispatches. Within a slice, parallel role work is fine. `npm run test:run` (Vitest) + the per-phase play-test checklist in `REFACTOR.md` are the two gates.

| Slice | Scope | Status (2026-05-30 late-PM audit) |
|---|---|---|
| **1 — Movement & canvas** | Landscape canvas, InputManager, Player walks chapel floor, FPS overlay | shipped |
| **2 — Investigation** | Stage JSON, 4 evidence, Reaper Sight (filters + budget), E collects, ghost overlays, TAB advance | shipped (+ PM polish: village hill blend, ChatterSystem bubble resize, `playerBounds` walk-off-into-void fix, chapel exterior strip deleted) |
| **3 — Phase 2 skeleton** | Victim routine walker, RadialHauntMenu, SHATTER haunt only, fear math chokepoint, FearBar, fated-death placeholder, EndScreen scaffold | **code complete, 13/15 ACs met** — routine walker live; FearBar / RadialHauntMenu / EndScreen all in place; HAUNT→SCORE transition wired. The slice-3-only `HAUNTS_WIRED_THIS_SLICE` SHATTER-only gate was **removed** alongside the slice-4 FSM landing (all 4 haunts now fire). Outstanding: append `## How to play-test` section to ticket #03, then user gate. |
| **4 — Full victim FSM + Night mechanics** | All 7 FSM state bodies, all 4 haunts wired, bucket + bias selection, RITUAL fail wiring, AGGRESSIVE smash + slot disable, FLEEING / CALLING_FOR_HELP / HIDING / PRAYING / RITUAL fail paths, cinematic intro, stealth-aura risk (`R`), candle puzzle (extinguish-to-hide), cloak-shed view swap | **partial — FSM core shipped 2026-05-30 PM**, cinematic + stealth-aura + candle puzzle still pending. All 7 state bodies + bucket+bias reaction selection + universal interrupt + 3 fail conditions + integration wires landed (commits `7901783` + `220880e`). Tests 239/251 (12 skipped = saveMigrate). Awaits user play-test gate; cinematic intro, stealth-aura risk `R`, and candle puzzle scheduled for the next dispatch. |
| **5 — Persistence + shell** | localStorage save + migrator, MenuScene, PauseOverlay, AudioManager, DesktopOnlySplash, 60 FPS profile pass, meta-layer hooks manually verified | pending |

### 13.1 Outstanding Tickets

Filed under `.scratch/grim-griper-puzzle-mvp/issues/`. Status as of 2026-05-30 PM audit:

| # | Title | Status | Notes |
|---|---|---|---|
| 01 | Slice 1: Movement & canvas | shipped, pending replay | rolled into combined slice-1+2 playtest gate; today's polish drops mean a re-run is owed |
| 02 | Slice 2: Investigation | shipped, pending replay | same gate as #01; today's PM polish: ChatterSystem bubble resize (`src/ui/ChatterSystem.js`), village hill blend (`src/art/pixelPalette/outsideScene/village.js`), `playerBounds` walk-off-into-void fix (`src/stages/confession-room.json`), chapel exterior left strip deleted (`src/stage/Stage.js`) |
| 03 | Slice 3: Phase 2 skeleton | **code complete; needs ticket play-test section + user gate** | 13/15 ACs met per audit. Victim routine walker, RadialHauntMenu, FearBar, EndScreen, SHATTER → +35/+5 fear, 15s cooldown, HAUNT→SCORE phase transition all in place. Outstanding: `## How to play-test` section appended to ticket; user playtest gate. PRD wording "finish wiring all 4 haunts" was incorrect — per ticket #03 only SHATTER ships in slice 3; the other 3 haunts land in slice 4. |
| 04 | Slice 4: Full victim FSM | **partial — FSM core shipped 2026-05-30 PM** | All 7 state bodies + bucket+bias reaction selection (`src/math/reactionSelection.js`) + universal interrupt + 3 fail conditions + integration wires landed (commits `7901783` + `220880e`). Cinematic intro, stealth-aura risk `R`, and candle puzzle still pending and awaiting user play-test of the FSM core first. |
| 05 | Slice 5: Persistence + shell | ready | dispatch after slice 4 plays clean |
| 06 | Test: scoreRun | shipped | `tests/scoreRun.test.js` passing |
| 07 | Test: computeHauntFearDelta | shipped | `tests/computeHauntFearDelta.test.js` passing |
| 08 | Test: VictimFSM | **shipped** | `tests/VictimFSM.test.js` un-skipped: 30 tests covering every haunt × waypoint × bucket × bias combo + 1000-sample bias property + 1000-sample CALLING-unreachable property. `tests/reactionSelection.test.js` added (commit `7901783`). 132/162 → 239/251 (12 skipped = saveMigrate). |
| 09 | Test: saveMigrate | not started | parallel with slice 5 |
| 10 | ADR-0001: Component-OOP over ECS | filed | docs-only |
| 11 | Spec reconciliation 2026-05-30 clarifier | reconciled into PRD | closed |
| 12 | Confession Room composition layer | shipped | per-waypoint props + ambient motion in code (`src/art/pixelPalette/confessionRoomProps.js`, `src/scene/ambientMounts.js`) |
| 13–17 | Stage 2–6 stubs | `status: post-mvp` | apothecary / magistrate / mill / surgeon / schoolmaster. Do NOT dispatch in MVP. |
| 18 | Evidence collection has no on-screen feedback | **shipped** | `src/ui/CollectionFeedback.js` + `EvidenceCounter` mounted via `setupHud.js`; fires from `actionHandlers.js:65` on collect. Tonal verification still owed at next playtest. |
| 19 | Ghost replays read as souls (tonal drift) | **shipped** | 4 distinct per-haunt gestural ghost poses in `src/art/placeholders/evidence/ghosts/` (poison / sermon / extort / bury) — each depicts the priest mid-crime. |
| 20 | Stage + victim narrative framing missing | **shipped** | `src/ui/StageTitleCard.js` — stage title + victim name + crime blurb on entry, then docks top-right. Reads from `stageData.displayName` + `stageData.victim.{displayName, crimeBlurb}`. |
| 21 | Chapel storytelling + dynamic motion | **shipped** | per-waypoint props (altar / lectern / booth / sacristy), `AmbientMotion` base + `CandleFlame` + `DustMotes` + `SmokeWisp`, NPC bustle + chatter via `chapelBustle.js` + `ChatterSystem.js`. |
| 22 | Hybrid map redesign (Happy Hills depth) | **partial: #22a shipped + expanded to 3-room JSON under walled-rooms pivot; #22b/c/d/e not started** | #22a — JSON schema (`meta.tile`/`rooms[]`/`links[]`) + multi-leg Victim walker through door tile — shipped. **2026-05-30 PM expansion**: `rooms[]` extended to 3 entries (nave / booth / sacristy) and `links[]` rewired to the two visible partition arches at tile [40,32] (x=640) and [58,32] (x=928) under the walled-rooms pivot. Matches the puzzleDoors[] x-values. #22b vision cone, #22c hide/crouch/sprint, #22d candle snuffing, #22e crypt room — all not started. |
| 23 | Zoom-in puzzle rooms for clue-hidden evidence | **partial: #23a reverted; #23b + #23c shipped 2026-05-30 PM; #23d not started** | Walled-rooms pivot superseded the zoom-camera approach. **#23a reverted** (commit `5db4325` deletes `CameraController.js` + the `camera` Container layer). **#23b shipped** (commit `7ce3fdd`): `src/puzzles/PuzzleScene.js` drag-to-slot + `src/engine/MouseManager.js` + `src/stages/puzzles/{booth,sacristy}.json` + 17 unit tests in `tests/PuzzleScene.test.js`. **#23c shipped same commit**: solve → `setVisible(true)` on the bound evidence + CollectionFeedback bubble + `gameState.puzzlesSolved` persistence. Re-entering solved door is a no-op. **#23d not started** — Day-phase NPC detection during puzzle was moot under the zoom model; under walled-rooms it's a separate decision (still viable as a NPC-driven hostility beat) deferred to a future session. |
| 24 | Walled-rooms pivot (chapel = 3 walled rooms) | **shipped** | 2026-05-30 PM, supersedes #23a's zoom approach. Two stone partition walls with arched doorways at x=640 + x=920 split the chapel into nave / booth / sacristy. Pews moved out of door openings (x=384 + x=1072 under sun shafts); floor shrines dropped; pew float bug fixed. Plus follow-up VP audit fixes (commit `374c840`): NPC spawn collisions corrected, pillar list trimmed, internal arches given gothic crests + warm halos, FLOOR_STRIP_H aligned 100→96 to the pixel-art band, 3-room JSON schema. |
| 25 | Prod JSON load (Vite static imports) | **shipped** | Production build was 404'ing on `loadStage(url)` + puzzle `fetch(puzzleFile)` because both paths were Vite-dev-only. StageLoader fell back to a null-victim stub → `Cannot read properties of null (reading 'routine')` → page rendered chapel art but nothing interactive. Fix: `normalizeStage(rawJson)` bypass + static JSON imports + `PUZZLE_CONFIGS` lookup. Commits `ccdc231` (load fix) + `d819c73` (leading-slash tolerance). |

---

## 14. Resolved Design Questions

Locked decisions, in chronological order. Each supplements the design above; nothing later in this list is reverted.

### 14.1 Round 1 — Grill, 2026-05-29

1. **Spatial trigger model — victim-anchored.** "Correct waypoint" is whichever waypoint Aldric is currently at. Reaper position is irrelevant for haunt evaluation.
2. **Walk-state — next-waypoint-sticky.** The instant Aldric leaves a waypoint, the *next* waypoint becomes his "current". Rewards prediction.
3. **Reaper in Phase 2 — free-roam + Sight aura.** Reaper walks freely; position has no mechanical effect on haunt evaluation. Sight remains available and reveals Aldric's FSM state via colored aura + a cooldown-readout ring on each haunt-source object.
   - **Superseded 2026-05-30 PM** by the sight-aura risk model (the aura now also reveals the Reaper to Aldric). See §6.8.
4. **Phase 2 entry — Altar spawn, full 3 s dwell, 1 s grace.** Aldric always spawns at the Altar with a full 3 s dwell ahead of him. A 1 s grace window after TAB during which Aldric is stationary; then his routine begins. `secondsToMax` still starts on first haunt trigger, not on TAB.
5. **Personality bias else-branch — haunt's primary tendency.** No `fallback` field in stage JSON.
   - **Superseded** by the dual-bucket model in 14.2#4.

### 14.2 Round 2 — Clarifier, 2026-05-30 AM

1. **Evidence gate.** Phase 2 unlocks only when **all 4 evidence** are collected.
2. **Setting reframe — hybrid / timeless.** Medieval-gothic stays the default visual register. Modern signifiers permitted where they read well in-fiction (e.g., "cops" as the entity on CALLING_FOR_HELP completion for non-Aldric victims).
3. **Victim FSM grows from 4 to 7 states.** New: `PRAYING`, `RITUAL`, `HIDING`. Retained: `NEUTRAL`, `AGGRESSIVE`, `FLEEING`, `CALLING_FOR_HELP`.
4. **Fear-bucket selection (replaces single `primaryReactionTendency`).** Bucket pick + tendency lookup + bias override — see §6.6.
5. **RITUAL — Aldric's signature.** `wrongWaypointReactsAs: "RITUAL"`, `probability: 0.6`. 8000 ms → `STAGE_FAIL (Soul Saved)`. CALLING_FOR_HELP becomes unreachable for Aldric (reserved for post-MVP victims).
6. **PRAYING.** Low-bucket lookup. Sight budget drains 3× while active. Auto-ends at 6 s → NEUTRAL. Any haunt interrupts.
7. **HIDING.** High-bucket lookup. Victim ducks at nearest waypoint. FEAR ticks +1/s. Reaper within 80 px with Sight ON → transitions to FLEEING. No auto-timeout.
8. **Interrupt routing simplified.** Any haunt fired during any non-NEUTRAL reaction is a clean interrupt → NEUTRAL (no FEAR delta). Replaces the haunt-specific interrupt routes from the original PRD.
9. **Stage JSON additions.** `haunts` block (per-haunt `correctWaypointId` + `lowFearTendency` + `highFearTendency`), `fearBucketThreshold`, `victim.personality.bias.wrongWaypointReactsAs: "RITUAL"`. `fallback` remains absent.

### 14.3 Round 3 — Codebase-Summary Grill, 2026-05-30 PM

1. **Loop model.** Investigation = Day; Haunt = Night. Same 2-phase FSM, re-themed. No new FSM states. Stealth / detection / candle puzzle live **inside HAUNT** as slice-4+ work, not as separate phases.
2. **Reaper vs. Pilgrim.** Two glossary terms, one `Player` entity. Pilgrim = Day disguise; Reaper = Night true form. Cloak-shed at HAUNT.enter.
3. **Aldric Night model.** HAUNT opens with a scripted cinematic intro (close-up of Aldric praying / preparing for bed). After the cinematic, the routine walker + 7-state FSM engage for steady state. Both models coexist: cinematic = intro, PRD model = steady state.
4. **Stealth = sight-aura risk.** Reaper Sight ON ⇒ visible to Aldric within radius `R` (omnidirectional, no vision cones). Sight OFF ⇒ invisible. Reuses existing `SightFSM`. Inverts the 14.1#3 "Sight reveals Aldric to player" — the aura is now bidirectional.
5. **Candle puzzle = extinguish-to-hide.** Extinguishing chapel candles shrinks `R`. Existing `CandleShrine` decor becomes interactable. Tactical resource for the stealth model.

### 14.4 Scope Reversion — 2026-05-30 PM

The morning's six-stage scope expansion was **reverted** the same afternoon after the combined slice-1 + slice-2 playtest surfaced narrative-framing gaps (tickets #18, #19, #20). **MVP ships stage 1 only.** Stages 2–6 are post-MVP roadmap. Polish-first: land #18, #19, #20 + finish slices 3 / 4 / 5, then MVP ship candidate. See `project-scope-reversion-2026-05-30` memory.

---

## 15. Testing Approach

### 15.1 Definition of a Good Test

A good test exercises the externally observable behavior of a pure or near-pure module — same inputs always produce same outputs, assertion is on the output, not on which internal helper was called. Tests are headless (no Pixi `Application`, no DOM, no Howler) and run under Vitest. They live next to the module they test (`<module>.test.js`).

Tests must not mock the formula they exercise — use the real `applyFearGain` chokepoint and the real `confession-room.json` stage data where possible.

### 15.2 Modules Under Test

1. **`scoreRun(events) → { score, breakdown, stars }`** — 3★/2★/1★/0★ floors, speed clamp at 0 when `secondsToMax ≥ 90`, efficiency clamp at 0 when `hauntsUsed ≥ 4`, mistake penalty stacking, "fearMaxed but no hauntFired" edge case.
2. **`computeHauntFearDelta({ haunt, waypoint, recentHaunts, victimState, traits, now })`** — correct vs. wrong waypoint deltas, same-haunt cooldown boundary at exactly 15000 ms, non-NEUTRAL victim returns 0, `fearGainMultiplier` scaling.
3. **`VictimFSM`** — every (haunt × waypoint) combo in NEUTRAL produces the documented next state under bucket + bias rules, clean interrupts to NEUTRAL on non-NEUTRAL haunts, RITUAL 8000 ms → SOUL_SAVED, FLEEING 6000 ms → SOUL_ESCAPED, CALLING_FOR_HELP 8000 ms → HELP_ARRIVED, HIDING +1/s drift + Reaper-proximity exit, PRAYING 3× sight drain + auto-end, AGGRESSIVE smash predicate + permanent slot disable. Seeded RNG for deterministic bias rolls.
4. **`saveMigrate(rawJson) → CurrentSave`** — null / undefined / missing version / v1 passthrough / unknown fields / corrupted JSON / future v2 input.

### 15.3 Modules Verified by Playtest Only

Pixi entity classes (`Player`, `Victim`, `EvidenceItem`, `GhostReplay`, `AmbientNPC`); all UI containers; `Stage` composition; `InputManager` (DOM-coupled); `AudioManager` (Howler-coupled); `GameLoop` (Pixi-coupled); `SightFX` filter wiring. The pure budget math inside `SightBudget` is exercised indirectly via the other tests.

### 15.4 Smoke Boot

`tests/smokeBoot.test.js` imports every module under `src/` (minus `main.js`) and asserts no module throws on evaluation. Catches broken imports, missing exports, renamed files with stale call sites, and circular deps. Required per-commit gate in `REFACTOR.md`.

### 15.5 Playtest Gate

Per `feedback-playtest-gates` memory: a green Vitest report does **not** authorize the next slice. The per-phase play-test in the dev server does. Open `npm run dev` → walk the happy-path checklist in `REFACTOR.md` → only then dispatch the next slice. See `docs/agents/roles.md` §"#8 QA Engineer" for the role that owns the gate.

---

## 16. Team & Dispatch

### 16.1 Roles

Eight roles (one Team Lead persona + seven execution roles). Source of truth: `docs/agents/roles.md`. Persona spec for the Team Lead: `docs/agents/team-lead.md`.

| # | Role | Owns |
|---|------|------|
| 0 | Team Lead | Project-wide tonal + architectural arbitration. Slice handoffs alongside playtest. Defends the *quiet dispassionate horror* line. |
| 1 | Foundation Engineer | `main.js` boot, `GameLoop`, `StateMachine`, `InputManager`, fit/letterbox, FPS overlay, save store + migrator wiring (slice 5), `AudioManager` (slice 5), trait plumbing. |
| 2 | Investigation Engineer | `SightFSM` + `SightBudget` + `SightFX`, `EvidenceItem`, `GhostReplay`, TAB phase-advance gate, `StageLoader`. |
| 3 | Haunt AI Engineer | `Victim` routine walker, `VictimFSM`, reaction selection, AGGRESSIVE smash, all four fail conditions, stealth-aura risk wiring, candle puzzle. |
| 4 | UI/HUD Engineer | `RadialHauntMenu`, `FearBar`, `SightMeter`, `EndScreen`, `PauseOverlay`, `MenuScene`, `DesktopOnlySplash`. |
| 5 | Stage + Art Lead | Stage JSON authoring, placeholder + pixel-art style guides, primitive sprites, palette + scale ratios. Placeholder-first per `grim-griper-constraints`. |
| 6 | Math & Test Author | `fearMath` chokepoint, `scoreRun`, `saveMigrate`, full Vitest suite against real `confession-room.json`. |
| 7 | Visual Polish Lead | Per-slice screenshot pass. Runs after role-author handoff, before user playtest. Inlines layout / anchor / silhouette / timing adjustments or files `NN-vp-adjustments.md`. |
| 8 | QA Engineer | Bug discovery across the running build. Files defects against owning roles; does not fix. Owns the play-test gate per the 2026-05-26 override. |

### 16.2 Coordination

**File-based only.** Tickets at `.scratch/grim-griper-puzzle-mvp/issues/NN-<slug>.md` carry `Status:`, `Owner:`, and a `## How to play-test` section the role appends before handoff. No cross-session `SendMessage`. (See `project-file-based-workflow` memory.)

Each role appends a `## How to play-test` section to its ticket before handoff: dev-server URL/command, the golden path the user should walk, edge cases to poke at, anything still placeholder. Defects the user finds get filed as new tickets with `Status: needs-triage` and do not block the gate from closing unless the user says so.

### 16.3 Dispatch Order

Sequential by slice (the playtest gate sits between each):

```
Slice 1: #1 Foundation + #5 Stage+Art (minimal)            → #7 VP pass → user playtest
Slice 2: #2 Investigation + #5 (expanded) + #6 (math)      → #7 VP pass → user playtest
Slice 3: #3 Haunt AI (routine + SHATTER) + #4 UI/HUD       → #7 VP pass → user playtest
Slice 4: #3 (full FSM + Night mechanics) + #6 (VictimFSM)  → #7 VP pass → user playtest
Slice 5: #4 (shell) + #1 (save + audio + traits) + #6     → #7 VP pass → user playtest
```

Within a slice, parallel role work is fine. The 2026-05-26 override placed the gate ownership with #8 QA Engineer.

### 16.4 Code Discipline (from `feedback-clean-code-and-refactor-rules`)

Before any code change, reuse existing abstractions:

- `src/engine/StateMachine.js` — shared FSM
- `src/art/motion/AmbientMotion.js` — ambient motion base
- View-factory pattern — entities take a `viewFactory` for runtime art-register swaps
- `applyFearGain` chokepoint — all fear additions
- `src/render/TileRenderer.js` — render mode + swap callback
- `src/engine/InputManager.js` — semantic actions

Follow `REFACTOR.md` discipline: per-commit `npm run test:run` gate, per-phase browser playtest, tiny sequential commits. The recent art-layer split (commits `b2e4136`, `6625f40`, `e84340a`, `56b898d`, `6bf5820` — phases G→K) is the model.

---

## 17. Out of Scope (MVP)

- Stages 2–6 (Apothecary / Magistrate / Mill / Surgeon / Schoolmaster). Authoring is post-MVP; sketches under `docs/narrative/post-mvp/`.
- Debt-payment meta-loop UI (submitting souls, trait-degradation animations, run summaries across stages). The data shape is built; the UI is the next build.
- Touch / mobile controls. UA-blocked with a splash.
- Save sync across devices. localStorage only.
- Configurable key bindings UI. Action layer exists; settings UI does not.
- Procedural ghost replays recorded from a hidden victim simulation. Ghosts are static sprites only.
- Final art, character animations, sound design. Placeholder Graphics + pixel-palette + placeholder SFX only.
- Localization. English strings inlined.
- Analytics, telemetry, error reporting.
- Anti-tampering on save (intentionally inspect-and-edit-friendly).
- Story arc connecting the six victims.
- Reaper backstory.
- Stage-unlock progression / hub UI.

---

## 18. References

- **`CONTEXT.md`** at repo root — glossary of project terms. Read first if new.
- **`REFACTOR.md`** at repo root — per-commit + per-phase safety gates.
- **`happyhills_level_map_spec.md`** at repo root — structural reference for stage / map authoring (rooms, links, objects, NPC vision/hearing, light, noise, puzzle gate, JSON shape). Treat the schema as canon; the surface fiction (suburban house, breaker panel, TV) does not transplant — Grim Griper's canon lives in `docs/narrative/confession-room.md`.
- **`docs/narrative/confession-room.md`** — narrative source of truth for stage 1.
- **`docs/narrative/README.md`** — stage roster.
- **`docs/narrative/post-mvp/*.md`** — sketches for stages 2–6.
- **`docs/art/style-guide.md`** — palette, shape grammar, scale ratios.
- **`docs/art/scene-composition-spec.md`** — Part A universal, Parts B per stage, Part C Confession Room composition plan.
- **`docs/art/references/confession-room.md`** — art reference doc (Happy Hills URLs, chapel-interior tileset shortlist, tonal companions, Reaper silhouettes).
- **`docs/agents/roles.md`** — role roster + dispatch protocol.
- **`docs/agents/team-lead.md`** — Team Lead persona spec.
- **Memory** at `~/.claude/projects/-Users-khangnguyen-Documents-Grip-Griper-game-grim-griper/memory/MEMORY.md` — the project's auto-memory index. Load on session boot for full design history.
- **The `/game-developer` skill** in `.agents/skills/game-developer/` — Unity/C# vernacular; patterns (state machine class, dt-driven update, data files over hardcoded values, object pooling) ported one-for-one to JS. ECS intentionally not adopted (entity count doesn't justify the abstraction; see ADR candidate #10).

---

## 19. Open Engineering Questions

Surfaced during the 2026-05-30 PM grill; deferred to slice-4 implementation + play-test tuning:

1. **`SMASH_RANGE_PX`** for AGGRESSIVE smash — placeholder 80 px. Tune at the slice-4 play-test.
2. **Awareness radius `R`** — default value + per-candle shrink delta + minimum floor. Tune at the slice-4 play-test.
3. **Sight-aura detection consequence** — concrete bucket + bias inputs when Aldric detects a Sight-on Reaper. Currently nominated as "trigger a wrong-waypoint-style reaction roll"; finalize at slice 4.
4. **Candle interaction binding** — is extinguishing a candle a new `INTERACT` (E) at proximity, or a haunt-source side effect (e.g. WHISPER near a shrine snuffs it)? Decide at slice 4 dispatch with #3 Haunt AI.
5. **Cinematic intro duration + skip** — non-skippable for tonal weight, or skippable on input for replays? Default: non-skippable until VP review at slice-4 gate.
6. **CALLING_FOR_HELP** for Aldric — confirmed unreachable per the bias + bucket tables. Tests should assert this. Master Ode (post-MVP schoolmaster stage) is the reference victim where this state matters.
7. **Painterly path retirement** — `src/art/placeholders/**` is the legacy A/B register. Schedule retirement post-MVP (an ADR may be worth filing alongside the cleanup PR to document the rationale).

These are explicitly **not** blockers for slice-4 dispatch — they are decisions to make alongside the implementation, captured here so the slice-4 role doesn't re-invent them.
