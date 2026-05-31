// furniture.js — chapel furniture (altar, lectern, booth, sacristy details, day ambient, pews, candle shrines).
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from './constants.js';

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

/**
 * Pixel-art sacristy details — replaces the painterly urn shelf + brick niche
 * from placeholders.js. Centered around x=1060 (Sacristy waypoint).
 *
 * Composition:
 *   1. Stagger-bonded brick patch on the back wall at y ≈ 360..440, drawn in
 *      WOOD_DARK / STONE_MORTAR tones. Strictly geometric — anti-slasher: no
 *      body-shaped cutout.
 *   2. Wooden shelf (pixel-art) with three small urn silhouettes (4×8 each)
 *      below the niche.
 */
export function createPixelArtSacristyDetails({ x = 1060, floorY } = {}) {
  if (floorY == null) {
    throw new Error('createPixelArtSacristyDetails: floorY is required');
  }
  const container = new Container();
  container.label = 'pixel-sacristy-details';

  // -------- 1. Christ icon on the back wall --------
  // Replaces the previous "bricked niche" (user direction 2026-05-30 evening:
  // "maybe change it to a picture of Christ cause it is a church"). The
  // sacristy back wall now carries a stylized pixel-art icon panel of Christ
  // in cruciform pose — reverent, on-register for a working medieval chapel.
  // Anti-slasher discipline held: no blood, no thorns, no wounds. The icon
  // is iconographic shorthand (halo + cruciform silhouette + warm cream),
  // not anatomical depiction.
  //
  // Burial narrative beat that the bricked niche previously implied: the
  // ghost replay (Aldric dragging the shrouded form) carries that beat
  // already. The wall no longer needs to hint at burial — the spectral
  // memory under Reaper Sight does the work.
  const iconW = 64;
  const iconH = 80;
  const iconX = x - iconW / 2;
  const iconY = 360;

  // Outer wooden frame (the icon's setting). 3px wood border.
  const iconFrameOuter = new Graphics();
  iconFrameOuter.rect(iconX, iconY, iconW, iconH).fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(iconFrameOuter);

  // Inner highlight on frame (1px wood-light at top + left edges).
  const iconFrameHi = new Graphics();
  iconFrameHi.rect(iconX, iconY, iconW, 1).fill(PIXEL_PALETTE.WOOD_LIGHT);
  iconFrameHi.rect(iconX, iconY, 1, iconH).fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(iconFrameHi);

  // Inner shadow on frame (1px wood-dark at right + bottom edges).
  const iconFrameShadow = new Graphics();
  iconFrameShadow.rect(iconX + iconW - 1, iconY, 1, iconH).fill(PIXEL_PALETTE.WOOD_DARK);
  iconFrameShadow.rect(iconX, iconY + iconH - 1, iconW, 1).fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(iconFrameShadow);

  // Inner panel — deep stone-dark background (reads as gilt-board behind icon).
  const PANEL_INSET = 3;
  const panelX = iconX + PANEL_INSET;
  const panelY = iconY + PANEL_INSET;
  const panelW = iconW - PANEL_INSET * 2;
  const panelH = iconH - PANEL_INSET * 2;
  const iconPanel = new Graphics();
  iconPanel.rect(panelX, panelY, panelW, panelH).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(iconPanel);

  // Halo — warm gold disc behind the head. 14×14 anchored above figure center.
  const HALO_R = 7;
  const haloCx = iconX + iconW / 2;
  const haloCy = iconY + 18;
  const halo = new Graphics();
  // Approximate a circle with a 14×14 rounded blob via two stacked rects + corners.
  halo.rect(haloCx - HALO_R + 2, haloCy - HALO_R, HALO_R * 2 - 4, HALO_R * 2)
    .fill(PIXEL_PALETTE.CANDLE_CORE);
  halo.rect(haloCx - HALO_R, haloCy - HALO_R + 2, HALO_R * 2, HALO_R * 2 - 4)
    .fill(PIXEL_PALETTE.CANDLE_CORE);
  halo.alpha = 0.95;
  container.addChild(halo);

  // Halo rim — 1px brighter pixel at top.
  const haloRim = new Graphics();
  haloRim.rect(haloCx - 2, haloCy - HALO_R, 4, 1).fill(PIXEL_PALETTE.DAY_LIGHT);
  container.addChild(haloRim);

  // Head — small cream square inside halo.
  const HEAD_W = 6;
  const HEAD_H = 7;
  const head = new Graphics();
  head.rect(haloCx - HEAD_W / 2, haloCy - HEAD_H / 2 + 1, HEAD_W, HEAD_H)
    .fill(PIXEL_PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Cruciform body — vertical robe column under head + horizontal outstretched arms.
  const ROBE_W = 8;
  const ROBE_H = 32;
  const ARMS_W = 28;
  const ARMS_H = 4;
  const bodyTopY = haloCy + 5;
  const armsY = bodyTopY + 6;

  // Robe (vertical column).
  const robe = new Graphics();
  robe.rect(haloCx - ROBE_W / 2, bodyTopY, ROBE_W, ROBE_H)
    .fill(PIXEL_PALETTE.ALDRIC_BODY);
  container.addChild(robe);

  // Arms (horizontal bar) — outstretched cruciform pose.
  const arms = new Graphics();
  arms.rect(haloCx - ARMS_W / 2, armsY, ARMS_W, ARMS_H)
    .fill(PIXEL_PALETTE.ALDRIC_BODY);
  container.addChild(arms);

  // Robe sash (vertical highlight down the front).
  const sash = new Graphics();
  sash.rect(haloCx - 1, bodyTopY + 1, 2, ROBE_H - 2)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  sash.alpha = 0.6;
  container.addChild(sash);

  // Outer stone-dark frame (1px) to set the icon into the wall.
  const wallFrame = new Graphics();
  wallFrame.rect(iconX - 1, iconY - 1, iconW + 2, 1).fill(PIXEL_PALETTE.STONE_DARK);
  wallFrame.rect(iconX - 1, iconY, 1, iconH + 1).fill(PIXEL_PALETTE.STONE_DARK);
  wallFrame.rect(iconX + iconW, iconY, 1, iconH + 1).fill(PIXEL_PALETTE.STONE_DARK);
  wallFrame.rect(iconX - 1, iconY + iconH, iconW + 2, 1).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(wallFrame);

  // -------- 2. Wooden shelf with three urns --------
  // Shelf sits below the niche, well above the floor.
  const shelfY = floorY - 90;
  const shelfW = 56;
  const shelfX = x - shelfW / 2;

  // Shelf plank.
  const plank = new Graphics();
  plank.rect(shelfX, shelfY, shelfW, 3).fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(plank);
  // Plank highlight.
  const plankHi = new Graphics();
  plankHi.rect(shelfX, shelfY, shelfW, 1).fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(plankHi);
  // Two bracket pegs under the shelf.
  const bracketL = new Graphics();
  bracketL.rect(shelfX + 4, shelfY + 3, 2, 4).fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(bracketL);
  const bracketR = new Graphics();
  bracketR.rect(shelfX + shelfW - 6, shelfY + 3, 2, 4).fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(bracketR);

  // Three urn silhouettes — small squat 4×8 dark blocks sitting on the shelf.
  const urnW = 6;
  const urnH = 10;
  const urnGap = 6;
  const totalW = urnW * 3 + urnGap * 2;
  const startX = x - totalW / 2;
  const urnY = shelfY - urnH;
  for (let i = 0; i < 3; i++) {
    const ux = startX + i * (urnW + urnGap);
    // Urn body.
    const urn = new Graphics();
    urn.rect(ux, urnY + 2, urnW, urnH - 2).fill(PIXEL_PALETTE.STONE_DARK);
    container.addChild(urn);
    // Urn lip — slightly wider darker band at top.
    const lip = new Graphics();
    lip.rect(ux - 1, urnY, urnW + 2, 2).fill(PIXEL_PALETTE.STONE_MORTAR);
    container.addChild(lip);
  }

  return container;
}

// Composite — all pixel-art interior props for The Confession Room.
// Mounted by Stage.js when render mode is PIXELART.
export function createChapelDayAmbientPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelDayAmbientPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-day-ambient';

  const tile = 16;
  const x0 = snap(bounds.x, tile);
  const y0 = snap(bounds.y, tile);
  const w = snap(bounds.width, tile);
  const h = snap(bounds.height, tile);
  const FLOOR_BAND_H = 96;
  const floorTopY = y0 + h - FLOOR_BAND_H;

  // -------- 1. Sun shafts from the clerestory band onto the floor --------
  // Six shafts spaced along the wall, each a tall narrow trapezoid that
  // widens toward the floor (rendered as a stacked-rect pixel-art trapezoid:
  // narrow at top, widening every ~16 px downward).
  //
  // POLISH PASS 2026-05-30 (late): bumped alpha 0.10 → 0.28 and widened the
  // top/bottom spread so the shafts visibly pour onto the floor. Previous
  // build read as "subtle highlight"; we want "bright midday beams".
  const SHAFT_TOP_W = 18;
  const SHAFT_BOT_W = 52;
  const SHAFT_TOP_Y = y0 + 24;           // just below the cornice
  const SHAFT_BOT_Y = floorTopY + 24;    // bleeds onto the floor
  const SHAFT_H = SHAFT_BOT_Y - SHAFT_TOP_Y;
  const SHAFT_STEPS = 8;
  const stepW = (SHAFT_BOT_W - SHAFT_TOP_W) / SHAFT_STEPS;
  const stepH = Math.floor(SHAFT_H / SHAFT_STEPS);

  // Tile-aligned x positions across the chapel — six shafts, evenly spaced.
  const SHAFT_XS = [192, 384, 576, 720, 880, 1072];

  const shafts = new Graphics();
  for (const sx of SHAFT_XS) {
    const cx = snap(sx, tile);
    for (let i = 0; i < SHAFT_STEPS; i++) {
      const stepWidth = Math.round(SHAFT_TOP_W + stepW * i);
      const y = SHAFT_TOP_Y + i * stepH;
      shafts
        .rect(cx - stepWidth / 2, y, stepWidth, stepH)
        .fill(PIXEL_PALETTE.DAY_LIGHT);
    }
  }
  shafts.alpha = 0.28; // bright midday pour — was 0.10
  container.addChild(shafts);

  // -------- 2. Warm cream wash over the whole chapel --------
  // POLISH PASS: alpha 0.07 → 0.22. The chapel needs to read as bathed in
  // midday warmth, not "lightly tinted dusk".
  const wash = new Graphics();
  wash
    .rect(x0, y0, w, h)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  wash.alpha = 0.22;
  container.addChild(wash);

  // -------- 3. Floor brightening pass --------
  // POLISH PASS: alpha 0.09 → 0.18. Sun-through-window hits the floor harder
  // than the wall band, so floor reads markedly brighter than mid-wall.
  const floorWash = new Graphics();
  floorWash
    .rect(x0, floorTopY, w, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  floorWash.alpha = 0.18;
  container.addChild(floorWash);

  // -------- 4. Upper-stone STONE_LIGHT highlight pass --------
  // POLISH PASS: subtle 1px highlight on top of stone-block rows in the
  // upper third of the chapel — "the high sun catches the upper stones".
  // One single Graphics with stacked thin rects (cheap, single draw call).
  const upperThirdH = Math.floor((floorTopY - y0) / 3);
  const highlightRows = new Graphics();
  const BLOCK_H = 16;
  for (let ry = y0 + BLOCK_H; ry < y0 + upperThirdH; ry += BLOCK_H * 2) {
    // Sparse — every 32px (every other block row) — keeps it from flattening.
    highlightRows.rect(x0, ry, w, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  highlightRows.alpha = 0.12;
  container.addChild(highlightRows);

  return container;
}

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
