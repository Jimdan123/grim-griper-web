// ghosts/builders.js — shared silhouette helpers + alpha constant for the
// pixel-art two-figure crime-act ghost replays.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.
//
// Internal-only helpers, but exported so the per-ghost sibling files can
// import them. Not intended as part of the public art-layer API.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

// ---------------------------------------------------------------------------
// Pixel-art ghost replays — TWO-FIGURE CRIME ACTS
// ---------------------------------------------------------------------------
// Per dispatch §E: re-author the ghost replays so they SHOW the crime acts.
// Each composition has TWO figures: Aldric (collared priest) + a pilgrim
// (kneeling/standing/shrouded). Both translucent low-alpha cyan GHOST_PALE.
//
// ANTI-SLASHER ABSOLUTES (held throughout):
//   * No blood color anywhere — discoloration only (none in ghosts).
//   * No body shapes for shrouded forms — fabric lump only.
//   * No violence depiction — pour, lean, write, drag.
//   * Pilgrim is kneeling / standing / shrouded — never sprawled / contorted.
//   * Translucent 0.4 alpha cyan — both figures, same alpha.
//   * No facial detail — no eyes, mouths, expressions.
//
// Each factory returns a PIXI.Container with pivot bottom-center at (W/2, H)
// so callers can place them at ghostX / ghostY like the painterly equivalents.

export const PIXEL_GHOST_ALPHA = 0.4;

// Shared pixel-figure builders. Both Aldric and the pilgrim are simple
// blocky silhouettes in GHOST_PALE — Aldric distinguishable from the pilgrim
// by the collar band and the stout proportion.

export function buildPixelAldricSilhouette({
  cx,
  feetY,
  leanX = 0,
  pose = 'upright',  // 'upright' | 'lean' | 'hunched'
}) {
  // Returns a Graphics drawn into a fresh sub-container. Aldric is 16 wide
  // × 32 tall. Collar band reads as the clergy tell. The cyan tone marks
  // this as a SPECTRAL memory, not a literal figure on stage.
  const g = new Graphics();
  const BODY_W = 16;
  const BODY_H = 22;
  const HEAD_W = 8;
  const HEAD_H = 8;
  const COLLAR_H = 2;

  let bodyX = cx - BODY_W / 2;
  let headX = cx - HEAD_W / 2;
  let bodyTop = feetY - BODY_H;
  let headTop = bodyTop - HEAD_H;

  // Lean / hunch adjustments — shift head + top-half of body slightly.
  if (pose === 'lean' || pose === 'hunched') {
    headX += leanX;
    bodyX += Math.floor(leanX * 0.5);
    if (pose === 'hunched') {
      headTop += 2;
      bodyTop += 2;
    }
  }

  // Body.
  g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
  // Collar band — drawn over the top of the body.
  g.rect(bodyX, bodyTop, BODY_W, COLLAR_H).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Head.
  g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);

  return { g, bodyX, bodyTop, headX, headTop };
}

export function buildPixelPilgrimSilhouette({
  cx,
  feetY,
  pose = 'standing', // 'standing' | 'kneeling'
}) {
  // Pilgrim is 12 wide × variable tall depending on pose. NO collar.
  const g = new Graphics();
  if (pose === 'kneeling') {
    // Kneeling pilgrim: 12 wide × 18 tall. Body is a squat block, head bowed
    // (smaller and lower than a standing head).
    const BODY_W = 12;
    const BODY_H = 12;
    const HEAD_W = 6;
    const HEAD_H = 5;
    const bodyX = cx - BODY_W / 2;
    const bodyTop = feetY - BODY_H;
    const headX = cx - HEAD_W / 2;
    const headTop = bodyTop - HEAD_H + 1; // head bowed forward = lower
    g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
    g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);
    return {
      g,
      footprint: { bodyX, bodyTop, BODY_W, BODY_H, headX, headTop, HEAD_W, HEAD_H },
    };
  }
  // Standing.
  const BODY_W = 12;
  const BODY_H = 22;
  const HEAD_W = 6;
  const HEAD_H = 6;
  const bodyX = cx - BODY_W / 2;
  const bodyTop = feetY - BODY_H;
  const headX = cx - HEAD_W / 2;
  const headTop = bodyTop - HEAD_H;
  g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
  g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);
  return {
    g,
    footprint: { bodyX, bodyTop, BODY_W, BODY_H, headX, headTop, HEAD_W, HEAD_H },
  };
}
