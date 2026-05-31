---
title: The Confession Room — Narrative
stage: confession-room
status: locked-2026-05-29
---

# The Confession Room

The first (and only MVP) stage. Source of narrative truth for slices 2–5. Engineering reads `docs/PRD.md`; this file is for art, ghost replays, evidence visual design, and any future voice/audio direction.

## Tone & era

**Medieval gothic. Plague era.** Stone chapel. Candle-lit. The world outside is dying. The chapel is one of the few places the sick come for comfort. Aldric exploits exactly that.

## Father Aldric

A priest who turned the chapel into a four-stage racket against his own dying parishioners. He is not visibly monstrous — he is *competent, ceremonial, used to being trusted*. He still genuinely believes himself to be the soul of the parish. The horror is the contrast.

His personality bias (60% → `RITUAL` on a wrong-waypoint haunt — *re-locked 2026-05-30, was `CALLING_FOR_HELP`*) reads from this: a corrupt priest's first instinct under threat is **to perform a cleansing rite over his own sins** — to wash the chalice, re-consecrate the sacrament, restore the appearance of holiness before the consequence catches him. If the ritual completes uninterrupted, the soul is exorcised from the Reaper's reach (`STAGE_FAIL: Soul Saved`).

## The Reaper

**Neutral debt collector.** Not vengeance, not pity. Aldric's soul is owed and the Reaper has come to collect. The Reaper does not gloat, taunt, or narrate. The four ghosts are silent re-enactments. The haunts are the consequence the universe has waiting.

This tone keeps the door open for the future **debt-payment meta-loop** (PRD §"Future meta-layer hooks"): submitting souls degrades the Reaper's powers over time. A vengeful Reaper would not fit that arc; a debt-collector who *progressively weakens with each soul he submits* does.

## The Racket — four stages, one per evidence

Each evidence anchors one stage of the scheme, lives at one waypoint, and unlocks the haunt that thematically returns Aldric's own act onto him.

### 1. Lure — Lectern → unlocks WHISPER

**Object:** A leather-bound sermon book on the lectern. Inside, marginal notes mark wealthy parishioners and which are sick.

**Ghost (Reaper Sight reveals):** Aldric mid-sermon, eyes lingering on the bedridden in the pews. A faint script visible scrolling along his sleeve — the notes he's mentally compiling.

**Why WHISPER:** He used his preaching voice as a lure. When the haunt fires at the Lectern, *the parishioners' whispered accusations* return — they were watching too. The whispers are what he tried not to hear.

**Wrong-waypoint tendency (dual-bucket, re-locked 2026-05-30):** low fear → `AGGRESSIVE` (he loses composure and lashes at the imagined accusers); high fear → `HIDING` (he ducks behind the lectern, trying to make the whispers stop hearing *him*).

### 2. Poison — Altar → unlocks SHATTER

**Object:** The sacramental chalice on the Altar. A faint residue clings inside the cup.

**Ghost:** Aldric, alone behind the Altar before service, tipping a small vial into the wine. The ghost overlay shows his hand pour, then place the chalice as if nothing happened.

**Why SHATTER:** The sacred vessel he corrupted. The haunt shatters the chalice on its pedestal — breaking the lie he's been pouring out of it for years.

**Wrong-waypoint tendency (dual-bucket, re-locked 2026-05-30):** low fear → `PRAYING` (he kneels and tries to re-consecrate over the damage, sacramental reflex); high fear → `FLEEING` (the broken chalice is the moment his crime is publicly visible; flight reflex).

### 3. Extort — Confession Booth → unlocks VOICE

**Object:** A confession ledger tucked into the priest's side of the booth. Pages of dying confessions transcribed in Aldric's hand, with margin notes pricing each one — *what to charge each family for forged absolutions*.

**Ghost:** A dying parishioner's hand pressed against the lattice from the penitent's side. Aldric writing fast. The dying voice is silent but the hand trembles.

**Why VOICE:** He stole confessional voices for profit. The haunt makes those voices speak *through the lattice at him* — he hears every one he sold.

**Wrong-waypoint tendency (dual-bucket, re-locked 2026-05-30):** low fear → `PRAYING` (he begs the saints to silence the voices); high fear → `HIDING` (he ducks into the booth itself — the one place the voices originate, the place he tries to disappear). Aldric's old `CALLING_FOR_HELP` flavor is migrated to the `RITUAL` bias-override; CALLING_FOR_HELP is no longer reachable for him.

### 4. Bury — Sacristy → unlocks RISE

**Object:** A lime-stained spade leaned in the sacristy corner. A priest's habit beside it, hem white with quicklime dust.

**Ghost:** Aldric dragging a shrouded body across the sacristy floor. Scattering quicklime. The floor flags have been lifted and replaced poorly — visible as faint outlines under Reaper Sight.

**Why RISE:** The bodies he buried under the sacristy floor *rise* where he put them. The haunt is the physical return of what he tried to dispose of.

**Wrong-waypoint tendency (dual-bucket, re-locked 2026-05-30):** low fear → `AGGRESSIVE` (he swings the spade at the rising shapes — gravedigger's reflex, the tool already in his hand); high fear → `FLEEING` (corpses rise; he runs for the doors).

## Visual direction notes for slice 2+

- The 4 ghost replays should be **silent, slow, dispassionate**. No screams. No blood. The horror is the routine — *this is just Tuesday for Aldric*.
- Lighting (texture upgrade pass per [`docs/art/style-guide.md`](../art/style-guide.md) §"Aesthetic touchstone — Happy Hills Homicide"): single candle at each waypoint. Ghost overlays back-lit so they read as *memory*, not as the present moment.
- Evidence object color: muted gold residue (`EVIDENCE_FILL` token), `EVIDENCE_GLOW` outline only under Reaper Sight.
- Quicklime dust on the Sacristy floor in the ghost replay should be the same warm cream as Aldric's robe (`ALDRIC_BODY`), so the player subliminally connects *him* to the dust.

## Mechanical anchors (PRD-locked, repeated here for narrative readers)

- 4 evidence pieces, 1:1 mapping to 4 haunts.
- Correct-waypoint mapping: SHATTER→Altar, VOICE→ConfessionBooth, WHISPER→Lectern, RISE→Sacristy.
- Aldric routine in Phase 2: Altar → Lectern → Booth → Sacristy → Altar (3s dwell, 2s walk).
- 1s grace + 3s dwell at Altar after TAB before routine begins.
- Aldric personality bias: `wrongWaypointReactsAs: "RITUAL"`, `probability: 0.6`. Bias rolls **after** the fear-bucket lookup and **overrides** the bucket default on hit. *(Re-locked 2026-05-30 — see PRD §"Resolved Design Questions (clarifier round, 2026-05-30)" for the full routing.)*
- Phase 2 unlocks only when **all 4 evidence** are collected. *(Re-locked 2026-05-30, was "≥1".)*
- Victim FSM: `NEUTRAL`, `AGGRESSIVE`, `PRAYING`, `CALLING_FOR_HELP`, `RITUAL`, `FLEEING`, `HIDING`. PRAYING drains Sight 3× and auto-ends at 6s; HIDING ticks FEAR +1/s and exits to FLEEING when the Reaper passes within 80px under Sight; RITUAL completes at 8s → `STAGE_FAIL (Soul Saved)`.

## Out of scope (narrative side)

- Backstory for who the 4 specific dying parishioners *were*. They exist as anonymous victims; the player feels the pattern, not the biography. Future stages may name individual victims when the design wants that.
- Aldric's prior life or how he became corrupt. Not in MVP.
- Whether the diocese knows. Implied no. Out of scope.
- Voice acting / written dialogue. The MVP is silent except for diegetic SFX.
