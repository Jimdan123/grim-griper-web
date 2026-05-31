// aldric.js — Father Aldric portrait card + walking sprite + Fated Death pose.
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from './constants.js';

const ALDRIC_CARD = {
  WIDTH: 120,
  HEIGHT: 160,
  PADDING: 10,       // inset from card edge to portrait area
  FRAME_W: 3,        // carved-stone frame thickness
};

export function createAldricPortraitCard() {
  const container = new Container();
  container.label = 'aldric-portrait-card';

  const { WIDTH: CW, HEIGHT: CH, PADDING: PAD, FRAME_W: FW } = ALDRIC_CARD;

  // Card backing — same stone tone as the cross-plaque signage, so the two
  // bits of HUD furniture share a visual family.
  const backing = new Graphics();
  backing.rect(0, 0, CW, CH).fill(PALETTE.COMPOSITION.CROSS_PLAQUE);
  container.addChild(backing);

  // Inner pane — dimmer recess behind the silhouette, evokes a darkened
  // niche the portrait sits in.
  const pane = new Graphics();
  pane
    .rect(FW, FW, CW - FW * 2, CH - FW * 2)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(pane);

  // Frame highlight — thin warm inner edge so the card reads as "lit from
  // candle light", matching the chapel's diegetic lighting.
  const highlight = new Graphics();
  highlight
    .rect(FW, FW, CW - FW * 2, 1)
    .fill(PALETTE.COMPOSITION.CANDLE_WARM);
  highlight.alpha = 0.5;
  container.addChild(highlight);

  // Inner portrait area — where the Aldric silhouette sits.
  const portraitX = PAD;
  const portraitY = PAD;
  const portraitW = CW - PAD * 2;
  const portraitH = CH - PAD * 2;

  // Aldric silhouette — same shape grammar as the ghost priest (cleric body
  // + round head + collar band), but in WARM CREAM. Pivot bottom-center on
  // the portrait area so the figure stands on the bottom of the card.
  // Scale character to fit within the portrait area while preserving the
  // 40x116 logical Aldric proportions from SCALE.ALDRIC.
  const A = SCALE.ALDRIC;
  // Fit the 40x116 figure into portraitW x portraitH at uniform scale.
  const scale = Math.min(portraitW / A.WIDTH, portraitH / A.HEIGHT);
  const figW = A.WIDTH * scale;
  const figH = A.HEIGHT * scale;
  const figX = portraitX + (portraitW - figW) / 2;
  const figY = portraitY + (portraitH - figH);  // stand on card bottom-pad

  // Body — warm cream vestment.
  const bodyH = A.BODY_H * scale;
  const body = new Graphics();
  body.rect(figX, figY + figH - bodyH, figW, bodyH).fill(PALETTE.ALDRIC_BODY);
  container.addChild(body);

  // Collar band — dark band where head meets body, distinguishes cleric
  // from the headless ghost silhouettes.
  const collarH = A.COLLAR_H * scale;
  const collar = new Graphics();
  collar
    .rect(figX, figY + figH - bodyH, figW, collarH)
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — warm cream circle, sits on top of the body.
  const headR = A.HEAD_R * scale;
  const head = new Graphics();
  head
    .circle(figX + figW / 2, figY + figH - bodyH - headR, headR)
    .fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Subtle vignette inside the card — dim the bottom corners so the figure
  // feels lit from candle above. Two faint corner rects, very low alpha.
  const vignette = new Graphics();
  vignette.rect(FW, CH - FW - 12, CW - FW * 2, 12).fill(PALETTE.COMPOSITION.VIGNETTE);
  vignette.alpha = 0.35;
  container.addChild(vignette);

  return container;
}

// ---------------------------------------------------------------------------
// Environmental storytelling props (ticket #21)
// ---------------------------------------------------------------------------
// Each waypoint area gets 1–3 inline-authored static props that telegraph
// Aldric's four-stage racket (lure → poison → extort → bury). Anti-slasher
// hard line per docs/agents/team-lead.md + scene-composition-spec.md §B.6:
// no gore, no body shapes, no blood, no figurative violence. The horror is
// in implication — discoloration, lumpy fabric, geometric seam.
//
// Coordinates are AUTHORED IN WORLD-LOGICAL SPACE (the 1280x720 logical
// canvas). The composite factory `createConfessionRoomProps` returns a
// Container that callers mount at (0,0) in `world`, so each prop's
// absolute x/y can be hand-tuned against the waypoint x's.
//
// Per ticket "Out of scope": NOT generalized over stage data. Stage 1 only.

// Floor surface top — derived from chapelBounds in confession-room.json
// (y=200, height=420) and SCALE.FRAME.FLOOR_STRIP_H (100). Hard-coded here
// because props are inline-authored for stage 1 only per the ticket.
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

/**
 * Fated Death pose — Aldric kneeling, weight broken.
 *
 * ANTI-SLASHER DISCIPLINE (docs/agents/team-lead.md + touchstone):
 *   - NO gore. NO blood. NO floor-sprawl body shape. NO contorted limbs.
 *   - Reads as SURRENDER / SPIRIT BROKEN, not as corpse.
 *   - Reaper is the quiet consequence — death is implied by the kneel +
 *     the Victim-class alpha fade, never depicted.
 *
 * Composition: Aldric on his knees (legs folded under), body slumped
 * forward, head bowed. Same palette as the walking sprite — recognizably
 * the same character.
 *
 * Logical bounds: 30 wide x 70 tall (compressed because kneeling). Pivot
 * bottom-center so Victim can swap this container in at the same world y
 * as the walking sprite.
 */
export function createFatedDeathPose() {
  const container = new Container();
  container.label = 'aldric-fated-death-pose';

  const WIDTH = 30;
  const HEIGHT = 70;

  // Layout, measured in local logical coords (origin = top-left of bbox):
  //   - Folded legs slab at the floor: 26w x 14h, centered.
  //   - Torso: slumped forward, leans ~6px off vertical to the front (right
  //     in local space). Drawn as a polygon so the slump is visible at
  //     thumbnail rather than a vertical column.
  //   - Collar band at the top of the torso (under the bowed head).
  //   - Head: bowed forward — circle sits slightly forward of the torso's
  //     top so it reads as "looking down at the floor".
  //
  // The slump direction (right) is arbitrary; Victim does not flip — the
  // pose is a still and the chapel's lighting / staging chooses the angle.

  // Folded legs — short rounded slab on the floor. Reads as "knees /
  // shins folded under", not as splayed limbs. Centered horizontally.
  const legsH = 14;
  const legsW = 26;
  const legsX = (WIDTH - legsW) / 2;
  const legsY = HEIGHT - legsH;
  const legs = new Graphics();
  legs
    .roundRect(legsX, legsY, legsW, legsH, 4)
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(legs);

  // Torso — slumped polygon. Base sits on top of the legs, leans forward
  // (to the right in local space) by ~5px at the shoulders.
  const torsoBaseY = legsY;        // top of legs slab
  const torsoTopY = torsoBaseY - 34; // 34px tall torso
  const torsoBaseLeft = legsX + 2;
  const torsoBaseRight = legsX + legsW - 2;
  const torsoLean = 5;
  const torsoTopLeft = torsoBaseLeft + torsoLean;
  const torsoTopRight = torsoBaseRight + torsoLean - 4; // taper at shoulders
  const torso = new Graphics();
  torso
    .poly([
      torsoTopLeft, torsoTopY,
      torsoTopRight, torsoTopY,
      torsoBaseRight, torsoBaseY,
      torsoBaseLeft, torsoBaseY,
    ])
    .fill(PALETTE.ALDRIC_BODY);
  container.addChild(torso);

  // Collar band — narrow dark stripe across the top of the slumped torso.
  // Same clergy tell as the walking sprite; preserves character identity
  // through the swap.
  const collarH = 3;
  const collar = new Graphics();
  collar
    .poly([
      torsoTopLeft, torsoTopY,
      torsoTopRight, torsoTopY,
      torsoTopRight, torsoTopY + collarH,
      torsoTopLeft, torsoTopY + collarH,
    ])
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — bowed forward. Centered on the torso's top edge but shifted
  // forward (right) so it reads as "head dropped, looking at the floor",
  // not as "head upright on the shoulders". Slightly smaller radius than
  // the walking sprite's head — the slump foreshortens the read.
  const headR = 10;
  const torsoTopMidX = (torsoTopLeft + torsoTopRight) / 2;
  const headCX = torsoTopMidX + 2;     // forward of torso center
  const headCY = torsoTopY - headR + 2; // slightly overlapping the collar
  const head = new Graphics();
  head.circle(headCX, headCY, headR).fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Pivot bottom-center — Victim swaps this container at the same world
  // (x, floorY) as the walking sprite, so the kneeling figure appears
  // collapsed at the spot Aldric was last walking.
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}
