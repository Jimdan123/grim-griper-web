// confessionRoom.js — interior props composition + candle/window geometry.
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from './constants.js';

const PROPS_FLOOR_Y = 520;

/**
 * Altar (waypoint x=220) — LURE / POISON.
 * - Stone altar block on the floor (visual anchor for the chalice).
 * - Faint ring stain on the altar top (poison residue — BROWN discoloration,
 *   NOT red blood).
 * - Two candles flanking the altar (the flames are added separately by
 *   ambientMotion; this draws only the wax pillars).
 * - Four small empty wooden bowls scattered around the altar's edge
 *   (many drank from the chalice).
 */
function buildAltarProps() {
  const c = new Container();
  c.label = 'props-altar';

  // Altar stone block — sits on the floor, just behind the chalice evidence
  // (which is at x=300, y=540). Center on the Altar waypoint (x=220).
  const altarCX = 220;
  const altarW = 110;
  const altarH = 44;
  const altarTopY = PROPS_FLOOR_Y - altarH;

  const block = new Graphics();
  block
    .rect(altarCX - altarW / 2, altarTopY, altarW, altarH)
    .fill(PALETTE.PROPS.ALTAR_STONE);
  c.addChild(block);

  // Top edge trim — slightly lighter, reads as a carved-stone top.
  const trim = new Graphics();
  trim
    .rect(altarCX - altarW / 2, altarTopY, altarW, 4)
    .fill(PALETTE.PROPS.ALTAR_STONE_TRIM);
  c.addChild(trim);

  // Ring stain on altar top — brown discoloration where the poisoned chalice
  // rested. Ellipse, low alpha. Anti-slasher: this is RESIDUE, not blood.
  const stain = new Graphics();
  stain
    .ellipse(altarCX + 18, altarTopY + 10, 14, 4)
    .fill(PALETTE.PROPS.POISON_RING);
  stain.alpha = 0.7;
  c.addChild(stain);
  // Inner ring — same hue, darker, sells the "ring" read.
  const stainInner = new Graphics();
  stainInner
    .ellipse(altarCX + 18, altarTopY + 10, 9, 2)
    .fill(PALETTE.CHAPEL_FRAME);
  stainInner.alpha = 0.4;
  c.addChild(stainInner);

  // Two candle wax pillars flanking the altar. Flames are added separately
  // by ambientMotion (so they can flicker without re-allocating geometry).
  // Positions chosen so they don't occlude the chalice evidence at x=300.
  // Left candle (deeper into the altar interior).
  const leftCandle = drawCandlePillar(altarCX - altarW / 2 + 10, altarTopY - 18, 4, 18);
  c.addChild(leftCandle);
  // Right candle (between altar and chalice).
  const rightCandle = drawCandlePillar(altarCX + altarW / 2 - 14, altarTopY - 18, 4, 18);
  c.addChild(rightCandle);

  // Snuffed candle near the altar — wax pillar only, no flame. The smoke
  // wisp will rise from its wick at (altarCX, altarTopY - 18).
  const snuffed = drawCandlePillar(altarCX - 2, altarTopY - 14, 4, 14);
  c.addChild(snuffed);

  // Empty wooden bowls / cups scattered around the altar base. Tiny squat
  // rects, brown wood tone. Place 4 of them.
  const bowlPositions = [
    [altarCX - altarW / 2 - 12, PROPS_FLOOR_Y - 4],
    [altarCX - altarW / 2 - 26, PROPS_FLOOR_Y - 3],
    [altarCX + altarW / 2 + 8, PROPS_FLOOR_Y - 4],
    [altarCX + altarW / 2 + 22, PROPS_FLOOR_Y - 3],
  ];
  for (const [bx, by] of bowlPositions) {
    const bowl = new Graphics();
    bowl.rect(bx, by, 8, 4).fill(PALETTE.PROPS.WOOD_BOWL);
    c.addChild(bowl);
    // Rim highlight — a single px of lighter wood on top.
    const rim = new Graphics();
    rim.rect(bx, by, 8, 1).fill(PALETTE.PROPS.WOOD_DARK);
    rim.alpha = 0.6;
    c.addChild(rim);
  }

  return c;
}

/**
 * Lectern (waypoint x=500) — SERMON AS LURE.
 * - Tall narrow wooden lectern stand.
 * - Small candle on top of the lectern.
 * - Scattered loose sermon pages on the floor in front.
 */
function buildLecternProps() {
  const c = new Container();
  c.label = 'props-lectern';

  const lecternCX = 500;
  const lecternTopY = PROPS_FLOOR_Y - 60;

  // Lectern shaft — tall thin vertical post.
  const shaft = new Graphics();
  shaft
    .rect(lecternCX - 4, lecternTopY + 8, 8, 52)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(shaft);

  // Lectern slanted top (book rest) — parallelogram angled forward-right.
  const top = new Graphics();
  top
    .poly([
      lecternCX - 18, lecternTopY + 12,
      lecternCX + 18, lecternTopY,
      lecternCX + 18, lecternTopY + 4,
      lecternCX - 18, lecternTopY + 16,
    ])
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(top);

  // Small candle on top of the lectern. Flame added separately.
  const candle = drawCandlePillar(lecternCX + 10, lecternTopY - 10, 3, 10);
  c.addChild(candle);

  // Scattered loose sermon pages on the floor — small parchment rects with
  // slight rotation suggestion (just irregular placement and varied size).
  // Avoid x=580 (where the sermonBook evidence sits — keep pages clear of
  // the pickup geometry).
  const pages = [
    [lecternCX - 40, PROPS_FLOOR_Y - 2, 10, 6],
    [lecternCX - 28, PROPS_FLOOR_Y + 4, 8, 5],
    [lecternCX - 50, PROPS_FLOOR_Y + 8, 9, 5],
    [lecternCX + 28, PROPS_FLOOR_Y + 10, 10, 5],
    [lecternCX + 42, PROPS_FLOOR_Y + 2, 8, 6],
  ];
  for (const [px, py, pw, ph] of pages) {
    const page = new Graphics();
    page.rect(px, py, pw, ph).fill(PALETTE.PROPS.PARCHMENT);
    page.alpha = 0.85;
    c.addChild(page);
    // A single dim horizontal pen-stroke per page to read as "written on".
    const ink = new Graphics();
    ink.rect(px + 1, py + Math.floor(ph / 2), pw - 2, 1).fill(PALETTE.PROPS.WOOD_DARK);
    ink.alpha = 0.6;
    c.addChild(ink);
  }

  return c;
}

/**
 * Confession Booth (waypoint x=780) — EXTORTION.
 * - Booth structure (tall narrow wooden box).
 * - Curtain hanging on the confessor's side.
 * - Small kneeler bench in front (where pilgrims confessed).
 * - Tally marks scratched into the wooden side (count of pilgrims).
 */
function buildBoothProps() {
  const c = new Container();
  c.label = 'props-booth';

  const boothCX = 780;
  const boothW = 78;
  const boothH = 110;
  const boothTopY = PROPS_FLOOR_Y - boothH;

  // Booth back wall — dark wood mass.
  const back = new Graphics();
  back
    .rect(boothCX - boothW / 2, boothTopY, boothW, boothH)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(back);

  // Booth roof trim — lighter wood, reads as a cornice on the box.
  const roof = new Graphics();
  roof
    .rect(boothCX - boothW / 2 - 3, boothTopY, boothW + 6, 6)
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(roof);

  // Vertical divider — splits booth into confessor (left) and penitent
  // (right) compartments. Reads as the lattice partition.
  const divider = new Graphics();
  divider
    .rect(boothCX - 2, boothTopY + 6, 4, boothH - 6)
    .fill(PALETTE.CHAPEL_FRAME);
  c.addChild(divider);

  // Confessor curtain — hanging fabric on the LEFT side. Drawn as a stack
  // of vertical pleats (3 thin rects of muted purple).
  const curtainX = boothCX - boothW / 2 + 4;
  const curtainY = boothTopY + 8;
  const curtainW = (boothW / 2) - 6;
  const curtainH = boothH - 26;
  const curtainBase = new Graphics();
  curtainBase
    .rect(curtainX, curtainY, curtainW, curtainH)
    .fill(PALETTE.PROPS.CURTAIN);
  c.addChild(curtainBase);
  // Three pleat shadows.
  for (let i = 1; i <= 3; i++) {
    const pleat = new Graphics();
    pleat
      .rect(curtainX + (curtainW / 4) * i - 1, curtainY, 2, curtainH)
      .fill(PALETTE.CHAPEL_FRAME);
    pleat.alpha = 0.4;
    c.addChild(pleat);
  }

  // Tally marks scratched into the RIGHT (penitent) side. Eight thin vertical
  // lines in two clusters of 4 (the classic count). Parchment tone.
  // Anti-slasher: scratches into wood read as "count of pilgrims processed",
  // not as wounds. Place at chest height on the back wall RIGHT half.
  const tallyY = boothTopY + 50;
  const tallyBaseX = boothCX + 10;
  for (let i = 0; i < 8; i++) {
    const cluster = Math.floor(i / 4);
    const within = i % 4;
    const tx = tallyBaseX + cluster * 14 + within * 3;
    const tally = new Graphics();
    tally.rect(tx, tallyY, 1, 10).fill(PALETTE.PROPS.TALLY_MARK);
    tally.alpha = 0.75;
    c.addChild(tally);
  }

  // Kneeler bench in front of the booth (penitent side, x ≈ booth right
  // half, on the floor). Small low rect, brown wood. Keep clear of the
  // confessionLedger evidence at x=860 — shift left slightly.
  const kneelerX = boothCX + 6;
  const kneelerW = 40;
  const kneeler = new Graphics();
  kneeler
    .rect(kneelerX, PROPS_FLOOR_Y - 6, kneelerW, 6)
    .fill(PALETTE.PROPS.KNEELER);
  c.addChild(kneeler);
  // Bench legs (two thin verticals so it reads 3D).
  const legL = new Graphics();
  legL.rect(kneelerX + 2, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legL);
  const legR = new Graphics();
  legR.rect(kneelerX + kneelerW - 5, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legR);

  return c;
}

/**
 * Sacristy (waypoint x=1060) — BURIAL IN QUICKLIME.
 *
 * ANTI-SLASHER HARD LINES (mirrors ticket #17 §B.6):
 * - Shroud pile = LUMPY FABRIC, not body silhouette. Drawn as a low
 *   irregular mound of two overlapping ellipses + a fabric corner sticking
 *   up — NEVER a head/torso/limbs profile.
 * - Bricked niche = SUBTLE GEOMETRIC SEAM only, never body-shaped. Drawn as
 *   a rectangular brickwork patch inset into the back wall — a wall patch,
 *   not a tomb cutout.
 * - Lime dust trail = pale dust on the floor leading from the booth toward
 *   the sacristy. Reads as "something dragged this way".
 * - Small candle on a stand.
 */
function buildSacristyProps() {
  const c = new Container();
  c.label = 'props-sacristy';

  const sacCX = 1060;

  // Partially-bricked niche on the back wall — a small rectangular patch
  // of geometric brickwork. Sits well above the floor (back wall area).
  // Anti-slasher: this is masonry, NEVER a body-shaped cutout.
  const nicheX = sacCX - 30;
  const nicheY = 360;
  const nicheW = 60;
  const nicheH = 80;
  const nicheBg = new Graphics();
  nicheBg
    .rect(nicheX, nicheY, nicheW, nicheH)
    .fill(PALETTE.PROPS.BRICK_SEAM);
  c.addChild(nicheBg);
  // Brick courses — horizontal mortar lines + staggered vertical joints.
  // Strictly geometric (anti-slasher).
  const brickH = 10;
  const brickW = 20;
  for (let row = 0; row < Math.floor(nicheH / brickH); row++) {
    const ry = nicheY + row * brickH;
    // Horizontal mortar line.
    const mortar = new Graphics();
    mortar.rect(nicheX, ry, nicheW, 1).fill(PALETTE.PROPS.BRICK_MORTAR);
    c.addChild(mortar);
    // Vertical joints, staggered each row.
    const offset = (row % 2) * (brickW / 2);
    for (let bx = -offset; bx < nicheW; bx += brickW) {
      const joint = new Graphics();
      joint
        .rect(nicheX + bx, ry, 1, brickH)
        .fill(PALETTE.PROPS.BRICK_MORTAR);
      c.addChild(joint);
    }
  }
  // Subtle frame around the niche — implies this is a SET-IN patch of new
  // brickwork, "partially bricked". Top + sides only; bottom blends into floor.
  const nicheFrame = new Graphics();
  nicheFrame.rect(nicheX - 1, nicheY - 1, nicheW + 2, 1).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX - 1, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  nicheFrame.rect(nicheX + nicheW, nicheY, 1, nicheH).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(nicheFrame);

  // Lime dust trail across the floor — pale dust path from the booth area
  // (~x=820) toward the sacristy (~x=1050). A series of overlapping low-alpha
  // pale rects on the floor surface.
  // Place clear of waypoints so it doesn't hide markers.
  const trailY = PROPS_FLOOR_Y + 4;
  const trailSegments = [
    [820, trailY, 30, 4],
    [855, trailY + 2, 28, 4],
    [890, trailY, 32, 4],
    [930, trailY + 3, 30, 4],
    [970, trailY + 1, 32, 4],
    [1010, trailY + 4, 32, 4],
    [1050, trailY + 2, 24, 5],
  ];
  for (const [tx, ty, tw, th] of trailSegments) {
    const dust = new Graphics();
    dust.rect(tx, ty, tw, th).fill(PALETTE.PROPS.LIME_DUST);
    dust.alpha = 0.32;
    c.addChild(dust);
  }
  // Wider dust pool at the sacristy end — suggests where the lime was poured.
  const pool = new Graphics();
  pool
    .ellipse(sacCX - 10, PROPS_FLOOR_Y + 8, 40, 6)
    .fill(PALETTE.PROPS.LIME_DUST);
  pool.alpha = 0.32;
  c.addChild(pool);

  // Lumpy fabric pile in shadow — anti-slasher CRITICAL.
  // Drawn as TWO overlapping low irregular ellipses + one small fabric corner
  // sticking up. NEVER a body silhouette: no head bump, no shoulder line,
  // no torso/leg division. The ellipses are wider than tall (fabric heaped,
  // not lying).
  // Place behind the spade evidence (x=1180 since #22a moved it into the
  // sacristy room) — slightly left of evidence so the spade silhouette still
  // reads cleanly. Sacristy interior is right side.
  const pileCX = 1100;
  const pileCY = PROPS_FLOOR_Y - 4;
  const pileLump1 = new Graphics();
  pileLump1
    .ellipse(pileCX - 8, pileCY + 4, 32, 8)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump1);
  const pileLump2 = new Graphics();
  pileLump2
    .ellipse(pileCX + 10, pileCY + 2, 24, 7)
    .fill(PALETTE.PROPS.SHROUD_FABRIC);
  c.addChild(pileLump2);
  // Shadow underneath — sells "pile on floor" without making it body-shaped.
  const pileShadow = new Graphics();
  pileShadow
    .ellipse(pileCX, pileCY + 10, 42, 3)
    .fill(PALETTE.CHAPEL_FRAME);
  pileShadow.alpha = 0.6;
  c.addChild(pileShadow);
  // Fabric corner sticking up — a small irregular triangular flap of cloth.
  // Important: this is an ABSTRACT corner, NOT a hand/foot/limb. Keep it
  // small, asymmetric, and tonally cream-brown (clearly fabric).
  const flap = new Graphics();
  flap
    .poly([
      pileCX - 6, pileCY - 2,
      pileCX + 2, pileCY - 6,
      pileCX + 6, pileCY + 1,
    ])
    .fill(PALETTE.PROPS.SHROUD_FABRIC_DARK);
  c.addChild(flap);

  // Small candle on a stand at the sacristy.
  // Stand: short vertical post; candle wax on top. Flame added separately.
  const standX = sacCX + 38;
  const standTopY = PROPS_FLOOR_Y - 24;
  const stand = new Graphics();
  stand.rect(standX - 1, standTopY, 3, 24).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(stand);
  const candle = drawCandlePillar(standX - 1, standTopY - 12, 3, 12);
  c.addChild(candle);

  return c;
}

/**
 * Helper — draws a single candle wax pillar at (x, y) with given width and
 * height. Returns a Container so callers can position it absolutely. Flames
 * are NOT part of the wax pillar — they're handled by ambientMotion.js so
 * they can flicker without re-allocating geometry.
 */
function drawCandlePillar(x, y, w, h) {
  const c = new Container();
  c.label = 'candle-wax';
  const wax = new Graphics();
  wax.rect(x, y, w, h).fill(PALETTE.PROPS.PARCHMENT);
  wax.alpha = 0.85;
  c.addChild(wax);
  // Wick — single dark px at top center.
  const wick = new Graphics();
  wick.rect(x + Math.floor(w / 2), y - 1, 1, 2).fill(PALETTE.CHAPEL_FRAME);
  c.addChild(wick);
  return c;
}

/**
 * Composite — all storytelling props for The Confession Room.
 * Returns a Container that callers mount into `world` at (0,0). Props are
 * authored in world-logical (1280x720) coordinates.
 *
 * Z-order discipline (per ticket #21 composition order):
 *   - Mount BETWEEN chapel background and waypoint markers / evidence / ghosts
 *     so props sit ON the chapel floor / back wall but BEHIND the gameplay
 *     midground.
 *   - The brick niche must read on the back wall (not in front of waypoints) —
 *     it is positioned high enough (y=360..440) to sit above the floor strip.
 */
export function createConfessionRoomProps() {
  const container = new Container();
  container.label = 'confession-room-props';
  container.addChild(buildAltarProps());
  container.addChild(buildLecternProps());
  container.addChild(buildBoothProps());
  container.addChild(buildSacristyProps());
  return container;
}

// Coordinates exposed so ambientMotion mount in main.js can place flames at
// the wicks of THE SAME candles drawn above. Single source of truth — if a
// candle position changes here, the flame coordinates change with it.
export const CONFESSION_ROOM_CANDLES = {
  // Altar block top y = PROPS_FLOOR_Y - 44 = 476. Candles are 18 tall, sit
  // on top of altar, wick = (top - 1).
  altarLeft:  { x: 220 - 55 + 10 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  altarRight: { x: 220 + 55 - 14 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  // Snuffed candle — same row, in the middle of the altar.
  altarSnuffed: { x: 220 - 2 + 2,        y: 476 - 14 - 1, flameRadius: 0 },
  // Lectern top candle.
  lecternTop: { x: 500 + 10 + 1,         y: PROPS_FLOOR_Y - 60 - 10 - 1, flameRadius: 3 },
  // Sacristy stand candle.
  sacristyStand: { x: 1060 + 38 - 1 + 1, y: PROPS_FLOOR_Y - 24 - 12 - 1, flameRadius: 3 },
};

// Stained-glass shaft geometry — exposed for DustMotes mount in main.js.
// The window is mounted at (altar.x - 30, 300), W=80, H=180.
// Light shaft drops from the window's lower edge down to the floor surface,
// narrowing slightly. We approximate it as a vertical rectangle directly
// below the window pane, clamped to the floor strip top.
export const STAINED_WINDOW_SHAFT = {
  // Window is at x = altar.x - 30 = 190. Shaft starts inset by 10 (pane
  // inset from window frame), width = pane width (60), drops from window
  // bottom (300 + 180 = 480) to floor top (520). 40px tall shaft.
  x: 190 + 10,
  y: 480,
  width: 60,
  height: PROPS_FLOOR_Y - 480,  // 40
};

// ---------------------------------------------------------------------------
// Father Aldric — in-world walking sprite (slice 3, Phase 2 skeleton)
// ---------------------------------------------------------------------------
// Two factories for the Victim entity:
//   * createAldricWalkingSprite — static silhouette translated along the
//     routine by Victim. Same warm-cream cleric grammar as the portrait card,
//     but lives in world-space and reads "guilty man at work" at thumbnail.
//   * createFatedDeathPose — kneeling / weight-broken still that swaps in
//     when FEAR hits 100. Victim fades alpha to 0; this factory delivers
//     only the pose. ANTI-SLASHER HARD LINE: no gore, no body sprawl,
//     no blood, no contorted limbs. Reads as surrender / spirit broken.
//
// Visual contract vs. siblings:
//   - Reaper: dark hood + lean + eye-slit, 32x124.  (createReaperPlaceholder)
//   - Aldric walking: warm cream + stout + collar band + round head, 40x116.
//   - Ghost replays: pale-cyan gestural poses (kneeling, pouring, etc.),
//     forensic witnesses — NOT Aldric himself.
// All three must read distinct at thumbnail; the walking Aldric is the
// living warm-cream cleric, distinguished from the ghosts' pale-cyan family
// by palette alone.
//
// Pivot grammar matches the Reaper sprite: bottom-center on the sprite's
// logical bounding box, so Victim can place the container at a floor-y
// world coord and the figure stands on that y.

/**
 * Father Aldric walking sprite — in-world placeholder.
 *
 * Logical bounds: 40 wide x 116 tall (per SCALE.ALDRIC). Slightly wider /
 * shorter than the Reaper (32x124) so the silhouette reads as STOUT vs.
 * the Reaper's LEAN at thumbnail.
 *
 * Build order (back to front):
 *   1. Body — warm cream rounded rectangle, tapered slightly at the
 *      shoulders for a "pillowed cleric" read.
 *   2. Robe seam — thin vertical dark line down body center (subtle, low
 *      alpha) hinting at a robe / vestment fold.
 *   3. Collar band — narrow dark horizontal band at neck level. This is
 *      the clergy tell at thumbnail.
 *   4. Head — warm cream circle on top of the collar. No face details
 *      (placeholder discipline; Reaper has the only eye-slit in the cast).
 *
 * No walk-cycle animation in slice 3 — Victim translates this container
 * as a static silhouette. A future slice may add a 2-frame leg shift.
 *
 * Pivot: (WIDTH/2, HEIGHT) — bottom-center, same convention as Reaper.
 */
