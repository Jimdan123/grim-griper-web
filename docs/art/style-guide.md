# Reaper's Debt — Placeholder Style Guide

Placeholder-first. Every visual in the MVP is `PIXI.Graphics` primitives or solid sprites plus Pixi `Text`. No textures.

This guide locks the palette, shape grammar, and scale ratios so the chapel reads at a glance and Reaper is unmistakable from Aldric. Final art swaps in later without gameplay churn.

Logical canvas: **1280 x 720** (landscape).

## Palette

Hex values are named here once and re-used by `src/art/placeholders.js`.

### Chapel

| Token | Hex | Use |
|---|---|---|
| `CHAPEL_FLOOR`        | `#2a2230` | floor slab inside `chapelBounds` |
| `CHAPEL_WALL`         | `#1a1420` | walls behind floor, fills canvas above floor |
| `CHAPEL_FRAME`        | `#0d0a12` | ceiling/floor framing strip (thin top + bottom band) |
| `CHAPEL_ACCENT`       | `#3d3148` | wall trim / pillar hint, optional decorative stripes |
| `DOORS`               | `#5a3a1a` | exit door rectangle at `doors.x` (introduced slice 4) |

### Actors

| Token | Hex | Use |
|---|---|---|
| `REAPER_BODY`         | `#0a0a14` | Reaper torso/robe — near-black, cold |
| `REAPER_HOOD`         | `#16162a` | Reaper hood triangle, slightly lighter so silhouette reads |
| `REAPER_EYE`          | `#9be7ff` | optional thin pale-cyan slit; spectral signal |
| `ALDRIC_BODY`         | `#d6c9a8` | Father Aldric robe — warm bone/cream, opposite of Reaper |
| `ALDRIC_HEAD`         | `#e8d4b0` | priest head circle, lighter cream |
| `ALDRIC_COLLAR`       | `#1a1a1a` | small black collar band, breaks up the bone tone |

Reaper and Aldric are kept on opposite ends of the value scale (Reaper = darkest things in scene; Aldric = lightest) so they never confuse the player even at thumbnail size.

### Evidence & ghosts (slice 2 — colors locked now)

| Token | Hex | Use |
|---|---|---|
| `EVIDENCE_GLOW`       | `#ffd24a` | OutlineFilter color on Evidence under Reaper Sight |
| `EVIDENCE_FILL`       | `#7a6a3a` | Evidence object body when sight is OFF (muted gold) |
| `GHOST_OVERLAY`       | `#b9e0ff` | translucent ghost replay sprite, alpha ~0.4 |

### Waypoints

Each waypoint marker is a flat colored rectangle on the floor with a Pixi `Text` label centered above it. Color encodes `kind` so the player learns the chapel quickly:

| Kind | Token | Hex |
|---|---|---|
| `Altar`           | `WAYPOINT_ALTAR`           | `#8a3a3a` (deep blood red) |
| `Lectern`         | `WAYPOINT_LECTERN`         | `#6a5a2a` (lectern wood ochre) |
| `ConfessionBooth` | `WAYPOINT_CONFESSION`      | `#3a3a6a` (booth velvet blue) |
| `Sacristy`        | `WAYPOINT_SACRISTY`        | `#3a6a4a` (sacristy vestment green) |
| `WAYPOINT_LABEL`  | `#ece6d8` | Pixi Text fill, sits on chapel wall above each marker |

## Shape grammar

All Reaper / Aldric silhouettes are constructed bottom-up from primitives so they read at a glance and have no ambiguity about facing.

### Reaper (placeholder)

- Tall narrow `Graphics` rectangle: **24 wide x 96 tall**, filled `REAPER_BODY`.
- Hooded triangle on top, base flush with rectangle top, **32 wide x 28 tall**, filled `REAPER_HOOD`.
- Optional thin horizontal slit (4 wide x 2 tall) of `REAPER_EYE` centered ~10px down the hood — purely cosmetic, kept off the gameplay surface.
- Anchor: bottom-center (feet on floor line).
- Total bounding box: 32 wide x 124 tall.

### Aldric / Father Aldric (placeholder, slice 3+)

- Wider rectangle: **40 wide x 88 tall**, filled `ALDRIC_BODY`.
- Circle head: **radius 14**, sat on top of body, filled `ALDRIC_HEAD`.
- Thin collar band: **40 wide x 4 tall**, filled `ALDRIC_COLLAR`, at the body's top edge.
- Anchor: bottom-center.
- Total bounding box: 40 wide x ~116 tall.

Reaper vs Aldric: Reaper is **taller, thinner, darker, hooded**. Aldric is **shorter, wider, lighter, has a visible round head**. Two glances apart at any zoom.

### Waypoint marker

- Floor rectangle: **80 wide x 12 tall**, fill by `kind` color (see palette).
- Label: Pixi `Text`, fill `WAYPOINT_LABEL`, font 16px sans, centered above the rectangle by ~20px (sits on the wall).
- Anchor: center on `waypoint.x`, vertically pinned to the chapel floor line (top of the marker is the floor surface; or render flush on top of floor — both fine, just consistent).

### Chapel background

- Wall fill: `CHAPEL_WALL` over the entire 1280x720 canvas as the base layer.
- Floor slab: `CHAPEL_FLOOR` rectangle covering `chapelBounds`.
- Frame strips: thin `CHAPEL_FRAME` bands along the top edge of the canvas (~16px) and the bottom edge of the chapel floor (~8px) to suggest ceiling and stage floor.
- Optional 2-3 vertical `CHAPEL_ACCENT` pillars at ~25%, 50%, 75% of width, thin (8px) and tall (full chapel height) to break up the wall — visual only.

## Scale ratios (logical px, 1280 x 720)

| Element | Width | Height | Anchor |
|---|---|---|---|
| Canvas | 1280 | 720 | top-left |
| Chapel floor | 1120 | 420 | top-left at (80, 200) |
| Reaper avatar | 32 | 124 | bottom-center on floor line |
| Aldric avatar | 40 | 116 | bottom-center on floor line |
| Waypoint marker | 80 | 12 | center on waypoint.x, top at floor line |
| Waypoint label | ~120 | 18 | center on waypoint.x, ~20px above marker |
| Doors (slice 4+) | 48 | 160 | bottom-center at (doors.x, floor line) |
| Frame strip (top) | 1280 | 16 | top edge |
| Frame strip (floor) | 1120 | 8 | bottom of chapel slab |

Reaper height / chapel height ≈ 124 / 420 ≈ **0.30**. Aldric height / chapel height ≈ 116 / 420 ≈ **0.28**. Both fit comfortably under the ceiling frame with the head clear of the top wall band.

## Aesthetic touchstone — *The Happy Hills Homicide*

Side-view 2D, dark atmospheric horror, stalker-cam framing. Use it as the visual + tonal reference for the future texture upgrade pass. Specifically:

- **Palette**: deep desaturated darks (near-black walls), one warm flesh-tone for the human victim, one cold spectral accent (cyan / pale blue) for the supernatural agent. The current MVP palette already maps to this — `CHAPEL_WALL` + `REAPER_BODY` carry the dark, `ALDRIC_BODY` carries the warm, `REAPER_EYE` + `GHOST_OVERLAY` carry the spectral.
- **Silhouette**: tall thin predator vs. short wide prey. Both readable at thumbnail with no overlap of value range. MVP shape grammar above already enforces this.
- **Lighting** (upgrade pass): low-key, single key-light from off-screen (candles / stained glass shafts), strong vignette, victim is the brightest object in frame, Reaper occupies the shadow.
- **Camera**: fixed, no parallax, no zoom. The chapel is the diorama.
- **Audio direction** (slice 5 onward): diegetic ambient — distant bell, wind through wood, footstep on stone — over melodic score. Silence is a tool.

**What we keep that Happy Hills does NOT have:** a two-phase loop — investigate first (Reaper Sight reveals ghost imagery of the crime), then haunt second (player as supernatural agent, not slasher). The player never directly attacks; they steer reactive AI toward a fated death. Hauntcraft, not violence. This is the differentiator the art should support, not muddy — keep the Reaper visibly *spectral*, not a knife-wielding human.

## Out of scope (future upgrade pass)

- Real character animations, robe ripples, candlelight flicker.
- Texture maps, normal maps, lighting passes.
- Particle FX for haunts beyond `Graphics` primitives.
- Final typography. `Text` uses default sans-serif at the sizes above.
