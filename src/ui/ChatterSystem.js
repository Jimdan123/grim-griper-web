// ChatterSystem — pool of pixel-art speech bubbles + scheduler.
//
// Owner: #5 Stage + Art Lead. Created 2026-05-30 evening for the
// chapel-bustle dispatch ([[project-chapel-bustle-2026-05-30]]). Mounts on
// `app.stage` (NOT `world`) so SightFX's ColorMatrixFilter doesn't desaturate
// the bubbles — they should stay legible in Reaper Sight ON state.
//
// API:
//   const chatter = new ChatterScheduler({ npcs, world, layer, lines });
//   chatter.update(dtMs)  // tick the scheduler + pooled bubble fade timelines
//
// Pooled to avoid per-frame allocations:
//   * 5 ChatterBubble instances pre-built at construction; reused on each
//     spawn. Inactive bubbles sit invisible at (-9999, -9999).
//
// Scheduler:
//   * Every ~4-8 s (randomized window), pick a random idle NPC + a random
//     unused chatter line; pick an unused bubble from the pool; fire it.
//   * Each bubble: fade-in (0.5 s) → hold (3 s) → fade-out (0.5 s).
//   * Bubbles follow their bound NPC's anchor x (NOT live x — the NPC's sway
//     /pace would jitter the bubble. Anchor is fixed during the bubble life).
//
// Anti-slasher discipline:
//   * Lines authored as anonymous-pilgrim mundane life (harvest, prayer,
//     gratitude). NO victim-distress. NO "help me father" lines.
//   * Cream-on-stone pixel-art register — soft, not stark.
//
// Discipline:
//   * No facial detail on NPCs; bubble text carries the social register.
//   * Bubbles render in app.stage (screen-space), so the world→screen position
//     conversion happens each frame on active bubbles.

import { Container, Graphics, Text } from 'pixi.js';
import { PIXEL_PALETTE } from '../art/pixelPalette/constants.js';

// Tuning.
const POOL_SIZE = 5;
const FADE_IN_MS = 500;
const HOLD_MS = 3000;
const FADE_OUT_MS = 500;
const BUBBLE_LIFETIME_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;
const SPAWN_MIN_MS = 4000;
const SPAWN_MAX_MS = 8000;

// Curated chatter lines — 10 anonymous-pilgrim petitions / news / gratitude
// fragments. Medieval-pilgrim register, restrained. Some quiet petitions,
// some mundane news, some gratitude. The horror is that these people TRUST
// Aldric. Verbatim list (so Team Lead can arbitrate tonal fit):
export const DEFAULT_CHATTER_LINES = Object.freeze([
  '...the harvest fails again...',
  '...Father Aldric heard my mother\'s last words...',
  '...bless this seed of mine...',
  '...the priest is a saint, surely...',
  '...I came for confession at dawn...',
  '...my fever has not broken...',
  '...they say the cardinal will come at Lent...',
  '...peace be unto you, brother...',
  '...amen...',
  '...I owe him so much...',
]);

// ---------------------------------------------------------------------------
// ChatterBubble — single pooled bubble instance.
// ---------------------------------------------------------------------------
class ChatterBubble {
  constructor() {
    this.view = new Container();
    this.view.label = 'chatter-bubble';

    // Bubble background (1px outline + cream fill). Sized once, drawn once;
    // we don't resize per-line — Text inherits a max-width layout via
    // wordWrap, and the bubble background is sized to fit the widest line.
    this._bubbleW = 168;
    this._bubbleH = 24;
    this._bg = new Graphics();
    this._drawBubble();
    this.view.addChild(this._bg);

    // Text inside. Pixel-art register monospace, 10px font.
    this._text = new Text({
      text: '',
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: PIXEL_PALETTE.BUBBLE_TEXT,
        align: 'left',
        wordWrap: true,
        wordWrapWidth: this._bubbleW - 12,
      },
    });
    this._text.x = 6;
    this._text.y = 6;
    this.view.addChild(this._text);

    this.view.visible = false;
    this.view.alpha = 0;
    this.view.x = -9999;
    this.view.y = -9999;

    this.active = false;
    this._elapsedMs = 0;
    this._npc = null;
    this._world = null;
  }

  _drawBubble() {
    const g = this._bg;
    const W = this._bubbleW;
    const H = this._bubbleH;
    g.clear();
    // 1 px outline.
    g.rect(0, 0, W, H).fill(PIXEL_PALETTE.BUBBLE_OUTLINE);
    // Cream fill inset 1px.
    g.rect(1, 1, W - 2, H - 2).fill(PIXEL_PALETTE.BUBBLE_FILL);
    // Bubble tail (downward triangle): 4×3 px notch at bottom-left quarter,
    // drawn as three stepped 1px rects pointing down.
    g.rect(16, H, 4, 1).fill(PIXEL_PALETTE.BUBBLE_OUTLINE);
    g.rect(17, H + 1, 2, 1).fill(PIXEL_PALETTE.BUBBLE_OUTLINE);
    g.rect(17, H, 2, 1).fill(PIXEL_PALETTE.BUBBLE_FILL);
  }

  /**
   * Begin showing this bubble bound to the given NPC with the given text.
   * @param {AmbientNPC} npc
   * @param {string} text
   * @param {PIXI.Container} world  the scaled world container (for toGlobal)
   */
  spawn(npc, text, world) {
    this._npc = npc;
    this._world = world;
    this._text.text = text;
    this._elapsedMs = 0;
    this.active = true;
    this.view.visible = true;
    this.view.alpha = 0;
    this._updateScreenPosition();
  }

  _updateScreenPosition() {
    if (!this._npc || !this._world) return;
    // Anchor above the NPC's head — anchorY is feet line, NPC height ~64,
    // so bubble bottom sits at anchorY - 80 (above head with margin). Use
    // anchorX (fixed) NOT live view.x so the bubble doesn't jitter with sway.
    const wx = this._npc.anchorX;
    const wy = this._npc.anchorY - 80;
    const screenPt = this._world.toGlobal({ x: wx, y: wy });
    // Center the bubble horizontally on the NPC.
    this.view.x = Math.round(screenPt.x - this._bubbleW / 2);
    this.view.y = Math.round(screenPt.y - this._bubbleH);
  }

  update(dtMs) {
    if (!this.active) return;
    this._elapsedMs += dtMs;

    // Track NPC position each frame (world might be panned/scaled).
    this._updateScreenPosition();

    // Fade timeline.
    let alpha;
    if (this._elapsedMs < FADE_IN_MS) {
      alpha = this._elapsedMs / FADE_IN_MS;
    } else if (this._elapsedMs < FADE_IN_MS + HOLD_MS) {
      alpha = 1;
    } else if (this._elapsedMs < BUBBLE_LIFETIME_MS) {
      const fadeOutElapsed = this._elapsedMs - FADE_IN_MS - HOLD_MS;
      alpha = 1 - fadeOutElapsed / FADE_OUT_MS;
    } else {
      // Done — return to pool.
      this.active = false;
      this.view.visible = false;
      this.view.alpha = 0;
      this._npc = null;
      this._world = null;
      this.view.x = -9999;
      this.view.y = -9999;
      return;
    }
    this.view.alpha = alpha;
  }
}

// ---------------------------------------------------------------------------
// ChatterScheduler — picks NPCs + lines, fires pooled bubbles.
// ---------------------------------------------------------------------------
export class ChatterScheduler {
  /**
   * @param {object} args
   * @param {AmbientNPC[]} args.npcs            NPC instances to attach bubbles to
   * @param {PIXI.Container} args.world         scaled world container (for toGlobal math)
   * @param {PIXI.Container} args.layer         screen-space layer to mount bubbles into (typically app.stage)
   * @param {string[]} [args.lines]             chatter lines (defaults to DEFAULT_CHATTER_LINES)
   * @param {number} [args.spawnDelayMs]        initial spawn delay; defaults to a small grace so chatter doesn't fire on boot frame
   */
  constructor({ npcs, world, layer, lines = DEFAULT_CHATTER_LINES, spawnDelayMs = 2000 }) {
    this._npcs = npcs;
    this._world = world;
    this._lines = lines;

    // Build the pool — fixed size, no per-spawn allocation.
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const b = new ChatterBubble();
      this._pool.push(b);
      layer.addChild(b.view);
    }

    this._timeToNextSpawnMs = spawnDelayMs;
  }

  _pickIdleBubble() {
    for (let i = 0; i < this._pool.length; i++) {
      if (!this._pool[i].active) return this._pool[i];
    }
    return null;
  }

  _pickRandomNPC() {
    if (this._npcs.length === 0) return null;
    return this._npcs[Math.floor(Math.random() * this._npcs.length)];
  }

  _pickRandomLine() {
    if (this._lines.length === 0) return null;
    return this._lines[Math.floor(Math.random() * this._lines.length)];
  }

  _scheduleNextSpawn() {
    this._timeToNextSpawnMs = SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS);
  }

  update(dtMs) {
    // Tick all bubbles every frame (pool — most will be inactive no-ops).
    for (let i = 0; i < this._pool.length; i++) {
      this._pool[i].update(dtMs);
    }

    // Scheduler.
    this._timeToNextSpawnMs -= dtMs;
    if (this._timeToNextSpawnMs <= 0) {
      const bubble = this._pickIdleBubble();
      const npc = this._pickRandomNPC();
      const line = this._pickRandomLine();
      if (bubble && npc && line) {
        bubble.spawn(npc, line, this._world);
      }
      // Reschedule even if we couldn't fire (pool exhausted or no NPCs) so
      // we retry in 4-8 s — keeps the chapel feeling socially alive.
      this._scheduleNextSpawn();
    }
  }
}
