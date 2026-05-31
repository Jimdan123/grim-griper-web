---
title: Schoolmaster's Loft — Sketch
stage: schoolmaster
status: post-mvp-sketch
---

# Schoolmaster's Loft

## Setting

A narrow stone loft above the cathedral nave, reached by a steep wooden stair. A schoolmaster's desk at one end, a single high window at the other, a row of choir benches along the side, and a stone niche in the wall — partially bricked over. Cane resting against the desk. Hymnbooks stacked in piles too neat to be casual.

Master Ode teaches the cathedral choirboys. The cathedral chapter knows he's harsh; they do not know he kills. When a boy disappears — and several have — Ode reports him as "run away" to the orphans' magistrate, and the magistrate signs the paperwork without checking. The bodies are bricked into the loft wall.

## Victim — Master Ode, Cathedral Schoolmaster

Tall, gaunt, sixties, lifelong cleric. Believes himself respectable. When threatened, he **calls for help** — not because he's frightened, because *he expects the institution to protect him as it always has.* The Church is his armor. He does not flee, he does not fight; he summons.

**Personality bias:** `wrongWaypointReactsAs: "CALLING_FOR_HELP"`, `probability: 0.7`. Else → haunt's primary tendency.

This bias overlaps with Aldric's (priest). Intentional — both are institutional men whose default is to summon backup. Aldric reads as panic-stricken; Ode reads as *entitled*. The personality bias % is the same shape; the *delivery* in the placeholder art (animation, posture later) is what distinguishes them. For now, same mechanical fingerprint.

## Waypoints (4)

| Waypoint | Kind | Role |
|---|---|---|
| Desk | `Desk` | Where he teaches and "records" boys |
| Choir | `Choir` | Bench row where boys sat |
| Niche | `Niche` | The bricked wall recess (where bodies are) |
| Window | `Window` | High window, only escape light |

**Doors:** stair-head at the desk end (FLEEING escapes here, down the stair).

## Haunt → waypoint mapping

| Haunt | Correct waypoint | Why |
|---|---|---|
| SHATTER | Desk | His ledger of "runaways" shatters with the desk — his cover broken |
| VOICE | Choir | The choir benches sing the voices of the missing boys |
| WHISPER | Window | Through the high window, the cathedral congregation whispers his name |
| RISE | Niche | The bricked wall opens and the bodies rise from the niche |

## Evidence (4)

| # | Object | Waypoint | Ghost replay | Unlocks |
|---|---|---|---|---|
| 1 | The cane, polished to a sheen | Desk | Ode striking a boy across the face mid-lesson | SHATTER |
| 2 | A "runaway" register with four names crossed off | Choir | Ode marking a boy absent during a choir rehearsal, while the others avoid his eye | VOICE |
| 3 | A small embroidered handkerchief, child-sized | Window | A boy at the high window, looking out, while Ode approaches from behind | WHISPER |
| 4 | A trowel + fresh mortar dust at the niche | Niche | Ode at night, calmly bricking the niche shut by candle-light | RISE |

## Tone

Institutional horror. Ode is the worst kind of victim in the roster — he believes he is *owed* protection, and society has not contradicted him. The Reaper does not exist to give society's answer; he exists to give the universe's.

## Visual hooks

- The loft is **enclosed and low-ceilinged** — claustrophobic compared to the open chapel and tall hall. The player feels the space pressing.
- The bricked niche should be subtly inset in the wall, visible at all times, but only *meaningful* once the ghost replay shows what's inside.
- The window is the single bright pool; the rest of the loft is candle-shadow.
