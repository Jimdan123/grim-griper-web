import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../art/placeholders.js';

// FearBar — horizontal Phase-2 stat indicator pinned to top-center of the
// screen. 0..100 scalar; FEAR=100 triggers SCORE phase + EndScreen.
//
// Anti-slasher discipline (touchstone: spectral, restrained, not slasher):
//   fill color is a warm RED-ORANGE (0xc84a30) — sits in the chapel-warm
//   family alongside candle bloom and altar palette. NOT a bright slasher
//   crimson. Matches the dispatch suggestion. The tick mark at 50% is
//   the fearBucketThreshold reference (rendered, unlabeled — per dispatch).

const BAR_W = 400;
const BAR_H = 24;
const PAD_TOP = 32;
const OUTLINE_PX = 1;

const COLOR_FRAME = PALETTE.CHAPEL_FRAME;     // 0x0d0a12 — chapel trim
const COLOR_TRACK = PALETTE.CHAPEL_WALL;      // 0x221a2a — dark unfilled
const COLOR_FILL = 0xc84a30;                  // warm red-orange — fits chapel
const COLOR_TICK = PALETTE.CHAPEL_WALL_TRIM;  // 0x352a40 — subtle bucket marker

const TRACK_BG_ALPHA = 0.55;
const FILL_ALPHA = 0.95;
const TICK_ALPHA = 0.6;
const TICK_W = 2;

export class FearBar {
  constructor() {
    this.view = new Container();
    this.view.label = 'fear-bar';

    // Track (frame + dark fill background + bucket tick). Drawn once.
    this._track = new Graphics();
    this._track
      .rect(0, 0, BAR_W, BAR_H)
      .fill({ color: COLOR_TRACK, alpha: TRACK_BG_ALPHA })
      .stroke({ width: OUTLINE_PX, color: COLOR_FRAME, alignment: 0 });
    // 50% bucket tick — fearBucketThreshold reference. Slice 4 reads it from
    // stageData and may move it; slice 3 hardcodes 0.5 (default threshold=50,
    // max=100) since main.js doesn't yet pass it through.
    const tickX = Math.round(BAR_W * 0.5) - Math.round(TICK_W / 2);
    this._track
      .rect(tickX, OUTLINE_PX, TICK_W, BAR_H - OUTLINE_PX * 2)
      .fill({ color: COLOR_TICK, alpha: TICK_ALPHA });
    this.view.addChild(this._track);

    // Fill bar. Re-drawn on setFear() when value changes.
    this._fill = new Graphics();
    this.view.addChild(this._fill);

    this._currentFear = 0;
    this._maxFear = 100;

    this._onWindowResize = () => this._anchor();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onWindowResize);
    }
    this._anchor();
    this._redrawFill();
  }

  // value: 0..100. Short-circuits when value hasn't changed.
  setFear(value) {
    const cur = Math.max(0, Math.min(value, this._maxFear));
    if (cur === this._currentFear) return;
    this._currentFear = cur;
    this._redrawFill();
  }

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
    this.view.x = Math.round((w - BAR_W) / 2);
    this.view.y = PAD_TOP;
  }

  _redrawFill() {
    this._fill.clear();
    const ratio = this._currentFear / this._maxFear;
    const innerX = OUTLINE_PX;
    const innerY = OUTLINE_PX;
    const innerW = BAR_W - OUTLINE_PX * 2;
    const innerH = BAR_H - OUTLINE_PX * 2;
    const fillW = Math.round(innerW * ratio);
    if (fillW <= 0) return;
    this._fill.rect(innerX, innerY, fillW, innerH).fill({
      color: COLOR_FILL,
      alpha: FILL_ALPHA,
    });
  }
}
