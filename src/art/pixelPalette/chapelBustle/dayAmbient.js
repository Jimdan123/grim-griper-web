// chapelBustle/dayAmbient.js — createChapelDayAmbientPixelArt factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

// Composite — all pixel-art interior props for The Confession Room.
// Mounted by Stage.js when render mode is PIXELART.
export function createChapelDayAmbientPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelDayAmbientPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-day-ambient';

  const tile = 16;
  const x0 = snap(bounds.x, tile);
  const y0 = snap(bounds.y, tile);
  const w = snap(bounds.width, tile);
  const h = snap(bounds.height, tile);
  const FLOOR_BAND_H = 96;
  const floorTopY = y0 + h - FLOOR_BAND_H;

  // -------- 1. Sun shafts from the clerestory band onto the floor --------
  // Six shafts spaced along the wall, each a tall narrow trapezoid that
  // widens toward the floor (rendered as a stacked-rect pixel-art trapezoid:
  // narrow at top, widening every ~16 px downward).
  //
  // POLISH PASS 2026-05-30 (late): bumped alpha 0.10 → 0.28 and widened the
  // top/bottom spread so the shafts visibly pour onto the floor. Previous
  // build read as "subtle highlight"; we want "bright midday beams".
  const SHAFT_TOP_W = 18;
  const SHAFT_BOT_W = 52;
  const SHAFT_TOP_Y = y0 + 24;           // just below the cornice
  const SHAFT_BOT_Y = floorTopY + 24;    // bleeds onto the floor
  const SHAFT_H = SHAFT_BOT_Y - SHAFT_TOP_Y;
  const SHAFT_STEPS = 8;
  const stepW = (SHAFT_BOT_W - SHAFT_TOP_W) / SHAFT_STEPS;
  const stepH = Math.floor(SHAFT_H / SHAFT_STEPS);

  // Tile-aligned x positions across the chapel — six shafts, evenly spaced.
  const SHAFT_XS = [192, 384, 576, 720, 880, 1072];

  const shafts = new Graphics();
  for (const sx of SHAFT_XS) {
    const cx = snap(sx, tile);
    for (let i = 0; i < SHAFT_STEPS; i++) {
      const stepWidth = Math.round(SHAFT_TOP_W + stepW * i);
      const y = SHAFT_TOP_Y + i * stepH;
      shafts
        .rect(cx - stepWidth / 2, y, stepWidth, stepH)
        .fill(PIXEL_PALETTE.DAY_LIGHT);
    }
  }
  shafts.alpha = 0.28; // bright midday pour — was 0.10
  container.addChild(shafts);

  // -------- 2. Warm cream wash over the whole chapel --------
  // POLISH PASS: alpha 0.07 → 0.22. The chapel needs to read as bathed in
  // midday warmth, not "lightly tinted dusk".
  const wash = new Graphics();
  wash
    .rect(x0, y0, w, h)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  wash.alpha = 0.22;
  container.addChild(wash);

  // -------- 3. Floor brightening pass --------
  // POLISH PASS: alpha 0.09 → 0.18. Sun-through-window hits the floor harder
  // than the wall band, so floor reads markedly brighter than mid-wall.
  const floorWash = new Graphics();
  floorWash
    .rect(x0, floorTopY, w, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  floorWash.alpha = 0.18;
  container.addChild(floorWash);

  // -------- 4. Upper-stone STONE_LIGHT highlight pass --------
  // POLISH PASS: subtle 1px highlight on top of stone-block rows in the
  // upper third of the chapel — "the high sun catches the upper stones".
  // One single Graphics with stacked thin rects (cheap, single draw call).
  const upperThirdH = Math.floor((floorTopY - y0) / 3);
  const highlightRows = new Graphics();
  const BLOCK_H = 16;
  for (let ry = y0 + BLOCK_H; ry < y0 + upperThirdH; ry += BLOCK_H * 2) {
    // Sparse — every 32px (every other block row) — keeps it from flattening.
    highlightRows.rect(x0, ry, w, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  highlightRows.alpha = 0.12;
  container.addChild(highlightRows);

  return container;
}
