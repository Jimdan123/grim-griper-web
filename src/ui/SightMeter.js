import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../art/placeholders/constants.js';

// Visual constants — locked here so #7 VP can find them on next pass.
const BAR_W = 180;
const BAR_H = 14;
const PAD_TOP = 20;
const PAD_RIGHT = 20;
const OUTLINE_PX = 1;

// Palette choices (documented for #7 VP):
//   FILL          = REAPER_EYE  (#9be7ff)  — pale-cyan family, matches the
//                                            Reaper's eye slit per spec.
//   EMPTY / TRACK = CHAPEL_WALL (#221a2a)  — "dark / unfilled wall color".
//   OUTLINE       = CHAPEL_FRAME (#0d0a12) — 1px chapel-trim line.
//   PULSE_DARK    = CHAPEL_ACCENT (#0f0a16) — fill colour during the
//                                             exhausted-pulse beat, so the
//                                             whole bar momentarily reads as
//                                             "off" without leaving the palette.
const COLOR_FILL = PALETTE.REAPER_EYE;
const COLOR_EMPTY = PALETTE.CHAPEL_WALL;
const COLOR_OUTLINE = PALETTE.CHAPEL_FRAME;
const COLOR_PULSE = PALETTE.CHAPEL_ACCENT;

// Animation timings.
const EXHAUST_PULSE_MS = 400;
// Subtle "full" saturation bump: bar alpha nudges up when budget is at cap.
// Tone discipline: no glow, just a 0.05 alpha lift so a full meter reads
// fractionally crisper than a draining one.
const FULL_ALPHA = 1.0;
const NORMAL_ALPHA = 0.95;

export class SightMeter {
  constructor() {
    this.view = new Container();
    this.view.label = 'sight-meter';

    // Track (outline + empty channel). Drawn once.
    this._track = new Graphics();
    this._track
      .rect(0, 0, BAR_W, BAR_H)
      .fill(COLOR_EMPTY)
      .stroke({ width: OUTLINE_PX, color: COLOR_OUTLINE, alignment: 0 });
    this.view.addChild(this._track);

    // Fill bar. Re-drawn on budget change.
    this._fill = new Graphics();
    this.view.addChild(this._fill);

    // State.
    this._currentMs = 0;
    this._capacityMs = 1;
    this._ratio = 0;
    this._wasEmpty = false;
    this._pulseRemainingMs = 0;

    // Re-anchor on window resize. Bound handler kept so we can unbind in destroy().
    this._onWindowResize = () => this._anchor();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onWindowResize);
    }
    this._anchor();
    this._redrawFill();
  }

  // Pushed every frame from main.js with the latest SightBudget reading.
  setSightBudget(currentMs, capacityMs) {
    const cap = capacityMs > 0 ? capacityMs : 1;
    const cur = Math.max(0, Math.min(currentMs, cap));
    const ratio = cur / cap;

    // Trigger exhausted-pulse on the falling edge to zero.
    if (cur === 0 && !this._wasEmpty) {
      this._pulseRemainingMs = EXHAUST_PULSE_MS;
    }
    this._wasEmpty = cur === 0;

    this._currentMs = cur;
    this._capacityMs = cap;
    this._ratio = ratio;
    this._redrawFill();
  }

  // Per-frame tick for the exhausted-pulse easing. No-op when no pulse active.
  update(dtMs) {
    if (this._pulseRemainingMs <= 0) return;
    this._pulseRemainingMs = Math.max(0, this._pulseRemainingMs - dtMs);
    this._redrawFill();
  }

  // Optional explicit resize hook, mirrors the window listener. Either path
  // works; main.js may call this if it owns its own resize bus.
  resize(_viewW, _viewH) {
    this._anchor();
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onWindowResize);
    }
    this.view.destroy({ children: true });
  }

  // --- internals -----------------------------------------------------------

  _anchor() {
    const w =
      typeof window !== 'undefined' && window.innerWidth
        ? window.innerWidth
        : 1280;
    this.view.x = Math.round(w - PAD_RIGHT - BAR_W);
    this.view.y = PAD_TOP;
  }

  _redrawFill() {
    this._fill.clear();

    // 1 px inset so the fill sits inside the outline.
    const innerX = OUTLINE_PX;
    const innerY = OUTLINE_PX;
    const innerW = BAR_W - OUTLINE_PX * 2;
    const innerH = BAR_H - OUTLINE_PX * 2;
    const fillW = Math.round(innerW * this._ratio);
    if (fillW <= 0 && this._pulseRemainingMs <= 0) return;

    // Exhausted pulse: ease the fill colour toward the dark pulse tone over
    // EXHAUST_PULSE_MS so the empty bar briefly "blinks darker" to signal the
    // forced OFF. After the pulse the track's empty colour reads through.
    let color = COLOR_FILL;
    let alpha = this._ratio >= 1 ? FULL_ALPHA : NORMAL_ALPHA;
    let drawW = fillW;

    if (this._pulseRemainingMs > 0) {
      color = COLOR_PULSE;
      // Pulse covers the full bar interior so the dim flash is unambiguous.
      drawW = innerW;
      // easeOutQuad on alpha so the pulse fades rather than hard-cuts.
      const t = this._pulseRemainingMs / EXHAUST_PULSE_MS;
      alpha = 0.85 * t;
      if (drawW <= 0) return;
    }

    this._fill.rect(innerX, innerY, drawW, innerH).fill({ color, alpha });
  }
}
