// chapel.js — chapel background, sacristy room, door arch.
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from './constants.js';

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

