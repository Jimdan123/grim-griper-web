// constants.js — PALETTE / CANVAS / SCALE shared across the placeholders layer.
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

export const PALETTE = {
  CHAPEL_FLOOR: 0x2a2230,
  CHAPEL_WALL: 0x221a2a,
  CHAPEL_WALL_TRIM: 0x352a40,
  CHAPEL_FRAME: 0x0d0a12,
  CHAPEL_ACCENT: 0x0f0a16,
  CHAPEL_HORIZON: 0x06040a,
  DOORS: 0x5a3a1a,

  REAPER_BODY: 0x0a0a14,
  REAPER_HOOD: 0x16162a,
  REAPER_EYE: 0x9be7ff,

  ALDRIC_BODY: 0xd6c9a8,
  ALDRIC_HEAD: 0xe8d4b0,
  ALDRIC_COLLAR: 0x1a1a1a,

  EVIDENCE_GLOW: 0xffd24a,
  EVIDENCE_FILL: 0x7a6a3a,
  GHOST_OVERLAY: 0xb9e0ff,

  WAYPOINT_ALTAR: 0x8a3a3a,
  WAYPOINT_LECTERN: 0x6a5a2a,
  WAYPOINT_CONFESSION: 0x3a3a6a,
  WAYPOINT_SACRISTY: 0x3a6a4a,
  WAYPOINT_LABEL: 0xece6d8,

  // Evidence: each piece has its own narrative-tied hue so the four objects
  // are distinguishable at thumbnail under both Sight OFF and Sight ON.
  EVIDENCE: {
    CHALICE: 0xc9a24a,       // gold — sacramental vessel
    SERMON_BOOK: 0x8a6a2a,   // ochre — leather sermon binding
    LEDGER: 0x6a2a2a,        // deep red — blood-priced confessions
    SPADE_SHAFT: 0x6a4a2a,   // brown wood shaft
    SPADE_BLADE: 0xd6c9a8,   // cream — quicklime dust = ALDRIC_BODY tonal link
  },

  // Ghosts share one tonal family (pale-cyan / cream-cyan) so they all read
  // as "the same kind of vision" — variation only in silhouette gesture.
  GHOST: {
    BODY: 0xb9e0ff,          // pale cyan — base ghost tone (= GHOST_OVERLAY)
    ACCENT: 0xd6e8f5,        // slightly creamier highlight for arms/limbs
    FLOOR_MARK: 0xb9e0ff,    // alpha-attenuated floor marks (e.g. shroud)
  },

  // Composition layer — Happy Hills touchstone (see docs/art/scene-composition-spec.md).
  // Foreground silhouettes, signage, lighting accents, vignette. Decor only,
  // never on the interaction surface.
  COMPOSITION: {
    FOREGROUND_SILHOUETTE: 0x0d0a12,  // = CHAPEL_FRAME; darkest tone in scene
    CANDLE_WARM: 0xa07840,            // soft warm bloom (outer)
    CANDLE_WARM_CORE: 0xc9a24a,       // brighter inner core of the bloom
    VIGNETTE: 0x000000,               // edge-darken overlay (alpha applied at draw)
    CROSS_PLAQUE: 0x352a40,           // = CHAPEL_WALL_TRIM; carved-stone read
    STAINED_WINDOW_GLOW: 0x6a4a2a,    // dim warm inset of implied stained-glass
  },

  // Storytelling props (ticket #21). Anti-slasher discipline:
  // poison stain = brown DISCOLORATION, never red. Quicklime = pale dust.
  // Shroud / fabric = warm dusty cream, lumpy fabric NOT body silhouette.
  PROPS: {
    ALTAR_STONE: 0x3a2e3e,        // lighter than wall — reads as stone block
    ALTAR_STONE_TRIM: 0x4a3a50,   // top edge highlight on the altar
    POISON_RING: 0x3a2a26,        // brown ring stain (residue, NOT blood red)
    WOOD_BOWL: 0x4a3a26,          // small empty wooden cup / bowl
    WOOD_DARK: 0x2a1f18,          // darker wood (lectern, booth)
    PARCHMENT: 0xc9b48a,          // sermon page — dim cream
    CURTAIN: 0x3a2a3a,            // muted purple — confession booth curtain
    KNEELER: 0x5a3a26,            // brown wooden kneeler bench
    TALLY_MARK: 0xc9b48a,         // scratched lines on booth side, parchment-tone
    SHROUD_FABRIC: 0x8a7a5a,      // dusty cream-brown — lumpy fabric pile
    SHROUD_FABRIC_DARK: 0x6a5a3a, // shadowed crease in fabric pile
    LIME_DUST: 0xb8b0a0,          // pale lime trail on the floor
    BRICK_SEAM: 0x4a3a40,         // partial brickwork in the niche wall
    BRICK_MORTAR: 0x1a121c,       // very dark mortar between bricks
  },
};

export const CANVAS = { WIDTH: 1280, HEIGHT: 720 };

export const SCALE = {
  REAPER: { WIDTH: 32, HEIGHT: 124, BODY_W: 24, BODY_H: 96, HOOD_W: 32, HOOD_H: 28 },
  ALDRIC: { WIDTH: 40, HEIGHT: 116, BODY_W: 40, BODY_H: 88, HEAD_R: 14, COLLAR_H: 4 },
  // Marker is drawn DOWN from the anchor by INSET, so it sits flush ON the
  // floor strip (anchor = floor surface top, per Foundation's floorY semantics).
  // INSET keeps the bar just below the horizon line; HEIGHT is the bar's
  // visible thickness on the floor.
  WAYPOINT_MARKER: {
    WIDTH: 80,
    HEIGHT: 10,
    INSET: 4,
    LABEL_OFFSET_Y: 8,
    LABEL_FONT_PX: 16,
  },
  // Evidence primitives — bounding box (W x H), pivot bottom-center so the
  // object's bottom edge anchors to evidence.y on the floor surface.
  EVIDENCE: {
    CHALICE: { WIDTH: 18, HEIGHT: 28, STEM_W: 4, STEM_H: 18, CUP_W: 18, CUP_H: 10 },
    SERMON_BOOK: { WIDTH: 32, HEIGHT: 22, SPINE_W: 2 },
    LEDGER: { WIDTH: 24, HEIGHT: 30, STRIPE_W: 2 },
    LIME_SPADE: { WIDTH: 14, HEIGHT: 44, SHAFT_W: 4, SHAFT_H: 34, BLADE_W: 14, BLADE_H: 10 },
  },
  // Ghost silhouette uses Aldric-shape proportions, scaled / posed per id.
  GHOST: {
    WIDTH: 40, HEIGHT: 116,
    BODY_W: 40, BODY_H: 88,
    HEAD_R: 14,
    ARM_W: 4, ARM_H: 18,
    HAND_R: 6,
    SHROUD_W: 24, SHROUD_H: 8,
  },
  // FLOOR_H kept for backward compat (baseboard trim thickness); FLOOR_STRIP_H is
  // the visible chapel floor band height (Path A composition).
  // 2026-05-30 evening (walled-rooms VP audit fix #4): aligned 100 → 96 to match
  // the pixel-art floor band height in chapel/nave.js + chapelBustle/dayAmbient.js
  // (`FLOOR_BAND_H = 96`). Previously Stage.floorY used 100 while the pixel-art
  // floor band drew at 96, causing pews/altar/lectern/booth/sacristy props to
  // float 4 px above the pixel-art flagstone surface. Painterly mode (legacy
  // A/B per PRD §19.7) just renders a 4 px thinner floor strip — still reads.
  FRAME: { TOP_H: 16, FLOOR_H: 8, FLOOR_STRIP_H: 96 },
  PILLAR: { WIDTH: 22, CAP_H: 10, BASE_H: 10 },
  HORIZON_H: 3,
};

