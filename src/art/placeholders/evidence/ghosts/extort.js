// evidence/ghosts/extort.js — buildGhostExtort factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';
import { GHOST_DEFAULT_ALPHA, buildGhostBase } from './builders.js';

export function buildGhostExtort() {
  // Booth / VOICE — priest hunched over the booth ledger, writing fast.
  // Pose: torso bent forward + head tilted down toward the page + writing
  // arm angled down across the body toward the ledger. The penitent's hand
  // on the lattice (left side) remains from the prior version — it is the
  // OTHER half of the scene (parishioner reaching through), not Aldric.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 4,
    headDx: 1,
    headDy: 5,
  });
  container.label = 'ghost-extort';
  const { WIDTH, HEIGHT, HAND_R, ARM_W, ARM_H } = SCALE.GHOST;

  // Writing arm — crosses down-right from the shoulder to the page.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 4,           bodyTopY + 10,
      WIDTH / 2 + 4 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Ledger page silhouette under the writing hand.
  const ledger = new Graphics();
  ledger
    .rect(WIDTH / 2 + 6, bodyTopY + 10 + ARM_H, 16, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(ledger);

  void headCx; void headCy;

  // Penitent's hand silhouette — a small palm (circle) + 4 finger stubs
  // pressed against the lattice at chest height on the left side. The fingers
  // are what distinguish this from an abstract dot — read as "hand reaching
  // through the lattice toward Aldric" per #5's flag (was a dot pre-fix).
  // VP pass 7: bumped finger geometry (was 2x1, ghost α=0.4 made them invisible)
  // and added a short wrist stub so palm reads as connected to body, not floating.
  const handX = WIDTH / 2 - 14;
  const handY = bodyTopY + 30;

  // Wrist stub — short bar from body toward palm, so palm reads "attached".
  const wrist = new Graphics();
  wrist
    .rect(handX, handY - 2, 10, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(wrist);

  // Palm.
  const palm = new Graphics();
  palm.circle(handX, handY, HAND_R).fill(PALETTE.GHOST.ACCENT);
  palm.alpha = 1.0;
  container.addChild(palm);

  // Four finger stubs extending LEFT (toward the booth lattice).
  const fingers = new Graphics();
  const fingerW = 4;
  const fingerH = 2;
  const fingerGap = 3;
  for (let i = 0; i < 4; i++) {
    const fy = handY - (fingerGap * 1.5) + i * fingerGap;
    fingers
      .rect(handX - HAND_R - fingerW + 1, fy, fingerW, fingerH)
      .fill(PALETTE.GHOST.ACCENT);
  }
  fingers.alpha = 1.0;
  container.addChild(fingers);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
