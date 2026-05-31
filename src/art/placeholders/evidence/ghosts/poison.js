// evidence/ghosts/poison.js — buildGhostPoison factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';
import { GHOST_DEFAULT_ALPHA, buildGhostBase } from './builders.js';

export function buildGhostPoison() {
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
