// sanctuary/altar.js — createPixelArtAltar factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

/**
 * Pixel-art altar block (x default = 220 matches confession-room.json Altar
 * waypoint). 72 wide × 40 tall stone block with a 4 px top trim band, a
 * faint brown poison-ring discoloration (NOT red), and two flanking 6×24
 * candle wax pillars topped with CANDLE_CORE flame pixels.
 *
 * Anti-slasher: discoloration is BROWN. No red, no body shapes.
 */
export function createPixelArtAltar({ x = 220, floorY } = {}) {
  if (floorY == null) {
    throw new Error('createPixelArtAltar: floorY is required');
  }
  const container = new Container();
  container.label = 'pixel-altar';

  const W = 72;
  const H = 40;
  const blockX = x - W / 2;
  const blockY = floorY - H;

  // Block body.
  const block = new Graphics();
  block.rect(blockX, blockY, W, H).fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(block);
  // Top trim (lighter stone) — 4 px band.
  const trim = new Graphics();
  trim.rect(blockX, blockY, W, 4).fill(PIXEL_PALETTE.STONE_LIGHT);
  container.addChild(trim);
  // Bottom shadow — 2 px STONE_DARK band.
  const shadow = new Graphics();
  shadow.rect(blockX, blockY + H - 2, W, 2).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(shadow);
  // 1px STONE_MORTAR vertical grooves at 1/3 and 2/3 — reads as joined blocks.
  const grooves = new Graphics();
  grooves
    .rect(blockX + Math.floor(W / 3), blockY + 4, 1, H - 4)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  grooves
    .rect(blockX + Math.floor((2 * W) / 3), blockY + 4, 1, H - 4)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(grooves);

  // Poison ring discoloration — brown ellipse-ish patch on top trim.
  // Pixel-art register: drawn as two stacked 1px rows of WOOD_DARK at low alpha.
  const stainCX = blockX + Math.round(W * 0.7);
  const stainY = blockY + 4;
  const stain = new Graphics();
  // Outer ring (wider, fainter).
  stain.rect(stainCX - 7, stainY, 14, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  stain.rect(stainCX - 9, stainY + 1, 18, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  stain.rect(stainCX - 7, stainY + 2, 14, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  stain.alpha = 0.55;
  container.addChild(stain);
  // Inner ring (darker).
  const stainInner = new Graphics();
  stainInner
    .rect(stainCX - 4, stainY + 1, 8, 1)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  stainInner.alpha = 0.5;
  container.addChild(stainInner);

  // Two candle wax pillars flanking the altar — 6 wide × 24 tall, sit on
  // top of the altar trim. Wax = PARCHMENT-style cream; we use ALDRIC_CREAM
  // (a known cream in our palette) for the wax pillar.
  const CANDLE_W = 6;
  const CANDLE_H = 24;
  const candleY = blockY - CANDLE_H;
  const candlePositions = [
    blockX + 6,                        // left candle
    blockX + W - 6 - CANDLE_W,         // right candle
  ];
  for (const cx of candlePositions) {
    const wax = new Graphics();
    wax.rect(cx, candleY, CANDLE_W, CANDLE_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
    container.addChild(wax);
    // Wick — 1 px STONE_MORTAR atop the wax.
    const wick = new Graphics();
    wick
      .rect(cx + Math.floor(CANDLE_W / 2), candleY - 1, 1, 1)
      .fill(PIXEL_PALETTE.STONE_MORTAR);
    container.addChild(wick);
    // Flame — 2×2 CANDLE_CORE pixel just above the wick.
    const flame = new Graphics();
    flame
      .rect(cx + Math.floor(CANDLE_W / 2) - 1, candleY - 4, 2, 3)
      .fill(PIXEL_PALETTE.CANDLE_CORE);
    container.addChild(flame);
    // Flame glow halo — 1px CANDLE_GLOW ring around flame.
    const halo = new Graphics();
    halo
      .rect(cx + Math.floor(CANDLE_W / 2) - 2, candleY - 5, 4, 5)
      .fill(PIXEL_PALETTE.CANDLE_GLOW);
    halo.alpha = 0.35;
    container.addChild(halo);
  }

  return container;
}
