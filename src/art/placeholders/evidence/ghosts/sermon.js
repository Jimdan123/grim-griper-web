// evidence/ghosts/sermon.js — buildGhostSermon factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';
import { GHOST_DEFAULT_ALPHA, buildGhostBase } from './builders.js';

export function buildGhostSermon() {
  // Lectern / WHISPER — priest mid-sermon-tilt, leaning over the lectern.
  // Forward lean of the torso + downward-tilted head reading off the page,
  // plus one arm extended forward/down resting on the lectern edge holding
  // an open sermon book (small ochre-toned rect held in front of the chest).
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 6,
    headDx: 2,
    headDy: 4,
  });
  container.label = 'ghost-sermon';
  const { WIDTH, HEIGHT, ARM_W, ARM_H } = SCALE.GHOST;

  // Forward-extended arm — reaches out and slightly down toward the lectern.
  const arm = new Graphics();
  arm
    .rect(WIDTH / 2 + 8, bodyTopY + 16, ARM_W + 2, ARM_H - 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Small book silhouette held flat in front, just below the head — the
  // sermon being read. Drawn in the same ghost-accent tone so it reads as
  // PART OF the vision, not a separate evidence pickup.
  const book = new Graphics();
  book
    .rect(headCx + 2, headCy + 8, 12, 6)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(book);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
