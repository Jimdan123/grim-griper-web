// sanctuary/booth.js — createPixelArtConfessionBooth factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

/**
 * Pixel-art confession booth (x default = 780 matches ConfessionBooth
 * waypoint). 56 wide × 120 tall framed booth, vertical plank construction,
 * lattice grille on the player-facing side, dark interior.
 *
 * Composition reads at glance: "you can't see inside without entering" — the
 * dark interior + lattice grille telegraph privacy.
 */
export function createPixelArtConfessionBooth({ x = 780, floorY } = {}) {
  if (floorY == null) {
    throw new Error('createPixelArtConfessionBooth: floorY is required');
  }
  const container = new Container();
  container.label = 'pixel-booth';

  const W = 56;
  const H = 120;
  const boothX = x - W / 2;
  const boothTopY = floorY - H;

  // Dark interior fill (visible through the grille).
  const interior = new Graphics();
  interior
    .rect(boothX, boothTopY, W, H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(interior);

  // Vertical wood-plank frame — left and right posts.
  const POST_W = 6;
  const leftPost = new Graphics();
  leftPost
    .rect(boothX, boothTopY, POST_W, H)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(leftPost);
  // 1px highlight on right edge of left post.
  const leftPostHi = new Graphics();
  leftPostHi
    .rect(boothX + POST_W - 1, boothTopY, 1, H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(leftPostHi);

  const rightPost = new Graphics();
  rightPost
    .rect(boothX + W - POST_W, boothTopY, POST_W, H)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(rightPost);
  const rightPostHi = new Graphics();
  rightPostHi
    .rect(boothX + W - POST_W, boothTopY, 1, H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(rightPostHi);

  // Top lintel — 8 px tall WOOD_BASE band across the top.
  const lintel = new Graphics();
  lintel
    .rect(boothX, boothTopY, W, 8)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(lintel);
  const lintelHi = new Graphics();
  lintelHi
    .rect(boothX, boothTopY, W, 1)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(lintelHi);

  // Booth roof shadow — 4 px WOOD_DARK below the lintel inside.
  const lintelShadow = new Graphics();
  lintelShadow
    .rect(boothX + POST_W, boothTopY + 8, W - POST_W * 2, 2)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(lintelShadow);

  // Lattice grille — 4-column × 8-row grid of dark pixels, centered in the
  // booth interior between the posts at chest height. Reads as wooden lattice.
  const latticeX = boothX + POST_W + 4;
  const latticeY = boothTopY + 32;
  const latticeW = W - POST_W * 2 - 8;
  const latticeH = 56;
  // Grille frame — 1px WOOD_DARK border.
  const grilleFrame = new Graphics();
  grilleFrame.rect(latticeX, latticeY, latticeW, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  grilleFrame.rect(latticeX, latticeY + latticeH - 1, latticeW, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  grilleFrame.rect(latticeX, latticeY, 1, latticeH).fill(PIXEL_PALETTE.WOOD_DARK);
  grilleFrame.rect(latticeX + latticeW - 1, latticeY, 1, latticeH).fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(grilleFrame);
  // Inner lattice — staggered 4×8 grid of 2×2 dark pixels.
  const lattice = new Graphics();
  const COLS = 4;
  const ROWS = 8;
  const cellW = Math.floor((latticeW - 4) / COLS);
  const cellH = Math.floor((latticeH - 4) / ROWS);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const lx = latticeX + 2 + col * cellW + Math.floor(cellW / 2) - 1;
      const ly = latticeY + 2 + row * cellH + Math.floor(cellH / 2) - 1;
      lattice.rect(lx, ly, 2, 2).fill(PIXEL_PALETTE.WOOD_DARK);
    }
  }
  container.addChild(lattice);

  // Vertical plank divider — 2 px WOOD_DARK column splitting the booth into
  // confessor / penitent halves. Sits BEHIND the lattice in z-order via
  // having been drawn before the lattice frame.
  const divider = new Graphics();
  divider
    .rect(boothX + W / 2 - 1, boothTopY + 8, 2, H - 8)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  divider.alpha = 0.6;
  container.addChild(divider);

  // Floor shadow under the booth — 2 px STONE_MORTAR band reads as base.
  const footShadow = new Graphics();
  footShadow
    .rect(boothX - 2, floorY - 2, W + 4, 2)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  footShadow.alpha = 0.6;
  container.addChild(footShadow);

  return container;
}
