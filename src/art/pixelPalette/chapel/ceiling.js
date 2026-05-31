// chapel/ceiling.js — createChapelCeilingPixelArt factory.
// Split from src/art/pixelPalette/chapel.js per issue #2 Phase A.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

// ---------------------------------------------------------------------------
// createChapelCeilingPixelArt({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Fills the canvas area ABOVE the chapelBounds back wall — i.e. y ∈ [0, bounds.y].
// Previously this was a black void; user reported the chapel looked "buggy" /
// unfinished above the wall. We render a band of pixel-art clerestory windows
// with warm DAY_LIGHT pouring through, framed by darker STONE_DARK vault.
//
// Composition (back-to-front):
//   1. Vault fill — STONE_DARK rect across the entire y ∈ [0, bounds.y] band.
//   2. Mullioned clerestory windows — three tall narrow stained-glass windows
//      arrayed across the back wall, each a stone frame with a DAY_LIGHT pane
//      and a single cross-mullion. Reads as "gothic chapel daylight from above".
//   3. Vault ribs — two thin STONE_LIGHT vertical accents at 1/3 and 2/3 of
//      the canvas width, terminating at the bottom of the ceiling band. Reads
//      as "rib-vault converging" without rendering literal arches.
//
// Discipline (anti-slasher):
//   * Stone palette only. Warm daylight through panes = cream, NOT red.
//   * No figures, no carvings, no body-shaped imagery.
//   * Daylight bias is muted DAY_LIGHT — the chapel is day-phase, lit but
//     gravitas-heavy, not cheerful.
export function createChapelCeilingPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelCeilingPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-ceiling-pixel-day';

  const tile = 16;
  const ceilTop = 0;
  const ceilBottom = bounds.y; // top of the back wall
  const ceilH = ceilBottom - ceilTop;
  const canvasW = 1280;

  // -------- 1. Vault fill --------
  const fill = new Graphics();
  fill.rect(0, ceilTop, canvasW, ceilH).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(fill);

  // 1px STONE_MORTAR mortar courses every 16px down the vault — reads as
  // stone tessellation without needing per-block tiling for the upper void.
  const courses = new Graphics();
  for (let y = ceilTop + tile; y < ceilBottom; y += tile) {
    courses.rect(0, y, canvasW, 1).fill(PIXEL_PALETTE.STONE_MORTAR);
  }
  courses.alpha = 0.6;
  container.addChild(courses);

  // -------- 2. Clerestory windows --------
  // Three windows spaced across the canvas width. Each is 48 wide × 96 tall,
  // sits with its bottom 24 px above the back-wall top so it doesn't crash
  // into the cornice. Frame STONE_BASE, pane DAY_LIGHT, cross-mullion STONE_DARK.
  const WIN_W = 48;
  const WIN_H = 96;
  const winBottomMargin = 24;
  const winY = Math.max(ceilTop + 16, ceilBottom - winBottomMargin - WIN_H);
  const winXs = [
    Math.round(canvasW * 0.18) - WIN_W / 2,
    Math.round(canvasW * 0.50) - WIN_W / 2,
    Math.round(canvasW * 0.82) - WIN_W / 2,
  ];
  for (const wx of winXs) {
    const winX = snap(wx, tile);
    // Outer frame.
    const frame = new Graphics();
    frame.rect(winX, winY, WIN_W, WIN_H).fill(PIXEL_PALETTE.STONE_BASE);
    container.addChild(frame);
    // 1px highlight on top of frame.
    const frameHi = new Graphics();
    frameHi.rect(winX, winY, WIN_W, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    container.addChild(frameHi);
    // Pane — inset 6 px on all sides.
    const pane = new Graphics();
    pane
      .rect(winX + 6, winY + 6, WIN_W - 12, WIN_H - 12)
      .fill(PIXEL_PALETTE.DAY_LIGHT);
    pane.alpha = 0.85;
    container.addChild(pane);
    // Cross-mullion — vertical + horizontal stone bars, 2px each.
    const mullion = new Graphics();
    mullion
      .rect(winX + WIN_W / 2 - 1, winY + 6, 2, WIN_H - 12)
      .fill(PIXEL_PALETTE.STONE_DARK);
    mullion
      .rect(winX + 6, winY + WIN_H / 2 - 1, WIN_W - 12, 2)
      .fill(PIXEL_PALETTE.STONE_DARK);
    container.addChild(mullion);
    // Pointed-arch cap on top of the window — three stepped STONE_BASE blocks
    // narrowing toward a 4px point. Lifts the clerestory read above "flat box".
    const cap = new Graphics();
    const capSteps = [
      { inset: 18, h: 4 },
      { inset: 12, h: 4 },
      { inset: 6,  h: 4 },
    ];
    for (let i = 0; i < capSteps.length; i++) {
      const step = capSteps[i];
      const sx = winX + step.inset;
      const sw = WIN_W - step.inset * 2;
      const sy = winY - capSteps.length * step.h + i * step.h;
      cap.rect(sx, sy, sw, step.h).fill(PIXEL_PALETTE.STONE_BASE);
      cap.rect(sx, sy, sw, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
    container.addChild(cap);
  }

  // -------- 3. Vault ribs (subtle vertical stone accents) --------
  // Two ribs at 1/3 and 2/3 canvas width, just visual depth cues.
  const ribs = new Graphics();
  for (const fx of [1 / 3, 2 / 3]) {
    const rx = Math.round(canvasW * fx);
    ribs.rect(rx, ceilTop, 2, ceilH).fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  ribs.alpha = 0.35;
  container.addChild(ribs);

  // -------- 4. Cornice strip — the boundary band between ceiling and wall.
  // 4px STONE_BASE strip just above the back-wall top.
  const cornice = new Graphics();
  cornice
    .rect(0, ceilBottom - 4, canvasW, 4)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(cornice);
  const corniceHi = new Graphics();
  corniceHi
    .rect(0, ceilBottom - 4, canvasW, 1)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  container.addChild(corniceHi);

  return container;
}
