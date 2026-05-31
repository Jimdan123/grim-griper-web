// chapelBustle/pew.js — createPewPixelArt factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

// ---------------------------------------------------------------------------
// createPewPixelArt({ x, floorY }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Stage + Art Lead, 2026-05-30 evening. Pixel-art wooden pew/bench, ~80 wide
// × ~24 tall. Sits on the floor; parishioners kneel in front of or stand
// near these. Pivot is bottom-center so callers place via x + floorY.
//
// Discipline:
//   * Wood palette only (WOOD_BASE / WOOD_DARK / WOOD_LIGHT). No red.
//   * Static — drawn once at construction. No animation.
//   * No body shapes; this is a bench, just a bench.
export function createPewPixelArt({ x = 0, floorY = 0 } = {}) {
  const container = new Container();
  container.label = 'pew-pixel';

  // Pew geometry — backed bench, low-slung.
  const PEW_W = 80;
  const PEW_H = 24;
  const SEAT_H = 6;
  const BACK_H = 14;
  const LEG_W = 6;
  const LEG_H = 8;

  // Seat — horizontal plank at the top of the body.
  const seat = new Graphics();
  const seatY = -PEW_H;
  seat.rect(-PEW_W / 2, seatY, PEW_W, SEAT_H).fill(PIXEL_PALETTE.WOOD_BASE);
  seat.rect(-PEW_W / 2, seatY, PEW_W, 1).fill(PIXEL_PALETTE.WOOD_LIGHT);
  seat.rect(-PEW_W / 2, seatY + SEAT_H - 1, PEW_W, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(seat);

  // Back rest.
  const back = new Graphics();
  const backY = seatY - BACK_H;
  back.rect(-PEW_W / 2, backY, PEW_W, BACK_H).fill(PIXEL_PALETTE.WOOD_BASE);
  back.rect(-PEW_W / 2, backY, PEW_W, 1).fill(PIXEL_PALETTE.WOOD_LIGHT);
  for (let gx = -PEW_W / 2 + 16; gx < PEW_W / 2; gx += 16) {
    back.rect(gx, backY, 1, BACK_H).fill(PIXEL_PALETTE.WOOD_DARK);
  }
  container.addChild(back);

  // Legs — two visible legs (front view).
  const legs = new Graphics();
  legs
    .rect(-PEW_W / 2 + 4, seatY + SEAT_H, LEG_W, LEG_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  legs
    .rect(PEW_W / 2 - 4 - LEG_W, seatY + SEAT_H, LEG_W, LEG_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(legs);

  container.x = snap(x, 1);
  container.y = snap(floorY, 1);
  return container;
}
