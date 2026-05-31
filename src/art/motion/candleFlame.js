// art/motion/candleFlame.js — CandleFlame ambient-motion class.
// Split from src/art/ambientMotion.js per issue #2 Phase J.

import { Graphics } from 'pixi.js';
import { PALETTE } from '../placeholders/constants.js';
import { AmbientMotion } from './AmbientMotion.js';

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

export class CandleFlame extends AmbientMotion {
  /**
   * @param {object} opts
   * @param {number} opts.x — world-space x for the flame center
   * @param {number} opts.y — world-space y for the flame center (top of candle)
   * @param {number} [opts.radius=4] — flame outer radius in logical px
   * @param {number} [opts.phaseRad] — initial phase in radians (random if omitted)
   */
  constructor({ x, y, radius = 4, phaseRad = Math.random() * Math.PI * 2 }) {
    super({ x, y, label: 'candle-flame' });

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
    this.advancePhase(FLAME_OMEGA_RAD_PER_MS, dtMs);

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
