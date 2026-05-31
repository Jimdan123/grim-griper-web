// sacristy.js — createPixelArtSacristyDetails factory.
// Split from src/art/pixelPalette/furniture.js per issue #2 Phase B.
//
// Single-factory file lives flat in pixelPalette/ (not nested under a
// sacristy/ subdir) since there's only one factory here.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from './constants.js';

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
