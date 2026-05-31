// chapel/exterior.js — createChapelExteriorPixelArt factory.
// Split from src/art/pixelPalette/chapel.js per issue #2 Phase A.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

// ---------------------------------------------------------------------------
// createChapelExteriorPixelArt({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Fills the area to the LEFT of chapelBounds — i.e. x ∈ [0, bounds.x] — where
// the Reaper spawns and walks toward the front door. Previously this was a
// flat black void; user wants to spawn outside the chapel and walk in via the
// door.
//
// Composition (back-to-front):
//   1. Pre-dusk sky band — NIGHT_AMBIENT band fills the upper portion
//      (above the path). Reads as "outside, late afternoon edging toward dusk".
//   2. Path/cobble band — repeating 16×8 STONE_BASE cobble tiles with darker
//      STONE_MORTAR grout, filling the floor level. The path leads RIGHT
//      toward the chapel door.
//   3. Grass tuft accents — a few darker (STONE_DARK family) 2×2 specks at
//      path edges, tonal life only. No bushes / no trees / no buildings.
//
// Discipline:
//   * No people, no second buildings, no church-on-the-horizon.
//   * Sky is muted blue-purple — NOT bright daylight. The day phase is muted.
//   * No red anywhere.
export function createChapelExteriorPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelExteriorPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-exterior-pixel-day';

  const FLOOR_BAND_H = 96;
  const extLeft = 0;
  const extRight = bounds.x;       // exterior ends where the chapel wall begins
  const extW = extRight - extLeft;
  const extTop = 0;
  const extBottom = bounds.y + bounds.height; // canvas-floor alignment with chapel
  const floorTopY = bounds.y + bounds.height - FLOOR_BAND_H;

  // -------- 1. Sky band --------
  // From y=0 down to floorTopY.
  const sky = new Graphics();
  sky.rect(extLeft, extTop, extW, floorTopY).fill(PIXEL_PALETTE.NIGHT_AMBIENT);
  container.addChild(sky);

  // Subtle horizontal "haze" bands — 1px STONE_DARK lines every 32px, low
  // alpha. Reads as atmospheric depth without rendering literal clouds.
  const haze = new Graphics();
  for (let y = 16; y < floorTopY; y += 32) {
    haze.rect(extLeft, y, extW, 1).fill(PIXEL_PALETTE.STONE_DARK);
  }
  haze.alpha = 0.3;
  container.addChild(haze);

  // -------- 2. Path/cobble band --------
  // Floor band: repeating 16×8 cobble tiles. Two staggered rows per 16px tile
  // height. STONE_BASE stones with STONE_MORTAR grout between them.
  const pathBase = new Graphics();
  pathBase
    .rect(extLeft, floorTopY, extW, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(pathBase);

  const COB_W = 16;
  const COB_H = 8;
  const cobbles = new Graphics();
  for (let row = 0, ry = floorTopY; ry + COB_H <= extBottom; row++, ry += COB_H) {
    const offset = (row % 2 === 0) ? 0 : COB_W / 2;
    for (let bx = extLeft - offset; bx < extRight; bx += COB_W) {
      const cellX = Math.max(bx + 1, extLeft);
      const cellY = ry + 1;
      const cellR = Math.min(bx + COB_W - 1, extRight);
      const cellB = ry + COB_H - 1;
      const drawW = cellR - cellX;
      const drawH = cellB - cellY;
      if (drawW <= 0 || drawH <= 0) continue;
      cobbles.rect(cellX, cellY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      // 1px top highlight on each cobble.
      cobbles.rect(cellX, cellY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
  }
  container.addChild(cobbles);

  // -------- 2b. Path edge — darker line where path meets the sky --------
  const pathEdge = new Graphics();
  pathEdge
    .rect(extLeft, floorTopY - 1, extW, 1)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(pathEdge);

  // -------- 3. Grass tufts at path edges --------
  // Three 2×2 specks of muted color at the top edge of the cobble band, at
  // pseudo-random x positions. Tonal life only.
  const tufts = new Graphics();
  const tuftSpots = [
    [extLeft + 14, floorTopY - 2],
    [extLeft + 38, floorTopY - 2],
    [extLeft + 62, floorTopY - 2],
  ];
  for (const [tx, ty] of tuftSpots) {
    if (tx + 2 > extRight) continue;
    tufts.rect(tx, ty, 2, 2).fill(PIXEL_PALETTE.WOOD_DARK);
  }
  tufts.alpha = 0.7;
  container.addChild(tufts);

  // -------- 3b. Chapel-wall shadow at the right edge --------
  // 4px STONE_DARK band hugging x = extRight, suggests the shadow the chapel
  // wall casts onto the exterior path.
  const wallShadow = new Graphics();
  wallShadow
    .rect(extRight - 4, floorTopY, 4, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  wallShadow.alpha = 0.5;
  container.addChild(wallShadow);

  return container;
}
