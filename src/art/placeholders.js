import { Container, Graphics, Text } from 'pixi.js';

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
  FRAME: { TOP_H: 16, FLOOR_H: 8, FLOOR_STRIP_H: 100 },
  PILLAR: { WIDTH: 22, CAP_H: 10, BASE_H: 10 },
  HORIZON_H: 3,
};

const WAYPOINT_KIND_COLOR = {
  Altar: PALETTE.WAYPOINT_ALTAR,
  Lectern: PALETTE.WAYPOINT_LECTERN,
  ConfessionBooth: PALETTE.WAYPOINT_CONFESSION,
  Sacristy: PALETTE.WAYPOINT_SACRISTY,
};

export function createChapelBackground(bounds) {
  const container = new Container();
  container.label = 'chapel-background';

  // Path A composition: the chapel ROOM extends from canvas top down to the
  // floor surface. The floor is a thin strip at the bottom of the bounds rect;
  // everything above is the same dark wall mass (back wall + chapel interior
  // void the Reaper haunts).
  const floorTopY = bounds.y + bounds.height - SCALE.FRAME.FLOOR_STRIP_H;

  // Layer 1: chapel interior + back wall — one continuous dark mass that fills
  // the ENTIRE canvas top-to-bottom. The floor strip (Layer 5) is then painted
  // ON TOP of this wall mass. VP pass 7 (defect 7): extending the wall all the
  // way to CANVAS.HEIGHT prevents the page-level letterbox background from
  // bleeding through below the floor strip in viewports where the rendered
  // canvas is taller than the chapel composition.
  const wall = new Graphics();
  wall.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT).fill(PALETTE.CHAPEL_WALL);
  container.addChild(wall);

  // Layer 2: top frame strip (cornice) — keeps the canvas top edge defined.
  const topFrame = new Graphics();
  topFrame.rect(0, 0, CANVAS.WIDTH, SCALE.FRAME.TOP_H).fill(PALETTE.CHAPEL_FRAME);
  container.addChild(topFrame);

  // Layer 3: pillars — full-height columns from cornice down to the floor
  // surface. Painted in CHAPEL_ACCENT (lighter shade) on top of the wall so
  // they read as architecture standing inside the room.
  const pillarTop = SCALE.FRAME.TOP_H;
  const pillarBottom = floorTopY;
  const pillarH = pillarBottom - pillarTop;
  for (const px of [0.2, 0.4, 0.6, 0.8]) {
    const x = Math.round(CANVAS.WIDTH * px - SCALE.PILLAR.WIDTH / 2);
    const pillar = new Graphics();
    pillar.rect(x, pillarTop, SCALE.PILLAR.WIDTH, pillarH).fill(PALETTE.CHAPEL_ACCENT);
    container.addChild(pillar);

    // Pillar cap + base trim — reads as carved stone.
    // VP pass 7 (defect 8): caps painted in CHAPEL_WALL (same as the wall mass)
    // so they effectively disappear. Previously CHAPEL_WALL_TRIM made them
    // read as floating lighter blocks detached from the cornice. Placeholder
    // chapel pillars don't need ornament at this phase; restore trim later
    // once the cornice has its own tonal differentiation.
    const cap = new Graphics();
    cap
      .rect(x - 3, pillarTop, SCALE.PILLAR.WIDTH + 6, SCALE.PILLAR.CAP_H)
      .fill(PALETTE.CHAPEL_WALL);
    container.addChild(cap);

    const base = new Graphics();
    base
      .rect(x - 3, pillarBottom - SCALE.PILLAR.BASE_H, SCALE.PILLAR.WIDTH + 6, SCALE.PILLAR.BASE_H)
      .fill(PALETTE.CHAPEL_WALL_TRIM);
    container.addChild(base);
  }

  // Layer 4: horizon line where chapel meets floor — sharp top edge for the
  // floor strip so characters' feet have a clean ground plane to stand on.
  const horizon = new Graphics();
  horizon
    .rect(0, floorTopY - SCALE.HORIZON_H, CANVAS.WIDTH, SCALE.HORIZON_H)
    .fill(PALETTE.CHAPEL_HORIZON);
  container.addChild(horizon);

  // Layer 5: floor strip — a thin band from floorTopY down by FLOOR_STRIP_H,
  // spanning the full canvas width so it reads as a continuous stage.
  const floor = new Graphics();
  floor
    .rect(0, floorTopY, CANVAS.WIDTH, SCALE.FRAME.FLOOR_STRIP_H)
    .fill(PALETTE.CHAPEL_FLOOR);
  container.addChild(floor);

  // Layer 6: bottom frame strip (baseboard) at the very bottom of the floor
  // strip — closes the composition.
  const floorBottomY = floorTopY + SCALE.FRAME.FLOOR_STRIP_H;
  const floorFrame = new Graphics();
  floorFrame
    .rect(0, floorBottomY - SCALE.FRAME.FLOOR_H, CANVAS.WIDTH, SCALE.FRAME.FLOOR_H)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(floorFrame);

  return container;
}

// ---------------------------------------------------------------------------
// Sacristy room (issue #22a — hybrid map)
// ---------------------------------------------------------------------------
// Repaints the right-side strip of the chapel as the SACRISTY — a slightly
// "deeper in the building" room than the nave. Sits on top of the
// createChapelBackground full-canvas back wall, replacing the right portion
// of the wall with a subtly different tone (a hair browner, a hair darker)
// so the player reads "different room" without it going slasher / dungeon.
//
// Tonal discipline (spectral, not slasher — touchstone):
//   * Same tonal FAMILY as the nave; just a small shift toward warm-brown.
//   * NO gore. NO body shapes. NO blood-red. NO bones. The sacristy is the
//     burial room narratively, but the visual is "back-of-house storage with
//     gravitas", not "kill room". The funerary read comes from the storage
//     prop (clay urns) — implying funerary use without depicting bodies.
//   * Floor strip color is the same as the nave's so characters' feet are on
//     one continuous ground (door is a wall opening, not a step). Slice 22d
//     may diverge per-room `lit` later.
//
// boundsLogical: { x, y, width, height } — logical-px room footprint.
//
// Static — drawn once at construction. No per-frame allocation.
const PALETTE_SACRISTY = {
  WALL: 0x1e1822,            // slightly browner / darker than CHAPEL_WALL
  WALL_TRIM: 0x2e2632,       // darker than CHAPEL_WALL_TRIM
  SHELF: 0x2a1f18,           // = PROPS.WOOD_DARK — shelf bracket / plank
  URN_BODY: 0x4a3a32,        // muted clay — funerary urn body
  URN_LIP: 0x5a4a3a,         // lighter rim on the urn
};
export function createSacristyRoom(boundsLogical) {
  const container = new Container();
  container.label = 'sacristy-room';

  const { x, y, width, height } = boundsLogical;
  const floorTopY = y + height - SCALE.FRAME.FLOOR_STRIP_H;

  // Back wall overlay — paints the sacristy region in a slightly browner
  // tone than the nave's CHAPEL_WALL. Spans top of canvas (or top of chapel)
  // down to the floor surface so the room reads as one continuous wall mass.
  // We start at canvas top (y=0) rather than `y` so the cornice band over the
  // sacristy matches the nave's full-height wall composition.
  const wall = new Graphics();
  wall
    .rect(x, 0, width, floorTopY)
    .fill(PALETTE_SACRISTY.WALL);
  container.addChild(wall);

  // Re-paint the top frame strip over the sacristy so the cornice tone stays
  // continuous (the nave's createChapelBackground painted CHAPEL_FRAME there;
  // we keep the same value for visual continuity).
  const topFrame = new Graphics();
  topFrame
    .rect(x, 0, width, SCALE.FRAME.TOP_H)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(topFrame);

  // Subtle vertical wall trim near the back to imply depth — a thin darker
  // band partway across the room. Decor only; no figure shapes.
  const trim = new Graphics();
  trim
    .rect(x + Math.round(width * 0.55), SCALE.FRAME.TOP_H, 2, floorTopY - SCALE.FRAME.TOP_H)
    .fill(PALETTE_SACRISTY.WALL_TRIM);
  trim.alpha = 0.6;
  container.addChild(trim);

  // Floor strip — same tone as the nave's so the ground reads continuous.
  // (Slice 22d may darken when room.lit=false.) Paint AFTER the wall so the
  // wall's bottom edge doesn't leak below the floor surface.
  const floor = new Graphics();
  floor
    .rect(x, floorTopY, width, SCALE.FRAME.FLOOR_STRIP_H)
    .fill(PALETTE.CHAPEL_FLOOR);
  container.addChild(floor);

  // Horizon line — sharp top edge for the floor surface (mirrors the nave).
  const horizon = new Graphics();
  horizon
    .rect(x, floorTopY - SCALE.HORIZON_H, width, SCALE.HORIZON_H)
    .fill(PALETTE.CHAPEL_HORIZON);
  container.addChild(horizon);

  // Baseboard trim — closes the bottom of the room (mirrors the nave's
  // floor frame strip), so the sacristy doesn't have a "hanging" lower edge.
  const floorBottomY = floorTopY + SCALE.FRAME.FLOOR_STRIP_H;
  const floorFrame = new Graphics();
  floorFrame
    .rect(x, floorBottomY - SCALE.FRAME.FLOOR_H, width, SCALE.FRAME.FLOOR_H)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(floorFrame);

  // Storage detail prop: a small wall shelf with three clay urns. Implies
  // funerary use without depicting bodies (anti-slasher discipline). Place
  // it on the back wall well above the floor strip so it doesn't crowd the
  // sacristy waypoint marker. Center horizontally within the room.
  const shelfCX = x + Math.round(width * 0.5);
  const shelfY = floorTopY - 90;
  const shelfW = Math.min(60, Math.round(width * 0.55));

  // Shelf plank — thin horizontal wood strip.
  const shelfPlank = new Graphics();
  shelfPlank
    .rect(shelfCX - shelfW / 2, shelfY, shelfW, 3)
    .fill(PALETTE_SACRISTY.SHELF);
  container.addChild(shelfPlank);

  // Two small bracket pegs under the shelf — sells "mounted to the wall".
  const bracketY = shelfY + 3;
  const bracketL = new Graphics();
  bracketL
    .rect(shelfCX - shelfW / 2 + 4, bracketY, 2, 4)
    .fill(PALETTE_SACRISTY.SHELF);
  container.addChild(bracketL);
  const bracketR = new Graphics();
  bracketR
    .rect(shelfCX + shelfW / 2 - 6, bracketY, 2, 4)
    .fill(PALETTE_SACRISTY.SHELF);
  container.addChild(bracketR);

  // Three clay urns sitting on the shelf — small squat rectangles + a darker
  // lip. Spaced evenly. Reads as funerary storage; no skull / body shapes.
  const urnW = 10;
  const urnH = 14;
  const urnGap = 4;
  const urnsTotalW = urnW * 3 + urnGap * 2;
  const urnsStartX = shelfCX - urnsTotalW / 2;
  const urnY = shelfY - urnH;
  for (let i = 0; i < 3; i++) {
    const ux = urnsStartX + i * (urnW + urnGap);
    const urnBody = new Graphics();
    urnBody.rect(ux, urnY + 2, urnW, urnH - 2).fill(PALETTE_SACRISTY.URN_BODY);
    container.addChild(urnBody);
    // Urn lip — a lighter band at the top.
    const lip = new Graphics();
    lip.rect(ux - 1, urnY, urnW + 2, 3).fill(PALETTE_SACRISTY.URN_LIP);
    container.addChild(lip);
  }

  return container;
}

// ---------------------------------------------------------------------------
// Door arch (issue #22a — hybrid map)
// ---------------------------------------------------------------------------
// A vertical wood-toned frame at the door tile, with the opening empty (door
// is `open: true` in #22a; closed-door rendering ships later). Subtle shadow
// line across the threshold so the player reads "this is a door".
//
// Geometry: the door tile sits at tileLogicalX (left edge of the 16-px tile).
// The frame is two thin vertical posts (one at tileLogicalX, one at
// tileLogicalX + tile) and a thin lintel across the top. The opening between
// is left empty — the back wall on either side shows through, suggesting an
// archway you can walk through.
//
// Args:
//   tileLogicalX — left edge of the door tile, in logical px.
//   topY         — top of the chapel interior (= chapelBounds.y typically).
//   floorY       — top of the floor strip (= Stage.floorY).
//
// Static — drawn once.
const DOOR_TILE_W = 16;        // matches stageData.meta.tile
const DOOR_POST_W = 3;         // thin wood frame
const DOOR_LINTEL_H = 6;       // thin wood band across the top of the opening
const DOOR_THRESHOLD_H = 2;    // shadow line on the floor surface
export function createDoorArch({ tileLogicalX, topY, floorY }) {
  const container = new Container();
  container.label = 'door-arch';

  const archHeight = floorY - topY;
  const archTopY = topY;

  // Left post — vertical wood-toned bar at the left side of the opening.
  const leftPost = new Graphics();
  leftPost
    .rect(tileLogicalX, archTopY, DOOR_POST_W, archHeight)
    .fill(PALETTE.DOORS);
  container.addChild(leftPost);

  // Right post — vertical wood-toned bar at the right side of the opening.
  const rightPost = new Graphics();
  rightPost
    .rect(tileLogicalX + DOOR_TILE_W - DOOR_POST_W, archTopY, DOOR_POST_W, archHeight)
    .fill(PALETTE.DOORS);
  container.addChild(rightPost);

  // Lintel — thin wood band across the top, spans between the two posts.
  const lintel = new Graphics();
  lintel
    .rect(tileLogicalX, archTopY, DOOR_TILE_W, DOOR_LINTEL_H)
    .fill(PALETTE.DOORS);
  container.addChild(lintel);

  // Subtle inner shadow — a 1px darker band just inside each post so the
  // opening reads as RECESSED, not painted-on-the-wall.
  const innerL = new Graphics();
  innerL
    .rect(tileLogicalX + DOOR_POST_W, archTopY + DOOR_LINTEL_H, 1, archHeight - DOOR_LINTEL_H)
    .fill(PALETTE.CHAPEL_FRAME);
  innerL.alpha = 0.55;
  container.addChild(innerL);
  const innerR = new Graphics();
  innerR
    .rect(tileLogicalX + DOOR_TILE_W - DOOR_POST_W - 1, archTopY + DOOR_LINTEL_H, 1, archHeight - DOOR_LINTEL_H)
    .fill(PALETTE.CHAPEL_FRAME);
  innerR.alpha = 0.55;
  container.addChild(innerR);

  // Threshold shadow line across the floor surface, between the two posts —
  // tells the player "this is a doorway, step through here".
  const threshold = new Graphics();
  threshold
    .rect(tileLogicalX + DOOR_POST_W, floorY, DOOR_TILE_W - DOOR_POST_W * 2, DOOR_THRESHOLD_H)
    .fill(PALETTE.CHAPEL_FRAME);
  threshold.alpha = 0.8;
  container.addChild(threshold);

  return container;
}

export function createReaperPlaceholder() {
  const container = new Container();
  container.label = 'reaper-placeholder';

  const { WIDTH, HEIGHT, BODY_W, BODY_H, HOOD_W, HOOD_H } = SCALE.REAPER;

  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H;

  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PALETTE.REAPER_BODY);
  container.addChild(body);

  const hood = new Graphics();
  const hoodBaseY = bodyY;
  hood
    .poly([
      0, hoodBaseY,
      HOOD_W, hoodBaseY,
      WIDTH / 2, hoodBaseY - HOOD_H,
    ])
    .fill(PALETTE.REAPER_HOOD);
  container.addChild(hood);

  const eye = new Graphics();
  eye.rect(WIDTH / 2 - 2, hoodBaseY - HOOD_H + 10, 4, 2).fill(PALETTE.REAPER_EYE);
  container.addChild(eye);

  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

export function createWaypointMarker(waypoint) {
  const container = new Container();
  container.label = `waypoint-${waypoint.id}`;

  const { WIDTH, HEIGHT, INSET, LABEL_OFFSET_Y, LABEL_FONT_PX } = SCALE.WAYPOINT_MARKER;
  const color = WAYPOINT_KIND_COLOR[waypoint.kind] ?? PALETTE.CHAPEL_ACCENT;

  // Stage.js anchors this container at `marker.y = floorY` (floor surface
  // top, Path A). We draw the marker bar DOWN from the anchor by INSET, so
  // it sits ON the floor strip — its top edge a few px below the horizon line
  // and its bottom edge well above the baseboard trim.
  const rectTop = INSET;

  const marker = new Graphics();
  marker.rect(-WIDTH / 2, rectTop, WIDTH, HEIGHT).fill(color);
  container.addChild(marker);

  // Thin glow strip on top of the marker for readability against the floor.
  const glow = new Graphics();
  glow.rect(-WIDTH / 2, rectTop, WIDTH, 2).fill(PALETTE.WAYPOINT_LABEL);
  glow.alpha = 0.45;
  container.addChild(glow);

  const label = new Text({
    text: waypoint.label,
    style: {
      fontFamily: 'sans-serif',
      fontSize: LABEL_FONT_PX,
      fill: PALETTE.WAYPOINT_LABEL,
      align: 'center',
    },
  });
  // Label sits ABOVE the floor surface (into the chapel interior) so it
  // doesn't crowd the marker bar inside the thin floor strip.
  label.anchor.set(0.5, 1);
  label.x = 0;
  label.y = -LABEL_OFFSET_Y;
  container.addChild(label);

  return container;
}

// ---------------------------------------------------------------------------
// Evidence placeholders (slice 2)
// ---------------------------------------------------------------------------
// Each evidence id dispatches to a small primitive-shape factory. All return
// a `Container` with pivot at center-bottom so callers place them via
// `sprite.x = evidence.x; sprite.y = evidence.y` with the bottom edge of the
// silhouette resting on the floor surface.
//
// Visual goals (per docs/art/style-guide.md + narrative):
//   * Distinguishable at thumbnail — different silhouette + different hue.
//   * Flat-color primitives only, no textures.
//   * Each color carries narrative meaning (gold/ochre/red/brown+cream).

function buildChalice() {
  const c = new Container();
  c.label = 'evidence-chalice';
  const { WIDTH, HEIGHT, STEM_W, STEM_H, CUP_W, CUP_H } = SCALE.EVIDENCE.CHALICE;

  // Base disc (foot).
  const foot = new Graphics();
  foot.rect(0, HEIGHT - 2, WIDTH, 2).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(foot);

  // Stem.
  const stem = new Graphics();
  const stemX = (WIDTH - STEM_W) / 2;
  stem.rect(stemX, HEIGHT - 2 - STEM_H, STEM_W, STEM_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(stem);

  // Cup (rect with 2 px notch to suggest the opening / residue rim).
  const cup = new Graphics();
  cup.rect(0, 0, CUP_W, CUP_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(cup);
  const rim = new Graphics();
  rim.rect(2, 0, CUP_W - 4, 2).fill(PALETTE.EVIDENCE_GLOW);
  rim.alpha = 0.7;
  c.addChild(rim);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildSermonBook() {
  const c = new Container();
  c.label = 'evidence-sermonBook';
  const { WIDTH, HEIGHT, SPINE_W } = SCALE.EVIDENCE.SERMON_BOOK;

  // Squat ochre rectangle = book lying open.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.SERMON_BOOK);
  c.addChild(cover);

  // Central spine band — splits the cover, reads as "open book".
  const spine = new Graphics();
  spine
    .rect((WIDTH - SPINE_W) / 2, 0, SPINE_W, HEIGHT)
    .fill(PALETTE.ALDRIC_COLLAR);
  c.addChild(spine);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildConfessionLedger() {
  const c = new Container();
  c.label = 'evidence-confessionLedger';
  const { WIDTH, HEIGHT, STRIPE_W } = SCALE.EVIDENCE.LEDGER;

  // Tall, narrow deep-red ledger — visibly different shape from sermonBook.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.LEDGER);
  c.addChild(cover);

  // Gold corner stripe = the priced margin notes (narr. line 53).
  const stripe = new Graphics();
  stripe.rect(WIDTH - STRIPE_W, 2, STRIPE_W, HEIGHT - 4).fill(PALETTE.EVIDENCE_GLOW);
  stripe.alpha = 0.8;
  c.addChild(stripe);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildLimeSpade() {
  const c = new Container();
  c.label = 'evidence-limeSpade';
  const { WIDTH, HEIGHT, SHAFT_W, SHAFT_H, BLADE_W, BLADE_H } = SCALE.EVIDENCE.LIME_SPADE;

  // Brown wood shaft — tall and thin, centered.
  const shaft = new Graphics();
  const shaftX = (WIDTH - SHAFT_W) / 2;
  shaft.rect(shaftX, BLADE_H, SHAFT_W, SHAFT_H).fill(PALETTE.EVIDENCE.SPADE_SHAFT);
  c.addChild(shaft);

  // Cream blade at top — the lime-dust link to ALDRIC_BODY tone.
  const blade = new Graphics();
  blade.rect(0, 0, BLADE_W, BLADE_H).fill(PALETTE.EVIDENCE.SPADE_BLADE);
  c.addChild(blade);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

const EVIDENCE_FACTORIES = {
  chalice: buildChalice,
  sermonBook: buildSermonBook,
  confessionLedger: buildConfessionLedger,
  limeSpade: buildLimeSpade,
};

export function createEvidencePlaceholder(evidence) {
  const factory = EVIDENCE_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createEvidencePlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(EVIDENCE_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}

// ---------------------------------------------------------------------------
// Ghost replay placeholders (slice 2)
// ---------------------------------------------------------------------------
// One silhouette per evidence id. Each ghost is a translucent priest-figure
// performing the crime gesture documented in docs/narrative/confession-room.md
// §"The Racket". All four share the pale-cyan GHOST.BODY tone so they read
// as "the same kind of vision" — only the silhouette / gesture differs.
//
// Tone discipline: Happy Hills touchstone — these are quiet witnesses, NOT
// jump-scare imagery. Standing figures performing period acts. The horror
// is the routine, not the visual.
//
// Alpha: ghost container alpha is set to 0.4 here as the default. Callers
// (#2 Investigation Engineer / Sight system) MAY override `container.alpha`
// if they want crossfades — the value is exposed, not baked into draw calls.

const GHOST_DEFAULT_ALPHA = 0.4;

function buildGhostBase(options = {}) {
  // Shared base silhouette: standing priest, no collar (silhouette only).
  // Returns { container, bodyTopY, headCx, headCy } so per-id factories can
  // attach arms / accents at the correct height AND can re-pose the figure
  // (bent torso, tilted head) to communicate the crime gesture per
  // docs/narrative/confession-room.md §"Visual direction notes".
  //
  // Options (all optional, all in logical px / radians):
  //   leanX      — horizontal offset applied to the torso TOP (creates a
  //                bent-over silhouette by drawing the body as a parallelogram).
  //                Positive = bend forward to the right.
  //   headDx     — horizontal offset of the head from the torso top center.
  //                Combined with leanX, lets us tilt the head independently
  //                of the lean (e.g. lectern: forward lean + downward head).
  //   headDy     — vertical offset of the head (positive = lower / hunched).
  //   shortenBy  — pixels to clip from the bottom of the body, so the figure
  //                reads as "crouched" rather than "shrunk floating".
  const c = new Container();
  const { WIDTH, HEIGHT, BODY_W, BODY_H, HEAD_R } = SCALE.GHOST;
  const { leanX = 0, headDx = 0, headDy = 0, shortenBy = 0 } = options;

  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H + shortenBy;

  // Torso as a parallelogram so the top can lean while the feet stay planted
  // on the floor — communicates "bent over" rather than "translated".
  const body = new Graphics();
  body
    .poly([
      bodyX + leanX,           bodyY,           // top-left (leans with leanX)
      bodyX + BODY_W + leanX,  bodyY,           // top-right (leans with leanX)
      bodyX + BODY_W,          HEIGHT,          // bottom-right (planted)
      bodyX,                   HEIGHT,          // bottom-left (planted)
    ])
    .fill(PALETTE.GHOST.BODY);
  c.addChild(body);

  // Head rides the top of the torso, offset by leanX so it sits over the
  // lean, plus per-pose headDx/headDy for tilt.
  const headCx = WIDTH / 2 + leanX + headDx;
  const headCy = bodyY - HEAD_R + headDy;
  const head = new Graphics();
  head.circle(headCx, headCy, HEAD_R).fill(PALETTE.GHOST.BODY);
  c.addChild(head);

  return { container: c, bodyTopY: bodyY, headCx, headCy };
}

function buildGhostSermon() {
  // Lectern / WHISPER — priest mid-sermon-tilt, leaning over the lectern.
  // Forward lean of the torso + downward-tilted head reading off the page,
  // plus one arm extended forward/down resting on the lectern edge holding
  // an open sermon book (small ochre-toned rect held in front of the chest).
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 6,
    headDx: 2,
    headDy: 4,
  });
  container.label = 'ghost-sermon';
  const { WIDTH, HEIGHT, ARM_W, ARM_H } = SCALE.GHOST;

  // Forward-extended arm — reaches out and slightly down toward the lectern.
  const arm = new Graphics();
  arm
    .rect(WIDTH / 2 + 8, bodyTopY + 16, ARM_W + 2, ARM_H - 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Small book silhouette held flat in front, just below the head — the
  // sermon being read. Drawn in the same ghost-accent tone so it reads as
  // PART OF the vision, not a separate evidence pickup.
  const book = new Graphics();
  book
    .rect(headCx + 2, headCy + 8, 12, 6)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(book);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostPoison() {
  // Altar / SHATTER — priest mid-tilt of the chalice, pouring poison.
  // Body bends forward over the altar; head dips to watch the pour; the
  // extended arm angles down-right, ending in a small chalice silhouette
  // tipped at the tilt angle (the poison going in).
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 5,
    headDx: 2,
    headDy: 6,
  });
  container.label = 'ghost-poison';
  const { WIDTH, HEIGHT, ARM_W, ARM_H } = SCALE.GHOST;

  // Pouring arm — angles from the shoulder down to the right.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 6,           bodyTopY + 12,            // shoulder
      WIDTH / 2 + 6 + ARM_W,   bodyTopY + 12,            // shoulder back
      WIDTH / 2 + 10 + ARM_W,  bodyTopY + 12 + ARM_H,    // hand-out lower-right
      WIDTH / 2 + 10,          bodyTopY + 12 + ARM_H,    // hand-in lower-right
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Tilted chalice silhouette at the end of the arm — a tiny cup-on-stem
  // rotated to suggest the pour. Same ghost-accent tone (vision, not pickup).
  const chaliceX = WIDTH / 2 + 12;
  const chaliceY = bodyTopY + 12 + ARM_H + 2;
  const chalice = new Graphics();
  // Cup, leaning right (parallelogram).
  chalice
    .poly([
      chaliceX,      chaliceY,
      chaliceX + 10, chaliceY - 2,
      chaliceX + 12, chaliceY + 6,
      chaliceX + 2,  chaliceY + 8,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(chalice);

  // Suppress unused-var lint of headCx/headCy by referencing nothing further;
  // we keep the destructure for symmetry with the other pose factories.
  void headCx; void headCy;

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostExtort() {
  // Booth / VOICE — priest hunched over the booth ledger, writing fast.
  // Pose: torso bent forward + head tilted down toward the page + writing
  // arm angled down across the body toward the ledger. The penitent's hand
  // on the lattice (left side) remains from the prior version — it is the
  // OTHER half of the scene (parishioner reaching through), not Aldric.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 4,
    headDx: 1,
    headDy: 5,
  });
  container.label = 'ghost-extort';
  const { WIDTH, HEIGHT, HAND_R, ARM_W, ARM_H } = SCALE.GHOST;

  // Writing arm — crosses down-right from the shoulder to the page.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 4,           bodyTopY + 10,
      WIDTH / 2 + 4 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Ledger page silhouette under the writing hand.
  const ledger = new Graphics();
  ledger
    .rect(WIDTH / 2 + 6, bodyTopY + 10 + ARM_H, 16, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(ledger);

  void headCx; void headCy;

  // Penitent's hand silhouette — a small palm (circle) + 4 finger stubs
  // pressed against the lattice at chest height on the left side. The fingers
  // are what distinguish this from an abstract dot — read as "hand reaching
  // through the lattice toward Aldric" per #5's flag (was a dot pre-fix).
  // VP pass 7: bumped finger geometry (was 2x1, ghost α=0.4 made them invisible)
  // and added a short wrist stub so palm reads as connected to body, not floating.
  const handX = WIDTH / 2 - 14;
  const handY = bodyTopY + 30;

  // Wrist stub — short bar from body toward palm, so palm reads "attached".
  const wrist = new Graphics();
  wrist
    .rect(handX, handY - 2, 10, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(wrist);

  // Palm.
  const palm = new Graphics();
  palm.circle(handX, handY, HAND_R).fill(PALETTE.GHOST.ACCENT);
  palm.alpha = 1.0;
  container.addChild(palm);

  // Four finger stubs extending LEFT (toward the booth lattice).
  const fingers = new Graphics();
  const fingerW = 4;
  const fingerH = 2;
  const fingerGap = 3;
  for (let i = 0; i < 4; i++) {
    const fy = handY - (fingerGap * 1.5) + i * fingerGap;
    fingers
      .rect(handX - HAND_R - fingerW + 1, fy, fingerW, fingerH)
      .fill(PALETTE.GHOST.ACCENT);
  }
  fingers.alpha = 1.0;
  container.addChild(fingers);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostBury() {
  // Sacristy / RISE — priest dragging a shroud / spading lime. Strong
  // forward bend at the waist (gravedigger posture) + head down + both arms
  // forward-low: one extended out gripping a spade shaft, the other tugging
  // the shroud across the floor.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 9,
    headDx: 3,
    headDy: 8,
  });
  container.label = 'ghost-bury';
  const { WIDTH, HEIGHT, ARM_W, ARM_H, SHROUD_W, SHROUD_H } = SCALE.GHOST;

  // Dragged shroud — low horizontal rect at floor level, offset right.
  // Drawn at full alpha; the parent container alpha (GHOST_DEFAULT_ALPHA=0.4)
  // attenuates it. Was 0.7 here → effective 0.28, too faint to read.
  const shroud = new Graphics();
  shroud
    .rect(WIDTH / 2 + 4, HEIGHT - SHROUD_H, SHROUD_W, SHROUD_H)
    .fill(PALETTE.GHOST.FLOOR_MARK);
  shroud.alpha = 1.0;
  container.addChild(shroud);

  // Pulling arm — angles from the shoulder down toward the shroud.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 8,           bodyTopY + 10,
      WIDTH / 2 + 8 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H + 6,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Spade shaft — thin diagonal accent from the hand toward the floor,
  // suggesting the tool in the dragging hand. Same accent tone (vision).
  const spade = new Graphics();
  spade
    .poly([
      WIDTH / 2 + 12, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 16, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 22, HEIGHT - SHROUD_H,
      WIDTH / 2 + 18, HEIGHT - SHROUD_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(spade);

  void headCx; void headCy;

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

const GHOST_FACTORIES = {
  chalice: buildGhostPoison,
  sermonBook: buildGhostSermon,
  confessionLedger: buildGhostExtort,
  limeSpade: buildGhostBury,
};

export function createGhostPlaceholder(evidence) {
  const factory = GHOST_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createGhostPlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(GHOST_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}

// ---------------------------------------------------------------------------
// Scene composition layer (Happy Hills touchstone)
// ---------------------------------------------------------------------------
// Five factories implementing Part C of docs/art/scene-composition-spec.md:
//   * createConfessionRoomForeground — left-edge dark silhouette props (decor)
//   * createConfessionRoomSignage    — hanging cross plaque, top-left
//   * createLightingAccent           — soft warm candle bloom on wall
//   * createStainedWindowSilhouette  — implied window behind the Altar
//   * createVignette                 — 4-side edge-darken overlay
//
// All return PIXI Containers. None mutate Stage / world / app.stage — wiring
// is Foundation's lane. See scene-composition-spec.md §"Part C → integration
// checklist" for the exact addChild calls Foundation needs.
//
// Discipline: decor only, never on the interaction surface, never overlapping
// waypoint hitboxes or evidence pickup geometry.

/**
 * Single dark silhouette anchored at the left canvas edge — the Happy Hills
 * voyeur frame. ONE shape, pure black, cutting the canvas edge so the player
 * reads the scene as "peering through" something.
 *
 * Redo pass: previous version had three competing silhouettes (candelabra +
 * fallen book + altar-cloth triangle) cluttering the lower-left. Happy Hills
 * uses ONE silhouette set, not three. Collapsed to a single tall pillar-edge
 * silhouette + a low foreground prop, both reading as one unified darkening
 * of the left margin.
 *
 * All filled COMPOSITION.FOREGROUND_SILHOUETTE — the darkest tone in scene.
 * No internal detail — true black silhouette.
 * Container pivot = (0, 0); caller places at world origin.
 */
export function createConfessionRoomForeground() {
  const container = new Container();
  container.label = 'confession-room-foreground';

  const dark = PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE;
  // Foreground budget: <= 14% of canvas width (tightened from 18%).
  // Canvas is 1280, so we hold the silhouette within x ∈ [0, ~180].

  // ONE silhouette: a tall narrow vertical mass on the far-left edge that
  // reads as "the edge of a pew / pillar / doorframe we are peering past".
  // No arms, no ornament, no second prop. Just one continuous dark wedge
  // cutting in from the canvas edge.
  const silhouette = new Graphics();
  silhouette
    .poly([
      0, 0,           // top-left corner of canvas
      90, 0,          // narrow at top
      60, CANVAS.HEIGHT,  // tapers slightly inward toward bottom
      0, CANVAS.HEIGHT,   // bottom-left corner
    ])
    .fill(dark);
  container.addChild(silhouette);

  return container;
}

/**
 * Small subtle cross plaque — stage-identifier that reads at thumbnail.
 * Redo pass: shrunk from 60x88 to 40x56 (≤ 120px-wide spec margin) and
 * stripped the warm catchlight (the lighting accent it referenced is gone).
 * Foundation should reposition this to upper-RIGHT (opposite the stained
 * window anchor) so it doesn't cluster with the window in the upper-left.
 *
 * Total bounding box ~ 40 wide x 60 tall. Caller places top-left at desired
 * spot (e.g. upper-right: roughly (CANVAS.WIDTH - 80, 30)).
 */
export function createConfessionRoomSignage() {
  const container = new Container();
  container.label = 'confession-room-signage';

  const stone = PALETTE.COMPOSITION.CROSS_PLAQUE;

  // Small hanging chain stub (two pixels of darker tone above the plaque).
  const chain = new Graphics();
  chain.rect(19, 0, 2, 6).fill(PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE);
  container.addChild(chain);

  // Plaque background — modest carved-stone rect, half the previous size.
  const plaque = new Graphics();
  plaque.rect(0, 6, 40, 54).fill(stone);
  container.addChild(plaque);

  // Cross — vertical bar + horizontal cross-bar inside the plaque.
  // Thinner strokes match the smaller plaque.
  const cross = new Graphics();
  cross.rect(19, 14, 2, 38).fill(PALETTE.WAYPOINT_LABEL);
  cross.rect(11, 24, 18, 2).fill(PALETTE.WAYPOINT_LABEL);
  container.addChild(cross);

  return container;
}

/**
 * DEPRECATED in redo pass. The previous implementation rendered a large
 * literal warm rectangle in the upper-left that competed with the signage
 * and stained window for the same compositional anchor. Happy Hills uses
 * ONE light source per scene, expressed diegetically (warm pane of a window),
 * not a free-floating bloom on the wall.
 *
 * Returns an empty Container so existing Foundation wiring keeps working
 * until Foundation removes the addChild call. The chapel's candlelit feel
 * now comes from the stained-window glow + vignette tonal grading alone.
 *
 * TODO Foundation follow-up: stop calling this and remove the import.
 */
export function createLightingAccent() {
  const container = new Container();
  container.label = 'lighting-accent-deprecated';
  return container;
}

/**
 * Tall stained-window silhouette to sit behind the Altar waypoint. This is
 * now the chapel's PRIMARY stage-identifier (the signage having been demoted
 * and the lighting accent deleted). It carries two compositional jobs:
 *   1. Stage identity — the warm pane reads "this is a chapel" at thumbnail.
 *   2. Implied light source — the warm glow plays the role the deleted
 *      lightingAccent used to do, but diegetically (light through window).
 *
 * Redo pass: widened from 60 to 80 (more compositional weight) and bumped
 * pane alpha from 0.55 to 0.72 so the warm glow does the work the deleted
 * lightingAccent used to do (diegetically, through the window). Height
 * kept at 180 to avoid colliding with the Altar waypoint marker below, since
 * Foundation positions this container at a fixed y on the back wall.
 *
 * Total bounding box: 80 wide x 180 tall. Caller places top-left at desired
 * spot (typically y ~ 300, x ~ Altar waypoint x minus W/2).
 */
export function createStainedWindowSilhouette() {
  const container = new Container();
  container.label = 'stained-window';

  const frame = PALETTE.CHAPEL_FRAME;
  const glow = PALETTE.COMPOSITION.STAINED_WINDOW_GLOW;

  const W = 80;
  const H = 180;

  // Outer frame — dark stone surround.
  const outer = new Graphics();
  outer.rect(0, 0, W, H).fill(frame);
  container.addChild(outer);

  // Inner warm pane — inset, brighter than before so the window carries the
  // role of the deleted lighting accent.
  const pane = new Graphics();
  pane.rect(10, 12, W - 20, H - 24).fill(glow);
  pane.alpha = 0.72;
  container.addChild(pane);

  // Cross-mullion (vertical + horizontal divider).
  const mullion = new Graphics();
  mullion.rect(W / 2 - 2, 12, 4, H - 24).fill(frame);
  mullion.rect(10, H / 2 - 2, W - 20, 4).fill(frame);
  container.addChild(mullion);

  return container;
}

/**
 * Four-side edge-darken vignette overlay. Each side is implemented as 3
 * stepped-alpha rects to approximate a soft gradient (PIXI Graphics does not
 * give us a free radial). Bottom corners get extra alpha — the player is
 * peering down into the chapel (Part B.1 §7).
 *
 * Caller mounts this on app.stage (NOT world) so it sits above everything
 * including any UI candidates. addChild last.
 *
 * Redo pass: returns a Container with a `resize(viewW, viewH)` method
 * attached so Foundation can call it on `window.resize`. Initial draw uses
 * the canvas defaults; resize() rebuilds all rects to the new viewport so
 * the vignette tracks the actual rendered canvas size rather than the
 * logical CANVAS.WIDTH/HEIGHT.
 *
 * Contract for Foundation:
 *   const vignette = createVignette();
 *   app.stage.addChild(vignette);
 *   window.addEventListener('resize', () =>
 *     vignette.resize(window.innerWidth, window.innerHeight)
 *   );
 *   // Also call once after mount in case initial viewport != 1280x720:
 *   vignette.resize(window.innerWidth, window.innerHeight);
 */
export function createVignette() {
  const container = new Container();
  container.label = 'vignette';

  const dark = PALETTE.COMPOSITION.VIGNETTE;

  const draw = (W, H) => {
    // Clear any previously-drawn band rects before re-drawing for new size.
    container.removeChildren();

    // QA Bug 7 fix (2026-05-30 evening) — both the original 3-stripe stepped
    // approach AND the 24-stripe gradient approach showed visible banding
    // seams in capture and on-screen. Replaced with the SIMPLEST possible
    // edge-darken: one solid rect per side at low alpha. Loses the smooth
    // gradient falloff but is COMPLETELY artifact-free at any viewport size.
    // The chapel art + scene composition carry the focal weight; the vignette
    // is just a subtle edge frame.

    const HORIZ_BAND = Math.round(H * 0.12);
    const VERT_BAND = Math.round(W * 0.08);

    // Single top rect.
    const top = new Graphics();
    top.rect(0, 0, W, HORIZ_BAND).fill(dark);
    top.alpha = 0.4;
    container.addChild(top);

    // Single bottom rect — slightly darker.
    const bottom = new Graphics();
    bottom.rect(0, H - HORIZ_BAND, W, HORIZ_BAND).fill(dark);
    bottom.alpha = 0.5;
    container.addChild(bottom);

    // Single left rect.
    const left = new Graphics();
    left.rect(0, 0, VERT_BAND, H).fill(dark);
    left.alpha = 0.35;
    container.addChild(left);

    // Single right rect.
    const right = new Graphics();
    right.rect(W - VERT_BAND, 0, VERT_BAND, H).fill(dark);
    right.alpha = 0.35;
    container.addChild(right);
  };

  // Initial draw at logical canvas size; Foundation should call resize()
  // after mount and on every window resize to track the real viewport.
  draw(CANVAS.WIDTH, CANVAS.HEIGHT);

  container.resize = (viewW, viewH) => {
    draw(viewW, viewH);
  };

  return container;
}

// ---------------------------------------------------------------------------
// Aldric portrait card (slice "show me who you're hunting")
// ---------------------------------------------------------------------------
// A small corner card that reads "Father Aldric, present in spirit during
// Phase 1". The real walking Aldric ships in slice 3; this placeholder lets
// the player see the target's face while they collect evidence.
//
// Design intent:
//   * Same shape grammar as the ghost priest figure (round head, collar band,
//     vestment body) — that consistency makes the ghosts read as "ALDRIC
//     re-enacting his own crime", not as victims.
//   * Inverted palette from the ghosts/Reaper: WARM CREAM (ALDRIC_BODY /
//     ALDRIC_HEAD), full alpha. The warmth makes Aldric read as ALIVE and
//     in the present — distinct from the cold-cyan witnesses and the
//     near-black Reaper.
//   * Framed like a card (carved stone frame + dim back-pane vignette), so
//     it reads as a UI artifact, not a sprite running around the world.
//   * Returns a PIXI.Container — UI/HUD owns positioning on app.stage.

const ALDRIC_CARD = {
  WIDTH: 120,
  HEIGHT: 160,
  PADDING: 10,       // inset from card edge to portrait area
  FRAME_W: 3,        // carved-stone frame thickness
};

export function createAldricPortraitCard() {
  const container = new Container();
  container.label = 'aldric-portrait-card';

  const { WIDTH: CW, HEIGHT: CH, PADDING: PAD, FRAME_W: FW } = ALDRIC_CARD;

  // Card backing — same stone tone as the cross-plaque signage, so the two
  // bits of HUD furniture share a visual family.
  const backing = new Graphics();
  backing.rect(0, 0, CW, CH).fill(PALETTE.COMPOSITION.CROSS_PLAQUE);
  container.addChild(backing);

  // Inner pane — dimmer recess behind the silhouette, evokes a darkened
  // niche the portrait sits in.
  const pane = new Graphics();
  pane
    .rect(FW, FW, CW - FW * 2, CH - FW * 2)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(pane);

  // Frame highlight — thin warm inner edge so the card reads as "lit from
  // candle light", matching the chapel's diegetic lighting.
  const highlight = new Graphics();
  highlight
    .rect(FW, FW, CW - FW * 2, 1)
    .fill(PALETTE.COMPOSITION.CANDLE_WARM);
  highlight.alpha = 0.5;
  container.addChild(highlight);

  // Inner portrait area — where the Aldric silhouette sits.
  const portraitX = PAD;
  const portraitY = PAD;
  const portraitW = CW - PAD * 2;
  const portraitH = CH - PAD * 2;

  // Aldric silhouette — same shape grammar as the ghost priest (cleric body
  // + round head + collar band), but in WARM CREAM. Pivot bottom-center on
  // the portrait area so the figure stands on the bottom of the card.
  // Scale character to fit within the portrait area while preserving the
  // 40x116 logical Aldric proportions from SCALE.ALDRIC.
  const A = SCALE.ALDRIC;
  // Fit the 40x116 figure into portraitW x portraitH at uniform scale.
  const scale = Math.min(portraitW / A.WIDTH, portraitH / A.HEIGHT);
  const figW = A.WIDTH * scale;
  const figH = A.HEIGHT * scale;
  const figX = portraitX + (portraitW - figW) / 2;
  const figY = portraitY + (portraitH - figH);  // stand on card bottom-pad

  // Body — warm cream vestment.
  const bodyH = A.BODY_H * scale;
  const body = new Graphics();
  body.rect(figX, figY + figH - bodyH, figW, bodyH).fill(PALETTE.ALDRIC_BODY);
  container.addChild(body);

  // Collar band — dark band where head meets body, distinguishes cleric
  // from the headless ghost silhouettes.
  const collarH = A.COLLAR_H * scale;
  const collar = new Graphics();
  collar
    .rect(figX, figY + figH - bodyH, figW, collarH)
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — warm cream circle, sits on top of the body.
  const headR = A.HEAD_R * scale;
  const head = new Graphics();
  head
    .circle(figX + figW / 2, figY + figH - bodyH - headR, headR)
    .fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Subtle vignette inside the card — dim the bottom corners so the figure
  // feels lit from candle above. Two faint corner rects, very low alpha.
  const vignette = new Graphics();
  vignette.rect(FW, CH - FW - 12, CW - FW * 2, 12).fill(PALETTE.COMPOSITION.VIGNETTE);
  vignette.alpha = 0.35;
  container.addChild(vignette);

  return container;
}

// ---------------------------------------------------------------------------
// Environmental storytelling props (ticket #21)
// ---------------------------------------------------------------------------
// Each waypoint area gets 1–3 inline-authored static props that telegraph
// Aldric's four-stage racket (lure → poison → extort → bury). Anti-slasher
// hard line per docs/agents/team-lead.md + scene-composition-spec.md §B.6:
// no gore, no body shapes, no blood, no figurative violence. The horror is
// in implication — discoloration, lumpy fabric, geometric seam.
//
// Coordinates are AUTHORED IN WORLD-LOGICAL SPACE (the 1280x720 logical
// canvas). The composite factory `createConfessionRoomProps` returns a
// Container that callers mount at (0,0) in `world`, so each prop's
// absolute x/y can be hand-tuned against the waypoint x's.
//
// Per ticket "Out of scope": NOT generalized over stage data. Stage 1 only.

// Floor surface top — derived from chapelBounds in confession-room.json
// (y=200, height=420) and SCALE.FRAME.FLOOR_STRIP_H (100). Hard-coded here
// because props are inline-authored for stage 1 only per the ticket.
const PROPS_FLOOR_Y = 520;

/**
 * Altar (waypoint x=220) — LURE / POISON.
 * - Stone altar block on the floor (visual anchor for the chalice).
 * - Faint ring stain on the altar top (poison residue — BROWN discoloration,
 *   NOT red blood).
 * - Two candles flanking the altar (the flames are added separately by
 *   ambientMotion; this draws only the wax pillars).
 * - Four small empty wooden bowls scattered around the altar's edge
 *   (many drank from the chalice).
 */
function buildAltarProps() {
  const c = new Container();
  c.label = 'props-altar';

  // Altar stone block — sits on the floor, just behind the chalice evidence
  // (which is at x=300, y=540). Center on the Altar waypoint (x=220).
  const altarCX = 220;
  const altarW = 110;
  const altarH = 44;
  const altarTopY = PROPS_FLOOR_Y - altarH;

  const block = new Graphics();
  block
    .rect(altarCX - altarW / 2, altarTopY, altarW, altarH)
    .fill(PALETTE.PROPS.ALTAR_STONE);
  c.addChild(block);

  // Top edge trim — slightly lighter, reads as a carved-stone top.
  const trim = new Graphics();
  trim
    .rect(altarCX - altarW / 2, altarTopY, altarW, 4)
    .fill(PALETTE.PROPS.ALTAR_STONE_TRIM);
  c.addChild(trim);

  // Ring stain on altar top — brown discoloration where the poisoned chalice
  // rested. Ellipse, low alpha. Anti-slasher: this is RESIDUE, not blood.
  const stain = new Graphics();
  stain
    .ellipse(altarCX + 18, altarTopY + 10, 14, 4)
    .fill(PALETTE.PROPS.POISON_RING);
  stain.alpha = 0.7;
  c.addChild(stain);
  // Inner ring — same hue, darker, sells the "ring" read.
  const stainInner = new Graphics();
  stainInner
    .ellipse(altarCX + 18, altarTopY + 10, 9, 2)
    .fill(PALETTE.CHAPEL_FRAME);
  stainInner.alpha = 0.4;
  c.addChild(stainInner);

  // Two candle wax pillars flanking the altar. Flames are added separately
  // by ambientMotion (so they can flicker without re-allocating geometry).
  // Positions chosen so they don't occlude the chalice evidence at x=300.
  // Left candle (deeper into the altar interior).
  const leftCandle = drawCandlePillar(altarCX - altarW / 2 + 10, altarTopY - 18, 4, 18);
  c.addChild(leftCandle);
  // Right candle (between altar and chalice).
  const rightCandle = drawCandlePillar(altarCX + altarW / 2 - 14, altarTopY - 18, 4, 18);
  c.addChild(rightCandle);

  // Snuffed candle near the altar — wax pillar only, no flame. The smoke
  // wisp will rise from its wick at (altarCX, altarTopY - 18).
  const snuffed = drawCandlePillar(altarCX - 2, altarTopY - 14, 4, 14);
  c.addChild(snuffed);

  // Empty wooden bowls / cups scattered around the altar base. Tiny squat
  // rects, brown wood tone. Place 4 of them.
  const bowlPositions = [
    [altarCX - altarW / 2 - 12, PROPS_FLOOR_Y - 4],
    [altarCX - altarW / 2 - 26, PROPS_FLOOR_Y - 3],
    [altarCX + altarW / 2 + 8, PROPS_FLOOR_Y - 4],
    [altarCX + altarW / 2 + 22, PROPS_FLOOR_Y - 3],
  ];
  for (const [bx, by] of bowlPositions) {
    const bowl = new Graphics();
    bowl.rect(bx, by, 8, 4).fill(PALETTE.PROPS.WOOD_BOWL);
    c.addChild(bowl);
    // Rim highlight — a single px of lighter wood on top.
    const rim = new Graphics();
    rim.rect(bx, by, 8, 1).fill(PALETTE.PROPS.WOOD_DARK);
    rim.alpha = 0.6;
    c.addChild(rim);
  }

  return c;
}

/**
 * Lectern (waypoint x=500) — SERMON AS LURE.
 * - Tall narrow wooden lectern stand.
 * - Small candle on top of the lectern.
 * - Scattered loose sermon pages on the floor in front.
 */
function buildLecternProps() {
  const c = new Container();
  c.label = 'props-lectern';

  const lecternCX = 500;
  const lecternTopY = PROPS_FLOOR_Y - 60;

  // Lectern shaft — tall thin vertical post.
  const shaft = new Graphics();
  shaft
    .rect(lecternCX - 4, lecternTopY + 8, 8, 52)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(shaft);

  // Lectern slanted top (book rest) — parallelogram angled forward-right.
  const top = new Graphics();
  top
    .poly([
      lecternCX - 18, lecternTopY + 12,
      lecternCX + 18, lecternTopY,
      lecternCX + 18, lecternTopY + 4,
      lecternCX - 18, lecternTopY + 16,
    ])
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(top);

  // Small candle on top of the lectern. Flame added separately.
  const candle = drawCandlePillar(lecternCX + 10, lecternTopY - 10, 3, 10);
  c.addChild(candle);

  // Scattered loose sermon pages on the floor — small parchment rects with
  // slight rotation suggestion (just irregular placement and varied size).
  // Avoid x=580 (where the sermonBook evidence sits — keep pages clear of
  // the pickup geometry).
  const pages = [
    [lecternCX - 40, PROPS_FLOOR_Y - 2, 10, 6],
    [lecternCX - 28, PROPS_FLOOR_Y + 4, 8, 5],
    [lecternCX - 50, PROPS_FLOOR_Y + 8, 9, 5],
    [lecternCX + 28, PROPS_FLOOR_Y + 10, 10, 5],
    [lecternCX + 42, PROPS_FLOOR_Y + 2, 8, 6],
  ];
  for (const [px, py, pw, ph] of pages) {
    const page = new Graphics();
    page.rect(px, py, pw, ph).fill(PALETTE.PROPS.PARCHMENT);
    page.alpha = 0.85;
    c.addChild(page);
    // A single dim horizontal pen-stroke per page to read as "written on".
    const ink = new Graphics();
    ink.rect(px + 1, py + Math.floor(ph / 2), pw - 2, 1).fill(PALETTE.PROPS.WOOD_DARK);
    ink.alpha = 0.6;
    c.addChild(ink);
  }

  return c;
}

/**
 * Confession Booth (waypoint x=780) — EXTORTION.
 * - Booth structure (tall narrow wooden box).
 * - Curtain hanging on the confessor's side.
 * - Small kneeler bench in front (where pilgrims confessed).
 * - Tally marks scratched into the wooden side (count of pilgrims).
 */
function buildBoothProps() {
  const c = new Container();
  c.label = 'props-booth';

  const boothCX = 780;
  const boothW = 78;
  const boothH = 110;
  const boothTopY = PROPS_FLOOR_Y - boothH;

  // Booth back wall — dark wood mass.
  const back = new Graphics();
  back
    .rect(boothCX - boothW / 2, boothTopY, boothW, boothH)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(back);

  // Booth roof trim — lighter wood, reads as a cornice on the box.
  const roof = new Graphics();
  roof
    .rect(boothCX - boothW / 2 - 3, boothTopY, boothW + 6, 6)
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(roof);

  // Vertical divider — splits booth into confessor (left) and penitent
  // (right) compartments. Reads as the lattice partition.
  const divider = new Graphics();
  divider
    .rect(boothCX - 2, boothTopY + 6, 4, boothH - 6)
    .fill(PALETTE.CHAPEL_FRAME);
  c.addChild(divider);

  // Confessor curtain — hanging fabric on the LEFT side. Drawn as a stack
  // of vertical pleats (3 thin rects of muted purple).
  const curtainX = boothCX - boothW / 2 + 4;
  const curtainY = boothTopY + 8;
  const curtainW = (boothW / 2) - 6;
  const curtainH = boothH - 26;
  const curtainBase = new Graphics();
  curtainBase
    .rect(curtainX, curtainY, curtainW, curtainH)
    .fill(PALETTE.PROPS.CURTAIN);
  c.addChild(curtainBase);
  // Three pleat shadows.
  for (let i = 1; i <= 3; i++) {
    const pleat = new Graphics();
    pleat
      .rect(curtainX + (curtainW / 4) * i - 1, curtainY, 2, curtainH)
      .fill(PALETTE.CHAPEL_FRAME);
    pleat.alpha = 0.4;
    c.addChild(pleat);
  }

  // Tally marks scratched into the RIGHT (penitent) side. Eight thin vertical
  // lines in two clusters of 4 (the classic count). Parchment tone.
  // Anti-slasher: scratches into wood read as "count of pilgrims processed",
  // not as wounds. Place at chest height on the back wall RIGHT half.
  const tallyY = boothTopY + 50;
  const tallyBaseX = boothCX + 10;
  for (let i = 0; i < 8; i++) {
    const cluster = Math.floor(i / 4);
    const within = i % 4;
    const tx = tallyBaseX + cluster * 14 + within * 3;
    const tally = new Graphics();
    tally.rect(tx, tallyY, 1, 10).fill(PALETTE.PROPS.TALLY_MARK);
    tally.alpha = 0.75;
    c.addChild(tally);
  }

  // Kneeler bench in front of the booth (penitent side, x ≈ booth right
  // half, on the floor). Small low rect, brown wood. Keep clear of the
  // confessionLedger evidence at x=860 — shift left slightly.
  const kneelerX = boothCX + 6;
  const kneelerW = 40;
  const kneeler = new Graphics();
  kneeler
    .rect(kneelerX, PROPS_FLOOR_Y - 6, kneelerW, 6)
    .fill(PALETTE.PROPS.KNEELER);
  c.addChild(kneeler);
  // Bench legs (two thin verticals so it reads 3D).
  const legL = new Graphics();
  legL.rect(kneelerX + 2, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legL);
  const legR = new Graphics();
  legR.rect(kneelerX + kneelerW - 5, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legR);

  return c;
}

/**
 * Sacristy (waypoint x=1060) — BURIAL IN QUICKLIME.
 *
 * ANTI-SLASHER HARD LINES (mirrors ticket #17 §B.6):
 * - Shroud pile = LUMPY FABRIC, not body silhouette. Drawn as a low
 *   irregular mound of two overlapping ellipses + a fabric corner sticking
 *   up — NEVER a head/torso/limbs profile.
 * - Bricked niche = SUBTLE GEOMETRIC SEAM only, never body-shaped. Drawn as
 *   a rectangular brickwork patch inset into the back wall — a wall patch,
 *   not a tomb cutout.
 * - Lime dust trail = pale dust on the floor leading from the booth toward
 *   the sacristy. Reads as "something dragged this way".
 * - Small candle on a stand.
 */
function buildSacristyProps() {
  const c = new Container();
  c.label = 'props-sacristy';

  const sacCX = 1060;

  // Partially-bricked niche on the back wall — a small rectangular patch
  // of geometric brickwork. Sits well above the floor (back wall area).
  // Anti-slasher: this is masonry, NEVER a body-shaped cutout.
  const nicheX = sacCX - 30;
  const nicheY = 360;
  const nicheW = 60;
  const nicheH = 80;
  const nicheBg = new Graphics();
  nicheBg
    .rect(nicheX, nicheY, nicheW, nicheH)
    .fill(PALETTE.PROPS.BRICK_SEAM);
  c.addChild(nicheBg);
  // Brick courses — horizontal mortar lines + staggered vertical joints.
  // Strictly geometric (anti-slasher).
  const brickH = 10;
  const brickW = 20;
  for (let row = 0; row < Math.floor(nicheH / brickH); row++) {
    const ry = nicheY + row * brickH;
    // Horizontal mortar line.
    const mortar = new Graphics();
    mortar.rect(nicheX, ry, nicheW, 1).fill(PALETTE.PROPS.BRICK_MORTAR);
    c.addChild(mortar);
    // Vertical joints, staggered each row.
    const offset = (row % 2) * (brickW / 2);
    for (let bx = -offset; bx < nicheW; bx += brickW) {
      const joint = new Graphics();
      joint
        .rect(nicheX + bx, ry, 1, brickH)
        .fill(PALETTE.PROPS.BRICK_MORTAR);
      c.addChild(joint);
    }
  }
  // Subtle frame around the niche — implies this is a SET-IN patch of new
  // brickwork, "partially bricked". Top + sides only; bottom blends into floor.
  const nicheFrame = new Graphics();
  nicheFrame.rect(nicheX - 1, nicheY - 1, nicheW + 2, 1).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX - 1, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX + nicheW, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(nicheFrame);

  // Lime dust trail across the floor — pale dust path from the booth area
  // (~x=820) toward the sacristy (~x=1050). A series of overlapping low-alpha
  // pale rects on the floor surface.
  // Place clear of waypoints so it doesn't hide markers.
  const trailY = PROPS_FLOOR_Y + 4;
  const trailSegments = [
    [820, trailY, 30, 4],
    [855, trailY + 2, 28, 4],
    [890, trailY, 32, 4],
    [930, trailY + 3, 30, 4],
    [970, trailY + 1, 32, 4],
    [1010, trailY + 4, 32, 4],
    [1050, trailY + 2, 24, 5],
  ];
  for (const [tx, ty, tw, th] of trailSegments) {
    const dust = new Graphics();
    dust.rect(tx, ty, tw, th).fill(PALETTE.PROPS.LIME_DUST);
    dust.alpha = 0.32;
    c.addChild(dust);
  }
  // Wider dust pool at the sacristy end — suggests where the lime was poured.
  const pool = new Graphics();
  pool
    .ellipse(sacCX - 10, PROPS_FLOOR_Y + 8, 40, 6)
    .fill(PALETTE.PROPS.LIME_DUST);
  pool.alpha = 0.32;
  c.addChild(pool);

  // Lumpy fabric pile in shadow — anti-slasher CRITICAL.
  // Drawn as TWO overlapping low irregular ellipses + one small fabric corner
  // sticking up. NEVER a body silhouette: no head bump, no shoulder line,
  // no torso/leg division. The ellipses are wider than tall (fabric heaped,
  // not lying).
  // Place behind the spade evidence (x=1180 since #22a moved it into the
  // sacristy room) — slightly left of evidence so the spade silhouette still
  // reads cleanly. Sacristy interior is right side.
  const pileCX = 1100;
  const pileCY = PROPS_FLOOR_Y - 4;
  const pileLump1 = new Graphics();
  pileLump1
    .ellipse(pileCX - 8, pileCY + 4, 32, 8)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump1);
  const pileLump2 = new Graphics();
  pileLump2
    .ellipse(pileCX + 10, pileCY + 2, 24, 7)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump2);
  // Shadow underneath — sells "pile on floor" without making it body-shaped.
  const pileShadow = new Graphics();
  pileShadow
    .ellipse(pileCX, pileCY + 10, 42, 3)
    .fill(PALETTE.CHAPEL_FRAME);
  pileShadow.alpha = 0.6;
  c.addChild(pileShadow);
  // Fabric corner sticking up — a small irregular triangular flap of cloth.
  // Important: this is an ABSTRACT corner, NOT a hand/foot/limb. Keep it
  // small, asymmetric, and tonally cream-brown (clearly fabric).
  const flap = new Graphics();
  flap
    .poly([
      pileCX - 6, pileCY - 2,
      pileCX + 2, pileCY - 6,
      pileCX + 6, pileCY + 1,
    ])
    .fill(PALETTE.PROPS.SHROUD_FABRIC_DARK);
  c.addChild(flap);

  // Small candle on a stand at the sacristy.
  // Stand: short vertical post; candle wax on top. Flame added separately.
  const standX = sacCX + 38;
  const standTopY = PROPS_FLOOR_Y - 24;
  const stand = new Graphics();
  stand.rect(standX - 1, standTopY, 3, 24).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(stand);
  const candle = drawCandlePillar(standX - 1, standTopY - 12, 3, 12);
  c.addChild(candle);

  return c;
}

/**
 * Helper — draws a single candle wax pillar at (x, y) with given width and
 * height. Returns a Container so callers can position it absolutely. Flames
 * are NOT part of the wax pillar — they're handled by ambientMotion.js so
 * they can flicker without re-allocating geometry.
 */
function drawCandlePillar(x, y, w, h) {
  const c = new Container();
  c.label = 'candle-wax';
  const wax = new Graphics();
  wax.rect(x, y, w, h).fill(PALETTE.PROPS.PARCHMENT);
  wax.alpha = 0.85;
  c.addChild(wax);
  // Wick — single dark px at top center.
  const wick = new Graphics();
  wick.rect(x + Math.floor(w / 2), y - 1, 1, 2).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(wick);
  return c;
}

/**
 * Composite — all storytelling props for The Confession Room.
 * Returns a Container that callers mount into `world` at (0,0). Props are
 * authored in world-logical (1280x720) coordinates.
 *
 * Z-order discipline (per ticket #21 composition order):
 *   - Mount BETWEEN chapel background and waypoint markers / evidence / ghosts
 *     so props sit ON the chapel floor / back wall but BEHIND the gameplay
 *     midground.
 *   - The brick niche must read on the back wall (not in front of waypoints) —
 *     it is positioned high enough (y=360..440) to sit above the floor strip.
 */
export function createConfessionRoomProps() {
  const container = new Container();
  container.label = 'confession-room-props';
  container.addChild(buildAltarProps());
  container.addChild(buildLecternProps());
  container.addChild(buildBoothProps());
  container.addChild(buildSacristyProps());
  return container;
}

// Coordinates exposed so ambientMotion mount in main.js can place flames at
// the wicks of THE SAME candles drawn above. Single source of truth — if a
// candle position changes here, the flame coordinates change with it.
export const CONFESSION_ROOM_CANDLES = {
  // Altar block top y = PROPS_FLOOR_Y - 44 = 476. Candles are 18 tall, sit
  // on top of altar, wick = (top - 1).
  altarLeft:  { x: 220 - 55 + 10 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  altarRight: { x: 220 + 55 - 14 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  // Snuffed candle — same row, in the middle of the altar.
  altarSnuffed: { x: 220 - 2 + 2,        y: 476 - 14 - 1, flameRadius: 0 },
  // Lectern top candle.
  lecternTop: { x: 500 + 10 + 1,         y: PROPS_FLOOR_Y - 60 - 10 - 1, flameRadius: 3 },
  // Sacristy stand candle.
  sacristyStand: { x: 1060 + 38 - 1 + 1, y: PROPS_FLOOR_Y - 24 - 12 - 1, flameRadius: 3 },
};

// Stained-glass shaft geometry — exposed for DustMotes mount in main.js.
// The window is mounted at (altar.x - 30, 300), W=80, H=180.
// Light shaft drops from the window's lower edge down to the floor surface,
// narrowing slightly. We approximate it as a vertical rectangle directly
// below the window pane, clamped to the floor strip top.
export const STAINED_WINDOW_SHAFT = {
  // Window is at x = altar.x - 30 = 190. Shaft starts inset by 10 (pane
  // inset from window frame), width = pane width (60), drops from window
  // bottom (300 + 180 = 480) to floor top (520). 40px tall shaft.
  x: 190 + 10,
  y: 480,
  width: 60,
  height: PROPS_FLOOR_Y - 480,  // 40
};

// ---------------------------------------------------------------------------
// Father Aldric — in-world walking sprite (slice 3, Phase 2 skeleton)
// ---------------------------------------------------------------------------
// Two factories for the Victim entity:
//   * createAldricWalkingSprite — static silhouette translated along the
//     routine by Victim. Same warm-cream cleric grammar as the portrait card,
//     but lives in world-space and reads "guilty man at work" at thumbnail.
//   * createFatedDeathPose — kneeling / weight-broken still that swaps in
//     when FEAR hits 100. Victim fades alpha to 0; this factory delivers
//     only the pose. ANTI-SLASHER HARD LINE: no gore, no body sprawl,
//     no blood, no contorted limbs. Reads as surrender / spirit broken.
//
// Visual contract vs. siblings:
//   - Reaper: dark hood + lean + eye-slit, 32x124.  (createReaperPlaceholder)
//   - Aldric walking: warm cream + stout + collar band + round head, 40x116.
//   - Ghost replays: pale-cyan gestural poses (kneeling, pouring, etc.),
//     forensic witnesses — NOT Aldric himself.
// All three must read distinct at thumbnail; the walking Aldric is the
// living warm-cream cleric, distinguished from the ghosts' pale-cyan family
// by palette alone.
//
// Pivot grammar matches the Reaper sprite: bottom-center on the sprite's
// logical bounding box, so Victim can place the container at a floor-y
// world coord and the figure stands on that y.

/**
 * Father Aldric walking sprite — in-world placeholder.
 *
 * Logical bounds: 40 wide x 116 tall (per SCALE.ALDRIC). Slightly wider /
 * shorter than the Reaper (32x124) so the silhouette reads as STOUT vs.
 * the Reaper's LEAN at thumbnail.
 *
 * Build order (back to front):
 *   1. Body — warm cream rounded rectangle, tapered slightly at the
 *      shoulders for a "pillowed cleric" read.
 *   2. Robe seam — thin vertical dark line down body center (subtle, low
 *      alpha) hinting at a robe / vestment fold.
 *   3. Collar band — narrow dark horizontal band at neck level. This is
 *      the clergy tell at thumbnail.
 *   4. Head — warm cream circle on top of the collar. No face details
 *      (placeholder discipline; Reaper has the only eye-slit in the cast).
 *
 * No walk-cycle animation in slice 3 — Victim translates this container
 * as a static silhouette. A future slice may add a 2-frame leg shift.
 *
 * Pivot: (WIDTH/2, HEIGHT) — bottom-center, same convention as Reaper.
 */
export function createAldricWalkingSprite() {
  const container = new Container();
  container.label = 'aldric-walking-sprite';

  const { WIDTH, HEIGHT, BODY_W, BODY_H, HEAD_R, COLLAR_H } = SCALE.ALDRIC;

  // Body bottom-aligned within the bounding box; the head sits above it.
  // The body's top-y leaves room for the head (2 * HEAD_R) above.
  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H;

  // Shoulder taper: shave 3px off each side of the upper ~16px of the body
  // so the silhouette reads "rounded shoulders / stout cleric" rather than
  // a flat slab. Implemented as a polygon for the body.
  const shoulderTaper = 3;
  const shoulderH = 16;
  const body = new Graphics();
  body
    .poly([
      bodyX + shoulderTaper, bodyY,
      bodyX + BODY_W - shoulderTaper, bodyY,
      bodyX + BODY_W, bodyY + shoulderH,
      bodyX + BODY_W, bodyY + BODY_H,
      bodyX, bodyY + BODY_H,
      bodyX, bodyY + shoulderH,
    ])
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(body);

  // Robe seam — faint vertical line down the body center, low alpha so it
  // reads as a fold rather than a hard split. Stops short of the collar.
  const seam = new Graphics();
  seam
    .rect(WIDTH / 2 - 0.5, bodyY + COLLAR_H + 4, 1, BODY_H - COLLAR_H - 8)
    .fill(PALETTE.ALDRIC_COLLAR);
  seam.alpha = 0.35;
  container.addChild(seam);

  // Collar band — dark horizontal stripe at the top of the body, the
  // unambiguous "clergy" tell. Sits flush with the body's top edge.
  const collar = new Graphics();
  collar
    .rect(bodyX + shoulderTaper, bodyY, BODY_W - shoulderTaper * 2, COLLAR_H)
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — warm cream circle, sits centered above the collar. Head bottom
  // touches the top of the body so collar + head read as one neck zone.
  const headCX = WIDTH / 2;
  const headCY = bodyY - HEAD_R;
  const head = new Graphics();
  head.circle(headCX, headCY, HEAD_R).fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Pivot bottom-center so Victim can place container.y at the floor y
  // and the sprite stands on that surface (same convention as Reaper).
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

/**
 * Fated Death pose — Aldric kneeling, weight broken.
 *
 * ANTI-SLASHER DISCIPLINE (docs/agents/team-lead.md + touchstone):
 *   - NO gore. NO blood. NO floor-sprawl body shape. NO contorted limbs.
 *   - Reads as SURRENDER / SPIRIT BROKEN, not as corpse.
 *   - Reaper is the quiet consequence — death is implied by the kneel +
 *     the Victim-class alpha fade, never depicted.
 *
 * Composition: Aldric on his knees (legs folded under), body slumped
 * forward, head bowed. Same palette as the walking sprite — recognizably
 * the same character.
 *
 * Logical bounds: 30 wide x 70 tall (compressed because kneeling). Pivot
 * bottom-center so Victim can swap this container in at the same world y
 * as the walking sprite.
 */
export function createFatedDeathPose() {
  const container = new Container();
  container.label = 'aldric-fated-death-pose';

  const WIDTH = 30;
  const HEIGHT = 70;

  // Layout, measured in local logical coords (origin = top-left of bbox):
  //   - Folded legs slab at the floor: 26w x 14h, centered.
  //   - Torso: slumped forward, leans ~6px off vertical to the front (right
  //     in local space). Drawn as a polygon so the slump is visible at
  //     thumbnail rather than a vertical column.
  //   - Collar band at the top of the torso (under the bowed head).
  //   - Head: bowed forward — circle sits slightly forward of the torso's
  //     top so it reads as "looking down at the floor".
  //
  // The slump direction (right) is arbitrary; Victim does not flip — the
  // pose is a still and the chapel's lighting / staging chooses the angle.

  // Folded legs — short rounded slab on the floor. Reads as "knees /
  // shins folded under", not as splayed limbs. Centered horizontally.
  const legsH = 14;
  const legsW = 26;
  const legsX = (WIDTH - legsW) / 2;
  const legsY = HEIGHT - legsH;
  const legs = new Graphics();
  legs
    .roundRect(legsX, legsY, legsW, legsH, 4)
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(legs);

  // Torso — slumped polygon. Base sits on top of the legs, leans forward
  // (to the right in local space) by ~5px at the shoulders.
  const torsoBaseY = legsY;        // top of legs slab
  const torsoTopY = torsoBaseY - 34; // 34px tall torso
  const torsoBaseLeft = legsX + 2;
  const torsoBaseRight = legsX + legsW - 2;
  const torsoLean = 5;
  const torsoTopLeft = torsoBaseLeft + torsoLean;
  const torsoTopRight = torsoBaseRight + torsoLean - 4; // taper at shoulders
  const torso = new Graphics();
  torso
    .poly([
      torsoTopLeft, torsoTopY,
      torsoTopRight, torsoTopY,
      torsoBaseRight, torsoBaseY,
      torsoBaseLeft, torsoBaseY,
    ])
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(torso);

  // Collar band — narrow dark stripe across the top of the slumped torso.
  // Same clergy tell as the walking sprite; preserves character identity
  // through the swap.
  const collarH = 3;
  const collar = new Graphics();
  collar
    .poly([
      torsoTopLeft, torsoTopY,
      torsoTopRight, torsoTopY,
      torsoTopRight, torsoTopY + collarH,
      torsoTopLeft, torsoTopY + collarH,
    ])
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — bowed forward. Centered on the torso's top edge but shifted
  // forward (right) so it reads as "head dropped, looking at the floor",
  // not as "head upright on the shoulders". Slightly smaller radius than
  // the walking sprite's head — the slump foreshortens the read.
  const headR = 10;
  const torsoTopMidX = (torsoTopLeft + torsoTopRight) / 2;
  const headCX = torsoTopMidX + 2;     // forward of torso center
  const headCY = torsoTopY - headR + 2; // slightly overlapping the collar
  const head = new Graphics();
  head.circle(headCX, headCY, headR).fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Pivot bottom-center — Victim swaps this container at the same world
  // (x, floorY) as the walking sprite, so the kneeling figure appears
  // collapsed at the spot Aldric was last walking.
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
