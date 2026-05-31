// ghosts/confessionBooth.js — createPixelArtConfessionBoothGhost factory.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';
import {
  PIXEL_GHOST_ALPHA,
  buildPixelAldricSilhouette,
  buildPixelPilgrimSilhouette,
} from './builders.js';

/**
 * CONFESSION BOOTH GHOST (inside the booth) — Aldric hunched writing in the
 * ledger inside the booth while a pilgrim kneels on the OTHER side of the
 * lattice grille, head pressed to the wood.
 *
 *   Aldric — collared, hunched, head down, writing-arm extended down-left.
 *   Pilgrim — kneeling on the opposite side, head leaning into the lattice.
 *   Lattice — vertical line of paired GHOST_PALE dashes between them.
 *
 * Reads at glance: priest records the dying confession.
 */
export function createPixelArtConfessionBoothGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-booth';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric hunched on the LEFT inside the booth.
  const aldricCx = 20;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'hunched',
    leanX: 2,
  });
  container.addChild(aldric.g);

  // Writing arm — extends DOWN from Aldric's chest, ending at a small page
  // silhouette (the ledger) in his lap.
  const arm = new Graphics();
  arm.rect(aldric.bodyX + 10, aldric.bodyTop + 8, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(aldric.bodyX + 12, aldric.bodyTop + 10, 3, 4).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);
  // Ledger page in lap.
  const ledger = new Graphics();
  ledger.rect(aldric.bodyX + 10, aldric.bodyTop + 14, 8, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(ledger);

  // Lattice grille between them — vertical dashed line at x=32 (booth center).
  const lattice = new Graphics();
  const latticeX = 32;
  const latticeTop = feetY - 32;
  const latticeBottom = feetY - 4;
  for (let ly = latticeTop; ly < latticeBottom; ly += 4) {
    lattice.rect(latticeX, ly, 1, 2).fill(PIXEL_PALETTE.GHOST_PALE);
    lattice.rect(latticeX + 2, ly, 1, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  }
  lattice.alpha = 0.6;
  container.addChild(lattice);

  // Pilgrim kneeling on the RIGHT, head pressed toward lattice.
  const pilgrimCx = 44;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'kneeling',
  });
  container.addChild(pilgrim.g);
  // Lean the pilgrim's head LEFT toward the lattice — paint a 2×3 GHOST_PALE
  // stub extending from the head toward the lattice. Reads as "head pressed".
  const headLean = new Graphics();
  headLean
    .rect(pilgrim.footprint.headX - 2, pilgrim.footprint.headTop + 1, 2, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(headLean);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}
