// confessionRoom/props/altar.js — buildAltarProps + drawCandlePillar helper.
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.
//
// The drawCandlePillar helper lives here because the altar uses it 3× and
// it's the heaviest user. Lectern + sacristy import it from this file.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../../constants.js';
import { PROPS_FLOOR_Y } from '../geometry.js';

/**
 * Helper — draws a single candle wax pillar at (x, y) with given width and
 * height. Returns a Container so callers can position it absolutely. Flames
 * are NOT part of the wax pillar — they're handled by ambientMotion.js so
 * they can flicker without re-allocating geometry.
 */
export function drawCandlePillar(x, y, w, h) {
  const c = new Container();
  c.label = 'candle-wax';
  const wax = new Graphics();
  wax.rect(x, y, w, h).fill(PALETTE.PROPS.PARCHMENT);
  wax.alpha = 0.85;
  c.addChild(wax);
  // Wick — single dark px at top center.
  const wick = new Graphics();
  wick.rect(x + Math.floor(w / 2), y - 1, 1, 2).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(wick);
  return c;
}

/**
 * Altar (waypoint x=220) — LURE / POISON.
 * - Stone altar block on the floor (visual anchor for the chalice).
 * - Faint ring stain on the altar top (poison residue — BROWN discoloration,
 *   NOT red blood).
 * - Two candles flanking the altar (the flames are added separately by
 *   ambientMotion; this draws only the wax pillars).
 * - Four small empty wooden bowls scattered around the altar's edge
 *   (many drank from the chalice).
 */
export function buildAltarProps() {
  const c = new Container();
  c.label = 'props-altar';

  // Altar stone block — sits on the floor, just behind the chalice evidence
  // (which is at x=300, y=540). Center on the Altar waypoint (x=220).
  const altarCX = 220;
  const altarW = 110;
  const altarH = 44;
  const altarTopY = PROPS_FLOOR_Y - altarH;

  const block = new Graphics();
  block
    .rect(altarCX - altarW / 2, altarTopY, altarW, altarH)
    .fill(PALETTE.PROPS.ALTAR_STONE);
  c.addChild(block);

  // Top edge trim — slightly lighter, reads as a carved-stone top.
  const trim = new Graphics();
  trim
    .rect(altarCX - altarW / 2, altarTopY, altarW, 4)
    .fill(PALETTE.PROPS.ALTAR_STONE_TRIM);
  c.addChild(trim);

  // Ring stain on altar top — brown discoloration where the poisoned chalice
  // rested. Ellipse, low alpha. Anti-slasher: this is RESIDUE, not blood.
  const stain = new Graphics();
  stain
    .ellipse(altarCX + 18, altarTopY + 10, 14, 4)
    .fill(PALETTE.PROPS.POISON_RING);
  stain.alpha = 0.7;
  c.addChild(stain);
  // Inner ring — same hue, darker, sells the "ring" read.
  const stainInner = new Graphics();
  stainInner
    .ellipse(altarCX + 18, altarTopY + 10, 9, 2)
    .fill(PALETTE.CHAPEL_FRAME);
  stainInner.alpha = 0.4;
  c.addChild(stainInner);

  // Two candle wax pillars flanking the altar. Flames are added separately
  // by ambientMotion (so they can flicker without re-allocating geometry).
  // Positions chosen so they don't occlude the chalice evidence at x=300.
  // Left candle (deeper into the altar interior).
  const leftCandle = drawCandlePillar(altarCX - altarW / 2 + 10, altarTopY - 18, 4, 18);
  c.addChild(leftCandle);
  // Right candle (between altar and chalice).
  const rightCandle = drawCandlePillar(altarCX + altarW / 2 - 14, altarTopY - 18, 4, 18);
  c.addChild(rightCandle);

  // Snuffed candle near the altar — wax pillar only, no flame. The smoke
  // wisp will rise from its wick at (altarCX, altarTopY - 18).
  const snuffed = drawCandlePillar(altarCX - 2, altarTopY - 14, 4, 14);
  c.addChild(snuffed);

  // Empty wooden bowls / cups scattered around the altar base. Tiny squat
  // rects, brown wood tone. Place 4 of them.
  const bowlPositions = [
    [altarCX - altarW / 2 - 12, PROPS_FLOOR_Y - 4],
    [altarCX - altarW / 2 - 26, PROPS_FLOOR_Y - 3],
    [altarCX + altarW / 2 + 8, PROPS_FLOOR_Y - 4],
    [altarCX + altarW / 2 + 22, PROPS_FLOOR_Y - 3],
  ];
  for (const [bx, by] of bowlPositions) {
    const bowl = new Graphics();
    bowl.rect(bx, by, 8, 4).fill(PALETTE.PROPS.WOOD_BOWL);
    c.addChild(bowl);
    // Rim highlight — a single px of lighter wood on top.
    const rim = new Graphics();
    rim.rect(bx, by, 8, 1).fill(PALETTE.PROPS.WOOD_DARK);
    rim.alpha = 0.6;
    c.addChild(rim);
  }

  return c;
}
