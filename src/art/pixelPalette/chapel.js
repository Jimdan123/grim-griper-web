// chapel.js — chapel architecture (nave, front door, ceiling, exterior, outside scene).
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from './constants.js';

// ---------------------------------------------------------------------------
// createNaveRoomPixelArt({ tile, bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Renders the DAY-phase Nave in pixel-art register.
//
// `bounds` is the nave's logical-px footprint. For confession-room.json the
// nave currently overlays the chapelBounds rect; the dispatch describes it
// as x=80–1024, y=200–620 (logical px). We accept whatever bounds Foundation
// passes and tile-align all geometry inside it.
//
// Layers (back-to-front):
//   1. Back wall — stone-block tessellation (32x16 blocks, 1px mortar).
//   2. Pillar accents at x=256/512/768/1024 (tile-snapped) — STONE_LIGHT
//      column-face highlights so the four nave pillars still read.
//   3. Window opening over the altar (altar.x=220 → snap to 208; warm
//      DAY_LIGHT pane with stone frame and a single cross-mullion).
//   4. Floor — flagstone tessellation (32x16 slabs, 1px grout) across the
//      bottom band (y ~ 528 down to floor bottom).
//   5. Baseboard — 8px STONE_DARK strip where wall meets floor.
//   6. Dust motes — a small cluster of single-pixel DAY_LIGHT specks inside
//      the window shaft. Static. Low alpha. Optional, but cheap to leave in.
//
// Discipline check (anti-slasher):
//   * Stone palette is grey-purple, NO red.
//   * Floor palette is cool-purple, NO red.
//   * NO body-shape blocks anywhere in the wall tessellation.
//   * Candles (warm) are not painted here — day light through the window is
//     the ONLY light source visible in this layer. Heavy shadow elsewhere.
export function createNaveRoomPixelArt({ tile = 16, bounds } = {}) {
  if (!bounds) {
    throw new Error('createNaveRoomPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'nave-pixel-day';

  const x0 = snap(bounds.x, tile);
  const y0 = snap(bounds.y, tile);
  const w = snap(bounds.width, tile);
  const h = snap(bounds.height, tile);

  // Floor band height: ~100 logical px per dispatch, tile-aligned to 96
  // (6 rows of 16px tiles). Floor top sits at floorTopY.
  const FLOOR_BAND_H = 96;
  const floorTopY = y0 + h - FLOOR_BAND_H;

  // -------- 1. Back wall: stone-block tessellation --------
  // Block geometry: 32 wide × 16 tall. Mortar = 1px gaps between blocks,
  // drawn by *omitting* mortar pixels via offset block rects on a darker
  // wall base. Cheaper: paint the entire wall STONE_MORTAR first (shadow
  // tone), then stamp STONE_BASE block faces with a 1px inset that
  // reveals the mortar lines underneath.
  const wallBase = new Graphics();
  wallBase
    .rect(x0, y0, w, floorTopY - y0)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(wallBase);

  const BLOCK_W = 32;
  const BLOCK_H = 16;
  const blocks = new Graphics();
  // Stagger every other row by half a block (running-bond brick pattern) so
  // the wall doesn't read as a flat grid. Mortar stays at 1px between cells.
  for (let row = 0, ry = y0; ry + BLOCK_H <= floorTopY; row++, ry += BLOCK_H) {
    const offset = (row % 2 === 0) ? 0 : BLOCK_W / 2;
    for (let bx = x0 - offset; bx < x0 + w; bx += BLOCK_W) {
      const cellX = bx + 1;                 // 1px mortar gap on left
      const cellY = ry + 1;                 // 1px mortar gap on top
      const cellW = BLOCK_W - 2;             // 1px gaps L+R
      const cellH = BLOCK_H - 2;             // 1px gaps T+B
      // Clip to the wall rect.
      const clipX = Math.max(cellX, x0);
      const clipY = Math.max(cellY, y0);
      const clipR = Math.min(cellX + cellW, x0 + w);
      const clipB = Math.min(cellY + cellH, floorTopY);
      const drawW = clipR - clipX;
      const drawH = clipB - clipY;
      if (drawW <= 0 || drawH <= 0) continue;
      blocks.rect(clipX, clipY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      // 1px top highlight on each block — candle-light bevel.
      if (clipY + 1 <= clipB) {
        blocks.rect(clipX, clipY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
      }
      // 1px bottom shadow.
      if (clipB - 1 >= clipY) {
        blocks.rect(clipX, clipB - 1, drawW, 1).fill(PIXEL_PALETTE.STONE_DARK);
      }
    }
  }
  container.addChild(blocks);

  // -------- 2. Pillar accents at x=256/512/768/1024 --------
  // Each pillar is a 16px-wide column of STONE_LIGHT (highlight column) with
  // a 16px-wide STONE_DARK shadow column 16px to its right, suggesting a
  // rounded pillar standing proud of the wall. Tile-snapped to the nearest
  // 16px boundary.
  const PILLAR_XS = [256, 512, 768, 1024];
  const pillars = new Graphics();
  for (const px of PILLAR_XS) {
    const cx = snap(px, tile);
    const top = y0;
    const bot = floorTopY;
    // Highlight column (sun-side / candle-side).
    pillars.rect(cx - tile, top, tile, bot - top).fill(PIXEL_PALETTE.STONE_LIGHT);
    // Shadow column (the opposite side of the round).
    pillars.rect(cx, top, tile, bot - top).fill(PIXEL_PALETTE.STONE_DARK);
    // Cap — 4px STONE_BASE band at the top to read as capital.
    pillars.rect(cx - tile, top, tile * 2, 4).fill(PIXEL_PALETTE.STONE_BASE);
    // Base — 4px STONE_BASE band at the bottom.
    pillars.rect(cx - tile, bot - 4, tile * 2, 4).fill(PIXEL_PALETTE.STONE_BASE);
  }
  container.addChild(pillars);

  // -------- 3. Window opening over the altar --------
  // Altar.x = 220 in confession-room.json. Window sits centered above the
  // altar; dispatch suggests altar.x - 30 = 190 → snap to 192. Window is
  // tall and narrow: 64 wide × 160 tall, top at y0 + 32. Inset 16px on all
  // sides with DAY_LIGHT cream pane. One cross-mullion.
  const WIN_W = 64;
  const WIN_H = 160;
  const winX = snap(220 - 30 - WIN_W / 2 + WIN_W / 2, tile); // 192 logical
  // Place window top a few tiles down from the cornice so it reads "high
  // on the wall" without crashing into the top edge.
  const winY = snap(y0 + 96, tile);

  const winFrame = new Graphics();
  winFrame
    .rect(winX, winY, WIN_W, WIN_H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(winFrame);

  const winPane = new Graphics();
  winPane
    .rect(winX + 8, winY + 8, WIN_W - 16, WIN_H - 16)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  container.addChild(winPane);

  // Cross-mullion — vertical + horizontal stone strips dividing the pane
  // into four panels. Reads as gothic chapel window at thumbnail.
  const mullion = new Graphics();
  // Vertical bar — 2px wide, full pane height.
  mullion
    .rect(winX + WIN_W / 2 - 1, winY + 8, 2, WIN_H - 16)
    .fill(PIXEL_PALETTE.STONE_DARK);
  // Horizontal bar — 2px tall, full pane width.
  mullion
    .rect(winX + 8, winY + WIN_H / 2 - 1, WIN_W - 16, 2)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(mullion);

  // -------- 4. Floor: flagstone tessellation --------
  const floorBase = new Graphics();
  floorBase
    .rect(x0, floorTopY, w, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.FLOOR_GROUT);
  container.addChild(floorBase);

  const SLAB_W = 32;
  const SLAB_H = 16;
  const slabs = new Graphics();
  for (let row = 0, ry = floorTopY; ry + SLAB_H <= floorTopY + FLOOR_BAND_H; row++, ry += SLAB_H) {
    const offset = (row % 2 === 0) ? 0 : SLAB_W / 2;
    for (let bx = x0 - offset; bx < x0 + w; bx += SLAB_W) {
      const cellX = Math.max(bx + 1, x0);
      const cellY = ry + 1;
      const cellR = Math.min(bx + SLAB_W - 1, x0 + w);
      const cellB = ry + SLAB_H - 1;
      const drawW = cellR - cellX;
      const drawH = cellB - cellY;
      if (drawW <= 0 || drawH <= 0) continue;
      slabs.rect(cellX, cellY, drawW, drawH).fill(PIXEL_PALETTE.FLOOR_BASE);
      // 1px top edge shadow on each slab — depth read.
      slabs.rect(cellX, cellY, drawW, 1).fill(PIXEL_PALETTE.FLOOR_DARK);
    }
  }
  container.addChild(slabs);

  // -------- 5. Baseboard --------
  // 8px STONE_DARK strip where the back wall meets the floor surface,
  // sitting just above floorTopY. Reads as the shadow ridge at the wall
  // base — anchors the wall to the floor.
  const baseboard = new Graphics();
  baseboard
    .rect(x0, floorTopY - 8, w, 8)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(baseboard);

  // -------- 6. Dust motes in the window shaft --------
  // Eight single-pixel DAY_LIGHT specks scattered diagonally from the
  // window down-left toward the floor — suggests a sunbeam shaft without
  // drawing an explicit ray (which would muddy the silhouette layer).
  const motes = new Graphics();
  const moteSpots = [
    [winX + WIN_W / 2 + 8,   winY + WIN_H + 24],
    [winX + WIN_W / 2 - 4,   winY + WIN_H + 48],
    [winX + WIN_W / 2 + 18,  winY + WIN_H + 60],
    [winX + WIN_W / 2 - 12,  winY + WIN_H + 80],
    [winX + WIN_W / 2 + 4,   winY + WIN_H + 96],
    [winX + WIN_W / 2 - 22,  winY + WIN_H + 112],
    [winX + WIN_W / 2 + 12,  winY + WIN_H + 128],
    [winX + WIN_W / 2 - 6,   winY + WIN_H + 144],
  ];
  for (const [mx, my] of moteSpots) {
    if (my >= floorTopY) continue; // don't paint motes on the floor
    motes.rect(snap(mx, 1), snap(my, 1), 1, 1).fill(PIXEL_PALETTE.DAY_LIGHT);
  }
  motes.alpha = 0.55;
  container.addChild(motes);

  return container;
}

// ---------------------------------------------------------------------------
// createAldricPixelSprite() -> PIXI.Container
// ---------------------------------------------------------------------------
// Day-phase Aldric. ~40 wide × 64 tall logical px. Stout cleric silhouette
// in ALDRIC_CREAM with a dark collar band. No face — placeholder discipline
// (the painterly placeholder also paints no face). No animation — walk
// cycle ships in a follow-up dispatch.
//
// Pivot is bottom-center so callers can use the same `sprite.x = waypoint.x;
// sprite.y = floorY` pattern the painterly sprite already supports.
//
// Discipline:
//   * No body-shape detail. Just torso + head + collar.
//   * Cream is the brightest tone in the scene (the victim is the brightest
//     thing in frame, per touchstone). The Aldric silhouette will dominate
//     the chapel midground at glance.
//   * Corner pixel-stairs on the head approximate a rounded skull without
//     using PIXI.circle (which would break the integer-pixel register).
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

// ---------------------------------------------------------------------------
// createChapelCeilingPixelArt({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Fills the canvas area ABOVE the chapelBounds back wall — i.e. y ∈ [0, bounds.y].
// Previously this was a black void; user reported the chapel looked "buggy" /
// unfinished above the wall. We render a band of pixel-art clerestory windows
// with warm DAY_LIGHT pouring through, framed by darker STONE_DARK vault.
//
// Composition (back-to-front):
//   1. Vault fill — STONE_DARK rect across the entire y ∈ [0, bounds.y] band.
//   2. Mullioned clerestory windows — three tall narrow stained-glass windows
//      arrayed across the back wall, each a stone frame with a DAY_LIGHT pane
//      and a single cross-mullion. Reads as "gothic chapel daylight from above".
//   3. Vault ribs — two thin STONE_LIGHT vertical accents at 1/3 and 2/3 of
//      the canvas width, terminating at the bottom of the ceiling band. Reads
//      as "rib-vault converging" without rendering literal arches.
//
// Discipline (anti-slasher):
//   * Stone palette only. Warm daylight through panes = cream, NOT red.
//   * No figures, no carvings, no body-shaped imagery.
//   * Daylight bias is muted DAY_LIGHT — the chapel is day-phase, lit but
//     gravitas-heavy, not cheerful.
export function createChapelCeilingPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelCeilingPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-ceiling-pixel-day';

  const tile = 16;
  const ceilTop = 0;
  const ceilBottom = bounds.y; // top of the back wall
  const ceilH = ceilBottom - ceilTop;
  const canvasW = 1280;

  // -------- 1. Vault fill --------
  const fill = new Graphics();
  fill.rect(0, ceilTop, canvasW, ceilH).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(fill);

  // 1px STONE_MORTAR mortar courses every 16px down the vault — reads as
  // stone tessellation without needing per-block tiling for the upper void.
  const courses = new Graphics();
  for (let y = ceilTop + tile; y < ceilBottom; y += tile) {
    courses.rect(0, y, canvasW, 1).fill(PIXEL_PALETTE.STONE_MORTAR);
  }
  courses.alpha = 0.6;
  container.addChild(courses);

  // -------- 2. Clerestory windows --------
  // Three windows spaced across the canvas width. Each is 48 wide × 96 tall,
  // sits with its bottom 24 px above the back-wall top so it doesn't crash
  // into the cornice. Frame STONE_BASE, pane DAY_LIGHT, cross-mullion STONE_DARK.
  const WIN_W = 48;
  const WIN_H = 96;
  const winBottomMargin = 24;
  const winY = Math.max(ceilTop + 16, ceilBottom - winBottomMargin - WIN_H);
  const winXs = [
    Math.round(canvasW * 0.18) - WIN_W / 2,
    Math.round(canvasW * 0.50) - WIN_W / 2,
    Math.round(canvasW * 0.82) - WIN_W / 2,
  ];
  for (const wx of winXs) {
    const winX = snap(wx, tile);
    // Outer frame.
    const frame = new Graphics();
    frame.rect(winX, winY, WIN_W, WIN_H).fill(PIXEL_PALETTE.STONE_BASE);
    container.addChild(frame);
    // 1px highlight on top of frame.
    const frameHi = new Graphics();
    frameHi.rect(winX, winY, WIN_W, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    container.addChild(frameHi);
    // Pane — inset 6 px on all sides.
    const pane = new Graphics();
    pane
      .rect(winX + 6, winY + 6, WIN_W - 12, WIN_H - 12)
      .fill(PIXEL_PALETTE.DAY_LIGHT);
    pane.alpha = 0.85;
    container.addChild(pane);
    // Cross-mullion — vertical + horizontal stone bars, 2px each.
    const mullion = new Graphics();
    mullion
      .rect(winX + WIN_W / 2 - 1, winY + 6, 2, WIN_H - 12)
      .fill(PIXEL_PALETTE.STONE_DARK);
    mullion
      .rect(winX + 6, winY + WIN_H / 2 - 1, WIN_W - 12, 2)
      .fill(PIXEL_PALETTE.STONE_DARK);
    container.addChild(mullion);
    // Pointed-arch cap on top of the window — three stepped STONE_BASE blocks
    // narrowing toward a 4px point. Lifts the clerestory read above "flat box".
    const cap = new Graphics();
    const capSteps = [
      { inset: 18, h: 4 },
      { inset: 12, h: 4 },
      { inset: 6,  h: 4 },
    ];
    for (let i = 0; i < capSteps.length; i++) {
      const step = capSteps[i];
      const sx = winX + step.inset;
      const sw = WIN_W - step.inset * 2;
      const sy = winY - capSteps.length * step.h + i * step.h;
      cap.rect(sx, sy, sw, step.h).fill(PIXEL_PALETTE.STONE_BASE);
      cap.rect(sx, sy, sw, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
    container.addChild(cap);
  }

  // -------- 3. Vault ribs (subtle vertical stone accents) --------
  // Two ribs at 1/3 and 2/3 canvas width, just visual depth cues.
  const ribs = new Graphics();
  for (const fx of [1 / 3, 2 / 3]) {
    const rx = Math.round(canvasW * fx);
    ribs.rect(rx, ceilTop, 2, ceilH).fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  ribs.alpha = 0.35;
  container.addChild(ribs);

  // -------- 4. Cornice strip — the boundary band between ceiling and wall.
  // 4px STONE_BASE strip just above the back-wall top.
  const cornice = new Graphics();
  cornice
    .rect(0, ceilBottom - 4, canvasW, 4)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(cornice);
  const corniceHi = new Graphics();
  corniceHi
    .rect(0, ceilBottom - 4, canvasW, 1)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  container.addChild(corniceHi);

  return container;
}

// ---------------------------------------------------------------------------
// createChapelExteriorPixelArt({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Fills the area to the LEFT of chapelBounds — i.e. x ∈ [0, bounds.x] — where
// the Reaper spawns and walks toward the front door. Previously this was a
// flat black void; user wants to spawn outside the chapel and walk in via the
// door.
//
// Composition (back-to-front):
//   1. Pre-dusk sky band — NIGHT_AMBIENT band fills the upper portion
//      (above the path). Reads as "outside, late afternoon edging toward dusk".
//   2. Path/cobble band — repeating 16×8 STONE_BASE cobble tiles with darker
//      STONE_MORTAR grout, filling the floor level. The path leads RIGHT
//      toward the chapel door.
//   3. Grass tuft accents — a few darker (STONE_DARK family) 2×2 specks at
//      path edges, tonal life only. No bushes / no trees / no buildings.
//
// Discipline:
//   * No people, no second buildings, no church-on-the-horizon.
//   * Sky is muted blue-purple — NOT bright daylight. The day phase is muted.
//   * No red anywhere.
export function createChapelExteriorPixelArt({ bounds } = {}) {
  if (!bounds) {
    throw new Error('createChapelExteriorPixelArt: bounds is required');
  }
  const container = new Container();
  container.label = 'chapel-exterior-pixel-day';

  const tile = 16;
  const FLOOR_BAND_H = 96;
  const extLeft = 0;
  const extRight = bounds.x;       // exterior ends where the chapel wall begins
  const extW = extRight - extLeft;
  const extTop = 0;
  const extBottom = bounds.y + bounds.height; // canvas-floor alignment with chapel
  const floorTopY = bounds.y + bounds.height - FLOOR_BAND_H;

  // -------- 1. Sky band --------
  // From y=0 down to floorTopY.
  const sky = new Graphics();
  sky.rect(extLeft, extTop, extW, floorTopY).fill(PIXEL_PALETTE.NIGHT_AMBIENT);
  container.addChild(sky);

  // Subtle horizontal "haze" bands — 1px STONE_DARK lines every 32px, low
  // alpha. Reads as atmospheric depth without rendering literal clouds.
  const haze = new Graphics();
  for (let y = 16; y < floorTopY; y += 32) {
    haze.rect(extLeft, y, extW, 1).fill(PIXEL_PALETTE.STONE_DARK);
  }
  haze.alpha = 0.3;
  container.addChild(haze);

  // -------- 2. Path/cobble band --------
  // Floor band: repeating 16×8 cobble tiles. Two staggered rows per 16px tile
  // height. STONE_BASE stones with STONE_MORTAR grout between them.
  const pathBase = new Graphics();
  pathBase
    .rect(extLeft, floorTopY, extW, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(pathBase);

  const COB_W = 16;
  const COB_H = 8;
  const cobbles = new Graphics();
  for (let row = 0, ry = floorTopY; ry + COB_H <= extBottom; row++, ry += COB_H) {
    const offset = (row % 2 === 0) ? 0 : COB_W / 2;
    for (let bx = extLeft - offset; bx < extRight; bx += COB_W) {
      const cellX = Math.max(bx + 1, extLeft);
      const cellY = ry + 1;
      const cellR = Math.min(bx + COB_W - 1, extRight);
      const cellB = ry + COB_H - 1;
      const drawW = cellR - cellX;
      const drawH = cellB - cellY;
      if (drawW <= 0 || drawH <= 0) continue;
      cobbles.rect(cellX, cellY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      // 1px top highlight on each cobble.
      cobbles.rect(cellX, cellY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
  }
  container.addChild(cobbles);

  // -------- 2b. Path edge — darker line where path meets the sky --------
  const pathEdge = new Graphics();
  pathEdge
    .rect(extLeft, floorTopY - 1, extW, 1)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(pathEdge);

  // -------- 3. Grass tufts at path edges --------
  // Three 2×2 specks of muted color at the top edge of the cobble band, at
  // pseudo-random x positions. Tonal life only.
  const tufts = new Graphics();
  const tuftSpots = [
    [extLeft + 14, floorTopY - 2],
    [extLeft + 38, floorTopY - 2],
    [extLeft + 62, floorTopY - 2],
  ];
  for (const [tx, ty] of tuftSpots) {
    if (tx + 2 > extRight) continue;
    tufts.rect(tx, ty, 2, 2).fill(PIXEL_PALETTE.WOOD_DARK);
  }
  tufts.alpha = 0.7;
  container.addChild(tufts);

  // -------- 3b. Chapel-wall shadow at the right edge --------
  // 4px STONE_DARK band hugging x = extRight, suggests the shadow the chapel
  // wall casts onto the exterior path.
  const wallShadow = new Graphics();
  wallShadow
    .rect(extRight - 4, floorTopY, 4, FLOOR_BAND_H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  wallShadow.alpha = 0.5;
  container.addChild(wallShadow);

  return container;
}

// ---------------------------------------------------------------------------
// Pixel-art interior props
// ---------------------------------------------------------------------------
// The painterly placeholders.js authors altar / lectern / booth / sacristy
// props in a soft-edged painterly grammar. In pixel-art mode these clash
// hard with the pixel-art back wall the user is seeing. These factories
// re-author the same four anchor props in the pixel-art register.
//
// All factories accept a `floorY` (top of the floor strip in logical px,
// typically Stage.floorY = chapelBounds.y + chapelBounds.height - 96 = 524
// after pixel-art FLOOR_BAND_H, or 520 in the painterly path — both work
// because the factories receive the value explicitly). The prop's bottom
// edge rests on floorY.
//
// All return PIXI.Container drawn once at construction.

/**
 * Pixel-art altar block (x default = 220 matches confession-room.json Altar
 * waypoint). 72 wide × 40 tall stone block with a 4 px top trim band, a
 * faint brown poison-ring discoloration (NOT red), and two flanking 6×24
 * candle wax pillars topped with CANDLE_CORE flame pixels.
 *
 * Anti-slasher: discoloration is BROWN. No red, no body shapes.
 */
export function createOutsideChapelScenePixelArt({ bounds, floorY = 560 } = {}) {
  // bounds is accepted for symmetry with sibling factories but the outside
  // scene always renders to the full 1280×720 logical canvas — see contract.
  void bounds;

  const container = new Container();
  container.label = 'outside-chapel-pixel-day';

  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const GROUND_Y = floorY;    // top of the ground band (default 560)

  // -------------------------------------------------------------------------
  // 1. Sky band
  // -------------------------------------------------------------------------
  const sky = new Graphics();
  sky.rect(0, 0, CANVAS_W, GROUND_Y).fill(PIXEL_PALETTE.SKY_BLUE);
  container.addChild(sky);

  // Horizon haze — slightly lighter band along y ∈ [GROUND_Y-80, GROUND_Y].
  const horizonHaze = new Graphics();
  horizonHaze
    .rect(0, GROUND_Y - 80, CANVAS_W, 80)
    .fill(PIXEL_PALETTE.SKY_HORIZON);
  horizonHaze.alpha = 0.6;
  container.addChild(horizonHaze);

  // POLISH PASS: tight horizon-mist band straddling the sky→grass meeting
  // line so the transition is no longer a hard horizontal cut. 8px lighter
  // sky-side haze right above the ground line, then a 4px grass-side band of
  // GROUND_GRASS_HI bleeding upward into the haze. Anti-slasher: cream-cool
  // mist, NOT sunset orange, NOT blood haze.
  const horizonMistSky = new Graphics();
  horizonMistSky
    .rect(0, GROUND_Y - 8, CANVAS_W, 8)
    .fill(PIXEL_PALETTE.SKY_HORIZON);
  horizonMistSky.alpha = 0.5;
  container.addChild(horizonMistSky);
  const horizonMistGrass = new Graphics();
  horizonMistGrass
    .rect(0, GROUND_Y, CANVAS_W, 4)
    .fill(PIXEL_PALETTE.GROUND_GRASS_HI);
  horizonMistGrass.alpha = 0.3;
  container.addChild(horizonMistGrass);

  // Two low-alpha pale cloud-wisp streaks JUST above the horizon mist band —
  // atmospheric perspective hint. Long and thin so they read as far-away
  // cloud, not foreground smoke.
  const horizonClouds = new Graphics();
  horizonClouds.rect(60, GROUND_Y - 18, 280, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  horizonClouds.rect(380, GROUND_Y - 14, 220, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  horizonClouds.alpha = 0.35;
  container.addChild(horizonClouds);

  // Cloud streaks — 1px horizontal wisps at low alpha. Two streaks at
  // varying lengths, all in the upper third.
  const clouds = new Graphics();
  // Streak A — long, x=140..360, y=90
  clouds.rect(140, 90, 220, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.rect(160, 91, 180, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  // Streak B — short, x=520..640, y=148
  clouds.rect(520, 148, 120, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  // Streak C — long fade right, x=720..1040, y=70
  clouds.rect(720, 70, 320, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.rect(760, 71, 240, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.alpha = 0.7;
  container.addChild(clouds);

  // Sun — 12×12 muted gold disc with a faint halo. Upper-right area.
  // Anti-slasher: muted DAY_LIGHT cream-gold, NOT a neon yellow disc.
  const SUN_CX = 1140;
  const SUN_CY = 110;
  // Halo (3 concentric squares of widening size, decreasing alpha).
  const sunHalo = new Graphics();
  sunHalo.rect(SUN_CX - 14, SUN_CY - 14, 28, 28).fill(PIXEL_PALETTE.SUN_DISC);
  sunHalo.alpha = 0.18;
  container.addChild(sunHalo);
  const sunHaloMid = new Graphics();
  sunHaloMid.rect(SUN_CX - 10, SUN_CY - 10, 20, 20).fill(PIXEL_PALETTE.SUN_DISC);
  sunHaloMid.alpha = 0.28;
  container.addChild(sunHaloMid);
  // Sun disc — 12×12 with corner pixel-stairs to round it.
  const sun = new Graphics();
  sun.rect(SUN_CX - 6, SUN_CY - 6, 12, 12).fill(PIXEL_PALETTE.SUN_DISC);
  // Knock out four corner pixels for a rounded read.
  sun.rect(SUN_CX - 6, SUN_CY - 6, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX + 5, SUN_CY - 6, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX - 6, SUN_CY + 5, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX + 5, SUN_CY + 5, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  container.addChild(sun);

  // -------------------------------------------------------------------------
  // 2. Distant treeline + spire silhouette (horizon, y ≈ 280..360)
  // -------------------------------------------------------------------------
  // QA re-author 2026-05-30 evening: the previous "village rooftops" read as
  // cardboard boxes with paper hats even after a polish pass — too abstract,
  // template-cloned, no architectural detail. Replaced with a pixel-art TREE
  // LINE silhouette: a row of pine/conifer silhouettes along the horizon,
  // with ONE distant church spire poking above. Anti-slasher: living trees,
  // not bare creepy branches. Reads as "approaching a village from the
  // country" without trying to depict buildings at distance.
  const villageHorizonY = 360;
  // Skip the old village rendering block. The trees + spire below replace it.
  // eslint-disable-next-line no-unused-vars
  const _treelineHorizonY = villageHorizonY;
  // Distant rolling hills — a wavy ground silhouette filling y=320..560
  // (from horizon line down to the foreground grass band). The hills ARE
  // the distant ground; they don't float because they extend from the
  // horizon to where the foreground grass begins. This is the layered
  // landscape pattern: far hills (darker, lower-saturation) → mid-ground
  // grass (the existing path band) → foreground (cobble path + props).
  const hills = new Graphics();
  // Back hill ridge — far horizon, slightly bluer (atmospheric perspective).
  // A series of overlapping arcs at y ≈ 320-360 with FOLIAGE_DARK + a touch
  // of sky-blue mixed in via low-alpha overlay.
  const BACK_HILL_BASE_Y = 380; // bottom of back hill row
  const backRidgePoints = [
    { x:   0, peakDip: 30 },
    { x:  60, peakDip: 12 },
    { x: 120, peakDip: 40 },
    { x: 200, peakDip: 18 },
    { x: 280, peakDip: 36 },
    { x: 360, peakDip:  6 },  // dips a bit lower so spire reads tall
    { x: 440, peakDip: 32 },
    { x: 520, peakDip: 14 },
    { x: 600, peakDip: 28 },
    { x: 640, peakDip: 20 },
  ];
  // Build the back-hill silhouette as a SINGLE polygon (smooth curve)
  // instead of stacked 9-px columns — the column approach was visibly
  // showing vertical seams between adjacent columns. Polygon = no seams.
  // We sample the curve every 4px along x, get the top y, then trace the
  // outline + close at BACK_HILL_BASE_Y.
  const backRidgeSamples = [];
  for (let i = 0; i < backRidgePoints.length - 1; i++) {
    const a = backRidgePoints[i];
    const b = backRidgePoints[i + 1];
    const segments = Math.max(1, Math.floor((b.x - a.x) / 4));
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
      const dip = a.peakDip + (b.peakDip - a.peakDip) * eased;
      const x = a.x + s * 4;
      const y = 320 + dip;
      backRidgeSamples.push([x, y]);
    }
  }
  // Trace the polygon: top of ridge from left to right, then close at base.
  hills.moveTo(backRidgeSamples[0][0], BACK_HILL_BASE_Y);
  for (const [x, y] of backRidgeSamples) hills.lineTo(x, y);
  hills.lineTo(backRidgeSamples[backRidgeSamples.length - 1][0], BACK_HILL_BASE_Y);
  hills.closePath();
  hills.fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Brighter highlight along the top ridge (1px line traced just above the
  // silhouette top).
  for (let i = 0; i < backRidgeSamples.length - 1; i++) {
    const [x1, y1] = backRidgeSamples[i];
    const [x2, y2] = backRidgeSamples[i + 1];
    hills.moveTo(x1, y1);
    hills.lineTo(x2, y2);
    hills.stroke({ color: PIXEL_PALETTE.FOLIAGE_BASE, width: 1 });
  }
  hills.alpha = 0.85;
  container.addChild(hills);

  // Front hill ridge — slightly closer, brighter, taller, anchored at
  // GROUND_Y (the actual foreground grass line — typically 520, derived
  // from chapelBounds.y + chapelBounds.height - FLOOR_STRIP_H, NOT 560
  // as I previously hardcoded). Sits IN FRONT of the back hill + spire.
  // QA bug fix 2026-05-30 evening: hardcoded 560 created a 40px sky-blue
  // gap between hill bottoms and the grass band, making hills look like
  // they were floating. Anchoring to GROUND_Y eliminates the gap.
  const frontHills = new Graphics();
  const FRONT_HILL_BASE_Y = GROUND_Y;
  const frontRidgePoints = [
    { x:   0, peakDip: 40 },
    { x:  80, peakDip: 60 },
    { x: 180, peakDip: 30 },
    { x: 280, peakDip: 50 },
    { x: 400, peakDip: 24 },
    { x: 500, peakDip: 48 },
    { x: 600, peakDip: 18 },
    { x: 640, peakDip: 36 },
  ];
  // Same polygon approach for front hills — no seams between columns.
  const FRONT_HILL_TOP_MAX = FRONT_HILL_BASE_Y - 120;
  const frontRidgeSamples = [];
  for (let i = 0; i < frontRidgePoints.length - 1; i++) {
    const a = frontRidgePoints[i];
    const b = frontRidgePoints[i + 1];
    const segments = Math.max(1, Math.floor((b.x - a.x) / 4));
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
      const dip = a.peakDip + (b.peakDip - a.peakDip) * eased;
      const x = a.x + s * 4;
      const y = FRONT_HILL_TOP_MAX + dip;
      frontRidgeSamples.push([x, y]);
    }
  }
  frontHills.moveTo(frontRidgeSamples[0][0], FRONT_HILL_BASE_Y);
  for (const [x, y] of frontRidgeSamples) frontHills.lineTo(x, y);
  frontHills.lineTo(frontRidgeSamples[frontRidgeSamples.length - 1][0], FRONT_HILL_BASE_Y);
  frontHills.closePath();
  frontHills.fill(PIXEL_PALETTE.GROUND_GRASS);
  // Top-ridge highlight.
  for (let i = 0; i < frontRidgeSamples.length - 1; i++) {
    const [x1, y1] = frontRidgeSamples[i];
    const [x2, y2] = frontRidgeSamples[i + 1];
    frontHills.moveTo(x1, y1);
    frontHills.lineTo(x2, y2);
    frontHills.stroke({ color: PIXEL_PALETTE.GROUND_GRASS_HI, width: 1 });
  }
  frontHills.alpha = 0.95;
  container.addChild(frontHills);

  // Distant church spire — ONE recognizable landmark behind the treeline.
  // Tall narrow stone tower with a stepped pointed cap and a tiny cross at
  // the apex. Implies "another village beyond the trees" without trying to
  // render rooftops at distance.
  const spire = new Graphics();
  const SPIRE_X = 360;            // center x in left-mid horizon
  const SPIRE_TOP_Y = 270;        // peak y
  const SPIRE_BASE_Y = 360;       // ground line (behind tree heights)
  const SPIRE_W = 12;             // body width
  // Body — stone-base tower.
  spire.rect(SPIRE_X - SPIRE_W / 2, SPIRE_TOP_Y + 8, SPIRE_W, SPIRE_BASE_Y - (SPIRE_TOP_Y + 8))
    .fill(PIXEL_PALETTE.STONE_BASE);
  // 1px highlight on left (sun back-light).
  spire.rect(SPIRE_X - SPIRE_W / 2, SPIRE_TOP_Y + 8, 1, SPIRE_BASE_Y - (SPIRE_TOP_Y + 8))
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  // Stepped pointed cap (3 narrowing rows).
  spire.rect(SPIRE_X - 5, SPIRE_TOP_Y + 8, 10, 3).fill(PIXEL_PALETTE.STONE_DARK);
  spire.rect(SPIRE_X - 3, SPIRE_TOP_Y + 5, 6, 3).fill(PIXEL_PALETTE.STONE_DARK);
  spire.rect(SPIRE_X - 1, SPIRE_TOP_Y + 2, 2, 3).fill(PIXEL_PALETTE.STONE_DARK);
  // Tiny cross at apex — vertical 1×3 + horizontal 3×1.
  spire.rect(SPIRE_X, SPIRE_TOP_Y - 1, 1, 3).fill(PIXEL_PALETTE.STONE_LIGHT);
  spire.rect(SPIRE_X - 1, SPIRE_TOP_Y, 3, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  spire.alpha = 0.85;
  container.addChild(spire);

  // Distant smoke wisps — 2 thin 1px columns rising from BEHIND the treeline,
  // implying hidden villagers cooking. Anti-slasher: thin pale, NOT thick
  // black plumes.
  const smokeWisps = new Graphics();
  const SMOKE_POSITIONS = [
    { x: 180, baseY: villageHorizonY - 8, height: 14 },
    { x: 480, baseY: villageHorizonY - 12, height: 18 },
  ];
  for (const s of SMOKE_POSITIONS) {
    smokeWisps.rect(s.x, s.baseY - s.height, 1, s.height).fill(PIXEL_PALETTE.VILLAGE_SMOKE);
  }
  smokeWisps.alpha = 0.45;
  container.addChild(smokeWisps);

  // Legacy village rendering — disabled in favour of the treeline above.
  // Kept commented out below as historical reference; remove on next cleanup.
  /* eslint-disable no-unreachable */
  if (false) {
  // POLISH PASS: per-building variety — roofKind (steep|shallow|flat),
  // wallTint (cycles through 4 muted tones), hasWindow (lit 2x2 DAY_LIGHT
  // pane), hasChimney (1px smoke wisp). Anti-slasher: no creepy eye-windows,
  // no smoking ruins — just muted working village at midday.
  // Format: { baseX, baseW, wallH, roofH, roofKind, wallTint, hasWindow, hasChimney }
  const villageBuildings = [
    { baseX:  40, baseW: 56, wallH: 38, roofH: 22, roofKind: 'steep',   wallTint: 'WALL', hasWindow: true,  hasChimney: false },
    { baseX: 124, baseW: 72, wallH: 46, roofH: 28, roofKind: 'steep',   wallTint: 'WOOD', hasWindow: false, hasChimney: true  },
    { baseX: 220, baseW: 48, wallH: 32, roofH: 14, roofKind: 'shallow', wallTint: 'STONE',hasWindow: true,  hasChimney: false },
    { baseX: 296, baseW: 80, wallH: 52, roofH: 14, roofKind: 'flat',    wallTint: 'WALL', hasWindow: false, hasChimney: false },
    { baseX: 408, baseW: 60, wallH: 40, roofH: 24, roofKind: 'steep',   wallTint: 'WOOD', hasWindow: true,  hasChimney: false },
    { baseX: 488, baseW: 52, wallH: 34, roofH: 14, roofKind: 'shallow', wallTint: 'WALL', hasWindow: false, hasChimney: true  },
    { baseX: 568, baseW: 44, wallH: 28, roofH: 10, roofKind: 'flat',    wallTint: 'STONE',hasWindow: false, hasChimney: false },
  ];
  const WALL_TINTS = {
    WALL:  PIXEL_PALETTE.VILLAGE_WALL,
    WOOD:  PIXEL_PALETTE.WOOD_DARK,
    STONE: PIXEL_PALETTE.STONE_BASE,
  };
  const village = new Graphics();
  for (const b of villageBuildings) {
    const wallTop = villageHorizonY - b.wallH;
    const roofTop = wallTop - b.roofH;
    const wallColor = WALL_TINTS[b.wallTint] ?? PIXEL_PALETTE.VILLAGE_WALL;
    // Wall body.
    village.rect(b.baseX, wallTop, b.baseW, b.wallH).fill(wallColor);
    // 1px STONE_LIGHT highlight along wall top (catching the high sun).
    village.rect(b.baseX, wallTop, b.baseW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);

    // Roof per kind.
    const ROOF_STEP = 2;
    if (b.roofKind === 'flat') {
      // Flat-topped: thin VILLAGE_ROOF band capping the wall — no gable.
      village.rect(b.baseX - 1, roofTop + b.roofH - 4, b.baseW + 2, 4)
        .fill(PIXEL_PALETTE.VILLAGE_ROOF);
    } else if (b.roofKind === 'shallow') {
      // Shallow gable: less aggressive inset per step (×0.35) so the
      // silhouette reads wide+low instead of a steep triangle.
      const steps = Math.max(1, Math.floor(b.roofH / ROOF_STEP));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const rowY = roofTop + i * ROOF_STEP;
        const insetX = Math.round(b.baseW * 0.35 * t);
        const rowW = b.baseW - insetX * 2;
        village.rect(b.baseX + insetX, rowY, rowW, ROOF_STEP)
          .fill(PIXEL_PALETTE.VILLAGE_ROOF);
      }
    } else {
      // Steep gable (default — original behaviour).
      const steps = Math.max(1, Math.floor(b.roofH / ROOF_STEP));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const rowY = roofTop + i * ROOF_STEP;
        const insetX = Math.round(b.baseW * 0.5 * t);
        const rowW = b.baseW - insetX * 2;
        village.rect(b.baseX + insetX, rowY, rowW, ROOF_STEP)
          .fill(PIXEL_PALETTE.VILLAGE_ROOF);
      }
    }

    // Lit window pane — 2x2 DAY_LIGHT pixel near the upper-middle of wall.
    // Anti-slasher: small + warm, NOT a creepy glowing eye-row.
    if (b.hasWindow) {
      const winX = b.baseX + Math.round(b.baseW * 0.4);
      const winY = wallTop + Math.round(b.wallH * 0.45);
      village.rect(winX, winY, 2, 2).fill(PIXEL_PALETTE.DAY_LIGHT);
      // 1px STONE_DARK frame underneath (reads as window sill).
      village.rect(winX, winY + 2, 2, 1).fill(PIXEL_PALETTE.STONE_DARK);
    }

    // 1px shadow at base of wall — anchors the building to the ground line.
    village.rect(b.baseX, villageHorizonY - 1, b.baseW, 1).fill(PIXEL_PALETTE.STONE_DARK);
  }
  container.addChild(village);

  // Chimney wisps — for buildings flagged hasChimney. Wisp is 1px wide × 8px
  // tall, pale cream-grey, low alpha.
  const chimneyWisps = new Graphics();
  for (const b of villageBuildings) {
    if (!b.hasChimney) continue;
    const wallTop = villageHorizonY - b.wallH;
    const roofTop = wallTop - b.roofH;
    const chimX = b.baseX + Math.round(b.baseW * 0.7);
    const chimTop = roofTop + 4;
    // Chimney stub — 3px wide × 6px tall, VILLAGE_ROOF colour.
    chimneyWisps.rect(chimX, chimTop, 3, 6).fill(PIXEL_PALETTE.VILLAGE_ROOF);
    // Smoke wisp — 1px column above chimney, fading upward.
    chimneyWisps.rect(chimX + 1, chimTop - 6, 1, 6).fill(PIXEL_PALETTE.VILLAGE_SMOKE);
    chimneyWisps.rect(chimX + 2, chimTop - 10, 1, 4).fill(PIXEL_PALETTE.VILLAGE_SMOKE);
  }
  chimneyWisps.alpha = 0.7;
  container.addChild(chimneyWisps);
  } // end of disabled legacy village block
  /* eslint-enable no-unreachable */

  // -------------------------------------------------------------------------
  // 3. Chapel facade (right half of canvas)
  // -------------------------------------------------------------------------
  // Facade footprint: x ∈ [640, 1280], y ∈ [200, GROUND_Y=560]. The bell
  // tower extends UP from the roof line to y=80. Door is center-right of
  // facade at x ∈ [900, 996], door y ∈ [GROUND_Y-200, GROUND_Y] = [360, 560].
  // The stained-glass window sits above the door at x ∈ [916, 980] (32 wide
  // ... wait, dispatch says 32×56 so center at x=948 → window x ∈ [932, 980]
  // — but a 32-wide window centered on a 96-wide door looks lopsided. Lift
  // to a 48-wide window for facade balance. Doc note: this is a deliberate
  // interpretation, see "Open questions" in the bundle).
  const FACADE_LEFT = 640;
  const FACADE_RIGHT = 1280;
  const FACADE_W = FACADE_RIGHT - FACADE_LEFT;
  const FACADE_TOP = 200;
  const FACADE_BOTTOM = GROUND_Y;
  const FACADE_H = FACADE_BOTTOM - FACADE_TOP;

  // 3a. Facade base wall — STONE_MORTAR fill, then stamp HEADER-bond blocks
  // over it. Header bond = blocks are SHORT-FACE forward (visually narrower
  // than running bond) so the wall reads as "exterior chapel wall" vs the
  // interior nave's running bond. We use 16×16 blocks (header) here vs the
  // interior's 32×16 (running).
  const facadeBase = new Graphics();
  facadeBase
    .rect(FACADE_LEFT, FACADE_TOP, FACADE_W, FACADE_H)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(facadeBase);

  const HDR_W = 16;
  const HDR_H = 16;
  const facadeBlocks = new Graphics();
  for (let row = 0, ry = FACADE_TOP; ry + HDR_H <= FACADE_BOTTOM; row++, ry += HDR_H) {
    const offset = (row % 2 === 0) ? 0 : HDR_W / 2;
    for (let bx = FACADE_LEFT - offset; bx < FACADE_RIGHT; bx += HDR_W) {
      const cellX = bx + 1;
      const cellY = ry + 1;
      const cellW = HDR_W - 2;
      const cellH = HDR_H - 2;
      const clipX = Math.max(cellX, FACADE_LEFT);
      const clipY = Math.max(cellY, FACADE_TOP);
      const clipR = Math.min(cellX + cellW, FACADE_RIGHT);
      const clipB = Math.min(cellY + cellH, FACADE_BOTTOM);
      const drawW = clipR - clipX;
      const drawH = clipB - clipY;
      if (drawW <= 0 || drawH <= 0) continue;
      facadeBlocks.rect(clipX, clipY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      facadeBlocks.rect(clipX, clipY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
      facadeBlocks.rect(clipX, clipB - 1, drawW, 1).fill(PIXEL_PALETTE.STONE_DARK);
    }
  }
  container.addChild(facadeBlocks);

  // 3b. Two buttresses — 16px wide stone projections at x=720 and x=1184,
  // running from roof line down to ground. Slight inward batter (tapered
  // top) reads as gothic buttress.
  // POLISH PASS: x=1180 was NOT tile-aligned (1180/16 = 73.75). Snapped to
  // x=1184 (16*74) so the buttress sits cleanly on the header-bond grid.
  const buttressXs = [720, 1184];
  const buttresses = new Graphics();
  for (const bx of buttressXs) {
    // Lower fat portion — 20 wide × 240 tall.
    buttresses.rect(bx - 4, FACADE_BOTTOM - 240, 20, 240).fill(PIXEL_PALETTE.STONE_BASE);
    // 1px STONE_LIGHT on candle-lit (left) side.
    buttresses.rect(bx - 4, FACADE_BOTTOM - 240, 1, 240).fill(PIXEL_PALETTE.STONE_LIGHT);
    // 1px STONE_DARK on shadow side.
    buttresses.rect(bx + 15, FACADE_BOTTOM - 240, 1, 240).fill(PIXEL_PALETTE.STONE_DARK);
    // Stepped top batter — three 12-tall steps narrowing inward.
    const BAT_STEP = 12;
    for (let i = 0; i < 3; i++) {
      const inset = 2 + i * 2;
      const stepY = FACADE_BOTTOM - 240 - (3 - i) * BAT_STEP;
      buttresses.rect(bx - 4 + inset, stepY, 20 - inset * 2, BAT_STEP)
        .fill(PIXEL_PALETTE.STONE_BASE);
      buttresses.rect(bx - 4 + inset, stepY, 20 - inset * 2, 1)
        .fill(PIXEL_PALETTE.STONE_LIGHT);
    }
  }
  container.addChild(buttresses);

  // 3b.2 RIGHT-SIDE FACADE FILL — Polish pass. The wall area x=996..1280
  // previously read as a blank stone slab. Now populated with:
  //   - 32×64 stained-glass side panel at (1120, 320)
  //   - 12×16 ivy/moss patch at the base of the wall (low alpha)
  //   - 4×16 thin wooden side door at (1220, 480) — non-interactive
  // Anti-slasher: muted blue/cream panes (NOT red), warm-brown side door
  // (NOT iron-bound dungeon), muted-green ivy (NOT creeping rot vines).
  //
  // SIDE STAINED-GLASS PANEL — narrow lancet-style window, x=1120..1152,
  // y=320..384. Sits in the wall between the door arch top (y=320 ≈ door
  // arch base of the main door at y=400) and the gable trim line above.
  const SSGW_X = 1120;
  const SSGW_Y = 320;
  const SSGW_W = 32;
  const SSGW_H = 64;
  const sideSGFrame = new Graphics();
  sideSGFrame.rect(SSGW_X, SSGW_Y, SSGW_W, SSGW_H).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(sideSGFrame);
  // Pane fill — muted DAY_LIGHT cream so it reads as a lit interior pane
  // (NOT bright halo). Below 1.0 alpha so the stone-dark frame edges register.
  const sideSGPane = new Graphics();
  sideSGPane
    .rect(SSGW_X + 3, SSGW_Y + 3, SSGW_W - 6, SSGW_H - 6)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  sideSGPane.alpha = 0.55;
  container.addChild(sideSGPane);
  // Top patch — muted blue (sky pane).
  const sideSGPatches = new Graphics();
  sideSGPatches
    .rect(SSGW_X + 4, SSGW_Y + 4, SSGW_W - 8, 18)
    .fill(PIXEL_PALETTE.SKY_BLUE);
  // Bottom patch — muted cream.
  sideSGPatches
    .rect(SSGW_X + 4, SSGW_Y + SSGW_H - 22, SSGW_W - 8, 18)
    .fill(PIXEL_PALETTE.DAY_LIGHT);
  sideSGPatches.alpha = 0.5;
  container.addChild(sideSGPatches);
  // Cross mullion — single vertical + horizontal divider.
  const sideSGMullion = new Graphics();
  sideSGMullion
    .rect(SSGW_X + SSGW_W / 2 - 1, SSGW_Y + 3, 2, SSGW_H - 6)
    .fill(PIXEL_PALETTE.STONE_DARK);
  sideSGMullion
    .rect(SSGW_X + 3, SSGW_Y + SSGW_H / 2 - 1, SSGW_W - 6, 2)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(sideSGMullion);
  // Lancet arch cap above the side panel — three stepped narrowing rows.
  const sideSGCap = new Graphics();
  for (let i = 0; i < 3; i++) {
    const inset = 4 + i * 4;
    sideSGCap
      .rect(SSGW_X + inset, SSGW_Y - (3 - i) * 3, SSGW_W - inset * 2, 3)
      .fill(PIXEL_PALETTE.STONE_BASE);
    sideSGCap
      .rect(SSGW_X + inset, SSGW_Y - (3 - i) * 3, SSGW_W - inset * 2, 1)
      .fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  container.addChild(sideSGCap);

  // IVY / MOSS patch — 12 wide × 16 tall, sits at the base of the right wall
  // near x=1040, just to the left of the side door. Anti-slasher: muted
  // FOLIAGE_DARK, low alpha — implies time + neglect, NOT creeping rot.
  const ivy = new Graphics();
  const IVY_X = 1040;
  const IVY_Y = FACADE_BOTTOM - 16;
  // Main mass — stepped silhouette so it doesn't look like a green box.
  ivy.rect(IVY_X, IVY_Y, 12, 16).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  ivy.rect(IVY_X - 2, IVY_Y + 6, 14, 10).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  ivy.rect(IVY_X + 2, IVY_Y - 4, 6, 6).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // 1px FOLIAGE_BASE highlight on left side (candle-lit / day-lit side).
  ivy.rect(IVY_X - 2, IVY_Y + 6, 1, 10).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  ivy.rect(IVY_X + 2, IVY_Y - 4, 1, 6).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  ivy.alpha = 0.7;
  container.addChild(ivy);

  // SIDE DOOR — 4 wide × 16 tall WOOD_BASE silhouette at x=1220, y=480..496.
  // Non-interactive — no E prompt, no scene-swap. Just a visual hint of
  // "this is a working building with multiple entrances".
  const sideDoor = new Graphics();
  // Frame (stone-dark inset 1px wider than door).
  sideDoor.rect(1219, 478, 6, 18).fill(PIXEL_PALETTE.STONE_DARK);
  // Door planks.
  sideDoor.rect(1220, 480, 4, 16).fill(PIXEL_PALETTE.WOOD_BASE);
  // 1px vertical groove down the middle (plank line).
  sideDoor.rect(1222, 480, 1, 16).fill(PIXEL_PALETTE.WOOD_DARK);
  // 1px STONE_LIGHT lintel highlight above the door.
  sideDoor.rect(1219, 478, 6, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  container.addChild(sideDoor);

  // 3c. Bell tower + cross spire — extends UPWARD from the roof line at
  // facade x=940..1004 (above the door), spanning y=80..200.
  const TOWER_X = 932;     // 16-px aligned
  const TOWER_W = 80;
  const TOWER_TOP = 80;
  const TOWER_BOTTOM = FACADE_TOP;  // 200 — fuses cleanly into the facade
  const tower = new Graphics();
  // Tower body fill.
  tower.rect(TOWER_X, TOWER_TOP, TOWER_W, TOWER_BOTTOM - TOWER_TOP)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  // Header-bond pattern on tower (same as facade) so it reads as
  // continuous stonework.
  for (let row = 0, ry = TOWER_TOP; ry + HDR_H <= TOWER_BOTTOM; row++, ry += HDR_H) {
    const offset = (row % 2 === 0) ? 0 : HDR_W / 2;
    for (let bx = TOWER_X - offset; bx < TOWER_X + TOWER_W; bx += HDR_W) {
      const cellX = Math.max(bx + 1, TOWER_X);
      const cellY = ry + 1;
      const cellR = Math.min(bx + HDR_W - 1, TOWER_X + TOWER_W);
      const cellB = ry + HDR_H - 1;
      const drawW = cellR - cellX;
      const drawH = cellB - cellY;
      if (drawW <= 0 || drawH <= 0) continue;
      tower.rect(cellX, cellY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      tower.rect(cellX, cellY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
      tower.rect(cellX, cellB - 1, drawW, 1).fill(PIXEL_PALETTE.STONE_DARK);
    }
  }
  // Bell opening — a pointed-arch dark window in the upper-middle of tower.
  const BELL_X = TOWER_X + 28;
  const BELL_Y = TOWER_TOP + 28;
  const BELL_W = 24;
  const BELL_H = 36;
  tower.rect(BELL_X, BELL_Y, BELL_W, BELL_H).fill(PIXEL_PALETTE.STONE_DARK);
  // A tiny bell silhouette inside — 8×6 dark cream at the bottom of opening.
  tower.rect(BELL_X + 8, BELL_Y + BELL_H - 14, 8, 8).fill(PIXEL_PALETTE.CANDLE_DIM);
  tower.rect(BELL_X + 10, BELL_Y + BELL_H - 6, 4, 2).fill(PIXEL_PALETTE.WOOD_DARK);
  // Arched cap on bell opening — three stepped narrowing rows.
  for (let i = 0; i < 3; i++) {
    const inset = 2 + i * 4;
    tower.rect(BELL_X + inset, BELL_Y - 4 + i * 2, BELL_W - inset * 2, 2)
      .fill(PIXEL_PALETTE.STONE_DARK);
  }
  container.addChild(tower);

  // Cross spire above the tower — small stone cross at the very top.
  const cross = new Graphics();
  const CROSS_CX = TOWER_X + TOWER_W / 2;
  const CROSS_TOP = TOWER_TOP - 28;
  // Vertical bar — 4 wide × 28 tall.
  cross.rect(CROSS_CX - 2, CROSS_TOP, 4, 28).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Horizontal bar — 16 wide × 4 tall, crosspiece at upper third.
  cross.rect(CROSS_CX - 8, CROSS_TOP + 8, 16, 4).fill(PIXEL_PALETTE.STONE_LIGHT);
  // 1px shadow under each bar.
  cross.rect(CROSS_CX - 2, CROSS_TOP + 27, 4, 1).fill(PIXEL_PALETTE.STONE_DARK);
  cross.rect(CROSS_CX - 8, CROSS_TOP + 11, 16, 1).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(cross);

  // Roof line trim — a 6px STONE_DARK band along the top of the facade so
  // the wall reads as having a peaked roof above the tower line. Also a
  // stepped gable rising up to meet the tower base.
  const roofTrim = new Graphics();
  roofTrim.rect(FACADE_LEFT, FACADE_TOP, FACADE_W, 6).fill(PIXEL_PALETTE.STONE_DARK);
  // Stepped gable rising from FACADE_LEFT up to TOWER_X over ~120px of run.
  const GABLE_RUN = TOWER_X - FACADE_LEFT;
  const GABLE_RISE = FACADE_TOP - TOWER_TOP - (TOWER_BOTTOM - TOWER_TOP);
  // Simple sloped fill — 8-step stair from facade-top to tower-base on left.
  const GABLE_STEPS_L = 12;
  for (let i = 0; i < GABLE_STEPS_L; i++) {
    const stepX = FACADE_LEFT + Math.round((GABLE_RUN / GABLE_STEPS_L) * i);
    const stepW = Math.ceil(GABLE_RUN / GABLE_STEPS_L);
    const stepY = FACADE_TOP - Math.round((Math.abs(GABLE_RISE) / GABLE_STEPS_L) * (GABLE_STEPS_L - i));
    roofTrim.rect(stepX, stepY, stepW, FACADE_TOP - stepY + 2).fill(PIXEL_PALETTE.STONE_DARK);
  }
  // Right side gable: from TOWER_X+TOWER_W slope down to FACADE_RIGHT.
  const GABLE_RUN_R = FACADE_RIGHT - (TOWER_X + TOWER_W);
  const GABLE_STEPS_R = 10;
  for (let i = 0; i < GABLE_STEPS_R; i++) {
    const stepX = TOWER_X + TOWER_W + Math.round((GABLE_RUN_R / GABLE_STEPS_R) * i);
    const stepW = Math.ceil(GABLE_RUN_R / GABLE_STEPS_R);
    const stepY = FACADE_TOP - Math.round((Math.abs(GABLE_RISE) / GABLE_STEPS_R) * (GABLE_STEPS_R - 1 - i));
    roofTrim.rect(stepX, stepY, stepW, FACADE_TOP - stepY + 2).fill(PIXEL_PALETTE.STONE_DARK);
  }
  container.addChild(roofTrim);

  // 3d. Stained-glass arched window — sits above the door at x ∈ [916, 980],
  // y ∈ [240, 320]. 48 wide × 80 tall (with arched cap on top).
  const SGW_X = 912;   // 16-aligned
  const SGW_Y = 248;
  const SGW_W = 48;
  const SGW_H = 80;
  const sgwFrame = new Graphics();
  sgwFrame.rect(SGW_X, SGW_Y, SGW_W, SGW_H).fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(sgwFrame);
  // Pane — inset 4 px. Use warm CANDLE_GLOW for the pane (a warm glow from
  // inside) with a slight cross-mullion. NOT bright red — warm gold-orange.
  const sgwPane = new Graphics();
  sgwPane.rect(SGW_X + 4, SGW_Y + 4, SGW_W - 8, SGW_H - 8)
    .fill(PIXEL_PALETTE.CANDLE_GLOW);
  sgwPane.alpha = 0.85;
  container.addChild(sgwPane);
  // Stained-glass colour patches — three muted blocks in pane to suggest
  // segmented stained glass. Muted blues + cream, no red.
  const sgwPatches = new Graphics();
  // Top patch — muted blue.
  sgwPatches.rect(SGW_X + 6, SGW_Y + 6, SGW_W - 12, 18).fill(PIXEL_PALETTE.SKY_BLUE);
  sgwPatches.rect(SGW_X + 6, SGW_Y + 6, SGW_W - 12, 18).fill(PIXEL_PALETTE.SKY_BLUE);
  // Center patch — DAY_LIGHT cream.
  sgwPatches.rect(SGW_X + 6, SGW_Y + 28, SGW_W - 12, 18).fill(PIXEL_PALETTE.DAY_LIGHT);
  // Bottom patch — muted brown (NOT red).
  sgwPatches.rect(SGW_X + 6, SGW_Y + 50, SGW_W - 12, 18).fill(PIXEL_PALETTE.WOOD_BASE);
  sgwPatches.alpha = 0.7;
  container.addChild(sgwPatches);
  // Cross mullion.
  const sgwMullion = new Graphics();
  sgwMullion.rect(SGW_X + SGW_W / 2 - 1, SGW_Y + 4, 2, SGW_H - 8)
    .fill(PIXEL_PALETTE.STONE_DARK);
  sgwMullion.rect(SGW_X + 4, SGW_Y + SGW_H / 2 - 1, SGW_W - 8, 2)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(sgwMullion);
  // Arched cap above the window — three stepped narrowing rows.
  const sgwCap = new Graphics();
  for (let i = 0; i < 3; i++) {
    const inset = 6 + i * 6;
    sgwCap.rect(SGW_X + inset, SGW_Y - (3 - i) * 4, SGW_W - inset * 2, 4)
      .fill(PIXEL_PALETTE.STONE_BASE);
    sgwCap.rect(SGW_X + inset, SGW_Y - (3 - i) * 4, SGW_W - inset * 2, 1)
      .fill(PIXEL_PALETTE.STONE_LIGHT);
  }
  container.addChild(sgwCap);

  // 3e. Gothic chapel front door — open, large enough to read.
  // Footprint: x ∈ [900, 996] (96 wide), y ∈ [GROUND_Y - 200, GROUND_Y]
  //   = [360, 560] (200 tall).
  const DOOR_X = 900;
  const DOOR_W = 96;
  const DOOR_BOTTOM = GROUND_Y;
  const DOOR_H = 200;
  const DOOR_TOP = DOOR_BOTTOM - DOOR_H;
  const DOOR_FRAME_W = 8;

  // Left jamb.
  const doorLeftJamb = new Graphics();
  doorLeftJamb
    .rect(DOOR_X, DOOR_TOP, DOOR_FRAME_W, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(doorLeftJamb);
  // Right jamb.
  const doorRightJamb = new Graphics();
  doorRightJamb
    .rect(DOOR_X + DOOR_W - DOOR_FRAME_W, DOOR_TOP, DOOR_FRAME_W, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_BASE);
  container.addChild(doorRightJamb);
  // 1px bevels.
  const doorJambBevels = new Graphics();
  doorJambBevels
    .rect(DOOR_X + DOOR_FRAME_W - 1, DOOR_TOP, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  doorJambBevels
    .rect(DOOR_X + DOOR_W - DOOR_FRAME_W, DOOR_TOP, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_DARK);
  container.addChild(doorJambBevels);

  // Gothic pointed-arch lintel — five stepped courses, ARCH_H tall.
  const DOOR_ARCH_H = 40;
  const archSteps = [
    { inset: 40, h: 8 },
    { inset: 30, h: 8 },
    { inset: 22, h: 8 },
    { inset: 14, h: 8 },
    { inset: 8,  h: 8 },
  ];
  const doorArch = new Graphics();
  for (let i = 0; i < archSteps.length; i++) {
    const step = archSteps[i];
    const sx = DOOR_X + step.inset;
    const sw = DOOR_W - step.inset * 2;
    const sy = DOOR_TOP + i * step.h;
    doorArch.rect(sx, sy, sw, step.h).fill(PIXEL_PALETTE.STONE_BASE);
    doorArch.rect(sx, sy, sw, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    doorArch.rect(sx, sy + step.h - 1, sw, 1).fill(PIXEL_PALETTE.STONE_DARK);
  }
  container.addChild(doorArch);

  // Dark interior void visible through the open door — STONE_MORTAR /
  // NIGHT_AMBIENT fill below the arch. We want a hint of warm candle glow
  // bleeding out from inside, so we paint the deep void then overlay a low
  // alpha CANDLE_DIM wash near the threshold.
  const doorOpening = new Graphics();
  const openingX = DOOR_X + DOOR_FRAME_W;
  const openingY = DOOR_TOP + DOOR_ARCH_H;
  const openingW = DOOR_W - DOOR_FRAME_W * 2;
  const openingH = DOOR_BOTTOM - openingY;
  doorOpening
    .rect(openingX, openingY, openingW, openingH)
    .fill(PIXEL_PALETTE.NIGHT_AMBIENT);
  container.addChild(doorOpening);
  // POLISH PASS: brighter, taller inner halo so the door pulls the eye as
  // the interaction target. Stack of three warm passes, centered horizontally
  // in the opening (64 wide), running 130 tall up from the threshold. Bottom
  // 30px is the hottest pass — implies candles RIGHT inside the threshold.
  // Anti-slasher: warm cream-gold candle warmth, NOT red, NOT pulsing.
  const GLOW_W = Math.min(64, openingW);
  const GLOW_H = Math.min(130, openingH);
  const glowX = openingX + (openingW - GLOW_W) / 2;
  // Outer dim halo — full 130 tall warm cream-brown wash.
  const doorInnerGlow = new Graphics();
  doorInnerGlow
    .rect(glowX, openingY + openingH - GLOW_H, GLOW_W, GLOW_H)
    .fill(PIXEL_PALETTE.CANDLE_DIM);
  doorInnerGlow.alpha = 0.55;
  container.addChild(doorInnerGlow);
  // Mid halo — 80 tall warm gold middle pass.
  const doorInnerGlowMid = new Graphics();
  doorInnerGlowMid
    .rect(glowX, openingY + openingH - 80, GLOW_W, 80)
    .fill(PIXEL_PALETTE.CANDLE_GLOW);
  doorInnerGlowMid.alpha = 0.55;
  container.addChild(doorInnerGlowMid);
  // Hot bottom halo — 30 tall, brighter, at the threshold itself.
  const doorInnerGlowBright = new Graphics();
  doorInnerGlowBright
    .rect(glowX, openingY + openingH - 30, GLOW_W, 30)
    .fill(PIXEL_PALETTE.CANDLE_CORE);
  doorInnerGlowBright.alpha = 0.4;
  container.addChild(doorInnerGlowBright);

  // POLISH PASS: subtle outer halo on the gothic arch keystone — STONE_LIGHT
  // wash 4px around the keystone area so the arch crown reads brighter than
  // the wall around it. Pulls the eye to the door without screaming.
  const doorArchHalo = new Graphics();
  // Keystone is centered around DOOR_X+DOOR_W/2, sits at the top of the arch.
  doorArchHalo
    .rect(DOOR_X + DOOR_W / 2 - 14, DOOR_TOP - 4, 28, 12)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  doorArchHalo.alpha = 0.4;
  container.addChild(doorArchHalo);

  // POLISH PASS: 1px STONE_LIGHT outline around the entire door arch silhouette
  // — outer rim that reads as "the candle light catches the arch edges". Drawn
  // as thin rects matching the arch step geometry from the archSteps array above.
  const doorArchOutline = new Graphics();
  for (let i = 0; i < archSteps.length; i++) {
    const step = archSteps[i];
    const sx = DOOR_X + step.inset;
    const sw = DOOR_W - step.inset * 2;
    const sy = DOOR_TOP + i * step.h;
    // 1px top edge.
    doorArchOutline.rect(sx, sy, sw, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    // 1px side edges (only the outermost — first step) so we don't repaint
    // already-stepped horizontal seams.
    if (i === 0) {
      doorArchOutline.rect(sx, sy, 1, step.h).fill(PIXEL_PALETTE.STONE_LIGHT);
      doorArchOutline.rect(sx + sw - 1, sy, 1, step.h).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
  }
  // Vertical jamb outlines down to threshold.
  doorArchOutline
    .rect(DOOR_X, DOOR_TOP, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  doorArchOutline
    .rect(DOOR_X + DOOR_W - 1, DOOR_TOP, 1, DOOR_H)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  doorArchOutline.alpha = 0.6;
  container.addChild(doorArchOutline);

  // Open wood door panels (visible against the dark opening, hugging jambs).
  const DOOR_PANEL_W = 10;
  const doorPanelH = openingH - 4;
  // Left panel.
  const dLeftPanel = new Graphics();
  dLeftPanel.rect(openingX, openingY, DOOR_PANEL_W, doorPanelH).fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(dLeftPanel);
  const dLeftPanelGrooves = new Graphics();
  dLeftPanelGrooves
    .rect(openingX + 3, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  dLeftPanelGrooves
    .rect(openingX + 7, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(dLeftPanelGrooves);
  const dLeftPanelEdge = new Graphics();
  dLeftPanelEdge
    .rect(openingX + DOOR_PANEL_W - 1, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(dLeftPanelEdge);
  // Right panel.
  const dRightX = openingX + openingW - DOOR_PANEL_W;
  const dRightPanel = new Graphics();
  dRightPanel.rect(dRightX, openingY, DOOR_PANEL_W, doorPanelH).fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(dRightPanel);
  const dRightPanelGrooves = new Graphics();
  dRightPanelGrooves
    .rect(dRightX + 3, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  dRightPanelGrooves
    .rect(dRightX + 7, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(dRightPanelGrooves);
  const dRightPanelEdge = new Graphics();
  dRightPanelEdge
    .rect(dRightX, openingY, 1, doorPanelH)
    .fill(PIXEL_PALETTE.WOOD_LIGHT);
  container.addChild(dRightPanelEdge);

  // Wooden threshold sill.
  const doorSill = new Graphics();
  doorSill
    .rect(DOOR_X, DOOR_BOTTOM - 8, DOOR_W, 8)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  container.addChild(doorSill);
  const doorSillShadow = new Graphics();
  doorSillShadow
    .rect(DOOR_X, DOOR_BOTTOM - 1, DOOR_W, 1)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  container.addChild(doorSillShadow);

  // -------------------------------------------------------------------------
  // 4. Ground / path / vegetation (foreground)
  // -------------------------------------------------------------------------
  // Ground band fills y ∈ [GROUND_Y, CANVAS_H]. Center stripe is the cobble
  // path; flanking strips are dry grass / dirt.
  const GROUND_H = CANVAS_H - GROUND_Y;
  const PATH_TOP = GROUND_Y + 24;     // path occupies bottom ~136 px
  const PATH_BOTTOM = CANVAS_H;
  const PATH_H = PATH_BOTTOM - PATH_TOP;

  // 4a. Grass / dirt under-layer (full ground band).
  const grassFill = new Graphics();
  grassFill.rect(0, GROUND_Y, CANVAS_W, GROUND_H).fill(PIXEL_PALETTE.GROUND_GRASS);
  container.addChild(grassFill);
  // 1px highlight band at top of ground = sun catching the grass tips.
  const grassHi = new Graphics();
  grassHi.rect(0, GROUND_Y, CANVAS_W, 1).fill(PIXEL_PALETTE.GROUND_GRASS_HI);
  container.addChild(grassHi);
  // Sprinkle of dirt patches — pseudo-random 8×4 ovals (rects in pixel-art)
  // across the grass for muted variation.
  const dirtPatches = new Graphics();
  const dirtSpots = [
    [60,  GROUND_Y + 12, 18, 6],
    [120, GROUND_Y + 8,  10, 4],
    [220, GROUND_Y + 14, 16, 5],
    [300, GROUND_Y + 6,  12, 4],
    [380, GROUND_Y + 16, 20, 6],
    [460, GROUND_Y + 10, 14, 5],
    [540, GROUND_Y + 14, 18, 6],
    [610, GROUND_Y + 18, 10, 4],
    // Right side, around churchyard area
    [1090, GROUND_Y + 8,  14, 5],
    [1160, GROUND_Y + 14, 18, 6],
    [1220, GROUND_Y + 10, 14, 5],
  ];
  for (const [dx, dy, dw, dh] of dirtSpots) {
    dirtPatches.rect(dx, dy, dw, dh).fill(PIXEL_PALETTE.GROUND_DIRT);
  }
  dirtPatches.alpha = 0.7;
  container.addChild(dirtPatches);

  // 4b. Cobble path — runs from x=0 to the door (x ≈ 948) along the bottom
  // band. We paint a tapered/curved path: wider at the door end, narrower at
  // the screen edge — gives perspective. Path is centered around y = PATH_TOP
  // + PATH_H/2, with a slight widening toward the door.
  //
  // Implementation: paint a STONE_MORTAR band first, then stamp cobble cells.
  const PATH_LEFT = 0;
  const PATH_RIGHT = DOOR_X + DOOR_W;   // ends at the door
  // Path top edges: y near GROUND_Y at left, dipping down a bit toward door.
  // For a simple read, treat path as a horizontal band: y ∈ [PATH_TOP, PATH_BOTTOM].
  const pathBase = new Graphics();
  pathBase.rect(PATH_LEFT, PATH_TOP, PATH_RIGHT - PATH_LEFT, PATH_H)
    .fill(PIXEL_PALETTE.STONE_MORTAR);
  container.addChild(pathBase);

  // Cobble tiles — 16×8 with staggered rows.
  const COB_W = 16;
  const COB_H = 8;
  const cobbles = new Graphics();
  for (let row = 0, ry = PATH_TOP; ry + COB_H <= PATH_BOTTOM; row++, ry += COB_H) {
    const offset = (row % 2 === 0) ? 0 : COB_W / 2;
    for (let bx = PATH_LEFT - offset; bx < PATH_RIGHT; bx += COB_W) {
      const cellX = Math.max(bx + 1, PATH_LEFT);
      const cellY = ry + 1;
      const cellR = Math.min(bx + COB_W - 1, PATH_RIGHT);
      const cellB = ry + COB_H - 1;
      const drawW = cellR - cellX;
      const drawH = cellB - cellY;
      if (drawW <= 0 || drawH <= 0) continue;
      cobbles.rect(cellX, cellY, drawW, drawH).fill(PIXEL_PALETTE.STONE_BASE);
      cobbles.rect(cellX, cellY, drawW, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    }
  }
  container.addChild(cobbles);

  // 4c. Wayside cross — plain stone cross at x=160, on the grass beside path.
  // POLISH PASS: scaled 12×32 → 20×48 + 2-step pedestal at base. Cross arms
  // 12 wide × 3 tall, intersecting the vertical bar at the upper third.
  // Anti-slasher: plain stone, NO figure, NO inscription.
  const WAYSIDE_CX = 160;
  const WAYSIDE_TOP = GROUND_Y - 48;       // 48 tall cross from base of vertical
  const wayside = new Graphics();
  // Pedestal — 2 stepped stone blocks at the base.
  // Lower pedestal: 12 wide × 4 tall.
  wayside.rect(WAYSIDE_CX - 6, GROUND_Y - 4, 12, 4).fill(PIXEL_PALETTE.STONE_BASE);
  wayside.rect(WAYSIDE_CX - 6, GROUND_Y - 4, 12, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  wayside.rect(WAYSIDE_CX + 5, GROUND_Y - 4, 1, 4).fill(PIXEL_PALETTE.STONE_DARK);
  // Upper pedestal: 8 wide × 3 tall.
  wayside.rect(WAYSIDE_CX - 4, GROUND_Y - 7, 8, 3).fill(PIXEL_PALETTE.STONE_BASE);
  wayside.rect(WAYSIDE_CX - 4, GROUND_Y - 7, 8, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  wayside.rect(WAYSIDE_CX + 3, GROUND_Y - 7, 1, 3).fill(PIXEL_PALETTE.STONE_DARK);
  // Vertical post — 4 wide × 41 tall, rising from upper pedestal.
  const POST_BOTTOM = GROUND_Y - 7;
  const POST_TOP = WAYSIDE_TOP;
  wayside.rect(WAYSIDE_CX - 2, POST_TOP, 4, POST_BOTTOM - POST_TOP)
    .fill(PIXEL_PALETTE.STONE_LIGHT);
  // 1px right-edge shadow on post.
  wayside.rect(WAYSIDE_CX + 1, POST_TOP, 1, POST_BOTTOM - POST_TOP)
    .fill(PIXEL_PALETTE.STONE_DARK);
  // Horizontal crosspiece — 12 wide × 3 tall, at upper third of post
  // (post is 41 tall, so upper third ≈ 13px down from POST_TOP).
  const ARM_Y = POST_TOP + 13;
  wayside.rect(WAYSIDE_CX - 6, ARM_Y, 12, 3).fill(PIXEL_PALETTE.STONE_LIGHT);
  // 1px top highlight + bottom shadow on the arm.
  wayside.rect(WAYSIDE_CX - 6, ARM_Y, 12, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  wayside.rect(WAYSIDE_CX - 6, ARM_Y + 2, 12, 1).fill(PIXEL_PALETTE.STONE_DARK);
  // Cap on the top of the post (1px highlight).
  wayside.rect(WAYSIDE_CX - 2, POST_TOP, 4, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  container.addChild(wayside);

  // 4d. One small pixel-art tree at x=420 (between wayside cross and chapel).
  // POLISH PASS: redesigned from "wavy blob on stick" to clear silhouette.
  // 24 wide × 56 tall. Trunk: 4px wide × 24 tall (WOOD_DARK + WOOD_BASE).
  // Canopy: stepped dome ~24 wide × 32 tall.
  // Anti-slasher: full living canopy, NOT bare creepy dead branches.
  const TREE_X = 420;
  const tree = new Graphics();
  // Trunk — 4 wide × 24 tall, WOOD_DARK with WOOD_BASE 1px highlight on left.
  const TRUNK_W = 4;
  const TRUNK_H = 24;
  const TRUNK_TOP_Y = GROUND_Y - TRUNK_H;
  tree.rect(TREE_X - TRUNK_W / 2, TRUNK_TOP_Y, TRUNK_W, TRUNK_H)
    .fill(PIXEL_PALETTE.WOOD_DARK);
  tree.rect(TREE_X - TRUNK_W / 2, TRUNK_TOP_Y, 1, TRUNK_H)
    .fill(PIXEL_PALETTE.WOOD_BASE);
  // Canopy — stepped dome polygon, FOLIAGE_DARK base.
  // Step shape from base (24w) → upper rows (narrower).
  // Base row: 24 wide × 8 tall, centered at TREE_X.
  const CANOPY_BASE_Y = TRUNK_TOP_Y - 8;
  tree.rect(TREE_X - 12, CANOPY_BASE_Y, 24, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Mid row: 22 wide × 8 tall.
  tree.rect(TREE_X - 11, CANOPY_BASE_Y - 8, 22, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Upper-mid: 18 wide × 8 tall.
  tree.rect(TREE_X - 9, CANOPY_BASE_Y - 16, 18, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Crown: 12 wide × 8 tall.
  tree.rect(TREE_X - 6, CANOPY_BASE_Y - 24, 12, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // FOLIAGE_BASE highlights on candle-lit (left) side — 2-3px wide vertical
  // stripes following the dome curve.
  tree.rect(TREE_X - 12, CANOPY_BASE_Y, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  tree.rect(TREE_X - 11, CANOPY_BASE_Y - 8, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  tree.rect(TREE_X - 9, CANOPY_BASE_Y - 16, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  tree.rect(TREE_X - 6, CANOPY_BASE_Y - 24, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  // 1px FOLIAGE_BASE top-crown highlight (sun catches the crown).
  tree.rect(TREE_X - 6, CANOPY_BASE_Y - 24, 12, 1).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  container.addChild(tree);

  // 4e. Small bush at x=580 (closer to chapel, on grass beside path).
  // POLISH PASS: 14 wide × 8 tall stepped FOLIAGE blob — implies multiple
  // small leaves rather than a smudge.
  const BUSH_X = 580;
  const bush = new Graphics();
  // Lower mass — full 14 wide × 8 tall.
  bush.rect(BUSH_X - 7, GROUND_Y - 8, 14, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Upper bump — 10 wide × 4 tall (left-leaning to imply leaf cluster).
  bush.rect(BUSH_X - 6, GROUND_Y - 12, 10, 4).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Small additional bump — 4 wide × 2 tall, far left, to imply a smaller
  // leaf cluster sticking out (breaks the "smooth blob" silhouette).
  bush.rect(BUSH_X - 8, GROUND_Y - 10, 4, 2).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // FOLIAGE_BASE highlight on the left/upper side.
  bush.rect(BUSH_X - 7, GROUND_Y - 8, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  bush.rect(BUSH_X - 6, GROUND_Y - 12, 3, 4).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  bush.rect(BUSH_X - 6, GROUND_Y - 12, 10, 1).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  container.addChild(bush);

  // 4f. Low stone churchyard wall to the right of the chapel facade —
  // x ∈ [1200, 1280], y ∈ [GROUND_Y - 24, GROUND_Y]. ABSOLUTELY NO
  // headstones, NO grave shapes — just a low stone wall implying enclosure.
  // Wall is broken / weather-worn (slight height variation) for character.
  const wallSegments = [
    { x: 1200, w: 16, h: 22 },
    { x: 1216, w: 16, h: 20 },
    { x: 1232, w: 16, h: 24 },
    { x: 1248, w: 16, h: 18 },
    { x: 1264, w: 16, h: 22 },
  ];
  const churchyardWall = new Graphics();
  for (const seg of wallSegments) {
    const segY = GROUND_Y - seg.h;
    churchyardWall.rect(seg.x, segY, seg.w, seg.h).fill(PIXEL_PALETTE.STONE_BASE);
    // 1px STONE_LIGHT on top.
    churchyardWall.rect(seg.x, segY, seg.w, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
    // 1px STONE_DARK on right edge (shadow).
    churchyardWall.rect(seg.x + seg.w - 1, segY, 1, seg.h).fill(PIXEL_PALETTE.STONE_DARK);
    // 1px STONE_MORTAR vertical groove between segments — reads as stacked stones.
    churchyardWall.rect(seg.x + seg.w - 1, segY + 4, 1, seg.h - 4)
      .fill(PIXEL_PALETTE.STONE_MORTAR);
  }
  container.addChild(churchyardWall);

  // -------------------------------------------------------------------------
  // 5. Atmosphere — subtle warm-light cream wash overlay
  // -------------------------------------------------------------------------
  // A very low alpha DAY_LIGHT rectangle over the whole canvas to suggest
  // midday warmth without bleaching the palette. Anti-slasher: NOT a heavy
  // orange overlay (would read sunset-foreboding) — cream-yellow, alpha 0.06.
  const warmWash = new Graphics();
  warmWash.rect(0, 0, CANVAS_W, CANVAS_H).fill(PIXEL_PALETTE.DAY_LIGHT);
  warmWash.alpha = 0.06;
  container.addChild(warmWash);

  return container;
}

// Door-x metadata exposed so cross-team (#1 Foundation's scene-swap +
// E-to-interact mechanic) can match the visual door without duplicating
// constants.
export const OUTSIDE_CHAPEL_DOOR_GEOM = Object.freeze({
  // Door footprint in OUTSIDE scene logical coords.
  doorX: 900,
  doorW: 96,
  doorH: 200,
  doorTop: 360,         // = GROUND_Y(560) - DOOR_H(200)
  doorBottom: 560,      // = GROUND_Y
  doorCx: 948,          // 900 + 96/2
  // Reaper E-to-enter trigger window — x ∈ [interactMinX, interactMaxX].
  // Matches the JSON values that ship in confession-room.json's reaperSpawn.
  interactMinX: 900,
  interactMaxX: 996,
  // Logical canvas the outside scene fills.
  canvasWidth: 1280,
  canvasHeight: 720,
  // Default ground-floor y (Reaper feet land here).
  groundY: 560,
  // Reaper spawn x — lands the Reaper visibly on the cobble path west of
  // the chapel facade with enough room to walk toward the door.
  spawnX: 240,
});

