import { Container, Text } from 'pixi.js';

// Floating-text feedback for evidence collection (issue #18).
// User chose the "Floating text + counter" pass — this is the floating-text
// half. Sibling EvidenceCounter is the counter half. Both are mounted
// screen-space on app.stage so the SightFX ColorMatrixFilter on world doesn't
// desaturate them.
//
// Behaviour: each show() spawns a short-lived label at (x, y) that rises ~24px
// and fades over LIFETIME_MS, then the slot is returned to a small pool. The
// pool size (POOL_SIZE) is chosen against the worst-case "player taps E four
// times in rapid succession" — four evidence × 1 slot each, plus margin.
// Driven by per-frame update(dtMs) called from the GameLoop, NOT setTimeout
// (project convention — every animated thing rides the PIXI ticker).

const POOL_SIZE = 5;
const LIFETIME_MS = 1200;
const RISE_PX = 24;
// Warm cream — matches the chapel palette without pulling a hex out of
// PALETTE.COMPOSITION (which is all dark scene tones). Per dispatch spec.
const COLOR = 0xe8dfc4;

class FloatingLabel {
  constructor() {
    this.text = new Text({
      text: '',
      style: {
        fontFamily: 'monospace',
        fontSize: 18,
        fill: COLOR,
        align: 'center',
      },
    });
    this.text.anchor.set(0.5, 1);
    this.text.visible = false;
    this.remainingMs = 0;
    this.startX = 0;
    this.startY = 0;
  }

  spawn(str, x, y) {
    this.text.text = str;
    this.startX = x;
    this.startY = y;
    this.text.x = x;
    this.text.y = y;
    this.text.alpha = 1;
    this.text.visible = true;
    this.remainingMs = LIFETIME_MS;
  }

  update(dtMs) {
    if (this.remainingMs <= 0) return;
    this.remainingMs = Math.max(0, this.remainingMs - dtMs);
    const t = 1 - this.remainingMs / LIFETIME_MS; // 0 → 1
    this.text.y = this.startY - RISE_PX * t;
    // Hold full alpha for first 30%, then ease out.
    this.text.alpha = t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.7);
    if (this.remainingMs === 0) {
      this.text.visible = false;
    }
  }
}

export class CollectionFeedback {
  constructor() {
    this.view = new Container();
    this.view.label = 'collection-feedback';
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const label = new FloatingLabel();
      this._pool.push(label);
      this.view.addChild(label.text);
    }
  }

  // Coordinates are in screen-space (app.stage). Caller is responsible for
  // converting from world to screen — see main.js wire-up for the pattern.
  show(message, x, y) {
    // First-free wins; if all in flight, recycle the oldest (lowest remaining).
    let target = this._pool.find((l) => l.remainingMs <= 0);
    if (!target) {
      target = this._pool.reduce((a, b) => (a.remainingMs <= b.remainingMs ? a : b));
    }
    target.spawn(message, x, y);
  }

  update(dtMs) {
    for (let i = 0; i < this._pool.length; i++) {
      this._pool[i].update(dtMs);
    }
  }
}
