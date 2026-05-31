// art/motion/AmbientMotion.js — base class for ambient-motion classes.
// Introduced per issue #2 Phase J.
//
// The three ambient-motion classes (CandleFlame, DustMotes, SmokeWisp) all
// share the same constructor preamble: `this.view = new Container(); this.view
// .label = ...; this.view.x = x; this.view.y = y;`. CandleFlame also has a
// scalar `_phase` advanced by `omega * dtMs` and wrapped at 2π. This base
// abstracts the duck-typed lifecycle: each subclass still owns its own sprite
// construction and per-frame draw mutations, but the constructor preamble and
// the phase-advance helper live here.
//
// Subclasses must implement `update(dtMs)`. CandleFlame uses `advancePhase`;
// DustMotes carries per-mote phase arrays (its own loop); SmokeWisp doesn't
// use a shared phase. Both still benefit from the shared constructor.

import { Container } from 'pixi.js';

export class AmbientMotion {
  /**
   * @param {object} opts
   * @param {number} opts.x — world-space x for the view container
   * @param {number} opts.y — world-space y for the view container
   * @param {string} opts.label — debug label for the PIXI Container
   */
  constructor({ x, y, label }) {
    this.view = new Container();
    this.view.label = label;
    this.view.x = x;
    this.view.y = y;
    this._phase = 0;
  }

  /**
   * Advance `this._phase` by `omegaRadPerMs * dtMs`, wrapping at 2π so the
   * float never drifts over a long session. Subclasses that use a scalar
   * phase (CandleFlame) call this once per update; subclasses with per-
   * element phase arrays (DustMotes) do their own inline wrap.
   */
  advancePhase(omegaRadPerMs, dtMs) {
    this._phase += omegaRadPerMs * dtMs;
    if (this._phase > Math.PI * 2) this._phase -= Math.PI * 2;
  }

  // Each subclass must implement update(dtMs). We throw to surface the
  // contract — duck typing would silently no-op if someone forgot.
  // eslint-disable-next-line no-unused-vars
  update(_dtMs) {
    throw new Error(`${this.constructor.name}.update() must be implemented`);
  }
}
