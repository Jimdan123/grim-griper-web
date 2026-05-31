// art/motion/dustMotes.js — DustMotes ambient-motion class.
// Split from src/art/ambientMotion.js per issue #2 Phase J.

import { Graphics } from 'pixi.js';
import { AmbientMotion } from './AmbientMotion.js';

// ---------------------------------------------------------------------------
// DustMotes — pooled drifting circles in the stained-glass shaft.
// ---------------------------------------------------------------------------
// Pre-allocate N Graphics circles in a Container. Each mote tracks its own
// (x, y, vx, vy, swayPhase, swayOmega) in TypedArray-style parallel fields
// so per-frame we only mutate primitive numbers and the Graphics.position.
// No allocations per frame.
//
// Behavior:
//   * Slow downward drift (vy small, positive).
//   * Slight horizontal sway (sin against swayPhase).
//   * When mote exits the bottom of the shaft, wrap to top with a fresh
//     random x within the shaft.

const MOTE_COUNT_DEFAULT = 8;
const MOTE_RADIUS = 1.6;
const MOTE_ALPHA = 0.28;
const MOTE_VY_MIN = 0.012;        // px per ms — slow
const MOTE_VY_MAX = 0.028;
const MOTE_SWAY_AMPLITUDE = 6;    // px
const MOTE_SWAY_OMEGA_MIN = 0.0015;
const MOTE_SWAY_OMEGA_MAX = 0.0035;

export class DustMotes extends AmbientMotion {
  /**
   * @param {object} opts
   * @param {number} opts.x — left edge of light shaft (world space)
   * @param {number} opts.y — top edge of light shaft (world space)
   * @param {number} opts.width — shaft width
   * @param {number} opts.height — shaft height (mote wraps at y + height)
   * @param {number} [opts.count=MOTE_COUNT_DEFAULT]
   */
  constructor({ x, y, width, height, count = MOTE_COUNT_DEFAULT }) {
    super({ x, y, label: 'dust-motes' });

    this._shaftW = width;
    this._shaftH = height;
    this._count = count;

    // Parallel arrays for mote state — primitives only, zero per-frame alloc.
    this._mx = new Float32Array(count);
    this._my = new Float32Array(count);
    this._mvy = new Float32Array(count);
    this._sphase = new Float32Array(count);
    this._somega = new Float32Array(count);
    this._sx = new Float32Array(count);   // base x (sway is around this)

    // Sprites — one Graphics per mote, drawn once.
    this._sprites = [];
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      g.circle(0, 0, MOTE_RADIUS).fill(0xfff2c4);
      g.alpha = MOTE_ALPHA;
      this.view.addChild(g);
      this._sprites.push(g);

      // Spread initial y across the shaft height so they don't bunch.
      this._sx[i] = Math.random() * width;
      this._my[i] = Math.random() * height;
      this._mvy[i] = MOTE_VY_MIN + Math.random() * (MOTE_VY_MAX - MOTE_VY_MIN);
      this._sphase[i] = Math.random() * Math.PI * 2;
      this._somega[i] = MOTE_SWAY_OMEGA_MIN + Math.random() * (MOTE_SWAY_OMEGA_MAX - MOTE_SWAY_OMEGA_MIN);

      this._mx[i] = this._sx[i];
      g.x = this._mx[i];
      g.y = this._my[i];
    }
  }

  update(dtMs) {
    const H = this._shaftH;
    for (let i = 0; i < this._count; i++) {
      // Advance phase + position. Per-mote phase array can't use the base's
      // single-phase advancePhase helper; wrap inline.
      this._sphase[i] += this._somega[i] * dtMs;
      if (this._sphase[i] > Math.PI * 2) this._sphase[i] -= Math.PI * 2;

      this._my[i] += this._mvy[i] * dtMs;

      // Sway around base x using sin(phase).
      this._mx[i] = this._sx[i] + Math.sin(this._sphase[i]) * MOTE_SWAY_AMPLITUDE;

      // Wrap when leaving bottom.
      if (this._my[i] > H) {
        this._my[i] = 0;
        // Refresh base x within the shaft so wrap-arounds don't cluster.
        this._sx[i] = Math.random() * this._shaftW;
      }

      const g = this._sprites[i];
      g.x = this._mx[i];
      g.y = this._my[i];
    }
  }
}
