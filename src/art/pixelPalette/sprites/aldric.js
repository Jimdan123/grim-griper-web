// sprites/aldric.js — createAldricPixelSprite factory.
// Split from src/art/pixelPalette/sprites.js per issue #2 Phase C.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function createAldricPixelSprite() {
  const container = new Container();
  container.label = 'aldric-pixel-day';

  // Geometry (logical px, integer-aligned).
  const W = 40;
  const H = 64;
  const HEAD_W = 12;
  const HEAD_H = 12;
  const BODY_W = 24;
  const BODY_H = 40;
  const COLLAR_W = 24;
  const COLLAR_H = 4;
  // Sprite is small (64px tall vs SCALE.ALDRIC.HEIGHT=116) — this matches
  // the dispatch's "stout pixel-art human silhouette" spec, deliberately
  // squatter than the painterly walker so the new register is recognisable.

  // Body — stout cleric robe, cream. Sits at the bottom of the bounding
  // rect with feet at y=H.
  const bodyX = (W - BODY_W) / 2;
  const bodyY = H - BODY_H;
  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  container.addChild(body);

  // Robe-bottom hem shadow — 2px STONE_DARK at the feet so the figure
  // anchors visibly to the floor (would otherwise float against the
  // FLOOR_BASE which is close in luminance to the robe at low alpha).
  const hemShadow = new Graphics();
  hemShadow
    .rect(bodyX, H - 2, BODY_W, 2)
    .fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  hemShadow.alpha = 0.5;
  container.addChild(hemShadow);

  // Collar — 24x4 ALDRIC_COLLAR band at the top of the body (neck).
  const collar = new Graphics();
  collar
    .rect((W - COLLAR_W) / 2, bodyY - COLLAR_H + 2, COLLAR_W, COLLAR_H)
    .fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — 12x12 cream block with diagonal pixel-stairs on the four
  // corners to read as a rounded skull. Each corner clips 2 pixels into
  // a stair: outer 1px row × 2px wide, then 1px row × 1px wide.
  const headX = (W - HEAD_W) / 2;
  const headY = bodyY - COLLAR_H - HEAD_H + 2;
  const head = new Graphics();
  head.rect(headX, headY, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  container.addChild(head);

  // Pixel-stair corner cuts — paint over the four head corners with the
  // STONE_BASE wall tone at low alpha to simulate a 1-pixel round.
  // (Using a transparent "cut" is cleaner than painting the wall color,
  // but since the sprite sits in front of arbitrary backgrounds we paint
  // 4 tiny ALDRIC_COLLAR shadow pixels instead, treating the rounding as
  // a darker "hair / hood" pixel rather than a transparent corner.)
  const corners = new Graphics();
  // Top-left.
  corners.rect(headX, headY, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Top-right.
  corners.rect(headX + HEAD_W - 1, headY, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Bottom-left.
  corners.rect(headX, headY + HEAD_H - 1, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Bottom-right.
  corners.rect(headX + HEAD_W - 1, headY + HEAD_H - 1, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  corners.alpha = 0.6;
  container.addChild(corners);

  // Pivot bottom-center so callers can place at floor surface.
  container.pivot.set(W / 2, H);
  return container;
}
