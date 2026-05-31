// aldric/fatedDeathPose.js — createFatedDeathPose factory.
// Split from src/art/placeholders/aldric.js per issue #2 Phase H.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../constants.js';

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
