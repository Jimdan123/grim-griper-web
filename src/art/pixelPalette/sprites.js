// sprites.js — character sprites (Aldric, Reaper, parishioner variants).
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

import { Container, Graphics } from 'pixi.js';
import { PIXEL_PALETTE, snap } from './constants.js';

export function createAldricPixelSprite() {
  const container = new Container();
  container.label = 'aldric-pixel-day';

  // Geometry (logical px, integer-aligned).
  const W = 40;
  const H = 64;
  const HEAD_W = 12;
  const HEAD_H = 12;
  const BODY_W = 24;
  const BODY_H = 40;
  const COLLAR_W = 24;
  const COLLAR_H = 4;
  // Sprite is small (64px tall vs SCALE.ALDRIC.HEIGHT=116) — this matches
  // the dispatch's "stout pixel-art human silhouette" spec, deliberately
  // squatter than the painterly walker so the new register is recognisable.

  // Body — stout cleric robe, cream. Sits at the bottom of the bounding
  // rect with feet at y=H.
  const bodyX = (W - BODY_W) / 2;
  const bodyY = H - BODY_H;
  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  container.addChild(body);

  // Robe-bottom hem shadow — 2px STONE_DARK at the feet so the figure
  // anchors visibly to the floor (would otherwise float against the
  // FLOOR_BASE which is close in luminance to the robe at low alpha).
  const hemShadow = new Graphics();
  hemShadow
    .rect(bodyX, H - 2, BODY_W, 2)
    .fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  hemShadow.alpha = 0.5;
  container.addChild(hemShadow);

  // Collar — 24x4 ALDRIC_COLLAR band at the top of the body (neck).
  const collar = new Graphics();
  collar
    .rect((W - COLLAR_W) / 2, bodyY - COLLAR_H + 2, COLLAR_W, COLLAR_H)
    .fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — 12x12 cream block with diagonal pixel-stairs on the four
  // corners to read as a rounded skull. Each corner clips 2 pixels into
  // a stair: outer 1px row × 2px wide, then 1px row × 1px wide.
  const headX = (W - HEAD_W) / 2;
  const headY = bodyY - COLLAR_H - HEAD_H + 2;
  const head = new Graphics();
  head.rect(headX, headY, HEAD_W, HEAD_H).fill(PIXEL_PALETTE.ALDRIC_CREAM);
  container.addChild(head);

  // Pixel-stair corner cuts — paint over the four head corners with the
  // STONE_BASE wall tone at low alpha to simulate a 1-pixel round.
  // (Using a transparent "cut" is cleaner than painting the wall color,
  // but since the sprite sits in front of arbitrary backgrounds we paint
  // 4 tiny ALDRIC_COLLAR shadow pixels instead, treating the rounding as
  // a darker "hair / hood" pixel rather than a transparent corner.)
  const corners = new Graphics();
  // Top-left.
  corners.rect(headX, headY, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Top-right.
  corners.rect(headX + HEAD_W - 1, headY, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Bottom-left.
  corners.rect(headX, headY + HEAD_H - 1, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  // Bottom-right.
  corners.rect(headX + HEAD_W - 1, headY + HEAD_H - 1, 1, 1).fill(PIXEL_PALETTE.ALDRIC_COLLAR);
  corners.alpha = 0.6;
  container.addChild(corners);

  // Pivot bottom-center so callers can place at floor surface.
  container.pivot.set(W / 2, H);
  return container;
}

// ---------------------------------------------------------------------------
// createChapelFrontDoor({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// REVISED 2026-05-30 evening (Stage + Art Lead dispatch — door-too-thin fix):
//   Previous door was 32 wide × 144 tall — user reported "front door barely
//   visible". This revision is 64 wide × 160 tall, with two-plank wood door
//   panels visible (open) and a `CANDLE_DIM` hanging-lantern glow above the
//   threshold. Door stays OPEN (no swinging panel art); the opening is the
//   NIGHT_AMBIENT void of outside-the-chapel.
//
// Cross-team contract with #1 Foundation:
//   Door logical-x footprint: x ∈ [bounds.x + 16, bounds.x + 16 + 64] = [96, 160]
//   for the default chapelBounds.x = 80. The proximity-to-door check for the
//   E-to-interact mechanic should fire when the Reaper's logical x is within
//   ~24 px of door-center (door-center-x ≈ 128). Settle: trigger between
//   x=104..152.
//
// Discipline (anti-slasher):
//   * Stone palette for frame, WOOD_BASE / WOOD_LIGHT for door panels.
//   * No red glow. The lantern glow is CANDLE_DIM (muted warm), not red.
//   * No silhouette in the dark opening.
export function createReaperPixelSprite() {
  const container = new Container();
  container.label = 'reaper-pixel';

  const W = 32;
  const H = 72;
  const BODY_W = 16;
  const BODY_H = 56;
  const HOOD_W = 24;
  const HOOD_H = 20;

  // Body — narrow vertical block (tall + lean silhouette).
  const bodyX = (W - BODY_W) / 2;
  const bodyY = H - BODY_H;
  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PIXEL_PALETTE.REAPER_BLACK);
  container.addChild(body);

  // Hood — wider trapezoidal mass at the top, drawn as stepped pixel rects
  // to approximate a curve in the pixel-art register. Top row 12 wide,
  // middle row 18 wide, base row 24 wide.
  const hoodBaseY = bodyY;
  const hood = new Graphics();
  // Hood crown (top): 12x4 centered.
  hood.rect((W - 12) / 2, hoodBaseY - HOOD_H, 12, 4).fill(PIXEL_PALETTE.REAPER_BLACK);
  // Hood mid: 18x8.
  hood.rect((W - 18) / 2, hoodBaseY - HOOD_H + 4, 18, 8).fill(PIXEL_PALETTE.REAPER_BLACK);
  // Hood base: 24x8.
  hood.rect((W - HOOD_W) / 2, hoodBaseY - HOOD_H + 12, HOOD_W, 8).fill(PIXEL_PALETTE.REAPER_BLACK);
  container.addChild(hood);

  // Shoulder bevels — single-pixel STONE_DARK accents at the hood-body
  // junction so the silhouette has a hint of internal structure without
  // breaking the all-black read.
  const bevels = new Graphics();
  // Left shoulder.
  bevels.rect(bodyX - 2, hoodBaseY, 2, 2).fill(PIXEL_PALETTE.STONE_DARK);
  // Right shoulder.
  bevels.rect(bodyX + BODY_W, hoodBaseY, 2, 2).fill(PIXEL_PALETTE.STONE_DARK);
  bevels.alpha = 0.4;
  container.addChild(bevels);

  // Eye-slit — ONE faint highlight pixel in the hood interior. Using
  // GHOST_PALE (the pale cyan witnesses' tone) ties the Reaper visually
  // to the ghost-replay register: same kind of spectral light. The painterly
  // REAPER_EYE was 0x9be7ff (saturated cyan); we use the muted GHOST_PALE
  // here so the pixel-art register stays muted '80s, not neon '80s.
  const eye = new Graphics();
  eye
    .rect((W - 2) / 2, hoodBaseY - HOOD_H + 8, 2, 1)
    .fill(PIXEL_PALETTE.GHOST_PALE);
  eye.alpha = 0.85;
  container.addChild(eye);

  // POLISH PASS 2026-05-30 (outside-scene readability): 1px STONE_LIGHT rim
  // highlight on ONE side of the body + head silhouette so the Reaper reads
  // as a figure on the lit outside cobble path. Subtle alpha (0.45) — same
  // technique used on NPCs in the prior polish pass. Anti-slasher: muted
  // moonlight grey, NOT lit-up-by-fire.
  const rim = new Graphics();
  // Body left-side rim — runs full body height.
  rim.rect(bodyX, bodyY, 1, BODY_H).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood crown left rim (top-row left-edge).
  rim.rect((W - 12) / 2, hoodBaseY - HOOD_H, 1, 4).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood mid-row left rim.
  rim.rect((W - 18) / 2, hoodBaseY - HOOD_H + 4, 1, 8).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Hood base-row left rim.
  rim.rect((W - HOOD_W) / 2, hoodBaseY - HOOD_H + 12, 1, 8).fill(PIXEL_PALETTE.STONE_LIGHT);
  // Top 1px of hood crown (catches sky light from above).
  rim.rect((W - 12) / 2, hoodBaseY - HOOD_H, 12, 1).fill(PIXEL_PALETTE.STONE_LIGHT);
  rim.alpha = 0.45;
  container.addChild(rim);

  // Pivot bottom-center so callers can place at floor surface.
  container.pivot.set(W / 2, H);
  return container;
}

// ---------------------------------------------------------------------------
// createChapelDayAmbientPixelArt({ bounds }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Stage + Art Lead, 2026-05-30 evening "chapel bustle" dispatch.
//
// Brightens the DAY-phase chapel so it reads as a working church at midday,
// not a dim stone box. We OVERLAY warm-light passes on top of the existing
// nave + ceiling renders rather than retuning the underlying palette — this
// keeps the night-phase nave variant (follow-up dispatch) free to flip the
// overlay off without re-rendering the walls.
//
// Layers (back-to-front):
//   1. Cream-gold sun shafts pouring from the clerestory band (top 96 px of
//      the chapel interior) onto the floor. Six narrow trapezoid bands at
//      tile-aligned x-offsets, low alpha so they wash without flattening.
//   2. Warm cream wash over the whole chapel — full-bounds low-alpha rect at
//      DAY_LIGHT to lift the cool stone palette ~one step toward midday.
//   3. Floor brightening pass — slightly stronger DAY_LIGHT wash limited to
//      the floor band so foot-level reads brighter than the upper wall band
//      (sun through window hits the floor harder than the wall).
//
// Discipline:
//   * NO additive blend mode — keep the painterly + pixel-art register stable
//     under SightFX ColorMatrixFilter (desaturation must still land cleanly).
//   * NO ticker subscriptions. Static graphics drawn once at construction.
//   * NO red, no high-saturation gold — DAY_LIGHT is a muted cream.
//
// Mounted by Stage.js in pixelart mode only, BEFORE the interior props so
// the warm cream sits behind altar/lectern/booth/sacristy but ON TOP of the
// stone walls + flagstone floor.
export function createParishionerSpritePixelArt({ variant = 'stander', seed = 0 } = {}) {
  const container = new Container();
  container.label = `parishioner-pixel-${variant}`;

  // POLISH PASS 2026-05-30 (late): added PILGRIM_RED variant for robe-color
  // variety so a 4-6-NPC crowd reads as visibly distinct people.
  const robePalette = [
    { body: PIXEL_PALETTE.PILGRIM_BROWN,      shadow: PIXEL_PALETTE.WOOD_DARK },
    { body: PIXEL_PALETTE.PILGRIM_DARK_CREAM, shadow: PIXEL_PALETTE.PILGRIM_BROWN },
    { body: PIXEL_PALETTE.PILGRIM_GREY,       shadow: PIXEL_PALETTE.STONE_DARK },
    { body: PIXEL_PALETTE.PILGRIM_RED,        shadow: PIXEL_PALETTE.WOOD_DARK },
  ];
  const palette =
    robePalette[Math.floor((seed % 1) * robePalette.length) % robePalette.length];
  const headColor = PIXEL_PALETTE.PILGRIM_SKIN;
  const hoodColor = PIXEL_PALETTE.PILGRIM_CREAM;

  // 1px STONE_LIGHT highlight rim along the candle-lit side so the NPC pops
  // off the dim stone background even before the day-ambient brightening.
  // We paint this LAST so it sits on top of body/head — done in addHighlightRim().
  const addHighlightRim = (bodyX, bodyY, bodyW, bodyH, headX, headY, headW, headH) => {
    const rim = new Graphics();
    // Body left edge highlight (candle-lit side).
    rim.rect(bodyX, bodyY, 1, bodyH).fill(PIXEL_PALETTE.STONE_LIGHT);
    // Head left edge highlight.
    rim.rect(headX, headY, 1, headH).fill(PIXEL_PALETTE.STONE_LIGHT);
    rim.alpha = 0.5;
    container.addChild(rim);
  };

  if (variant === 'kneeler') {
    const W = 16;
    const H = 40;
    const BODY_W = 16;
    const BODY_H = 20;
    const HEAD_W = 8;
    const HEAD_H = 7;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2;
    const headY = bodyY - HEAD_H + 3; // bowed lower than upright
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const hood = new Graphics();
    hood.rect(headX - 1, headY, HEAD_W + 2, 2).fill(hoodColor);
    container.addChild(hood);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else if (variant === 'stander') {
    const W = 16;
    const H = 64;
    const BODY_W = 14;
    const BODY_H = 40;
    const HEAD_W = 8;
    const HEAD_H = 8;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 1;
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else if (variant === 'walker') {
    const W = 16;
    const H = 64;
    const BODY_W = 14;
    const BODY_H = 40;
    const HEAD_W = 8;
    const HEAD_H = 8;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 2; // forward lean
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  } else {
    // candlelighter — facing right with extended arm.
    const W = 16;
    const H = 56;
    const BODY_W = 12;
    const BODY_H = 34;
    const HEAD_W = 8;
    const HEAD_H = 8;
    const ARM_W = 6;
    const ARM_H = 3;

    const bodyX = (W - BODY_W) / 2;
    const bodyY = H - BODY_H;
    const body = new Graphics();
    body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(palette.body);
    container.addChild(body);

    const hem = new Graphics();
    hem.rect(bodyX, H - 2, BODY_W, 2).fill(palette.shadow);
    hem.alpha = 0.6;
    container.addChild(hem);

    const headX = (W - HEAD_W) / 2 + 2;
    const headY = bodyY - HEAD_H;
    const head = new Graphics();
    head.rect(headX, headY, HEAD_W, HEAD_H).fill(headColor);
    container.addChild(head);

    // Extended arm reaching right (toward a shrine candle).
    const arm = new Graphics();
    arm
      .rect(bodyX + BODY_W, bodyY + 6, ARM_W, ARM_H)
      .fill(palette.body);
    container.addChild(arm);

    const shawl = new Graphics();
    shawl.rect(bodyX, bodyY, BODY_W, 4).fill(hoodColor);
    shawl.alpha = 0.85;
    container.addChild(shawl);

    addHighlightRim(bodyX, bodyY, BODY_W, BODY_H, headX, headY, HEAD_W, HEAD_H);
    container.pivot.set(W / 2, H);
  }

  // POLISH PASS 2026-05-30 (late): scale 1.5× so parishioners read as
  // distinct people at fit-to-viewport scaling instead of disappearing into
  // the dim chapel as specks. 16×40 / 16×64 logical-px sprites become
  // ~24×60 / ~24×96 on screen. Pivot is set BEFORE scale so bottom-center
  // anchoring still lands cleanly on the floor.
  container.scale.set(1.5);

  return container;
}

// ---------------------------------------------------------------------------
// createOutsideChapelScenePixelArt({ bounds, floorY }) -> PIXI.Container
// ---------------------------------------------------------------------------
// Renders the FULL OUTSIDE-THE-CHAPEL scene as a single composite Container.
// Fills the entire 1280×720 logical canvas. The Reaper spawns on the cobble
// path at the left, walks right, and presses E at the chapel door (centered
// around x=948) to transition into the interior scene that #1 Foundation
// Engineer's scene-swap state machine mounts/unmounts.
//
// Locked 2026-05-30 evening per `[[project-outside-chapel-scene-2026-05-30]]`.
//
// Composition (back-to-front z-order):
//   1. Sky band — washed cream-blue midday (SKY_BLUE), pale horizon haze,
//      1-2 cloud streaks, small pixel-art sun upper-right with halo.
//   2. Distant village silhouette — 5 rooftops along the horizon at y=300..360,
//      muted grey-brown, slight height variation, one with a 1px chimney wisp.
//   3. Chapel facade (mid-ground, RIGHT HALF of canvas) — stone-block wall
//      with header-bond pattern, gothic door (open), stained-glass arched
//      window above door, bell tower with cross spire, two buttresses.
//   4. Ground / path / vegetation (foreground) — cobble path leading right
//      to the door, muted dry grass flanking, wayside stone cross at left
//      edge of path, plague-era foliage (1 small tree, 1 bush), low stone
//      churchyard wall to the right of chapel.
//   5. Atmosphere — subtle warm-light cream wash overlay at very low alpha.
//
// Cross-team contract:
//   * Container fills logical (0,0)..(1280,720).
//   * `bounds` arg is reserved for future scene-sizing flexibility; the body
//     ignores it in favour of the canonical 1280×720 — passing a different
//     bounds rect won't change the layout. Documented intent: ALWAYS the
//     full canvas.
//   * `floorY` is honoured as the ground-level y; defaults to 560.
//   * Reaper spawn at x=240 lands on the cobble path west of the chapel.
//   * Door interaction range x ∈ [900, 996] (= door footprint 96 wide).
//
// Discipline (anti-slasher):
//   * Sky is muted midday cream-blue — NOT blood red, NOT ominous.
//   * Cross is plain stone, NO crucifix figure, NO ornamentation.
//   * Churchyard wall is a low stone wall — NO headstones, NO grave shapes.
//   * Distant village: muted, working day, one wispy 1px chimney smoke OK.
//   * Foliage is dry/muted plague-era — NO bright spring green, NO creepy
//     bare-branch dead trees.
//
// Performance: every primitive drawn ONCE at construction. No ticker subs.
// No per-frame allocations.
