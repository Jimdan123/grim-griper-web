// evidence/ghosts/builders.js — shared GHOST_DEFAULT_ALPHA + buildGhostBase
// silhouette helper for the placeholder ghost-replay factories.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';

// ---------------------------------------------------------------------------
// Ghost replay placeholders (slice 2)
// ---------------------------------------------------------------------------
// One silhouette per evidence id. Each ghost is a translucent priest-figure
// performing the crime gesture documented in docs/narrative/confession-room.md
// §"The Racket". All four share the pale-cyan GHOST.BODY tone so they read
// as "the same kind of vision" — only the silhouette / gesture differs.
//
// Tone discipline: Happy Hills touchstone — these are quiet witnesses, NOT
// jump-scare imagery. Standing figures performing period acts. The horror
// is the routine, not the visual.
//
// Alpha: ghost container alpha is set to 0.4 here as the default. Callers
// (#2 Investigation Engineer / Sight system) MAY override `container.alpha`
// if they want crossfades — the value is exposed, not baked into draw calls.

export const GHOST_DEFAULT_ALPHA = 0.4;

export function buildGhostBase(options = {}) {
  // Shared base silhouette: standing priest, no collar (silhouette only).
  // Returns { container, bodyTopY, headCx, headCy } so per-id factories can
  // attach arms / accents at the correct height AND can re-pose the figure
  // (bent torso, tilted head) to communicate the crime gesture per
  // docs/narrative/confession-room.md §"Visual direction notes".
  //
  // Options (all optional, all in logical px / radians):
  //   leanX      — horizontal offset applied to the torso TOP (creates a
  //                bent-over silhouette by drawing the body as a parallelogram).
  //                Positive = bend forward to the right.
  //   headDx     — horizontal offset of the head from the torso top center.
  //                Combined with leanX, lets us tilt the head independently
  //                of the lean (e.g. lectern: forward lean + downward head).
  //   headDy     — vertical offset of the head (positive = lower / hunched).
  //   shortenBy  — pixels to clip from the bottom of the body, so the figure
  //                reads as "crouched" rather than "shrunk floating".
  const c = new Container();
  const { WIDTH, HEIGHT, BODY_W, BODY_H, HEAD_R } = SCALE.GHOST;
  const { leanX = 0, headDx = 0, headDy = 0, shortenBy = 0 } = options;

  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H + shortenBy;

  // Torso as a parallelogram so the top can lean while the feet stay planted
  // on the floor — communicates "bent over" rather than "translated".
  const body = new Graphics();
  body
    .poly([
      bodyX + leanX,           bodyY,           // top-left (leans with leanX)
      bodyX + BODY_W + leanX,  bodyY,           // top-right (leans with leanX)
      bodyX + BODY_W,          HEIGHT,          // bottom-right (planted)
      bodyX,                   HEIGHT,          // bottom-left (planted)
    ])
    .fill(PALETTE.GHOST.BODY);
  c.addChild(body);

  // Head rides the top of the torso, offset by leanX so it sits over the
  // lean, plus per-pose headDx/headDy for tilt.
  const headCx = WIDTH / 2 + leanX + headDx;
  const headCy = bodyY - HEAD_R + headDy;
  const head = new Graphics();
  head.circle(headCx, headCy, HEAD_R).fill(PALETTE.GHOST.BODY);
  c.addChild(head);

  return { container: c, bodyTopY: bodyY, headCx, headCy };
}
