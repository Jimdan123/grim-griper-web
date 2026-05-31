// ghosts/sacristy.js — createPixelArtSacristyGhost factory.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';
import {
  PIXEL_GHOST_ALPHA,
  buildPixelAldricSilhouette,
} from './builders.js';

/**
 * SACRISTY GHOST (where burial happens) — Aldric dragging a SHROUDED FORM
 * across the floor.
 *
 *   Aldric — collared, standing upright with arms extended BEHIND him pulling.
 *   Shrouded form — LUMPY FABRIC SHAPE (sack-of-grain read), NOT body-shaped.
 *
 * HARD ANTI-SLASHER LINE: shroud is FABRIC. No limbs, no head outline, no
 * contortion. Drawn as 3 overlapping low irregular rects at floor level —
 * the silhouette is LUMPY (wider than tall), never figural.
 *
 * Reads at glance: priest disposes of the victim.
 */
export function createPixelArtSacristyGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-sacristy';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric on the RIGHT, dragging shroud to the LEFT (his back to the
  // direction of motion — both arms reaching back-left).
  const aldricCx = 44;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: -1,  // slight backward lean as he pulls
  });
  container.addChild(aldric.g);

  // Dragging arms — both arms extend DOWN-LEFT toward the shroud.
  const dragArmTop = aldric.bodyTop + 10;
  const arms = new Graphics();
  // Left arm.
  arms.rect(aldric.bodyX - 2, dragArmTop, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arms.rect(aldric.bodyX - 6, dragArmTop + 2, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  // Right arm (just behind / parallel).
  arms.rect(aldric.bodyX - 1, dragArmTop + 4, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arms);

  // Rope / cloth grip — 1px GHOST_PALE strand connecting hand to shroud.
  const grip = new Graphics();
  grip.rect(aldric.bodyX - 8, dragArmTop + 6, 14, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  grip.alpha = 0.7;
  container.addChild(grip);

  // Shroud — LUMPY FABRIC PILE on the floor LEFT of Aldric.
  // Three overlapping low rects + a small fabric "corner" sticking up.
  // Strictly LUMPY: each rect is much WIDER than tall (>3:1 aspect),
  // never columnar/figural.
  const shroudCx = 14;
  const shroudY = feetY - 6;
  const lump1 = new Graphics();
  lump1.rect(shroudCx - 10, shroudY, 22, 5).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump1);
  const lump2 = new Graphics();
  lump2.rect(shroudCx - 6, shroudY - 3, 14, 4).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump2);
  const lump3 = new Graphics();
  lump3.rect(shroudCx + 2, shroudY - 1, 10, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump3);
  // Small fabric corner sticking up — 3×3 GHOST_PALE block offset from main.
  // Asymmetric. NOT a head, NOT a limb. Reads as "fabric corner of the sack".
  const fabricCorner = new Graphics();
  fabricCorner
    .rect(shroudCx - 8, shroudY - 5, 3, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(fabricCorner);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}
