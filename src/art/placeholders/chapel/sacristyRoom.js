// chapel/sacristyRoom.js — createSacristyRoom factory + PALETTE_SACRISTY.
// Split from src/art/placeholders/chapel.js per issue #2 Phase G.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../constants.js';

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
