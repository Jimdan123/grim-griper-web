// sanctuary/lectern.js — createPixelArtLectern factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

/**
 * Pixel-art lectern (x default = 500 matches the Lectern waypoint). 28 wide
 * × 80 tall: a tapered wooden post with a slanted book-rest top.
 */
export function createPixelArtLectern({ x = 500, floorY } = {}) {
  if (floorY == null) {
    throw new Error('createPixelArtLectern: floorY is required');
  }
  const container = new Container();
  container.label = 'pixel-lectern';

  const SHAFT_W = 8;
  const SHAFT_H = 60;
  const TOP_W = 28;
  const TOP_H = 12;

  const shaftX = x - SHAFT_W / 2;
  const shaftY = floorY - SHAFT_H;

  // Wide base — 24×6 WOOD_BASE block on the floor.
  const baseW = 24;
  const base = new Graphics();
  base
    .rect(x - baseW / 2, floorY - 6, baseW, 6)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(base);
  const baseShadow = new Graphics();
  baseShadow
    .rect(x - baseW / 2, floorY - 2, baseW, 2)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(baseShadow);

  // Shaft — tall narrow wood column.
  const shaft = new Graphics();
  shaft
    .rect(shaftX, shaftY, SHAFT_W, SHAFT_H - 6)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(shaft);
  // 1px highlight on the candle-lit side of the shaft.
  const shaftHi = new Graphics();
  shaftHi
    .rect(shaftX + SHAFT_W - 1, shaftY, 1, SHAFT_H - 6)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(shaftHi);

  // Slanted top — five stacked pixel-art rows offset right by 1px each row,
  // forming a stair-stepped slant that reads as the angled book-rest.
  const topY = shaftY - TOP_H;
  const slant = new Graphics();
  for (let i = 0; i < TOP_H; i++) {
    const ry = topY + i;
    const offset = Math.floor((TOP_H - i) / 3);
    const rx = x - TOP_W / 2 + offset;
    const rw = TOP_W - offset;
    slant.rect(rx, ry, rw, 1).fill(PIXEL_PALETTE.WOOD_BASE);
  }
  container.addChild(slant);
  // Top-edge highlight on the slant.
  const slantHi = new Graphics();
  slantHi
    .rect(x - TOP_W / 2, topY, TOP_W, 1)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(slantHi);

  return container;
}
