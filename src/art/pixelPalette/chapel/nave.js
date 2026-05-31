// chapel/nave.js — createNaveRoomPixelArt factory.
// Split from src/art/pixelPalette/chapel.js per issue #2 Phase A.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from '../constants.js';

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
