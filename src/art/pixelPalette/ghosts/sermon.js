// ghosts/sermon.js — createPixelArtSermonGhost factory.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';
import {
  PIXEL_GHOST_ALPHA,
  buildPixelAldricSilhouette,
  buildPixelPilgrimSilhouette,
} from './builders.js';

/**
 * SERMON GHOST (at lectern) — Aldric at the lectern leaning over the book,
 * gesturing toward a standing pilgrim in front of him.
 *
 *   Aldric — collared, leaning forward, one arm extended forward (gesture).
 *   Pilgrim — standing in supplicant posture, head slightly bowed.
 *
 * Reads at glance: priest gives the lure-sermon; pilgrim listens.
 */
export function createPixelArtSermonGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-sermon';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric leaning forward on the LEFT.
  const aldricCx = 18;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: 2,
  });
  container.addChild(aldric.g);

  // Lectern silhouette in front of Aldric — small wedge-shape, GHOST_PALE.
  const lectern = new Graphics();
  // Vertical post.
  lectern.rect(aldricCx + 10, feetY - 22, 3, 22).fill(PIXEL_PALETTE.GHOST_PALE);
  // Slanted top — 3 stepped rows for the book-rest.
  lectern.rect(aldricCx + 7, feetY - 26, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  lectern.rect(aldricCx + 8, feetY - 25, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  lectern.rect(aldricCx + 9, feetY - 24, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lectern);

  // Aldric's gesturing arm — extends RIGHT toward the pilgrim, at chest level.
  const arm = new Graphics();
  arm
    .rect(aldric.bodyX + 14, aldric.bodyTop + 6, 8, 2)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(aldric.bodyX + 20, aldric.bodyTop + 4, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);

  // Pilgrim standing on the RIGHT, head slightly bowed.
  const pilgrimCx = 46;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'standing',
  });
  container.addChild(pilgrim.g);
  // Subtle bowed-head suggestion — paint a 6×1 GHOST_PALE strip just below
  // the head to merge head into shoulders, suggesting forward tilt.
  const bowedY = pilgrim.footprint.headTop + pilgrim.footprint.HEAD_H;
  const bowed = new Graphics();
  bowed
    .rect(pilgrim.footprint.headX, bowedY, 6, 1)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(bowed);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}
