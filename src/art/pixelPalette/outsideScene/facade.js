// outsideScene/facade.js — chapel front-wall, buttresses, side panel, ivy,
// side door, bell tower, cross spire, roof trim/gable, stained-glass arched
// window, door arch + open wood panels + sill.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.
//
// Section 3 of the outside scene composite. The bulkiest single layer — one
// coherent "chapel facade" cluster.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function drawFacade(container, spec) {
  const { groundY } = spec;

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
  const FACADE_BOTTOM = groundY;
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
  const DOOR_BOTTOM = groundY;
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
}
