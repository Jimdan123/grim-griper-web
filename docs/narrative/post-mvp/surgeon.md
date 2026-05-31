---
title: Surgeon's Tent — Sketch
stage: surgeon
status: post-mvp-sketch
---

# Surgeon's Tent

## Setting

A canvas field-surgeon's tent staked on a hillside above a recent battlefield. Inside: a stained operating board, a basin of darkened water, a rack of saws and probes, and stacked crates of armor and personal effects "removed for treatment." A flap at the back opens to a pile of corpses already stripped.

Plague-era conflict has the kingdom in a low-grade civil war. Brother Carrion ostensibly serves both sides. In practice he treats the wealthy and leaves the rest to bleed out — keeping their gear.

## Victim — Brother Carrion, Battlefield Surgeon

Late thirties, lean and weatherproof. Spent a decade on campaign; he is desensitized in a way the other victims are not. When threatened, he **attacks** — not because he's brave, because he's tired and he has a bone-saw. He will reach for the nearest tool and use it on whatever's in front of him.

**Personality bias:** `wrongWaypointReactsAs: "AGGRESSIVE"`, `probability: 0.7`. Else → haunt's primary tendency.

## Waypoints (4)

| Waypoint | Kind | Role |
|---|---|---|
| Board | `Board` | The operating table |
| Sawrack | `Sawrack` | Tools hung in order |
| Basin | `Basin` | Bloody water for "cleansing" |
| Loot | `Loot` | Crates of looted gear & effects |

**Doors:** tent flap at the back (FLEEING escapes here — out onto the corpse-field).

## Haunt → waypoint mapping

| Haunt | Correct waypoint | Why |
|---|---|---|
| SHATTER | Sawrack | The tools shatter — his instrument-kit broken |
| VOICE | Board | The men he left on the board speak from where they died |
| WHISPER | Loot | The looted gear whispers the names of the men it belonged to |
| RISE | Basin | The basin water rises and pours out faces |

## Evidence (4)

| # | Object | Waypoint | Ghost replay | Unlocks |
|---|---|---|---|---|
| 1 | A still-warm bone-saw, hung wrong | Sawrack | Carrion choosing a saw with deliberate care while a man bleeds beside him | SHATTER |
| 2 | A signet ring left on the board | Board | A wounded man begging on the board while Carrion stares past him at his pay | VOICE |
| 3 | A heap of gambesons sorted by quality | Loot | Carrion stripping a body in the dark, sorting gear into "sell" and "keep" piles | WHISPER |
| 4 | The basin, lid open, water dark | Basin | Carrion calmly washing his hands while a man dies behind him | RISE |

## Tone

Cold horror. The other victims hide what they do; Carrion does not. He sees himself as efficient. The Reaper investigates a man who would explain his crimes as practical.

## Visual hooks

- The tent walls are canvas; light bleeds through. **The canvas is the brightest surface in the scene.** Carrion is silhouetted against it.
- The pile of corpses outside the back flap is implied, not drawn — visible only in ghost replays.
- The bone-saw hangs in the wrong place on the rack until the player notices — small visual cue that something is off.
