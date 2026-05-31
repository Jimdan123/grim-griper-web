---
title: Apothecary's Loft — Sketch
stage: apothecary
status: post-mvp-sketch
---

# Apothecary's Loft

## Setting

A timber-framed shop crammed under a steep roof. Drying herbs hang from beams. Jars line every shelf — most labeled in Bryn's hand, a few deliberately mislabeled. A trapdoor in the floor leads to a cellar where she keeps the bodies she pretends she "couldn't save".

Plague-era. The town is desperate for cures. Bryn sells them confidence — most of which kills.

## Victim — Mistress Bryn

A lone operator. Mid-forties, careful, soft-spoken. No clergy backing, no guild — she runs the only apothecary in town and the town needs her. When threatened, she **flees**: her instinct is to vanish into the cellar trapdoor or the back alley. She has no institution to call.

**Personality bias:** `wrongWaypointReactsAs: "FLEEING"`, `probability: 0.7`. Else → haunt's primary tendency.

## Waypoints (4)

| Waypoint | Kind | Role |
|---|---|---|
| Counter | `Counter` | Front of shop — where she sells |
| Hearth | `Hearth` | Where she boils tinctures |
| Shelf | `Shelf` | Wall of jars, labeled in her hand |
| Trapdoor | `Trapdoor` | Cellar entrance — where bodies go |

**Doors:** front shop door (FLEEING escapes here).

## Haunt → waypoint mapping

| Haunt | Correct waypoint | Why |
|---|---|---|
| SHATTER | Hearth | The boiling pot shatters — her "cures" exposed mid-batch |
| VOICE | Counter | Customers' last words speak from across the counter |
| WHISPER | Shelf | The jars whisper their *real* contents |
| RISE | Trapdoor | The dead in the cellar rise through the trapdoor |

## Evidence (4)

| # | Object | Waypoint | Ghost replay | Unlocks |
|---|---|---|---|---|
| 1 | Mislabeled jar (foxglove sold as feverfew) | Shelf | Bryn calmly swapping a label on a jar | WHISPER |
| 2 | Stained mortar with bone fragments | Hearth | Bryn grinding ribs into a "tonic" | SHATTER |
| 3 | Coin pouch + a child's milk tooth | Counter | Mother handing over coins for a poison "cure" for her dying child | VOICE |
| 4 | Lime-stained ladder rung at trapdoor | Trapdoor | Bryn dragging a sheet-wrapped body down into the cellar | RISE |

## Tone

Domestic horror. Bryn's space looks competent, even welcoming. The horror is the deliberate intimacy of her cruelty — she remembered every customer's name, then killed them.

## Visual hooks

- Shelf wall = primary readability anchor; jar grid is the first thing the player sees.
- The trapdoor is **flush with the floor**, visible only as a square seam, until the ghost replay shows it open.
- Lighting (upgrade): single hearth-flame key-light, warm. The trapdoor is the only cold pool in the room.
