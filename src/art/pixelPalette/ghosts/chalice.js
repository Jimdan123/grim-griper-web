// ghosts/chalice.js — createPixelArtChaliceGhost factory.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';
import {
  PIXEL_GHOST_ALPHA,
  buildPixelAldricSilhouette,
  buildPixelPilgrimSilhouette,
} from './builders.js';

/**
 * CHALICE GHOST (at altar) — Aldric pouring poison into a chalice held by
 * a kneeling pilgrim.
 *
 *   Aldric — collared, standing upright, arm extended downward in a pouring
 *   gesture.
 *   Pilgrim — kneeling, head bowed in supplication.
 *
 * Reads at glance: priest poisons pilgrim's communion.
 */
export function createPixelArtChaliceGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-chalice';

  // Logical bounds: 64 wide × 56 tall. Pivot bottom-center.
  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric standing on the LEFT, pouring DOWN-RIGHT.
  const aldricCx = 20;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: 1,
  });
  container.addChild(aldric.g);

  // Pouring arm — extends down-right from Aldric's shoulder toward the
  // pilgrim's head. Drawn as two 2-px stepped stair rects (down-right).
  const arm = new Graphics();
  const armStartX = aldric.bodyX + 14; // Aldric's right shoulder
  const armStartY = aldric.bodyTop + 4;
  // Stair-stepped arm: 3 steps each (4 wide × 2 tall) angling down-right.
  arm.rect(armStartX, armStartY, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(armStartX + 3, armStartY + 2, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(armStartX + 6, armStartY + 4, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);
  // Pouring vessel — 4×3 GHOST_PALE block at the hand tip. Slightly tilted
  // suggestion (a single 1px extension on its right side reads as the lip).
  const vessel = new Graphics();
  vessel.rect(armStartX + 9, armStartY + 6, 4, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  vessel.rect(armStartX + 13, armStartY + 7, 1, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(vessel);
  // Pouring stream — 1px column of GHOST_PALE pixels dropping from vessel
  // toward the chalice in pilgrim's hands. NOT red — just translucent cyan.
  const stream = new Graphics();
  stream.rect(armStartX + 11, armStartY + 9, 1, 6).fill(PIXEL_PALETTE.GHOST_PALE);
  stream.alpha = 0.7;
  container.addChild(stream);

  // Pilgrim kneeling on the RIGHT, holding chalice up toward Aldric.
  const pilgrimCx = 42;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'kneeling',
  });
  container.addChild(pilgrim.g);

  // Chalice held by pilgrim — 4×3 GHOST_PALE block in front of pilgrim chest,
  // just below where the poison stream lands.
  const pilgrimChalice = new Graphics();
  pilgrimChalice
    .rect(pilgrimCx - 2, feetY - 18, 4, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  // Stem.
  pilgrimChalice
    .rect(pilgrimCx - 1, feetY - 15, 2, 2)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(pilgrimChalice);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}
