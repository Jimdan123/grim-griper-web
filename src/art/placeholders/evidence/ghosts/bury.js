// evidence/ghosts/bury.js — buildGhostBury factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';
import { GHOST_DEFAULT_ALPHA, buildGhostBase } from './builders.js';

export function buildGhostBury() {
  // Sacristy / RISE — priest dragging a shroud / spading lime. Strong
  // forward bend at the waist (gravedigger posture) + head down + both arms
  // forward-low: one extended out gripping a spade shaft, the other tugging
  // the shroud across the floor.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 9,
    headDx: 3,
    headDy: 8,
  });
  container.label = 'ghost-bury';
  const { WIDTH, HEIGHT, ARM_W, ARM_H, SHROUD_W, SHROUD_H } = SCALE.GHOST;

  // Dragged shroud — low horizontal rect at floor level, offset right.
  // Drawn at full alpha; the parent container alpha (GHOST_DEFAULT_ALPHA=0.4)
  // attenuates it. Was 0.7 here → effective 0.28, too faint to read.
  const shroud = new Graphics();
  shroud
    .rect(WIDTH / 2 + 4, HEIGHT - SHROUD_H, SHROUD_W, SHROUD_H)
    .fill(PALETTE.GHOST.FLOOR_MARK);
  shroud.alpha = 1.0;
  container.addChild(shroud);

  // Pulling arm — angles from the shoulder down toward the shroud.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 8,           bodyTopY + 10,
      WIDTH / 2 + 8 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H + 6,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Spade shaft — thin diagonal accent from the hand toward the floor,
  // suggesting the tool in the dragging hand. Same accent tone (vision).
  const spade = new Graphics();
  spade
    .poly([
      WIDTH / 2 + 12, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 16, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 22, HEIGHT - SHROUD_H,
      WIDTH / 2 + 18, HEIGHT - SHROUD_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(spade);

  void headCx; void headCy;

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
