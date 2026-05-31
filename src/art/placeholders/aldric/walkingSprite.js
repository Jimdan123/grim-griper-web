// aldric/walkingSprite.js — createAldricWalkingSprite factory.
// Split from src/art/placeholders/aldric.js per issue #2 Phase H.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../constants.js';

// ---------------------------------------------------------------------------
// Father Aldric — in-world walking sprite (slice 3, Phase 2 skeleton)
// ---------------------------------------------------------------------------
// Two factories for the Victim entity:
//   * createAldricWalkingSprite — static silhouette translated along the
//     routine by Victim. Same warm-cream cleric grammar as the portrait card,
//     but lives in world-space and reads "guilty man at work" at thumbnail.
//   * createFatedDeathPose — kneeling / weight-broken still that swaps in
//     when FEAR hits 100. Victim fades alpha to 0; this factory delivers
//     only the pose. ANTI-SLASHER HARD LINE: no gore, no body sprawl,
//     no blood, no contorted limbs. Reads as surrender / spirit broken.
//
// Visual contract vs. siblings:
//   - Reaper: dark hood + lean + eye-slit, 32x124.  (createReaperPlaceholder)
//   - Aldric walking: warm cream + stout + collar band + round head, 40x116.
//   - Ghost replays: pale-cyan gestural poses (kneeling, pouring, etc.),
//     forensic witnesses — NOT Aldric himself.
// All three must read distinct at thumbnail; the walking Aldric is the
// living warm-cream cleric, distinguished from the ghosts' pale-cyan family
// by palette alone.
//
// Pivot grammar matches the Reaper sprite: bottom-center on the sprite's
// logical bounding box, so Victim can place the container at a floor-y
// world coord and the figure stands on that y.

/**
 * Father Aldric walking sprite — in-world placeholder.
 *
 * Logical bounds: 40 wide x 116 tall (per SCALE.ALDRIC). Slightly wider /
 * shorter than the Reaper (32x124) so the silhouette reads as STOUT vs.
 * the Reaper's LEAN at thumbnail.
 *
 * Build order (back to front):
 *   1. Body — warm cream rounded rectangle, tapered slightly at the
 *      shoulders for a "pillowed cleric" read.
 *   2. Robe seam — thin vertical dark line down body center (subtle, low
 *      alpha) hinting at a robe / vestment fold.
 *   3. Collar band — narrow dark horizontal band at neck level. This is
 *      the clergy tell at thumbnail.
 *   4. Head — warm cream circle on top of the collar. No face details
 *      (placeholder discipline; Reaper has the only eye-slit in the cast).
 *
 * No walk-cycle animation in slice 3 — Victim translates this container
 * as a static silhouette. A future slice may add a 2-frame leg shift.
 *
 * Pivot: (WIDTH/2, HEIGHT) — bottom-center, same convention as Reaper.
 */
export function createAldricWalkingSprite() {
  const container = new Container();
  container.label = 'aldric-walking-sprite';

  const { WIDTH, HEIGHT, BODY_W, BODY_H, HEAD_R, COLLAR_H } = SCALE.ALDRIC;

  // Body bottom-aligned within the bounding box; the head sits above it.
  // The body's top-y leaves room for the head (2 * HEAD_R) above.
  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H;

  // Shoulder taper: shave 3px off each side of the upper ~16px of the body
  // so the silhouette reads "rounded shoulders / stout cleric" rather than
  // a flat slab. Implemented as a polygon for the body.
  const shoulderTaper = 3;
  const shoulderH = 16;
  const body = new Graphics();
  body
    .poly([
      bodyX + shoulderTaper, bodyY,
      bodyX + BODY_W - shoulderTaper, bodyY,
      bodyX + BODY_W, bodyY + shoulderH,
      bodyX + BODY_W, bodyY + BODY_H,
      bodyX, bodyY + BODY_H,
      bodyX, bodyY + shoulderH,
    ])
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(body);

  // Robe seam — faint vertical line down the body center, low alpha so it
  // reads as a fold rather than a hard split. Stops short of the collar.
  const seam = new Graphics();
  seam
    .rect(WIDTH / 2 - 0.5, bodyY + COLLAR_H + 4, 1, BODY_H - COLLAR_H - 8)
    .fill(PALETTE.ALDRIC_COLLAR);
  seam.alpha = 0.35;
  container.addChild(seam);

  // Collar band — dark horizontal stripe at the top of the body, the
  // unambiguous "clergy" tell. Sits flush with the body's top edge.
  const collar = new Graphics();
  collar
    .rect(bodyX + shoulderTaper, bodyY, BODY_W - shoulderTaper * 2, COLLAR_H)
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — warm cream circle, sits centered above the collar. Head bottom
  // touches the top of the body so collar + head read as one neck zone.
  const headCX = WIDTH / 2;
  const headCY = bodyY - HEAD_R;
  const head = new Graphics();
  head.circle(headCX, headCY, HEAD_R).fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Pivot bottom-center so Victim can place container.y at the floor y
  // and the sprite stands on that surface (same convention as Reaper).
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
