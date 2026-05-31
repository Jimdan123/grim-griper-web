// sprites/reaper.js — createReaperPixelSprite factory.
// Split from src/art/pixelPalette/sprites.js per issue #2 Phase C.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function createReaperPixelSprite() {
  const container = new Container();
  container.label = 'reaper-pixel';

  const W = 32;
  const H = 72;
  const BODY_W = 16;
  const BODY_H = 56;
  const HOOD_W = 24;
  const HOOD_H = 20;

  // Body — narrow vertical block (tall + lean silhouette).
  const bodyX = (W - BODY_W) / 2;
  const bodyY = H - BODY_H;
  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PIXEL_PALETTE.REAPER_BLACK);
  container.addChild(body);

  // Hood — wider trapezoidal mass at the top, drawn as stepped pixel rects
  // to approximate a curve in the pixel-art register. Top row 12 wide,
  // middle row 18 wide, base row 24 wide.
  const hoodBaseY = bodyY;
  const hood = new Graphics();
  // Hood crown (top): 12x4 centered.
  hood.rect((W - 12) / 2, hoodBaseY - HOOD_H, 12, 4).fill(PIXEL_PALETTE.REAPER_BLACK);
  // Hood mid: 18x8.
  hood.rect((W - 18) / 2, hoodBaseY - HOOD_H + 4, 18, 8).fill(PIXEL_PALETTE.REAPER_BLACK);
  // Hood base: 24x8.
  hood.rect((W - HOOD_W) / 2, hoodBaseY - HOOD_H + 12, HOOD_W, 8).fill(PIXEL_PALETTE.REAPER_BLACK);
  container.addChild(hood);

  // Shoulder bevels — single-pixel STONE_DARK accents at the hood-body
  // junction so the silhouette has a hint of internal structure without
  // breaking the all-black read.
  const bevels = new Graphics();
  // Left shoulder.
  bevels.rect(bodyX - 2, hoodBaseY, 2, 2).fill(PIXEL_PALETTE.STONE_DARK);
  // Right shoulder.
  bevels.rect(bodyX + BODY_W, hoodBaseY, 2, 2).fill(PIXEL_PALETTE.STONE_DARK);
  bevels.alpha = 0.4;
  container.addChild(bevels);

  // Eye-slit — ONE faint highlight pixel in the hood interior. Using
  // GHOST_PALE (the pale cyan witnesses' tone) ties the Reaper visually
  // to the ghost-replay register: same kind of spectral light. The painterly
  // REAPER_EYE was 0x9be7ff (saturated cyan); we use the muted GHOST_PALE
  // here so the pixel-art register stays muted '80s, not neon '80s.
  const eye = new Graphics();
  eye
    .rect((W - 2) / 2, hoodBaseY - HOOD_H + 8, 2, 1)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  eye.alpha = 0.85;
  container.addChild(eye);

  // POLISH PASS 2026-05-30 (outside-scene readability): 1px STONE_LIGHT rim
  // highlight on ONE side of the body + head silhouette so the Reaper reads
  // as a figure on the lit outside cobble path. Subtle alpha (0.45) — same
  // technique used on NPCs in the prior polish pass. Anti-slasher: muted
  // moonlight grey, NOT lit-up-by-fire.
  const rim = new Graphics();
  // Body left-side rim — runs full body height.
  rim.rect(bodyX, bodyY, 1, BODY_H).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood crown left rim (top-row left-edge).
  rim.rect((W - 12) / 2, hoodBaseY - HOOD_H, 1, 4).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood mid-row left rim.
  rim.rect((W - 18) / 2, hoodBaseY - HOOD_H + 4, 1, 8).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood base-row left rim.
  rim.rect((W - HOOD_W) / 2, hoodBaseY - HOOD_H + 12, 1, 8).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Top 1px of hood crown (catches sky light from above).
  rim.rect((W - 12) / 2, hoodBaseY - HOOD_H, 12, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  rim.alpha = 0.45;
  container.addChild(rim);

  // Pivot bottom-center so callers can place at floor surface.
  container.pivot.set(W / 2, H);
  return container;
}
