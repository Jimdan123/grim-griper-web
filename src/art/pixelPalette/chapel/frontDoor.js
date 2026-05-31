// chapel/frontDoor.js — createChapelFrontDoor + CHAPEL_FRONT_DOOR_GEOM.
// Split from src/art/pixelPalette/chapel.js per issue #2 Phase A.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

export function createChapelFrontDoor({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelFrontDoor: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-front-door';

  // Door geometry. Anchored to bounds.x (left edge of nave). Tile-aligned.
  const tile = 16;
  // 100px logical floor strip in the painterly path; we mirror the pixel-art
  // floor band of 96 here. Floor top = bounds.y + bounds.height - 96.
  const FLOOR_BAND_H = 96;
  const floorTopY = bounds.y + bounds.height - FLOOR_BAND_H;

  // Door footprint: 64 wide × 160 tall logical px (was 32×144). Reads as a
  // genuine threshold a hooded pilgrim crosses, not a slot in the wall.
  const DOOR_W = 64;
  const DOOR_H = 160;
  // Inset 16px from the absolute left edge of the chapel bounds so the door
  // sits ~one block in from the corner — reads as "chapel wall + door slot"
  // rather than "the wall starts at the door".
  const doorX = snap(bounds.x + tile, tile);
  const doorBottomY = floorTopY;
  const doorTopY = doorBottomY - DOOR_H;

  // -------- 1. Stone door frame (left jamb, right jamb, gothic lintel) --------
  // Wider frame (6px jambs) so the threshold reads at a glance.
  const FRAME_W = 6;

  // Left jamb — vertical stone strip running the full door height.
  const leftJamb = new Graphics();
  leftJamb
    .rect(doorX, doorTopY, FRAME_W, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(leftJamb);

  // Right jamb.
  const rightJamb = new Graphics();
  rightJamb
    .rect(doorX + DOOR_W - FRAME_W, doorTopY, FRAME_W, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(rightJamb);

  // 1px highlight on the candle-lit (right-facing) edge of the left jamb,
  // and a 1px shadow on the right jamb's left edge — reads as a beveled
  // pixel-art recess.
  const jambBevels = new Graphics();
  jambBevels
    .rect(doorX + FRAME_W - 1, doorTopY, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  jambBevels
    .rect(doorX + DOOR_W - FRAME_W, doorTopY, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(jambBevels);

  // Gothic pointed-arch lintel — five stepped courses above the opening,
  // forming a more pronounced gothic point now that the door is wider.
  // Each course is 6px tall; arch consumes the top 30px of the door.
  const ARCH_H = 30;
  const archSpringY = doorTopY + ARCH_H;
  // Five concentric stepped rectangles, each 6-8px wider than the one above.
  const archSteps = [
    { inset: 28, h: 6 },  // narrowest top — center 8px filled
    { inset: 22, h: 6 },
    { inset: 16, h: 6 },
    { inset: 10, h: 6 },
    { inset: 6,  h: 6 },
  ];
  const arch = new Graphics();
  for (let i = 0; i < archSteps.length; i++) {
    const step = archSteps[i];
    const sx = doorX + step.inset;
    const sw = DOOR_W - step.inset * 2;
    const sy = doorTopY + i * step.h;
    arch.rect(sx, sy, sw, step.h).fill(PIXEL_PALETTE.STONE_BASE);
    // 1px STONE_LIGHT highlight on top of each course.
    arch.rect(sx, sy, sw, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    // 1px STONE_DARK shadow at the underside.
    arch.rect(sx, sy + step.h - 1, sw, 1).fill(PIXEL_PALETTE.STONE_DARK);
  }
  container.addChild(arch);

  // POLISH PASS 2026-05-30 (late): brighten the keystone (top-center of the
  // gothic arch) so the silhouette pops at thumbnail. Two top courses get a
  // STONE_LIGHT fill over the STONE_BASE; the candle-lit upper stones are
  // catching the high sun.
  const keystone = new Graphics();
  for (let i = 0; i < 2; i++) {
    const step = archSteps[i];
    const sx = doorX + step.inset;
    const sw = DOOR_W - step.inset * 2;
    const sy = doorTopY + i * step.h;
    keystone.rect(sx, sy, sw, step.h).fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  keystone.alpha = 0.55;
  container.addChild(keystone);

  // -------- 2. The dark opening (outside-the-chapel beyond) --------
  // Rectangular void from the arch spring down to the floor surface, painted
  // NIGHT_AMBIENT (deep blue-purple). The void reads as "outside, at dusk".
  const openingX = doorX + FRAME_W;
  const openingY = archSpringY;
  const openingW = DOOR_W - FRAME_W * 2;
  const openingH = doorBottomY - openingY;
  const opening = new Graphics();
  opening
    .rect(openingX, openingY, openingW, openingH)
    .fill(PIXEL_PALETTE.NIGHT_AMBIENT);
  container.addChild(opening);

  // -------- 2b. Open door panels (visible against the dark opening) --------
  // The door is OPEN — we render two vertical wood-plank panels swung
  // INWARD/SIDEWAYS, hugging the jambs. Reads as "you can see the wood door
  // is open"; without them, the opening looks like a stone arch with no door.
  // Left panel — 8px wide, hugs the left jamb interior.
  const PANEL_W = 8;
  const PANEL_H = openingH - 6; // clear the sill band drawn below
  // Left panel: three vertical planks of WOOD_BASE separated by 1px WOOD_DARK
  // grooves. Drawn as one block with grooves overpainted.
  const leftPanel = new Graphics();
  leftPanel
    .rect(openingX, openingY, PANEL_W, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(leftPanel);
  // Plank grooves (vertical) on left panel.
  const leftPanelGrooves = new Graphics();
  leftPanelGrooves
    .rect(openingX + Math.floor(PANEL_W / 3), openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  leftPanelGrooves
    .rect(openingX + Math.floor((2 * PANEL_W) / 3), openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(leftPanelGrooves);
  // 1px WOOD_LIGHT highlight on the inner (right) edge of the left panel.
  // POLISH PASS 2026-05-30 (late): bumped alpha 0.7 → 1.0 + added a second
  // 1px outer highlight strip so the wood panels read brighter at thumbnail.
  const leftPanelEdge = new Graphics();
  leftPanelEdge
    .rect(openingX + PANEL_W - 1, openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  leftPanelEdge.alpha = 1.0;
  container.addChild(leftPanelEdge);
  // Outer (left) edge of left panel — same WOOD_LIGHT, dimmer.
  const leftPanelOuterEdge = new Graphics();
  leftPanelOuterEdge
    .rect(openingX, openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  leftPanelOuterEdge.alpha = 0.45;
  container.addChild(leftPanelOuterEdge);

  // Right panel — mirror of left, hugs the right jamb interior.
  const rightPanelX = openingX + openingW - PANEL_W;
  const rightPanel = new Graphics();
  rightPanel
    .rect(rightPanelX, openingY, PANEL_W, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(rightPanel);
  const rightPanelGrooves = new Graphics();
  rightPanelGrooves
    .rect(rightPanelX + Math.floor(PANEL_W / 3), openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  rightPanelGrooves
    .rect(rightPanelX + Math.floor((2 * PANEL_W) / 3), openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(rightPanelGrooves);
  const rightPanelEdge = new Graphics();
  rightPanelEdge
    .rect(rightPanelX, openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  rightPanelEdge.alpha = 1.0;
  container.addChild(rightPanelEdge);
  // Outer (right) edge of right panel — same WOOD_LIGHT, dimmer.
  const rightPanelOuterEdge = new Graphics();
  rightPanelOuterEdge
    .rect(rightPanelX + PANEL_W - 1, openingY, 1, PANEL_H)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  rightPanelOuterEdge.alpha = 0.45;
  container.addChild(rightPanelOuterEdge);

  // -------- 2c. Hanging-lantern glow above the threshold --------
  // POLISH PASS 2026-05-30 (late): enlarged halo (was 10×4) to 14×8 with a
  // brighter CANDLE_CORE flame and a 1px CANDLE_DIM ring so the door reads
  // as a clear inviting threshold at thumbnail. Anti-slasher: dim warm, not red.
  const lanternCX = doorX + DOOR_W / 2;
  const lanternY = doorTopY + ARCH_H - 6;
  // Outer halo — wider, dimmer CANDLE_DIM ring around the core glow.
  const lanternHaloOuter = new Graphics();
  lanternHaloOuter
    .rect(lanternCX - 8, lanternY - 1, 16, 10)
    .fill(PIXEL_PALETTE.CANDLE_DIM);
  lanternHaloOuter.alpha = 0.4;
  container.addChild(lanternHaloOuter);
  // Inner halo — was the only halo, now bumped to 14×8 brighter.
  const lanternGlow = new Graphics();
  lanternGlow
    .rect(lanternCX - 7, lanternY, 14, 8)
    .fill(PIXEL_PALETTE.CANDLE_GLOW);
  lanternGlow.alpha = 0.7;
  container.addChild(lanternGlow);
  // CANDLE_CORE flame — slightly larger, brighter.
  const lanternFlame = new Graphics();
  lanternFlame
    .rect(lanternCX - 2, lanternY + 2, 4, 4)
    .fill(PIXEL_PALETTE.CANDLE_CORE);
  lanternFlame.alpha = 0.95;
  container.addChild(lanternFlame);

  // -------- 3. Wooden threshold sill --------
  // A 6px-tall WOOD_BASE band across the bottom of the opening, sitting on
  // the floor surface. Reads as the worn wooden sill pilgrims step over.
  const sill = new Graphics();
  sill
    .rect(doorX, doorBottomY - 6, DOOR_W, 6)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(sill);
  // 1px WOOD_DARK shadow under the sill.
  const sillShadow = new Graphics();
  sillShadow
    .rect(doorX, doorBottomY - 1, DOOR_W, 1)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(sillShadow);

  return container;
}

// Door-x metadata exposed so cross-team systems (#1 Foundation's interactive
// E-to-enter mechanic, Stage's proximity checks) can match the visual door
// without duplicating constants.
//   doorX     — left edge of the stone frame (inset 16 from chapelBounds.x)
//   doorW     — outer width including jambs
//   doorCx    — geometric center; use for proximity checks
export const CHAPEL_FRONT_DOOR_GEOM = Object.freeze({
  insetFromBoundsLeft: 16,
  doorW: 64,
  doorH: 160,
  // Default values when bounds.x = 80 (confession-room.json):
  doorX: 96,
  doorCx: 128,
  // Proximity window for E-to-enter: ±24 px of doorCx.
  interactHalfWidth: 24,
});
