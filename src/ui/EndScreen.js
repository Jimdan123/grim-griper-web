import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE } from '../art/placeholders/constants.js';

// EndScreen — full-screen overlay shown when FEAR=100 ("SOUL CLAIMED") or
// when FLEEING/CALLING_FOR_HELP completes ("SOUL ESCAPED"). Slice 3 only
// wires the FEAR=100 path, so show() always renders "SOUL CLAIMED" unless
// callers pass an explicit outcome. Reserved for slice 4: outcome='escaped'.
//
// Tone discipline (touchstone: spectral, restrained, NOT slasher):
//   - Title "SOUL CLAIMED" in warm serif, ~36px, cream — funereal, not
//     celebratory. NOT "KILL CONFIRMED" register.
//   - Background overlay alpha 0.85 over PALETTE.CHAPEL_HORIZON (the darkest
//     chapel tone) — no blood-red wash.
//   - Star icons drawn from straight chapel-warm gold (PALETTE.EVIDENCE_GLOW)
//     so the reward read is "altar candle warmth" not "victory burst".
//   - Buttons are text-with-subtle-frame; no glowing CTAs.
//
// Animation: fade in over FADE_IN_MS via a per-frame update(dtMs). EndScreen
// is added to GameLoop in main.js so it ticks like other UI components.

const FADE_IN_MS = 400;
const FADE_OUT_MS = 250;

const TITLE_FONT_PX = 36;
const SUBTITLE_FONT_PX = 14;
const SCORE_FONT_PX = 28;
const ROW_FONT_PX = 16;
const BUTTON_FONT_PX = 18;

const COLOR_TITLE = 0xe8dfc4;          // warm cream — matches StageTitleCard
const COLOR_SUBTITLE = 0xbfb59a;       // dimmer cream
const COLOR_ROW = 0xc9b48a;            // parchment — matches PROPS.PARCHMENT
const COLOR_BUTTON = 0xe8dfc4;
const COLOR_BUTTON_FRAME = PALETTE.CHAPEL_WALL_TRIM;
const COLOR_STAR_FILLED = PALETTE.EVIDENCE_GLOW;   // 0xffd24a — chapel-warm gold
const COLOR_STAR_HOLLOW = PALETTE.CHAPEL_WALL_TRIM;
const COLOR_BG = PALETTE.CHAPEL_HORIZON; // 0x06040a — darkest chapel tone
const COLOR_CARD_FRAME = PALETTE.CHAPEL_FRAME;

const CARD_W = 540;
const CARD_H = 540;
const CARD_PAD = 32;
const BG_ALPHA = 0.85;

const STAR_R_OUTER = 14;
const STAR_R_INNER = 6;
const STAR_GAP = 12;

const BUTTON_W = 200;
const BUTTON_H = 44;
const BUTTON_GAP = 16;

const BREAKDOWN_LABELS = {
  fearMaxedBonus: 'Soul claimed bonus',
  timeBonus: 'Swift judgment',
  hauntsUsedBonus: 'Haunts deployed',
  correctHits: 'True hauntings',
  reactionsPenalty: 'Reactions provoked',
};
const BREAKDOWN_ORDER = [
  'fearMaxedBonus',
  'timeBonus',
  'hauntsUsedBonus',
  'correctHits',
  'reactionsPenalty',
];

export class EndScreen {
  constructor() {
    this.view = new Container();
    this.view.label = 'end-screen';
    this.view.visible = false;
    this.view.alpha = 0;
    // The overlay swallows pointer events even when buttons aren't directly
    // under the click — prevents stray clicks from leaking to world / radial.
    this.view.eventMode = 'static';

    // Full-screen dim background. Sized on resize / show().
    this._bg = new Graphics();
    this.view.addChild(this._bg);

    // Centered card container — anchored at (0,0); we translate this to
    // (screenW - CARD_W)/2, (screenH - CARD_H)/2.
    this._card = new Container();
    this.view.addChild(this._card);

    // Card frame.
    this._cardFrame = new Graphics();
    this._cardFrame
      .rect(0, 0, CARD_W, CARD_H)
      .fill({ color: PALETTE.CHAPEL_WALL, alpha: 0.95 })
      .stroke({ width: 2, color: COLOR_CARD_FRAME, alignment: 0 });
    this._card.addChild(this._cardFrame);

    // Title — "SOUL CLAIMED" / "SOUL ESCAPED".
    this._title = new Text({
      text: 'SOUL CLAIMED',
      style: {
        fontFamily: 'serif',
        fontSize: TITLE_FONT_PX,
        fontWeight: '600',
        fill: COLOR_TITLE,
        align: 'center',
        letterSpacing: 3,
      },
    });
    this._title.anchor.set(0.5, 0);
    this._title.x = CARD_W / 2;
    this._title.y = CARD_PAD;
    this._card.addChild(this._title);

    // Subtitle (stage / victim — slice 3 leaves blank or "Confession Room").
    this._subtitle = new Text({
      text: '',
      style: {
        fontFamily: 'serif',
        fontSize: SUBTITLE_FONT_PX,
        fontStyle: 'italic',
        fill: COLOR_SUBTITLE,
        align: 'center',
      },
    });
    this._subtitle.anchor.set(0.5, 0);
    this._subtitle.x = CARD_W / 2;
    this._subtitle.y = CARD_PAD + TITLE_FONT_PX + 6;
    this._card.addChild(this._subtitle);

    // Star row — three slots, filled/hollow per `stars` value.
    this._stars = new Container();
    this._stars.x = CARD_W / 2;
    this._stars.y = CARD_PAD + TITLE_FONT_PX + 40;
    this._card.addChild(this._stars);
    this._starGraphics = [];
    for (let i = 0; i < 3; i++) {
      const g = new Graphics();
      g.x = (i - 1) * (STAR_R_OUTER * 2 + STAR_GAP);
      this._stars.addChild(g);
      this._starGraphics.push(g);
    }

    // Score readout — large monospace.
    this._score = new Text({
      text: '0',
      style: {
        fontFamily: 'monospace',
        fontSize: SCORE_FONT_PX,
        fill: COLOR_TITLE,
        align: 'center',
      },
    });
    this._score.anchor.set(0.5, 0);
    this._score.x = CARD_W / 2;
    this._score.y = CARD_PAD + TITLE_FONT_PX + 80;
    this._card.addChild(this._score);

    // Breakdown rows (pre-allocated; one Text per known key).
    this._breakdownRows = {};
    let rowY = CARD_PAD + TITLE_FONT_PX + 130;
    for (const key of BREAKDOWN_ORDER) {
      const row = new Text({
        text: `${BREAKDOWN_LABELS[key]} ........ 0`,
        style: {
          fontFamily: 'monospace',
          fontSize: ROW_FONT_PX,
          fill: COLOR_ROW,
          align: 'left',
        },
      });
      row.x = CARD_PAD;
      row.y = rowY;
      this._card.addChild(row);
      this._breakdownRows[key] = row;
      rowY += ROW_FONT_PX + 6;
    }

    // Buttons — RETRY + RETURN TO MENU, side-by-side at the bottom of card.
    const btnY = CARD_H - CARD_PAD - BUTTON_H;
    const btnsTotalW = BUTTON_W * 2 + BUTTON_GAP;
    const btnsStartX = (CARD_W - btnsTotalW) / 2;
    this._retryBtn = this._buildButton('RETRY');
    this._retryBtn.x = btnsStartX;
    this._retryBtn.y = btnY;
    this._card.addChild(this._retryBtn);

    this._returnBtn = this._buildButton('RETURN TO MENU');
    this._returnBtn.x = btnsStartX + BUTTON_W + BUTTON_GAP;
    this._returnBtn.y = btnY;
    this._card.addChild(this._returnBtn);

    // State.
    this._fadeDir = 0;          // -1 fade-out, 0 idle, +1 fade-in
    this._fadeMs = 0;
    this._onRetry = null;
    this._onReturn = null;

    this._retryBtn.on('pointertap', () => {
      if (typeof this._onRetry === 'function') this._onRetry();
    });
    this._returnBtn.on('pointertap', () => {
      if (typeof this._onReturn === 'function') this._onReturn();
    });

    this._onWindowResize = () => this._anchor();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onWindowResize);
    }
    this._anchor();
    this._redrawStars(0);
  }

  // payload: { score, breakdown, stars, outcome? }
  // outcome: 'claimed' (default) | 'escaped' (slice 4 wires the FLEEING path)
  show({ score = 0, breakdown = {}, stars = 0, outcome = 'claimed', subtitle = '' } = {}) {
    this._title.text = outcome === 'escaped' ? 'SOUL ESCAPED' : 'SOUL CLAIMED';
    this._subtitle.text = subtitle;
    this._score.text = String(Math.round(score));
    for (const key of BREAKDOWN_ORDER) {
      const v = breakdown[key];
      const num = typeof v === 'number' ? Math.round(v) : 0;
      // Dot-leader for legible monospace row.
      const label = BREAKDOWN_LABELS[key];
      const dots = '.'.repeat(Math.max(2, 38 - label.length - String(num).length));
      this._breakdownRows[key].text = `${label} ${dots} ${num}`;
    }
    this._redrawStars(stars);

    this._anchor();
    this.view.visible = true;
    this._fadeDir = 1;
    this._fadeMs = 0;
  }

  hide() {
    this._fadeDir = -1;
    this._fadeMs = 0;
  }

  setOnRetry(callback) {
    this._onRetry = callback;
  }

  setOnReturn(callback) {
    this._onReturn = callback;
  }

  update(dtMs) {
    if (this._fadeDir === 0) return;
    this._fadeMs += dtMs;
    if (this._fadeDir > 0) {
      const t = Math.min(1, this._fadeMs / FADE_IN_MS);
      this.view.alpha = t;
      if (t >= 1) this._fadeDir = 0;
    } else {
      const t = Math.min(1, this._fadeMs / FADE_OUT_MS);
      this.view.alpha = 1 - t;
      if (t >= 1) {
        this.view.visible = false;
        this._fadeDir = 0;
      }
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onWindowResize);
    }
    this.view.destroy({ children: true });
  }

  // --- internals -----------------------------------------------------------

  _buildButton(label) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const frame = new Graphics();
    frame
      .rect(0, 0, BUTTON_W, BUTTON_H)
      .fill({ color: PALETTE.CHAPEL_WALL, alpha: 0.9 })
      .stroke({ width: 1, color: COLOR_BUTTON_FRAME, alignment: 0 });
    btn.addChild(frame);

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'serif',
        fontSize: BUTTON_FONT_PX,
        fill: COLOR_BUTTON,
        align: 'center',
        letterSpacing: 1,
      },
    });
    text.anchor.set(0.5, 0.5);
    text.x = BUTTON_W / 2;
    text.y = BUTTON_H / 2;
    btn.addChild(text);

    btn.hitArea = { contains: (x, y) => x >= 0 && y >= 0 && x <= BUTTON_W && y <= BUTTON_H };
    return btn;
  }

  _anchor() {
    const w =
      typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280;
    const h =
      typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 720;

    this._bg.clear();
    this._bg.rect(0, 0, w, h).fill({ color: COLOR_BG, alpha: BG_ALPHA });

    this._card.x = Math.round((w - CARD_W) / 2);
    this._card.y = Math.round((h - CARD_H) / 2);
  }

  _redrawStars(count) {
    const filled = Math.max(0, Math.min(3, Math.round(count)));
    for (let i = 0; i < 3; i++) {
      const g = this._starGraphics[i];
      const isFilled = i < filled;
      g.clear();
      this._drawStar(g, isFilled ? COLOR_STAR_FILLED : COLOR_STAR_HOLLOW, isFilled ? 1 : 0.5);
    }
  }

  // Five-pointed star drawn at local origin via alternating outer/inner radii.
  _drawStar(g, color, alpha) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? STAR_R_OUTER : STAR_R_INNER;
      // Start at -PI/2 so the top point faces up (PIXI y-down convention).
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    g.poly(points).fill({ color, alpha });
  }
}
