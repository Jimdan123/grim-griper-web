// confessionRoom/props/lectern.js — buildLecternProps factory.
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../../constants.js';
import { PROPS_FLOOR_Y } from '../geometry.js';
import { drawCandlePillar } from './altar.js';

/**
 * Lectern (waypoint x=500) — SERMON AS LURE.
 * - Tall narrow wooden lectern stand.
 * - Small candle on top of the lectern.
 * - Scattered loose sermon pages on the floor in front.
 */
export function buildLecternProps() {
  const c = new Container();
  c.label = 'props-lectern';

  const lecternCX = 500;
  const lecternTopY = PROPS_FLOOR_Y - 60;

  // Lectern shaft — tall thin vertical post.
  const shaft = new Graphics();
  shaft
    .rect(lecternCX - 4, lecternTopY + 8, 8, 52)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(shaft);

  // Lectern slanted top (book rest) — parallelogram angled forward-right.
  const top = new Graphics();
  top
    .poly([
      lecternCX - 18, lecternTopY + 12,
      lecternCX + 18, lecternTopY,
      lecternCX + 18, lecternTopY + 4,
      lecternCX - 18, lecternTopY + 16,
    ])
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(top);

  // Small candle on top of the lectern. Flame added separately.
  const candle = drawCandlePillar(lecternCX + 10, lecternTopY - 10, 3, 10);
  c.addChild(candle);

  // Scattered loose sermon pages on the floor — small parchment rects with
  // slight rotation suggestion (just irregular placement and varied size).
  // Avoid x=580 (where the sermonBook evidence sits — keep pages clear of
  // the pickup geometry).
  const pages = [
    [lecternCX - 40, PROPS_FLOOR_Y - 2, 10, 6],
    [lecternCX - 28, PROPS_FLOOR_Y + 4, 8, 5],
    [lecternCX - 50, PROPS_FLOOR_Y + 8, 9, 5],
    [lecternCX + 28, PROPS_FLOOR_Y + 10, 10, 5],
    [lecternCX + 42, PROPS_FLOOR_Y + 2, 8, 6],
  ];
  for (const [px, py, pw, ph] of pages) {
    const page = new Graphics();
    page.rect(px, py, pw, ph).fill(PALETTE.PROPS.PARCHMENT);
    page.alpha = 0.85;
    c.addChild(page);
    // A single dim horizontal pen-stroke per page to read as "written on".
    const ink = new Graphics();
    ink.rect(px + 1, py + Math.floor(ph / 2), pw - 2, 1).fill(PALETTE.PROPS.WOOD_DARK);
    ink.alpha = 0.6;
    c.addChild(ink);
  }

  return c;
}
