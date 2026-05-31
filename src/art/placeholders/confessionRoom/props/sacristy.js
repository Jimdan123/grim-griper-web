// confessionRoom/props/sacristy.js — buildSacristyProps factory.
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../../constants.js';
import { PROPS_FLOOR_Y } from '../geometry.js';
import { drawCandlePillar } from './altar.js';

/**
 * Sacristy (waypoint x=1060) — BURIAL IN QUICKLIME.
 *
 * ANTI-SLASHER HARD LINES (mirrors ticket #17 §B.6):
 * - Shroud pile = LUMPY FABRIC, not body silhouette. Drawn as a low
 *   irregular mound of two overlapping ellipses + a fabric corner sticking
 *   up — NEVER a head/torso/limbs profile.
 * - Bricked niche = SUBTLE GEOMETRIC SEAM only, never body-shaped. Drawn as
 *   a rectangular brickwork patch inset into the back wall — a wall patch,
 *   not a tomb cutout.
 * - Lime dust trail = pale dust on the floor leading from the booth toward
 *   the sacristy. Reads as "something dragged this way".
 * - Small candle on a stand.
 */
export function buildSacristyProps() {
  const c = new Container();
  c.label = 'props-sacristy';

  const sacCX = 1060;

  // Partially-bricked niche on the back wall — a small rectangular patch
  // of geometric brickwork. Sits well above the floor (back wall area).
  // Anti-slasher: this is masonry, NEVER a body-shaped cutout.
  const nicheX = sacCX - 30;
  const nicheY = 360;
  const nicheW = 60;
  const nicheH = 80;
  const nicheBg = new Graphics();
  nicheBg
    .rect(nicheX, nicheY, nicheW, nicheH)
    .fill(PALETTE.PROPS.BRICK_SEAM);
  c.addChild(nicheBg);
  // Brick courses — horizontal mortar lines + staggered vertical joints.
  // Strictly geometric (anti-slasher).
  const brickH = 10;
  const brickW = 20;
  for (let row = 0; row < Math.floor(nicheH / brickH); row++) {
    const ry = nicheY + row * brickH;
    // Horizontal mortar line.
    const mortar = new Graphics();
    mortar.rect(nicheX, ry, nicheW, 1).fill(PALETTE.PROPS.BRICK_MORTAR);
    c.addChild(mortar);
    // Vertical joints, staggered each row.
    const offset = (row % 2) * (brickW / 2);
    for (let bx = -offset; bx < nicheW; bx += brickW) {
      const joint = new Graphics();
      joint
        .rect(nicheX + bx, ry, 1, brickH)
        .fill(PALETTE.PROPS.BRICK_MORTAR);
      c.addChild(joint);
    }
  }
  // Subtle frame around the niche — implies this is a SET-IN patch of new
  // brickwork, "partially bricked". Top + sides only; bottom blends into floor.
  const nicheFrame = new Graphics();
  nicheFrame.rect(nicheX - 1, nicheY - 1, nicheW + 2, 1).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX - 1, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX + nicheW, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(nicheFrame);

  // Lime dust trail across the floor — pale dust path from the booth area
  // (~x=820) toward the sacristy (~x=1050). A series of overlapping low-alpha
  // pale rects on the floor surface.
  // Place clear of waypoints so it doesn't hide markers.
  const trailY = PROPS_FLOOR_Y + 4;
  const trailSegments = [
    [820, trailY, 30, 4],
    [855, trailY + 2, 28, 4],
    [890, trailY, 32, 4],
    [930, trailY + 3, 30, 4],
    [970, trailY + 1, 32, 4],
    [1010, trailY + 4, 32, 4],
    [1050, trailY + 2, 24, 5],
  ];
  for (const [tx, ty, tw, th] of trailSegments) {
    const dust = new Graphics();
    dust.rect(tx, ty, tw, th).fill(PALETTE.PROPS.LIME_DUST);
    dust.alpha = 0.32;
    c.addChild(dust);
  }
  // Wider dust pool at the sacristy end — suggests where the lime was poured.
  const pool = new Graphics();
  pool
    .ellipse(sacCX - 10, PROPS_FLOOR_Y + 8, 40, 6)
    .fill(PALETTE.PROPS.LIME_DUST);
  pool.alpha = 0.32;
  c.addChild(pool);

  // Lumpy fabric pile in shadow — anti-slasher CRITICAL.
  // Drawn as TWO overlapping low irregular ellipses + one small fabric corner
  // sticking up. NEVER a body silhouette: no head bump, no shoulder line,
  // no torso/leg division. The ellipses are wider than tall (fabric heaped,
  // not lying).
  // Place behind the spade evidence (x=1180 since #22a moved it into the
  // sacristy room) — slightly left of evidence so the spade silhouette still
  // reads cleanly. Sacristy interior is right side.
  const pileCX = 1100;
  const pileCY = PROPS_FLOOR_Y - 4;
  const pileLump1 = new Graphics();
  pileLump1
    .ellipse(pileCX - 8, pileCY + 4, 32, 8)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump1);
  const pileLump2 = new Graphics();
  pileLump2
    .ellipse(pileCX + 10, pileCY + 2, 24, 7)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump2);
  // Shadow underneath — sells "pile on floor" without making it body-shaped.
  const pileShadow = new Graphics();
  pileShadow
    .ellipse(pileCX, pileCY + 10, 42, 3)
    .fill(PALETTE.CHAPEL_FRAME);
  pileShadow.alpha = 0.6;
  c.addChild(pileShadow);
  // Fabric corner sticking up — a small irregular triangular flap of cloth.
  // Important: this is an ABSTRACT corner, NOT a hand/foot/limb. Keep it
  // small, asymmetric, and tonally cream-brown (clearly fabric).
  const flap = new Graphics();
  flap
    .poly([
      pileCX - 6, pileCY - 2,
      pileCX + 2, pileCY - 6,
      pileCX + 6, pileCY + 1,
    ])
    .fill(PALETTE.PROPS.SHROUD_FABRIC_DARK);
  c.addChild(flap);

  // Small candle on a stand at the sacristy.
  // Stand: short vertical post; candle wax on top. Flame added separately.
  const standX = sacCX + 38;
  const standTopY = PROPS_FLOOR_Y - 24;
  const stand = new Graphics();
  stand.rect(standX - 1, standTopY, 3, 24).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(stand);
  const candle = drawCandlePillar(standX - 1, standTopY - 12, 3, 12);
  c.addChild(candle);

  return c;
}
