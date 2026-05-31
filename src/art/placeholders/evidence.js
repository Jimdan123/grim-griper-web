// evidence.js — waypoint markers, evidence placeholders, ghost replay placeholders.
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE, SCALE } from './constants.js';

const WAYPOINT_KIND_COLOR = {
  Altar: PALETTE.WAYPOINT_ALTAR,
  Lectern: PALETTE.WAYPOINT_LECTERN,
  ConfessionBooth: PALETTE.WAYPOINT_CONFESSION,
  Sacristy: PALETTE.WAYPOINT_SACRISTY,
};

export function createWaypointMarker(waypoint) {
  const container = new Container();
  container.label = `waypoint-${waypoint.id}`;

  const { WIDTH, HEIGHT, INSET, LABEL_OFFSET_Y, LABEL_FONT_PX } = SCALE.WAYPOINT_MARKER;
  const color = WAYPOINT_KIND_COLOR[waypoint.kind] ?? PALETTE.CHAPEL_ACCENT;

  // Stage.js anchors this container at `marker.y = floorY` (floor surface
  // top, Path A). We draw the marker bar DOWN from the anchor by INSET, so
  // it sits ON the floor strip — its top edge a few px below the horizon line
  // and its bottom edge well above the baseboard trim.
  const rectTop = INSET;

  const marker = new Graphics();
  marker.rect(-WIDTH / 2, rectTop, WIDTH, HEIGHT).fill(color);
  container.addChild(marker);

  // Thin glow strip on top of the marker for readability against the floor.
  const glow = new Graphics();
  glow.rect(-WIDTH / 2, rectTop, WIDTH, 2).fill(PALETTE.WAYPOINT_LABEL);
  glow.alpha = 0.45;
  container.addChild(glow);

  const label = new Text({
    text: waypoint.label,
    style: {
      fontFamily: 'sans-serif',
      fontSize: LABEL_FONT_PX,
      fill: PALETTE.WAYPOINT_LABEL,
      align: 'center',
    },
  });
  // Label sits ABOVE the floor surface (into the chapel interior) so it
  // doesn't crowd the marker bar inside the thin floor strip.
  label.anchor.set(0.5, 1);
  label.x = 0;
  label.y = -LABEL_OFFSET_Y;
  container.addChild(label);

  return container;
}

// ---------------------------------------------------------------------------
// Evidence placeholders (slice 2)
// ---------------------------------------------------------------------------
// Each evidence id dispatches to a small primitive-shape factory. All return
// a `Container` with pivot at center-bottom so callers place them via
// `sprite.x = evidence.x; sprite.y = evidence.y` with the bottom edge of the
// silhouette resting on the floor surface.
//
// Visual goals (per docs/art/style-guide.md + narrative):
//   * Distinguishable at thumbnail — different silhouette + different hue.
//   * Flat-color primitives only, no textures.
//   * Each color carries narrative meaning (gold/ochre/red/brown+cream).

function buildChalice() {
  const c = new Container();
  c.label = 'evidence-chalice';
  const { WIDTH, HEIGHT, STEM_W, STEM_H, CUP_W, CUP_H } = SCALE.EVIDENCE.CHALICE;

  // Base disc (foot).
  const foot = new Graphics();
  foot.rect(0, HEIGHT - 2, WIDTH, 2).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(foot);

  // Stem.
  const stem = new Graphics();
  const stemX = (WIDTH - STEM_W) / 2;
  stem.rect(stemX, HEIGHT - 2 - STEM_H, STEM_W, STEM_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(stem);

  // Cup (rect with 2 px notch to suggest the opening / residue rim).
  const cup = new Graphics();
  cup.rect(0, 0, CUP_W, CUP_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(cup);
  const rim = new Graphics();
  rim.rect(2, 0, CUP_W - 4, 2).fill(PALETTE.EVIDENCE_GLOW);
  rim.alpha = 0.7;
  c.addChild(rim);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildSermonBook() {
  const c = new Container();
  c.label = 'evidence-sermonBook';
  const { WIDTH, HEIGHT, SPINE_W } = SCALE.EVIDENCE.SERMON_BOOK;

  // Squat ochre rectangle = book lying open.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.SERMON_BOOK);
  c.addChild(cover);

  // Central spine band — splits the cover, reads as "open book".
  const spine = new Graphics();
  spine
    .rect((WIDTH - SPINE_W) / 2, 0, SPINE_W, HEIGHT)
    .fill(PALETTE.ALDRIC_COLLAR);
  c.addChild(spine);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildConfessionLedger() {
  const c = new Container();
  c.label = 'evidence-confessionLedger';
  const { WIDTH, HEIGHT, STRIPE_W } = SCALE.EVIDENCE.LEDGER;

  // Tall, narrow deep-red ledger — visibly different shape from sermonBook.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.LEDGER);
  c.addChild(cover);

  // Gold corner stripe = the priced margin notes (narr. line 53).
  const stripe = new Graphics();
  stripe.rect(WIDTH - STRIPE_W, 2, STRIPE_W, HEIGHT - 4).fill(PALETTE.EVIDENCE_GLOW);
  stripe.alpha = 0.8;
  c.addChild(stripe);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

function buildLimeSpade() {
  const c = new Container();
  c.label = 'evidence-limeSpade';
  const { WIDTH, HEIGHT, SHAFT_W, SHAFT_H, BLADE_W, BLADE_H } = SCALE.EVIDENCE.LIME_SPADE;

  // Brown wood shaft — tall and thin, centered.
  const shaft = new Graphics();
  const shaftX = (WIDTH - SHAFT_W) / 2;
  shaft.rect(shaftX, BLADE_H, SHAFT_W, SHAFT_H).fill(PALETTE.EVIDENCE.SPADE_SHAFT);
  c.addChild(shaft);

  // Cream blade at top — the lime-dust link to ALDRIC_BODY tone.
  const blade = new Graphics();
  blade.rect(0, 0, BLADE_W, BLADE_H).fill(PALETTE.EVIDENCE.SPADE_BLADE);
  c.addChild(blade);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}

const EVIDENCE_FACTORIES = {
  chalice: buildChalice,
  sermonBook: buildSermonBook,
  confessionLedger: buildConfessionLedger,
  limeSpade: buildLimeSpade,
};

export function createEvidencePlaceholder(evidence) {
  const factory = EVIDENCE_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createEvidencePlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(EVIDENCE_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}

// ---------------------------------------------------------------------------
// Ghost replay placeholders (slice 2)
// ---------------------------------------------------------------------------
// One silhouette per evidence id. Each ghost is a translucent priest-figure
// performing the crime gesture documented in docs/narrative/confession-room.md
// §"The Racket". All four share the pale-cyan GHOST.BODY tone so they read
// as "the same kind of vision" — only the silhouette / gesture differs.
//
// Tone discipline: Happy Hills touchstone — these are quiet witnesses, NOT
// jump-scare imagery. Standing figures performing period acts. The horror
// is the routine, not the visual.
//
// Alpha: ghost container alpha is set to 0.4 here as the default. Callers
// (#2 Investigation Engineer / Sight system) MAY override `container.alpha`
// if they want crossfades — the value is exposed, not baked into draw calls.

const GHOST_DEFAULT_ALPHA = 0.4;

function buildGhostBase(options = {}) {
  // Shared base silhouette: standing priest, no collar (silhouette only).
  // Returns { container, bodyTopY, headCx, headCy } so per-id factories can
  // attach arms / accents at the correct height AND can re-pose the figure
  // (bent torso, tilted head) to communicate the crime gesture per
  // docs/narrative/confession-room.md §"Visual direction notes".
  //
  // Options (all optional, all in logical px / radians):
  //   leanX      — horizontal offset applied to the torso TOP (creates a
  //                bent-over silhouette by drawing the body as a parallelogram).
  //                Positive = bend forward to the right.
  //   headDx     — horizontal offset of the head from the torso top center.
  //                Combined with leanX, lets us tilt the head independently
  //                of the lean (e.g. lectern: forward lean + downward head).
  //   headDy     — vertical offset of the head (positive = lower / hunched).
  //   shortenBy  — pixels to clip from the bottom of the body, so the figure
  //                reads as "crouched" rather than "shrunk floating".
  const c = new Container();
  const { WIDTH, HEIGHT, BODY_W, BODY_H, HEAD_R } = SCALE.GHOST;
  const { leanX = 0, headDx = 0, headDy = 0, shortenBy = 0 } = options;

  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H + shortenBy;

  // Torso as a parallelogram so the top can lean while the feet stay planted
  // on the floor — communicates "bent over" rather than "translated".
  const body = new Graphics();
  body
    .poly([
      bodyX + leanX,           bodyY,           // top-left (leans with leanX)
      bodyX + BODY_W + leanX,  bodyY,           // top-right (leans with leanX)
      bodyX + BODY_W,          HEIGHT,          // bottom-right (planted)
      bodyX,                   HEIGHT,          // bottom-left (planted)
    ])
    .fill(PALETTE.GHOST.BODY);
  c.addChild(body);

  // Head rides the top of the torso, offset by leanX so it sits over the
  // lean, plus per-pose headDx/headDy for tilt.
  const headCx = WIDTH / 2 + leanX + headDx;
  const headCy = bodyY - HEAD_R + headDy;
  const head = new Graphics();
  head.circle(headCx, headCy, HEAD_R).fill(PALETTE.GHOST.BODY);
  c.addChild(head);

  return { container: c, bodyTopY: bodyY, headCx, headCy };
}

function buildGhostSermon() {
  // Lectern / WHISPER — priest mid-sermon-tilt, leaning over the lectern.
  // Forward lean of the torso + downward-tilted head reading off the page,
  // plus one arm extended forward/down resting on the lectern edge holding
  // an open sermon book (small ochre-toned rect held in front of the chest).
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 6,
    headDx: 2,
    headDy: 4,
  });
  container.label = 'ghost-sermon';
  const { WIDTH, HEIGHT, ARM_W, ARM_H } = SCALE.GHOST;

  // Forward-extended arm — reaches out and slightly down toward the lectern.
  const arm = new Graphics();
  arm
    .rect(WIDTH / 2 + 8, bodyTopY + 16, ARM_W + 2, ARM_H - 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Small book silhouette held flat in front, just below the head — the
  // sermon being read. Drawn in the same ghost-accent tone so it reads as
  // PART OF the vision, not a separate evidence pickup.
  const book = new Graphics();
  book
    .rect(headCx + 2, headCy + 8, 12, 6)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(book);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostPoison() {
  // Altar / SHATTER — priest mid-tilt of the chalice, pouring poison.
  // Body bends forward over the altar; head dips to watch the pour; the
  // extended arm angles down-right, ending in a small chalice silhouette
  // tipped at the tilt angle (the poison going in).
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 5,
    headDx: 2,
    headDy: 6,
  });
  container.label = 'ghost-poison';
  const { WIDTH, HEIGHT, ARM_W, ARM_H } = SCALE.GHOST;

  // Pouring arm — angles from the shoulder down to the right.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 6,           bodyTopY + 12,            // shoulder
      WIDTH / 2 + 6 + ARM_W,   bodyTopY + 12,            // shoulder back
      WIDTH / 2 + 10 + ARM_W,  bodyTopY + 12 + ARM_H,    // hand-out lower-right
      WIDTH / 2 + 10,          bodyTopY + 12 + ARM_H,    // hand-in lower-right
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Tilted chalice silhouette at the end of the arm — a tiny cup-on-stem
  // rotated to suggest the pour. Same ghost-accent tone (vision, not pickup).
  const chaliceX = WIDTH / 2 + 12;
  const chaliceY = bodyTopY + 12 + ARM_H + 2;
  const chalice = new Graphics();
  // Cup, leaning right (parallelogram).
  chalice
    .poly([
      chaliceX,      chaliceY,
      chaliceX + 10, chaliceY - 2,
      chaliceX + 12, chaliceY + 6,
      chaliceX + 2,  chaliceY + 8,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(chalice);

  // Suppress unused-var lint of headCx/headCy by referencing nothing further;
  // we keep the destructure for symmetry with the other pose factories.
  void headCx; void headCy;

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostExtort() {
  // Booth / VOICE — priest hunched over the booth ledger, writing fast.
  // Pose: torso bent forward + head tilted down toward the page + writing
  // arm angled down across the body toward the ledger. The penitent's hand
  // on the lattice (left side) remains from the prior version — it is the
  // OTHER half of the scene (parishioner reaching through), not Aldric.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 4,
    headDx: 1,
    headDy: 5,
  });
  container.label = 'ghost-extort';
  const { WIDTH, HEIGHT, HAND_R, ARM_W, ARM_H } = SCALE.GHOST;

  // Writing arm — crosses down-right from the shoulder to the page.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 4,           bodyTopY + 10,
      WIDTH / 2 + 4 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Ledger page silhouette under the writing hand.
  const ledger = new Graphics();
  ledger
    .rect(WIDTH / 2 + 6, bodyTopY + 10 + ARM_H, 16, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(ledger);

  void headCx; void headCy;

  // Penitent's hand silhouette — a small palm (circle) + 4 finger stubs
  // pressed against the lattice at chest height on the left side. The fingers
  // are what distinguish this from an abstract dot — read as "hand reaching
  // through the lattice toward Aldric" per #5's flag (was a dot pre-fix).
  // VP pass 7: bumped finger geometry (was 2x1, ghost α=0.4 made them invisible)
  // and added a short wrist stub so palm reads as connected to body, not floating.
  const handX = WIDTH / 2 - 14;
  const handY = bodyTopY + 30;

  // Wrist stub — short bar from body toward palm, so palm reads "attached".
  const wrist = new Graphics();
  wrist
    .rect(handX, handY - 2, 10, 4)
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(wrist);

  // Palm.
  const palm = new Graphics();
  palm.circle(handX, handY, HAND_R).fill(PALETTE.GHOST.ACCENT);
  palm.alpha = 1.0;
  container.addChild(palm);

  // Four finger stubs extending LEFT (toward the booth lattice).
  const fingers = new Graphics();
  const fingerW = 4;
  const fingerH = 2;
  const fingerGap = 3;
  for (let i = 0; i < 4; i++) {
    const fy = handY - (fingerGap * 1.5) + i * fingerGap;
    fingers
      .rect(handX - HAND_R - fingerW + 1, fy, fingerW, fingerH)
      .fill(PALETTE.GHOST.ACCENT);
  }
  fingers.alpha = 1.0;
  container.addChild(fingers);

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

function buildGhostBury() {
  // Sacristy / RISE — priest dragging a shroud / spading lime. Strong
  // forward bend at the waist (gravedigger posture) + head down + both arms
  // forward-low: one extended out gripping a spade shaft, the other tugging
  // the shroud across the floor.
  const { container, bodyTopY, headCx, headCy } = buildGhostBase({
    leanX: 9,
    headDx: 3,
    headDy: 8,
  });
  container.label = 'ghost-bury';
  const { WIDTH, HEIGHT, ARM_W, ARM_H, SHROUD_W, SHROUD_H } = SCALE.GHOST;

  // Dragged shroud — low horizontal rect at floor level, offset right.
  // Drawn at full alpha; the parent container alpha (GHOST_DEFAULT_ALPHA=0.4)
  // attenuates it. Was 0.7 here → effective 0.28, too faint to read.
  const shroud = new Graphics();
  shroud
    .rect(WIDTH / 2 + 4, HEIGHT - SHROUD_H, SHROUD_W, SHROUD_H)
    .fill(PALETTE.GHOST.FLOOR_MARK);
  shroud.alpha = 1.0;
  container.addChild(shroud);

  // Pulling arm — angles from the shoulder down toward the shroud.
  const arm = new Graphics();
  arm
    .poly([
      WIDTH / 2 + 8,           bodyTopY + 10,
      WIDTH / 2 + 8 + ARM_W,   bodyTopY + 10,
      WIDTH / 2 + 14,          bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 10,          bodyTopY + 10 + ARM_H + 6,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(arm);

  // Spade shaft — thin diagonal accent from the hand toward the floor,
  // suggesting the tool in the dragging hand. Same accent tone (vision).
  const spade = new Graphics();
  spade
    .poly([
      WIDTH / 2 + 12, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 16, bodyTopY + 10 + ARM_H + 6,
      WIDTH / 2 + 22, HEIGHT - SHROUD_H,
      WIDTH / 2 + 18, HEIGHT - SHROUD_H,
    ])
    .fill(PALETTE.GHOST.ACCENT);
  container.addChild(spade);

  void headCx; void headCy;

  container.alpha = GHOST_DEFAULT_ALPHA;
  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

const GHOST_FACTORIES = {
  chalice: buildGhostPoison,
  sermonBook: buildGhostSermon,
  confessionLedger: buildGhostExtort,
  limeSpade: buildGhostBury,
};

export function createGhostPlaceholder(evidence) {
  const factory = GHOST_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createGhostPlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(GHOST_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}

// ---------------------------------------------------------------------------
// Scene composition layer (Happy Hills touchstone)
// ---------------------------------------------------------------------------
// Five factories implementing Part C of docs/art/scene-composition-spec.md:
//   * createConfessionRoomForeground — left-edge dark silhouette props (decor)
//   * createConfessionRoomSignage    — hanging cross plaque, top-left
//   * createLightingAccent           — soft warm candle bloom on wall
//   * createStainedWindowSilhouette  — implied window behind the Altar
//   * createVignette                 — 4-side edge-darken overlay
//
// All return PIXI Containers. None mutate Stage / world / app.stage — wiring
// is Foundation's lane. See scene-composition-spec.md §"Part C → integration
// checklist" for the exact addChild calls Foundation needs.
//
// Discipline: decor only, never on the interaction surface, never overlapping
// waypoint hitboxes or evidence pickup geometry.

/**
 * Single dark silhouette anchored at the left canvas edge — the Happy Hills
 * voyeur frame. ONE shape, pure black, cutting the canvas edge so the player
 * reads the scene as "peering through" something.
 *
 * Redo pass: previous version had three competing silhouettes (candelabra +
 * fallen book + altar-cloth triangle) cluttering the lower-left. Happy Hills
 * uses ONE silhouette set, not three. Collapsed to a single tall pillar-edge
 * silhouette + a low foreground prop, both reading as one unified darkening
 * of the left margin.
 *
 * All filled COMPOSITION.FOREGROUND_SILHOUETTE — the darkest tone in scene.
 * No internal detail — true black silhouette.
 * Container pivot = (0, 0); caller places at world origin.
 */
