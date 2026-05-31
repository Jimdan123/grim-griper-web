// chapelBustle/candleShrine.js — createCandleShrinePixelArt factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

// ---------------------------------------------------------------------------
// createCandleShrinePixelArt({ x, floorY }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Small candle-stand shrine — three candles on a low stone plinth, ~24×40.
// The candlelighter NPC stands next to one of these.
//
// Discipline:
//   * Stone plinth + candle warmth. No red. No body shapes.
//   * Static — no ticker. No per-frame allocation.
export function createCandleShrinePixelArt({ x = 0, floorY = 0 } = {}) {
  const container = new Container();
  container.label = 'candle-shrine-pixel';

  const SHRINE_W = 24;
  const PLINTH_H = 10;

  // Plinth.
  const plinth = new Graphics();
  const plinthY = -PLINTH_H;
  plinth
    .rect(-SHRINE_W / 2, plinthY, SHRINE_W, PLINTH_H)
    .fill(PIXEL_PALETTE.STONE_BASE);
  plinth
    .rect(-SHRINE_W / 2, plinthY, SHRINE_W, 1)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  plinth
    .rect(-SHRINE_W / 2, plinthY + PLINTH_H - 1, SHRINE_W, 1)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(plinth);

  // Soft warm bloom behind candles — low-alpha CANDLE_DIM.
  const bloom = new Graphics();
  bloom
    .rect(-SHRINE_W / 2 + 2, plinthY - 28, SHRINE_W - 4, 28)
    .fill(PIXEL_PALETTE.CANDLE_DIM);
  bloom.alpha = 0.22;
  container.addChild(bloom);

  // Three candles.
  const candles = new Graphics();
  const CANDLE_W = 3;
  const SIDE_H = 18;
  const CENTER_H = 24;
  const candleBaseY = plinthY;
  candles.rect(-8, candleBaseY - SIDE_H, CANDLE_W, SIDE_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  candles.rect(-1, candleBaseY - CENTER_H, CANDLE_W, CENTER_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  candles.rect(5, candleBaseY - SIDE_H, CANDLE_W, SIDE_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  container.addChild(candles);

  // Flames.
  const flames = new Graphics();
  flames.rect(-8, candleBaseY - SIDE_H - 3, CANDLE_W, 2).fill(PIXEL_PALETTE.CANDLE_GLOW);
  flames.rect(-7, candleBaseY - SIDE_H - 4, 1, 2).fill(PIXEL_PALETTE.CANDLE_CORE);
  flames.rect(-1, candleBaseY - CENTER_H - 4, CANDLE_W, 3).fill(PIXEL_PALETTE.CANDLE_GLOW);
  flames.rect(0, candleBaseY - CENTER_H - 5, 1, 2).fill(PIXEL_PALETTE.CANDLE_CORE);
  flames.rect(5, candleBaseY - SIDE_H - 3, CANDLE_W, 2).fill(PIXEL_PALETTE.CANDLE_GLOW);
  flames.rect(6, candleBaseY - SIDE_H - 4, 1, 2).fill(PIXEL_PALETTE.CANDLE_CORE);
  container.addChild(flames);

  container.x = snap(x, 1);
  container.y = snap(floorY, 1);
  return container;
}
