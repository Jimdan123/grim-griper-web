// constants.js — palette + snap helper shared across the pixelPalette layer.
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

export const PIXEL_PALETTE = Object.freeze({
  // Stone (chapel walls in pixel-art register)
  STONE_BASE: 0x4a4252,     // muted grey-purple stone — block face
  STONE_DARK: 0x2a232f,     // deep shadow on block underside
  STONE_LIGHT: 0x6a6072,    // highlight courses on candle-lit edges
  STONE_MORTAR: 0x1e1822,   // mortar lines between blocks (= shadow tone)

  // Wood (door frames, pews, lectern, confession booth — follow-up sprites)
  WOOD_BASE: 0x5a3a1e,      // medieval dark wood
  WOOD_DARK: 0x3a2616,      // deep shadow
  WOOD_LIGHT: 0x7a5a3a,     // candle-lit edge

  // Floor (flagstone)
  FLOOR_BASE: 0x3a3238,     // dim flagstone — slightly cooler than wall
  FLOOR_DARK: 0x251e2a,     // shadow between slabs
  FLOOR_GROUT: 0x1e1822,    // grout = same shadow tone as STONE_MORTAR

  // Candle warmth (gold-orange that bleeds into stone at night — used by
  // night variant in a follow-up dispatch; included now so #1 doesn't have
  // to re-import the palette later).
  CANDLE_CORE: 0xf0c060,
  CANDLE_GLOW: 0xc88a40,
  CANDLE_DIM: 0x6a4a30,

  // Day sky / window light (warm cream through stained glass)
  DAY_LIGHT: 0xe8d8a0,

  // Night ambient (used by follow-up night nave variant)
  NIGHT_AMBIENT: 0x1e1830,

  // Characters — identity preserved from existing placeholders.PALETTE
  REAPER_BLACK: 0x0a0a14,   // = placeholders.PALETTE.REAPER_BODY
  ALDRIC_CREAM: 0xd6c9a8,   // = placeholders.PALETTE.ALDRIC_BODY
  ALDRIC_COLLAR: 0x2a1e2a,  // clergy collar — close to STONE_DARK; reads
                            // as "robe collar in shadow" not "blood band"

  // Ghost replays (pale cyan witnesses — same identity, pixel register)
  GHOST_PALE: 0xb9e0ff,     // = placeholders.PALETTE.GHOST.BODY

  // Evidence glow
  EVIDENCE_GOLD: 0xe8c860,  // close to placeholders.PALETTE.EVIDENCE_GLOW

  // Parishioner (NPC) palette — Stage + Art Lead, 2026-05-30 evening "chapel
  // bustle" dispatch. Muted browns / cream / grey so parishioners read as
  // ordinary villagers — distinct from the Reaper (near-black) and Aldric
  // (warm cream cleric w/ collar). Anti-slasher: NO red, no high saturation.
  // These are alive working-class pilgrims at a working church.
  // POLISH PASS 2026-05-30 (late): pilgrim palette lifted — old values were
  // too close to STONE_BASE (0x4a4252) so the NPCs disappeared into the wall.
  // Each hex shifted toward warmer/brighter to lift them off grey-purple stone.
  // Anti-slasher discipline preserved: still no pure red, no high-saturation
  // crimson. PILGRIM_RED is a muted blood-orange robe variant (not slasher).
  PILGRIM_BROWN:      0x8a6040,  // homespun robe — warm brown contrast (was 0x5a4030)
  PILGRIM_DARK_CREAM: 0xb8a880,  // dusty linen — middle tone (was 0xa89870)
  PILGRIM_CREAM:      0xd8c8a8,  // sun-bleached cloth — brighter (was 0xc8b890)
  PILGRIM_GREY:       0x686060,  // peasant wool — lifted cooler (was 0x504848)
  PILGRIM_RED:        0x6a4040,  // muted brick robe — anti-slasher safe variety
  PILGRIM_SKIN:       0x866650,  // muted shadowed face/hand band (placeholder
                                 // skin tone — no facial detail painted on top)

  // Bubble (chatter UI) — cream-on-stone, low-contrast pixel-art register.
  BUBBLE_FILL:    0xd6c9a8,  // = ALDRIC_CREAM — sun-bleached parchment vibe
  BUBBLE_OUTLINE: 0x2a232f,  // = STONE_DARK — same shadow tone as stone mortar
  BUBBLE_TEXT:    0x2a232f,  // muted dark on cream — readable but not stark

  // Outside-the-chapel anchors — Stage + Art Lead, 2026-05-30 evening dispatch
  // (`[[project-outside-chapel-scene-2026-05-30]]`). Muted '80s register;
  // midday-but-overcast colour key matches the chapel-interior dim grey-purple
  // mood. Anti-slasher: no neon, no blood-red sky, no cheerful spring green.
  SKY_BLUE:        0x8aa0b8,  // washed cream-blue midday sky band
  SKY_HORIZON:     0xa8b4c0,  // slightly lighter near-horizon haze
  CLOUD_WISP:      0xd0d8e0,  // pale cool-cream cloud streak (low alpha)
  SUN_DISC:        0xe8d8a0,  // = DAY_LIGHT — muted gold sun (no neon yellow)
  VILLAGE_ROOF:    0x4a3a32,  // distant rooftop silhouette — muted grey-brown
  VILLAGE_WALL:    0x6a5a4e,  // distant wall colour — slightly lighter than roof
  VILLAGE_SMOKE:   0xb8b0a8,  // 1px chimney wisp — pale grey-cream, no thick plume
  GROUND_GRASS:    0x5a6840,  // dry/muted plague-era grass — NOT spring green
  GROUND_GRASS_HI: 0x6a7848,  // 1px highlight on grass tufts
  GROUND_DIRT:     0x6a5a44,  // exposed dirt/earth between grass patches
  FOLIAGE_DARK:    0x3a4830,  // tree/bush shadow side — dark muted green-brown
  FOLIAGE_BASE:    0x4a5838,  // tree/bush midtone — muted plague green
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
// All "px" arguments below are LOGICAL pixels (the 1280x720 design space the
// renderer scales from). Pixel-art register = snap to integer multiples of
// the supplied tile size (default 16).

export function snap(value, tile) {
  return Math.round(value / tile) * tile;
}
