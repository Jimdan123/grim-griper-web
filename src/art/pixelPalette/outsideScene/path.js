// outsideScene/path.js — ground/grass/dirt, cobble path, wayside cross, tree,
// bush, churchyard wall.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.
//
// Section 4 of the outside scene composite. Foreground band that sits below
// the facade and runs from screen-left to the chapel door.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function drawPath(container, spec) {
  const { canvasW, canvasH, groundY } = spec;

  // Ground band fills y ∈ [GROUND_Y, CANVAS_H]. Center stripe is the cobble
  // path; flanking strips are dry grass / dirt.
  const GROUND_H = canvasH - groundY;
  const PATH_TOP = groundY + 24;     // path occupies bottom ~136 px
  const PATH_BOTTOM = canvasH;
  const PATH_H = PATH_BOTTOM - PATH_TOP;

  // 4a. Grass / dirt under-layer (full ground band).
  const grassFill = new Graphics();
  grassFill.rect(0, groundY, canvasW, GROUND_H).fill(PIXEL_PALETTE.GROUND_GRASS);
  container.addChild(grassFill);
  // 1px highlight band at top of ground = sun catching the grass tips.
  const grassHi = new Graphics();
  grassHi.rect(0, groundY, canvasW, 1).fill(PIXEL_PALETTE.GROUND_GRASS_HI);
  container.addChild(grassHi);
  // Sprinkle of dirt patches — pseudo-random 8×4 ovals (rects in pixel-art)
  // across the grass for muted variation.
  const dirtPatches = new Graphics();
  const dirtSpots = [
    [60,  groundY + 12, 18, 6],
    [120, groundY + 8,  10, 4],
    [220, groundY + 14, 16, 5],
    [300, groundY + 6,  12, 4],
    [380, groundY + 16, 20, 6],
    [460, groundY + 10, 14, 5],
    [540, groundY + 14, 18, 6],
    [610, groundY + 18, 10, 4],
    // Right side, around churchyard area
    [1090, groundY + 8,  14, 5],
    [1160, groundY + 14, 18, 6],
    [1220, groundY + 10, 14, 5],
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
  // PATH_RIGHT ends at the door (door x=900, door w=96 → 996). Pulled from
  // OUTSIDE_CHAPEL_DOOR_GEOM in composite.js so this layer doesn't depend on
  // facade-layer locals.
  const PATH_LEFT = 0;
  const PATH_RIGHT = spec.doorRight;
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
  const WAYSIDE_TOP = groundY - 48;       // 48 tall cross from base of vertical
  const wayside = new Graphics();
  // Pedestal — 2 stepped stone blocks at the base.
  // Lower pedestal: 12 wide × 4 tall.
  wayside.rect(WAYSIDE_CX - 6, groundY - 4, 12, 4).fill(PIXEL_PALETTE.STONE_BASE);
  wayside.rect(WAYSIDE_CX - 6, groundY - 4, 12, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  wayside.rect(WAYSIDE_CX + 5, groundY - 4, 1, 4).fill(PIXEL_PALETTE.STONE_DARK);
  // Upper pedestal: 8 wide × 3 tall.
  wayside.rect(WAYSIDE_CX - 4, groundY - 7, 8, 3).fill(PIXEL_PALETTE.STONE_BASE);
  wayside.rect(WAYSIDE_CX - 4, groundY - 7, 8, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  wayside.rect(WAYSIDE_CX + 3, groundY - 7, 1, 3).fill(PIXEL_PALETTE.STONE_DARK);
  // Vertical post — 4 wide × 41 tall, rising from upper pedestal.
  const POST_BOTTOM = groundY - 7;
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
  const TRUNK_TOP_Y = groundY - TRUNK_H;
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
  bush.rect(BUSH_X - 7, groundY - 8, 14, 8).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Upper bump — 10 wide × 4 tall (left-leaning to imply leaf cluster).
  bush.rect(BUSH_X - 6, groundY - 12, 10, 4).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // Small additional bump — 4 wide × 2 tall, far left, to imply a smaller
  // leaf cluster sticking out (breaks the "smooth blob" silhouette).
  bush.rect(BUSH_X - 8, groundY - 10, 4, 2).fill(PIXEL_PALETTE.FOLIAGE_DARK);
  // FOLIAGE_BASE highlight on the left/upper side.
  bush.rect(BUSH_X - 7, groundY - 8, 3, 8).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  bush.rect(BUSH_X - 6, groundY - 12, 3, 4).fill(PIXEL_PALETTE.FOLIAGE_BASE);
  bush.rect(BUSH_X - 6, groundY - 12, 10, 1).fill(PIXEL_PALETTE.FOLIAGE_BASE);
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
    const segY = groundY - seg.h;
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
}
