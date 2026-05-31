// outsideScene/village.js — distant treeline, hills, spire silhouette, smoke wisps.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.
//
// Section 2 of the outside scene composite. Despite the filename `village.js`,
// this layer now renders a TREE LINE silhouette + distant church spire + rolling
// hills (the QA re-author on 2026-05-30 replaced the original village rooftops).
// The legacy village rendering is preserved inside an `if (false)` block as
// historical reference.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function drawVillage(container, spec) {
  const { groundY } = spec;

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
  // QA fix 2026-05-30 PM: lowered base from 380 → groundY so the back hill
  // silhouette extends BEHIND the front hill (proper depth overlap) instead
  // of stopping in mid-sky. Peaks shifted from y=320 → y=350 base so they
  // still poke above the front-hill ridge without floating disconnected
  // from the landscape.
  const BACK_HILL_BASE_Y = groundY;
  const BACK_HILL_TOP_BASE = 350;
  const backRidgePoints = [
    { x:   0, peakDip: 30 },
    { x:  60, peakDip: 12 },
    { x: 120, peakDip: 40 },
    { x: 200, peakDip: 18 },
    { x: 280, peakDip: 36 },
    { x: 360, peakDip: 18 },
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
      const y = BACK_HILL_TOP_BASE + dip;
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
  const FRONT_HILL_BASE_Y = groundY;
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

  // QA fix 2026-05-30 PM: removed the distant church spire — at the rendered
  // scale it read as a gray fountain/obelisk, not a spire, and was redundant
  // with the actual chapel facade on the right. Smoke wisps removed alongside
  // (they paired with the spire/village layer that's no longer present).

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
}
