// AmbientNPC — passive parishioner in the chapel-bustle dispatch.
//
// Owner: #5 Stage + Art Lead. Created 2026-05-30 evening for the
// daytime-chapel-bustle deliverable ([[project-chapel-bustle-2026-05-30]]).
//
// Responsibilities:
//   * Wrap a pixel-art parishioner sprite (from createParishionerSpritePixelArt)
//     in a Container so per-NPC animation lives on `this.view` independent of
//     the underlying sprite's child structure.
//   * Tick a small variant-specific animation off the GameLoop's dtMs ticker:
//       - kneeler:       slow up/down bob (~5 s cycle) + subtle horizontal sway
//       - stander:       gentle horizontal sway (~4 s cycle) + faint alpha shift
//       - walker:        paces between (anchorX - 24) and (anchorX + 24) on ~7 s
//       - candlelighter: static + occasional 1-px head bob (slow 6 s cycle)
//
// Performance discipline (strict — chapel has 4-6 of these + bubbles + Aldric):
//   * No per-frame allocations. All math is on instance numeric fields.
//   * No PIXI graphics re-draws. Animation = container x / y / alpha mutation.
//   * Phase seeded per-instance so a row of NPCs doesn't pulse in sync.
//   * `update(dtMs)` is GameLoop-friendly — same signature as Player / Victim.
//
// Anti-slasher discipline:
//   * NPCs are alive. They kneel / stand / walk / light candles.
//   * No flinches, no panic, no "victim in distress" beats.
//   * No audio cues (no audio system yet anyway).
//
// API:
//   new AmbientNPC({ sprite, variant, x, floorY, scheduleSeed })
//   npc.update(dtMs)
//   npc.view  // PIXI.Container — caller mounts into world

import { Container } from 'pixi.js';

const TWO_PI = Math.PI * 2;

/**
 * Animation tuning by variant. Periods are in milliseconds. Amplitudes are in
 * logical pixels (matched to pixel-art register — 1-3 px moves; nothing flashy).
 */
const VARIANT_TUNING = {
  kneeler: {
    bobPeriodMs: 5000,
    bobAmplitudePx: 2,
    swayPeriodMs: 7000,
    swayAmplitudePx: 1,
    alphaPeriodMs: 0,
    alphaAmplitude: 0,
  },
  stander: {
    bobPeriodMs: 0,
    bobAmplitudePx: 0,
    swayPeriodMs: 4000,
    swayAmplitudePx: 1,
    alphaPeriodMs: 6000,
    alphaAmplitude: 0.06,
  },
  walker: {
    bobPeriodMs: 0,
    bobAmplitudePx: 0,
    // Walker uses paceAmplitude / pacePeriod instead of sway.
    pacePeriodMs: 7000,
    paceAmplitudePx: 24,
    alphaPeriodMs: 0,
    alphaAmplitude: 0,
  },
  candlelighter: {
    bobPeriodMs: 6000,
    bobAmplitudePx: 1,
    swayPeriodMs: 0,
    swayAmplitudePx: 0,
    alphaPeriodMs: 0,
    alphaAmplitude: 0,
  },
};

export class AmbientNPC {
  /**
   * @param {object} args
   * @param {PIXI.Container} args.sprite       sprite returned by createParishionerSpritePixelArt
   * @param {string} args.variant              'kneeler' | 'stander' | 'walker' | 'candlelighter'
   * @param {number} args.x                    anchor x (world-logical px)
   * @param {number} args.floorY               anchor y (world-logical px, floor line)
   * @param {number} [args.scheduleSeed]       0..1 seed used to phase-randomize the animation
   */
  constructor({ sprite, variant = 'stander', x = 0, floorY = 0, scheduleSeed = 0 }) {
    this.view = new Container();
    this.view.label = `ambient-npc-${variant}`;
    this._sprite = sprite;
    this.view.addChild(sprite);

    this._variant = variant;
    this._anchorX = x;
    this._anchorY = floorY;
    this.view.x = x;
    this.view.y = floorY;

    // Phase seed → 0..1, used to randomize the start phase of each oscillator.
    const seed = ((scheduleSeed % 1) + 1) % 1; // safe-mod into [0,1)
    this._phaseBob = seed * TWO_PI;
    this._phaseSway = (seed * 0.7) * TWO_PI;
    this._phaseAlpha = (seed * 0.4) * TWO_PI;
    this._phasePace = seed * TWO_PI;

    this._tuning = VARIANT_TUNING[variant] || VARIANT_TUNING.stander;
    this._baseAlpha = 1;

    // Walker bookkeeping — track facing so we can flip scale.x on direction
    // change. AmbientNPCs don't fight for sub-pixel — we flip once per half
    // pace cycle. We start facing right.
    this._lastPaceVelocity = 1;
  }

  /**
   * Public facade for the controlling system. AmbientNPCs are passive — no
   * external state mutates them; only the GameLoop drives `update`.
   */
  get variant() {
    return this._variant;
  }

  /** World-logical x of the NPC anchor (for the chatter bubble follow). */
  get anchorX() {
    return this._anchorX;
  }
  get anchorY() {
    return this._anchorY;
  }

  update(dtMs) {
    const tuning = this._tuning;

    // Convert dtMs to phase advance per oscillator. (dt / period) * 2π.
    if (tuning.bobPeriodMs > 0) {
      this._phaseBob += (dtMs / tuning.bobPeriodMs) * TWO_PI;
      if (this._phaseBob > TWO_PI) this._phaseBob -= TWO_PI;
    }
    if (tuning.swayPeriodMs > 0) {
      this._phaseSway += (dtMs / tuning.swayPeriodMs) * TWO_PI;
      if (this._phaseSway > TWO_PI) this._phaseSway -= TWO_PI;
    }
    if (tuning.alphaPeriodMs > 0) {
      this._phaseAlpha += (dtMs / tuning.alphaPeriodMs) * TWO_PI;
      if (this._phaseAlpha > TWO_PI) this._phaseAlpha -= TWO_PI;
    }
    if (this._variant === 'walker' && tuning.pacePeriodMs > 0) {
      this._phasePace += (dtMs / tuning.pacePeriodMs) * TWO_PI;
      if (this._phasePace > TWO_PI) this._phasePace -= TWO_PI;
    }

    // Apply.
    if (this._variant === 'walker') {
      // Pace: sin oscillator around anchorX. Facing flips on velocity sign.
      const sinPace = Math.sin(this._phasePace);
      const cosPace = Math.cos(this._phasePace);
      this.view.x = Math.round(this._anchorX + sinPace * tuning.paceAmplitudePx);
      // Velocity direction = cos(phase) sign.
      const wantFacing = cosPace >= 0 ? 1 : -1;
      if (wantFacing !== this._lastPaceVelocity) {
        this.view.scale.x = wantFacing;
        this._lastPaceVelocity = wantFacing;
      }
    } else {
      // Non-walker: horizontal sway.
      const swayPx = tuning.swayAmplitudePx > 0
        ? Math.sin(this._phaseSway) * tuning.swayAmplitudePx
        : 0;
      this.view.x = Math.round(this._anchorX + swayPx);
    }

    // Vertical bob (kneeler bow, candlelighter nod).
    if (tuning.bobAmplitudePx > 0) {
      // Use (1 - cos) / 2 so bob phase reads as a slow nod (0 at rest, +amp
      // at peak), not a sin that swings above and below anchor.
      const bobPhase = (1 - Math.cos(this._phaseBob)) / 2;
      this.view.y = this._anchorY + bobPhase * tuning.bobAmplitudePx;
    } else if (this.view.y !== this._anchorY) {
      this.view.y = this._anchorY;
    }

    // Alpha shift (stander only) — subtle breath.
    if (tuning.alphaPeriodMs > 0 && tuning.alphaAmplitude > 0) {
      const alphaShift = Math.sin(this._phaseAlpha) * tuning.alphaAmplitude;
      this.view.alpha = this._baseAlpha - Math.abs(alphaShift);
    }
  }
}
