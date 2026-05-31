// sprites/parishioner.js — createParishionerSpritePixelArt factory.
// Split from src/art/pixelPalette/sprites.js per issue #2 Phase C.
//
// Four variant builders inline: kneeler, stander, walker, candlelighter.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

// ---------------------------------------------------------------------------
// createParishionerSpritePixelArt({ variant, seed }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Pixel-art parishioner figure for the chapel-bustle dispatch. Four variants
// with distinct silhouettes so a 4-6-NPC crowd reads as distinct people:
//   * 'kneeler'        — head bowed, on knees, ~16×40 bounding box
//   * 'stander'        — upright, head slightly tilted, ~16×64
//   * 'walker'         — upright, slight forward lean, ~16×64
//   * 'candlelighter'  — facing right with extended arm, ~16×56
//
// Per-instance palette variation via `seed` (0..1).
//
// Discipline:
//   * No facial detail — silhouettes only.
//   * No body shapes / sprawled / contorted — alive only.
//   * No red. Muted browns / cream / grey.
//   * Pivot bottom-center.
//   * Drawn ONCE at construction. AmbientNPC ticks animation via container
//     position + alpha mutations only, never a re-draw.
export function createParishionerSpritePixelArt({ variant = 'stander', seed = 0 } = {}) {
  const container = new Container();
  container.label = `parishioner-pixel-${variant}`;

  // POLISH PASS 2026-05-30 (late): added PILGRIM_RED variant for robe-color
  // variety so a 4-6-NPC crowd reads as visibly distinct people.
  const robePalette = [
    { body: PIXEL_PALETTE.PILGRIM_BROWN,      shadow: PIXEL_PALETTE.WOOD_DARK },
    { body: PIXEL_PALETTE.PILGRIM_DARK_CREAM, shadow: PIXEL_PALETTE.PILGRIM_BROWN },
    { body: PIXEL_PALETTE.PILGRIM_GREY,       shadow: PIXEL_PALETTE.STONE_DARK },
    { body: PIXEL_PALETTE.PILGRIM_RED,        shadow: PIXEL_PALETTE.WOOD_DARK },
  ];
  const palette =
    robePalette[Math.floor((seed % 1) * robePalette.length) % robePalette.length];
  const headColor = PIXEL_PALETTE.PILGRIM_SKIN;
  const hoodColor = PIXEL_PALETTE.PILGRIM_CREAM;

  // 1px STONE_LIGHT highlight rim along the candle-lit side so the NPC pops
  // off the dim stone background even before the day-ambient brightening.
  // We paint this LAST so it sits on top of body/head — done in addHighlightRim().
  const addHighlightRim = (bodyX, bodyY, bodyW, bodyH, headX, headY, headW, headH) => {
    const rim = new Graphics();
    // Body left edge highlight (candle-lit side).
    rim.rect(bodyX, bodyY, 1, bodyH).fill(PIXEL_PALETTE.STONE_LIGHT);
    // Head left edge highlight.
    rim.rect(headX, headY, 1, headH).fill(PIXEL_PALETTE.STONE_LIGHT);
    rim.alpha = 0.5;
    container.addChild(rim);
  };

  if (variant === 'kneeler') {
    const W = 16;
    const H = 40;
    const BODY_W = 16;
    const BODY_H = 20;
    const HEAD_W = 8;
    const HEAD_H = 7;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2;
    const headY = bodyY - HEAD_H + 3; // bowed lower than upright
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const hood = new Graphics();
    hood.rect(headX - 1, headY, HEAD_W + 2, 2).fill(hoodColor);
    container.addChild(hood);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else if (variant === 'stander') {
    const W = 16;
    const H = 64;
    const BODY_W = 14;
    const BODY_H = 40;
    const HEAD_W = 8;
    const HEAD_H = 8;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 1;
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else if (variant === 'walker') {
    const W = 16;
    const H = 64;
    const BODY_W = 14;
    const BODY_H = 40;
    const HEAD_W = 8;
    const HEAD_H = 8;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 2; // forward lean
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else {
    // candlelighter — facing right with extended arm.
    const W = 16;
    const H = 56;
    const BODY_W = 12;
    const BODY_H = 34;
    const HEAD_W = 8;
    const HEAD_H = 8;
    const ARM_W = 6;
    const ARM_H = 3;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 2;
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    // Extended arm reaching right (toward a shrine candle).
    const arm = new Graphics();
    arm
      .rect(bodyX + BODY_W, bodyY + 6, ARM_W, ARM_H)
      .fill(palette.body);
    container.addChild(arm);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  }

  // POLISH PASS 2026-05-30 (late): scale 1.5× so parishioners read as
  // distinct people at fit-to-viewport scaling instead of disappearing into
  // the dim chapel as specks. 16×40 / 16×64 logical-px sprites become
  // ~24×60 / ~24×96 on screen. Pivot is set BEFORE scale so bottom-center
  // anchoring still lands cleanly on the floor.
  container.scale.set(1.5);

  return container;
}
