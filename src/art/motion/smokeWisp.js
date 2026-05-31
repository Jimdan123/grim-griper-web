// art/motion/smokeWisp.js — SmokeWisp ambient-motion class.
// Split from src/art/ambientMotion.js per issue #2 Phase J.

import { Graphics } from 'pixi.js';
import { AmbientMotion } from './AmbientMotion.js';

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

export class SmokeWisp extends AmbientMotion {
  /**
   * @param {object} opts
   * @param {number} opts.x — world x of the candle wick
   * @param {number} opts.y — world y of the candle wick (smoke origin)
   */
  constructor({ x, y }) {
    super({ x, y, label: 'smoke-wisp' });

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
