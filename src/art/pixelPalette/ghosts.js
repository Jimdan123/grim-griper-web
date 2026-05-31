// ghosts.js — two-figure crime-act ghost replays + the dispatch placeholder.
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from './constants.js';

// ---------------------------------------------------------------------------
// Pixel-art ghost replays — TWO-FIGURE CRIME ACTS
// ---------------------------------------------------------------------------
// Per dispatch §E: re-author the ghost replays so they SHOW the crime acts.
// Each composition has TWO figures: Aldric (collared priest) + a pilgrim
// (kneeling/standing/shrouded). Both translucent low-alpha cyan GHOST_PALE.
//
// ANTI-SLASHER ABSOLUTES (held throughout):
//   * No blood color anywhere — discoloration only (none in ghosts).
//   * No body shapes for shrouded forms — fabric lump only.
//   * No violence depiction — pour, lean, write, drag.
//   * Pilgrim is kneeling / standing / shrouded — never sprawled / contorted.
//   * Translucent 0.4 alpha cyan — both figures, same alpha.
//   * No facial detail — no eyes, mouths, expressions.
//
// Each factory returns a PIXI.Container with pivot bottom-center at (W/2, H)
// so callers can place them at ghostX / ghostY like the painterly equivalents.

const PIXEL_GHOST_ALPHA = 0.4;

// Shared pixel-figure builders. Both Aldric and the pilgrim are simple
// blocky silhouettes in GHOST_PALE — Aldric distinguishable from the pilgrim
// by the collar band and the stout proportion.

function buildPixelAldricSilhouette({
  cx,
  feetY,
  leanX = 0,
  pose = 'upright',  // 'upright' | 'lean' | 'hunched'
}) {
  // Returns a Graphics drawn into a fresh sub-container. Aldric is 16 wide
  // × 32 tall. Collar band reads as the clergy tell. The cyan tone marks
  // this as a SPECTRAL memory, not a literal figure on stage.
  const g = new Graphics();
  const BODY_W = 16;
  const BODY_H = 22;
  const HEAD_W = 8;
  const HEAD_H = 8;
  const COLLAR_H = 2;

  let bodyX = cx - BODY_W / 2;
  let headX = cx - HEAD_W / 2;
  let bodyTop = feetY - BODY_H;
  let headTop = bodyTop - HEAD_H;

  // Lean / hunch adjustments — shift head + top-half of body slightly.
  if (pose === 'lean' || pose === 'hunched') {
    headX += leanX;
    bodyX += Math.floor(leanX * 0.5);
    if (pose === 'hunched') {
      headTop += 2;
      bodyTop += 2;
    }
  }

  // Body.
  g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
  // Collar band — drawn over the top of the body.
  g.rect(bodyX, bodyTop, BODY_W, COLLAR_H).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Head.
  g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);

  return { g, bodyX, bodyTop, headX, headTop };
}

function buildPixelPilgrimSilhouette({
  cx,
  feetY,
  pose = 'standing', // 'standing' | 'kneeling'
}) {
  // Pilgrim is 12 wide × variable tall depending on pose. NO collar.
  const g = new Graphics();
  if (pose === 'kneeling') {
    // Kneeling pilgrim: 12 wide × 18 tall. Body is a squat block, head bowed
    // (smaller and lower than a standing head).
    const BODY_W = 12;
    const BODY_H = 12;
    const HEAD_W = 6;
    const HEAD_H = 5;
    const bodyX = cx - BODY_W / 2;
    const bodyTop = feetY - BODY_H;
    const headX = cx - HEAD_W / 2;
    const headTop = bodyTop - HEAD_H + 1; // head bowed forward = lower
    g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
    g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);
    return {
      g,
      footprint: { bodyX, bodyTop, BODY_W, BODY_H, headX, headTop, HEAD_W, HEAD_H },
    };
  }
  // Standing.
  const BODY_W = 12;
  const BODY_H = 22;
  const HEAD_W = 6;
  const HEAD_H = 6;
  const bodyX = cx - BODY_W / 2;
  const bodyTop = feetY - BODY_H;
  const headX = cx - HEAD_W / 2;
  const headTop = bodyTop - HEAD_H;
  g.rect(bodyX, bodyTop, BODY_W, BODY_H).fill(PIXEL_PALETTE.GHOST_PALE);
  g.rect(headX, headTop, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.GHOST_PALE);
  return {
    g,
    footprint: { bodyX, bodyTop, BODY_W, BODY_H, headX, headTop, HEAD_W, HEAD_H },
  };
}

/**
 * CHALICE GHOST (at altar) — Aldric pouring poison into a chalice held by
 * a kneeling pilgrim.
 *
 *   Aldric — collared, standing upright, arm extended downward in a pouring
 *   gesture.
 *   Pilgrim — kneeling, head bowed in supplication.
 *
 * Reads at glance: priest poisons pilgrim's communion.
 */
export function createPixelArtChaliceGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-chalice';

  // Logical bounds: 64 wide × 56 tall. Pivot bottom-center.
  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric standing on the LEFT, pouring DOWN-RIGHT.
  const aldricCx = 20;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: 1,
  });
  container.addChild(aldric.g);

  // Pouring arm — extends down-right from Aldric's shoulder toward the
  // pilgrim's head. Drawn as two 2-px stepped stair rects (down-right).
  const arm = new Graphics();
  const armStartX = aldric.bodyX + 14; // Aldric's right shoulder
  const armStartY = aldric.bodyTop + 4;
  // Stair-stepped arm: 3 steps each (4 wide × 2 tall) angling down-right.
  arm.rect(armStartX, armStartY, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(armStartX + 3, armStartY + 2, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(armStartX + 6, armStartY + 4, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);
  // Pouring vessel — 4×3 GHOST_PALE block at the hand tip. Slightly tilted
  // suggestion (a single 1px extension on its right side reads as the lip).
  const vessel = new Graphics();
  vessel.rect(armStartX + 9, armStartY + 6, 4, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  vessel.rect(armStartX + 13, armStartY + 7, 1, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(vessel);
  // Pouring stream — 1px column of GHOST_PALE pixels dropping from vessel
  // toward the chalice in pilgrim's hands. NOT red — just translucent cyan.
  const stream = new Graphics();
  stream.rect(armStartX + 11, armStartY + 9, 1, 6).fill(PIXEL_PALETTE.GHOST_PALE);
  stream.alpha = 0.7;
  container.addChild(stream);

  // Pilgrim kneeling on the RIGHT, holding chalice up toward Aldric.
  const pilgrimCx = 42;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'kneeling',
  });
  container.addChild(pilgrim.g);

  // Chalice held by pilgrim — 4×3 GHOST_PALE block in front of pilgrim chest,
  // just below where the poison stream lands.
  const pilgrimChalice = new Graphics();
  pilgrimChalice
    .rect(pilgrimCx - 2, feetY - 18, 4, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  // Stem.
  pilgrimChalice
    .rect(pilgrimCx - 1, feetY - 15, 2, 2)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(pilgrimChalice);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}

/**
 * SERMON GHOST (at lectern) — Aldric at the lectern leaning over the book,
 * gesturing toward a standing pilgrim in front of him.
 *
 *   Aldric — collared, leaning forward, one arm extended forward (gesture).
 *   Pilgrim — standing in supplicant posture, head slightly bowed.
 *
 * Reads at glance: priest gives the lure-sermon; pilgrim listens.
 */
export function createPixelArtSermonGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-sermon';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric leaning forward on the LEFT.
  const aldricCx = 18;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: 2,
  });
  container.addChild(aldric.g);

  // Lectern silhouette in front of Aldric — small wedge-shape, GHOST_PALE.
  const lectern = new Graphics();
  // Vertical post.
  lectern.rect(aldricCx + 10, feetY - 22, 3, 22).fill(PIXEL_PALETTE.GHOST_PALE);
  // Slanted top — 3 stepped rows for the book-rest.
  lectern.rect(aldricCx + 7, feetY - 26, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  lectern.rect(aldricCx + 8, feetY - 25, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  lectern.rect(aldricCx + 9, feetY - 24, 8, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lectern);

  // Aldric's gesturing arm — extends RIGHT toward the pilgrim, at chest level.
  const arm = new Graphics();
  arm
    .rect(aldric.bodyX + 14, aldric.bodyTop + 6, 8, 2)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(aldric.bodyX + 20, aldric.bodyTop + 4, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);

  // Pilgrim standing on the RIGHT, head slightly bowed.
  const pilgrimCx = 46;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'standing',
  });
  container.addChild(pilgrim.g);
  // Subtle bowed-head suggestion — paint a 6×1 GHOST_PALE strip just below
  // the head to merge head into shoulders, suggesting forward tilt.
  const bowedY = pilgrim.footprint.headTop + pilgrim.footprint.HEAD_H;
  const bowed = new Graphics();
  bowed
    .rect(pilgrim.footprint.headX, bowedY, 6, 1)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(bowed);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}

/**
 * CONFESSION BOOTH GHOST (inside the booth) — Aldric hunched writing in the
 * ledger inside the booth while a pilgrim kneels on the OTHER side of the
 * lattice grille, head pressed to the wood.
 *
 *   Aldric — collared, hunched, head down, writing-arm extended down-left.
 *   Pilgrim — kneeling on the opposite side, head leaning into the lattice.
 *   Lattice — vertical line of paired GHOST_PALE dashes between them.
 *
 * Reads at glance: priest records the dying confession.
 */
export function createPixelArtConfessionBoothGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-booth';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric hunched on the LEFT inside the booth.
  const aldricCx = 20;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'hunched',
    leanX: 2,
  });
  container.addChild(aldric.g);

  // Writing arm — extends DOWN from Aldric's chest, ending at a small page
  // silhouette (the ledger) in his lap.
  const arm = new Graphics();
  arm.rect(aldric.bodyX + 10, aldric.bodyTop + 8, 4, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arm.rect(aldric.bodyX + 12, aldric.bodyTop + 10, 3, 4).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arm);
  // Ledger page in lap.
  const ledger = new Graphics();
  ledger.rect(aldric.bodyX + 10, aldric.bodyTop + 14, 8, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(ledger);

  // Lattice grille between them — vertical dashed line at x=32 (booth center).
  const lattice = new Graphics();
  const latticeX = 32;
  const latticeTop = feetY - 32;
  const latticeBottom = feetY - 4;
  for (let ly = latticeTop; ly < latticeBottom; ly += 4) {
    lattice.rect(latticeX, ly, 1, 2).fill(PIXEL_PALETTE.GHOST_PALE);
    lattice.rect(latticeX + 2, ly, 1, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  }
  lattice.alpha = 0.6;
  container.addChild(lattice);

  // Pilgrim kneeling on the RIGHT, head pressed toward lattice.
  const pilgrimCx = 44;
  const pilgrim = buildPixelPilgrimSilhouette({
    cx: pilgrimCx,
    feetY,
    pose: 'kneeling',
  });
  container.addChild(pilgrim.g);
  // Lean the pilgrim's head LEFT toward the lattice — paint a 2×3 GHOST_PALE
  // stub extending from the head toward the lattice. Reads as "head pressed".
  const headLean = new Graphics();
  headLean
    .rect(pilgrim.footprint.headX - 2, pilgrim.footprint.headTop + 1, 2, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(headLean);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}

/**
 * SACRISTY GHOST (where burial happens) — Aldric dragging a SHROUDED FORM
 * across the floor.
 *
 *   Aldric — collared, standing upright with arms extended BEHIND him pulling.
 *   Shrouded form — LUMPY FABRIC SHAPE (sack-of-grain read), NOT body-shaped.
 *
 * HARD ANTI-SLASHER LINE: shroud is FABRIC. No limbs, no head outline, no
 * contortion. Drawn as 3 overlapping low irregular rects at floor level —
 * the silhouette is LUMPY (wider than tall), never figural.
 *
 * Reads at glance: priest disposes of the victim.
 */
export function createPixelArtSacristyGhost() {
  const container = new Container();
  container.label = 'pixel-ghost-sacristy';

  const W = 64;
  const H = 56;
  const feetY = H;

  // Aldric on the RIGHT, dragging shroud to the LEFT (his back to the
  // direction of motion — both arms reaching back-left).
  const aldricCx = 44;
  const aldric = buildPixelAldricSilhouette({
    cx: aldricCx,
    feetY,
    pose: 'lean',
    leanX: -1,  // slight backward lean as he pulls
  });
  container.addChild(aldric.g);

  // Dragging arms — both arms extend DOWN-LEFT toward the shroud.
  const dragArmTop = aldric.bodyTop + 10;
  const arms = new Graphics();
  // Left arm.
  arms.rect(aldric.bodyX - 2, dragArmTop, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  arms.rect(aldric.bodyX - 6, dragArmTop + 2, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  // Right arm (just behind / parallel).
  arms.rect(aldric.bodyX - 1, dragArmTop + 4, 6, 2).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(arms);

  // Rope / cloth grip — 1px GHOST_PALE strand connecting hand to shroud.
  const grip = new Graphics();
  grip.rect(aldric.bodyX - 8, dragArmTop + 6, 14, 1).fill(PIXEL_PALETTE.GHOST_PALE);
  grip.alpha = 0.7;
  container.addChild(grip);

  // Shroud — LUMPY FABRIC PILE on the floor LEFT of Aldric.
  // Three overlapping low rects + a small fabric "corner" sticking up.
  // Strictly LUMPY: each rect is much WIDER than tall (>3:1 aspect),
  // never columnar/figural.
  const shroudCx = 14;
  const shroudY = feetY - 6;
  const lump1 = new Graphics();
  lump1.rect(shroudCx - 10, shroudY, 22, 5).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump1);
  const lump2 = new Graphics();
  lump2.rect(shroudCx - 6, shroudY - 3, 14, 4).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump2);
  const lump3 = new Graphics();
  lump3.rect(shroudCx + 2, shroudY - 1, 10, 3).fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(lump3);
  // Small fabric corner sticking up — 3×3 GHOST_PALE block offset from main.
  // Asymmetric. NOT a head, NOT a limb. Reads as "fabric corner of the sack".
  const fabricCorner = new Graphics();
  fabricCorner
    .rect(shroudCx - 8, shroudY - 5, 3, 3)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  container.addChild(fabricCorner);

  container.alpha = PIXEL_GHOST_ALPHA;
  container.pivot.set(W / 2, H);
  return container;
}

// Dispatch by evidence id — same shape as the painterly GHOST_FACTORIES table
// in placeholders.js, so callers can hot-swap on render mode.
const PIXEL_GHOST_FACTORIES = {
  chalice: createPixelArtChaliceGhost,
  sermonBook: createPixelArtSermonGhost,
  confessionLedger: createPixelArtConfessionBoothGhost,
  limeSpade: createPixelArtSacristyGhost,
};

/**
 * Pixel-art ghost factory matching the painterly createGhostPlaceholder API
 * shape (takes the evidence-data record, dispatches on `.id`). Returns
 * a PIXI.Container pivoted bottom-center.
 *
 * Used by GhostReplay (or main.js wrapper) when render mode is PIXELART.
 */
export function createPixelArtGhostPlaceholder(evidence) {
  const factory = PIXEL_GHOST_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createPixelArtGhostPlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(PIXEL_GHOST_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}

// ---------------------------------------------------------------------------
// createReaperPixelSprite() -> PIXI.Container
// ---------------------------------------------------------------------------
// Reaper in pixel-art register. ~32 wide × 72 tall logical px. Tall, lean,
// hooded silhouette. REAPER_BLACK throughout, with a single faint highlight
// pixel for the eye-slit (preserves the spectral cyan eye identity from the
// painterly REAPER_EYE without breaking the pixel-art register's tonal
// restraint — the eye is ONE pixel, the smallest possible accent).
//
// Discipline:
//   * Tall + thin silhouette = predator (per touchstone). Aldric is short +
//     wide; the proportion contrast carries the predator/prey read.
//   * Hood blends into body — no scythe, no skull, no slasher silhouette.
//   * No animation. Static silhouette.
