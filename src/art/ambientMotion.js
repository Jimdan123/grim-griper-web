// Ambient motion — breathing chapel (ticket #21).
//
// Three small classes, each shaped {view, update(dtMs)} so main.js can mount
// `view` into the world Container and register `update` with the GameLoop.
//
// Rules:
//   * No setTimeout / no setInterval — everything is dtMs-driven from the
//     PIXI ticker via GameLoop.
//   * No per-frame allocations — sprites/graphics are constructed once in the
//     constructor and only their alpha/scale/y mutate per frame.
//   * Subtle motion only. No strobing. Anti-slasher discipline: this is the
//     chapel breathing, not a horror set-piece.
//
// All three live in the `world` Container so SightFX's ColorMatrixFilter
// desaturates them when Reaper Sight is ON, matching the static props.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from './placeholders/constants.js';

// ---------------------------------------------------------------------------
// CandleFlame — small warm glow that breathes (alpha + slight scale oscillation).
// ---------------------------------------------------------------------------
// One Graphics primitive per flame (an ellipse fill). Phase is randomized per
// flame at construction so a row of candles doesn't pulse in sync.
//
// Tuning:
//   * Base alpha ~0.65, oscillates +/- 0.18 — readable but never strobe.
//   * Scale oscillates +/- 0.08 on a slow sin curve (~1.4Hz typical).
//   * Two stacked ellipses (warm outer + warm core) for a soft bloom.

const FLAME_BASE_ALPHA = 0.68;
const FLAME_ALPHA_AMPLITUDE = 0.18;
const FLAME_BASE_SCALE = 1.0;
const FLAME_SCALE_AMPLITUDE = 0.08;
// Angular speed in radians per ms. ~0.0085 rad/ms ≈ 1.35Hz — a slow breath.
const FLAME_OMEGA_RAD_PER_MS = 0.0085;

export class CandleFlame {
  /**
   * @param {object} opts
   * @param {number} opts.x — world-space x for the flame center
   * @param {number} opts.y — world-space y for the flame center (top of candle)
   * @param {number} [opts.radius=4] — flame outer radius in logical px
   * @param {number} [opts.phaseRad] — initial phase in radians (random if omitted)
   */
  constructor({ x, y, radius = 4, phaseRad = Math.random() * Math.PI * 2 }) {
    this.view = new Container();
    this.view.label = 'candle-flame';
    this.view.x = x;
    this.view.y = y;

    // Outer warm bloom — slightly larger, dimmer.
    this._outer = new Graphics();
    this._outer
      .ellipse(0, 0, radius * 1.6, radius * 2.2)
      .fill(PALETTE.COMPOSITION.CANDLE_WARM);
    this._outer.alpha = 0.45;
    this.view.addChild(this._outer);

    // Inner core — brighter cream-gold, smaller.
    this._core = new Graphics();
    this._core
      .ellipse(0, 0, radius * 0.8, radius * 1.4)
      .fill(PALETTE.COMPOSITION.CANDLE_WARM_CORE);
    this._core.alpha = FLAME_BASE_ALPHA;
    this.view.addChild(this._core);

    this._phase = phaseRad;
  }

  update(dtMs) {
    this._phase += FLAME_OMEGA_RAD_PER_MS * dtMs;
    // Keep phase bounded so floats don't drift over long sessions.
    if (this._phase > Math.PI * 2) this._phase -= Math.PI * 2;

    const sinP = Math.sin(this._phase);
    // Add a second harmonic so the flicker doesn't read as a metronome.
    const sin2P = Math.sin(this._phase * 2.3);

    const alpha = FLAME_BASE_ALPHA + FLAME_ALPHA_AMPLITUDE * sinP * 0.7
      + FLAME_ALPHA_AMPLITUDE * 0.3 * sin2P;
    this._core.alpha = alpha;
    this._outer.alpha = 0.30 + 0.20 * (sinP * 0.5 + 0.5);

    const scale = FLAME_BASE_SCALE + FLAME_SCALE_AMPLITUDE * sinP * 0.75
      + FLAME_SCALE_AMPLITUDE * 0.25 * sin2P;
    this.view.scale.set(scale, scale);
  }
}

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

export class DustMotes {
  /**
   * @param {object} opts
   * @param {number} opts.x — left edge of light shaft (world space)
   * @param {number} opts.y — top edge of light shaft (world space)
   * @param {number} opts.width — shaft width
   * @param {number} opts.height — shaft height (mote wraps at y + height)
   * @param {number} [opts.count=MOTE_COUNT_DEFAULT]
   */
  constructor({ x, y, width, height, count = MOTE_COUNT_DEFAULT }) {
    this.view = new Container();
    this.view.label = 'dust-motes';
    this.view.x = x;
    this.view.y = y;

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
      // Advance phase + position.
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

// ---------------------------------------------------------------------------
// SmokeWisp — single curl of smoke rising from a snuffed candle.
// ---------------------------------------------------------------------------
// One Container holds a small column of pre-allocated faint circles. Each
// "puff" has a lifecycle (rises, fades, then resets to the bottom). Phases
// are staggered so the column reads as a continuous wisp, not pulses.
//
// Total memory: SMOKE_PUFF_COUNT Graphics circles. No per-frame alloc.

const SMOKE_PUFF_COUNT = 6;
const SMOKE_RISE_HEIGHT = 56;     // px the wisp travels before resetting
const SMOKE_RISE_SPEED = 0.030;   // px per ms — slow vertical rise
const SMOKE_BASE_RADIUS = 2.0;
const SMOKE_BASE_ALPHA = 0.45;

export class SmokeWisp {
  /**
   * @param {object} opts
   * @param {number} opts.x — world x of the candle wick
   * @param {number} opts.y — world y of the candle wick (smoke origin)
   */
  constructor({ x, y }) {
    this.view = new Container();
    this.view.label = 'smoke-wisp';
    this.view.x = x;
    this.view.y = y;

    this._py = new Float32Array(SMOKE_PUFF_COUNT);  // y offset (negative = up)
    this._sprites = [];

    for (let i = 0; i < SMOKE_PUFF_COUNT; i++) {
      const g = new Graphics();
      g.circle(0, 0, SMOKE_BASE_RADIUS).fill(0xbab0a8);
      g.alpha = 0;
      this.view.addChild(g);
      this._sprites.push(g);

      // Stagger initial y so the column reads continuous.
      this._py[i] = -(i / SMOKE_PUFF_COUNT) * SMOKE_RISE_HEIGHT;
    }
  }

  update(dtMs) {
    for (let i = 0; i < SMOKE_PUFF_COUNT; i++) {
      this._py[i] -= SMOKE_RISE_SPEED * dtMs;

      // Wrap when fully risen — reset to wick origin.
      if (this._py[i] < -SMOKE_RISE_HEIGHT) {
        this._py[i] = 0;
      }

      const g = this._sprites[i];
      g.y = this._py[i];

      // Distance from origin, 0..1.
      const t = -this._py[i] / SMOKE_RISE_HEIGHT;

      // Alpha rises from 0 at wick, peaks ~25% up, fades to 0 at top.
      // Subtle curve so the wisp dissolves rather than blinks out.
      const fadeIn = Math.min(t / 0.25, 1);
      const fadeOut = Math.max(0, 1 - (t - 0.25) / 0.75);
      g.alpha = SMOKE_BASE_ALPHA * fadeIn * fadeOut;

      // Slight horizontal drift — sin against y so puffs curl as they rise.
      g.x = Math.sin(t * Math.PI * 1.7) * 3;

      // Mild expansion as it rises — puffs spread.
      const s = 1 + t * 0.9;
      g.scale.set(s, s);
    }
  }
}
