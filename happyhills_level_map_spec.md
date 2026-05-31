# Level Map Spec — "Maple Street, 11:47 PM"
### An original ’80s-slasher stealth-puzzle level (in the style of *The Happyhills Homicide*)

This is a build-ready spec for a single self-contained level. Hand it to Claude Code as-is. It describes a **2D stealth-puzzle level**: the player (a masked prowler) must navigate a suburban house at night, avoid being seen or heard, solve one environmental puzzle to gate the objective, then reach the target undetected.

> **Tone note for implementation:** keep the "takedown" abstract — a brief stylized cutaway / fade, not graphic detail. All occupants are adults. The interesting part to build is the stealth + puzzle systems below.

---

## 1. Game framing

- **Genre:** Top-down-cutaway 2D stealth puzzle (single screen that scrolls; whole house visible as a dollhouse cross-section).
- **View:** Side-on cutaway of a 2-storey house + basement + attic. Camera follows the player; the whole house is one contiguous level.
- **Art:** Pixel art, ~16px tiles, muted ’80s palette, heavy shadow.
- **Loop:** Observe NPC patterns → move through shadow → cut the power (puzzle gate) → reach target → trigger scripted end. Detection or noise can fail the run.

---

## 2. Coordinate system

- **Tile size:** 16 × 16 px.
- **World size:** 64 tiles wide × 40 tiles tall → **1024 × 640 px**.
- All positions below are in **tile coordinates** `(col, row)`, origin top-left. Multiply by 16 for pixels.
- These are a **starting layout** — Claude Code can nudge them; just keep rooms non-overlapping and doors aligned.

---

## 3. The map (cross-section)

```
 rows 0–7     [ . . . . . . .  A T T I C  . . . . . . . ]      (hide: steamer_trunk)
            ┌──────────────┬────────┬───────────────────────┐
 rows 8–18  │  BATHROOM    │ HALL   │   MASTER BEDROOM       │
   FLOOR 2  │  (window_2f) │ [stair]│   target sleeps here   │
            │              │   ‖‖   │   hide: closet, bed     │
            ├──────────────┴───‖‖───┴───────────────────────┤
 rows 19–29 │ GARAGE   │   KITCHEN    │ LIVING RM  │  FOYER   │
   FLOOR 1  │ (tools)  │ [bsmt stair] │ TV, couch  │ FRONT    │
            │ side_door│     ‖‖       │ hide:couch │  DOOR    │
            └──────────┴─────‖‖───────┴────────────┴──────────┘
 rows 30–39          [ BOILER RM ]            [ STORAGE ]
   BASEMENT          breaker_panel
```

Connections (the only ways between floors):
- **Main staircase:** Hallway (F2) ↔ Foyer (F1)
- **Basement stairs:** Kitchen (F1) ↔ Boiler Room (basement)
- **Attic ladder:** Hallway (F2) ↔ Attic

---

## 4. Rooms (bounding boxes, in tiles)

| id | name | x | y | w | h | notes |
|----|------|---|---|---|---|-------|
| `attic` | Attic | 24 | 0 | 28 | 8 | dark by default; hiding spot |
| `bathroom` | Bathroom | 4 | 8 | 22 | 11 | has `window_2f` (alt entry) |
| `hall_2f` | Upstairs Hall | 26 | 8 | 8 | 11 | main stairs + attic ladder |
| `bedroom` | Master Bedroom | 34 | 8 | 30 | 11 | **target** sleeps/wakes here |
| `garage` | Garage | 4 | 19 | 13 | 11 | `side_door` (alt entry), tool pickup |
| `kitchen` | Kitchen | 17 | 19 | 17 | 11 | basement stairs |
| `living` | Living Room | 34 | 19 | 16 | 11 | TV, couch, light switch |
| `foyer` | Foyer | 50 | 19 | 14 | 11 | `front_door` (main entry) |
| `boiler` | Boiler Room | 17 | 30 | 17 | 10 | `breaker_panel` (the puzzle) |
| `storage` | Storage | 4 | 30 | 13 | 10 | spare hiding spot |

Treat each room's perimeter as **solid wall tiles** except where a door/stair opening is defined. Floors between levels are solid except at stair openings.

---

## 5. Tile legend

| char | tile | solid? |
|------|------|--------|
| `#` | wall / floor slab | yes |
| `.` | empty walkable | no |
| `D` | door (opens, blocks LOS when shut) | toggle |
| `S` | stair tile | no |
| `L` | ladder tile | no |
| `W` | window (alt entry, makes noise) | breakable |
| `o` | interactable object anchor | no |

---

## 6. Interactive objects

| id | type | room | tile (col,row) | effect |
|----|------|------|----------------|--------|
| `front_door` | entry | foyer | 56, 29 | main spawn/entry; locked from outside until lockpick (3s, makes small noise) |
| `side_door` | entry | garage | 4, 24 | alt entry, quieter |
| `window_2f` | entry | bathroom | 4, 12 | alt entry; **breaking it = loud noise** (alerts NPCs) |
| `switch_living` | light | living | 49, 20 | toggles `living` light |
| `switch_kitchen` | light | kitchen | 33, 20 | toggles `kitchen` light |
| `tv` | noise lure | living | 40, 24 | when on, emits noise radius 6 → draws patroller |
| `closet_bedroom` | hide | bedroom | 60, 16 | player hides; NPC loses track |
| `couch` | hide | living | 38, 26 | crouch-hide behind |
| `bed` | hide | bedroom | 45, 14 | hide under (only if target is OUT of room) |
| `steamer_trunk` | hide | attic | 36, 4 | hide |
| `tool_pickup` | item | garage | 8, 26 | the required "tool" for the takedown (kept abstract) |
| `breaker_panel` | puzzle | boiler | 25, 35 | **cuts all power** → kills lights + disables `phone` |
| `phone` | fail-trigger | bedroom | 36, 14 | if target reaches it while alerted → calls police → fail (unless power is cut) |

---

## 7. NPCs

### `target` — the occupant
- **Spawn:** `bedroom` at (50, 14), state `sleeping`.
- **States:** `sleeping` → (if woken by noise nearby, radius 4) → `awake_patrol` → (if sees player) → `fleeing` → tries to reach `phone`.
- **While `sleeping`:** no vision cone. Wakes on noise within radius 4, or if light in `bedroom` switches on.
- **While `awake_patrol`:** patrols waypoints `[bedroom(50,14) → hall_2f(30,14) → bedroom]`, vision cone range 7 tiles, 60° arc, facing = movement direction.
- **Goal once fleeing:** reach `phone`. If reached AND power is on → **fail**. If power is cut → phone dead, target keeps fleeing (timer-based fail instead, see §9).

### `patroller` — second occupant (spouse/roommate)
- **Spawn:** `living` at (42, 25), state `watching_tv`.
- **Patrol route (waypoints):** `living(42,25) → kitchen(25,24) → foyer(56,24) → living`. Pauses 3s at each.
- **Vision cone:** range 6 tiles, 75° arc.
- **Hearing:** investigates any noise within radius 8 — walks to the noise source, searches 4s, returns to route.
- **On spotting player:** detection meter spikes; if it fills, raises alarm (same fail as phone).

> Keep it to these two NPCs for v1. More can be added later.

---

## 8. Stealth mechanics

**Detection meter (0–100):**
- Fills while player is inside any NPC's vision cone, unobstructed, and **not hidden**.
- Fill rate scales with: distance (closer = faster), and **light** (player in a lit room fills ~2× faster than in a dark room).
- Decays slowly when out of all cones.
- At 100 → that NPC enters `fleeing`/`alarm` → fail sequence.

**Line of sight:**
- Raycast from NPC eye tile to player tile. **Walls and shut doors block** the ray.
- Cone = facing direction ± half the arc, out to range.

**Light:**
- Each room has `lit: true/false`. Switches toggle per-room. `breaker_panel` forces all rooms to `lit: false`.
- Dark room = slower detection + player nearly invisible beyond 3 tiles.

**Noise:**
- Actions emit a noise event with a radius: walking = 2, running = 5, breaking `window_2f` = 12, `tv` on = 6, lockpicking `front_door` = 3.
- Any NPC within the radius switches to `investigate` and moves toward the source.

**Player states:** `idle`, `walk`, `run` (fast + loud), `crouch` (slow + quiet + smaller profile), `hide` (in a hiding object → invisible), `interact`.

---

## 9. Objective & puzzle flow

1. **Enter** via `front_door` (lockpick), `side_door`, or `window_2f` (loud).
2. *(Optional but recommended)* grab `tool_pickup` in the garage.
3. **Solve the gate:** reach `breaker_panel` in the basement and cut the power. This:
   - turns off all lights (easier stealth), and
   - **disables `phone`** so the target can't call for help.
4. **Reach the target** in the bedroom undetected and trigger the scripted takedown (abstract cutaway).

**Win:** takedown triggered while detection never maxed.

**Lose conditions:**
- Detection meter hits 100 and an NPC reaches the `phone` (power on) → police called.
- **OR** if power is cut, alerting an NPC instead starts a 45-second "escape" timer — if the target reaches the `front_door` or `side_door` and exits, you fail.
- Player caught directly (NPC moves onto player's tile while alerted).

---

## 10. Suggested map data structure

Give Claude Code this shape so the level is data-driven and easy to extend:

```json
{
  "meta": { "id": "maple_street", "tile": 16, "width": 64, "height": 40 },
  "rooms": [
    { "id": "bedroom", "x": 34, "y": 8, "w": 30, "h": 11, "lit": false },
    { "id": "living",  "x": 34, "y": 19, "w": 16, "h": 11, "lit": true },
    { "id": "kitchen", "x": 17, "y": 19, "w": 17, "h": 11, "lit": true }
    /* ...the rest from the table in §4... */
  ],
  "links": [
    { "type": "stair",  "a": [30,18], "b": [56,19], "label": "main_stairs" },
    { "type": "stair",  "a": [25,29], "b": [25,30], "label": "basement_stairs" },
    { "type": "ladder", "a": [30,8],  "b": [38,7],  "label": "attic_ladder" }
  ],
  "objects": [
    { "id": "breaker_panel", "type": "puzzle", "tile": [25,35],
      "onUse": { "setAllRoomsLit": false, "disable": ["phone"] } },
    { "id": "tv", "type": "noise", "tile": [40,24], "noiseRadius": 6 },
    { "id": "closet_bedroom", "type": "hide", "tile": [60,16] }
    /* ...the rest from §6... */
  ],
  "npcs": [
    { "id": "target", "spawn": [50,14], "state": "sleeping",
      "wakeNoiseRadius": 4, "vision": { "range": 7, "arc": 60 },
      "waypoints": [[50,14],[30,14]], "fleeGoal": "phone" },
    { "id": "patroller", "spawn": [42,25], "state": "watching_tv",
      "vision": { "range": 6, "arc": 75 }, "hearingRadius": 8,
      "waypoints": [[42,25],[25,24],[56,24]] }
  ],
  "objective": {
    "gate": "breaker_panel",
    "goal": "reach_target",
    "win": "takedown_undetected",
    "fail": ["phone_call", "escape_timer_45s", "caught"]
  }
}
```

---

## 11. Suggested tech stack + build order

**Recommended: Phaser 3 (web / JavaScript).** Easy for Claude Code to scaffold, runs in a browser, great 2D/tilemap support.
*Lighter option:* plain HTML5 Canvas + JS (no deps). *Engine option:* Godot 4 (GDScript) if you want a desktop build later.

Suggested build order for Claude Code:
1. Scaffold project + game loop + render the tilemap from the data in §10.
2. Player movement + wall collision + the 5 player states (§8).
3. Light system (per-room `lit`, switches, breaker).
4. Interactable system (doors, hiding, pickups, breaker, phone).
5. NPC patrol + waypoints + states.
6. Vision cones + raycast LOS + detection meter + HUD bar.
7. Noise events + NPC investigate behavior.
8. Objective/puzzle gating + win/lose + the (abstract) takedown cutaway.
9. Polish: pixel-art placeholders, footstep/ambient SFX, ’80s palette.

---

## 12. What I left out (and you can re-add)

- Multiple levels / a level-select — this is one level; the data structure is built to scale to more.
- A detective/investigator playable side — the source game alternates; not needed for a first build.
- Graphic gore — intentionally abstracted; the systems above are the actual engineering work.
