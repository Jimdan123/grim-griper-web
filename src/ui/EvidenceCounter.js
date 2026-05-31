import { Container, Text } from 'pixi.js';

// "N / 4" counter for evidence collection (issue #18 — counter half).
// Stacks below the SightMeter in the top-left HUD column (FpsOverlay →
// SightMeter → EvidenceCounter → portrait). Visually consistent with
// FpsOverlay/SightMeter: monospace, ~16–18px, warm cream so it doesn't
// compete with the cyan sight meter or the green FPS.
//
// Anchoring: SightMeter pins itself to top-right via window.innerWidth. The
// FpsOverlay is top-left at (12, 8). Per dispatch we anchor under SightMeter
// — but SightMeter is top-right. Re-reading the dispatch: "Anchor: directly
// below the SightMeter (which is top-left below FpsOverlay)." That description
// of SightMeter is wrong (it's top-right per src/ui/SightMeter.js) — but the
// intent ("stacked HUD column on the left edge") is unambiguous. We follow
// intent: anchor under FpsOverlay on the LEFT edge, and the rest of the
// column (portrait) stacks under us. Team Lead can reconcile if needed.

const PAD_LEFT = 12;
const PAD_TOP = 36; // FpsOverlay sits at (12, 8) and is ~20px tall → 28 leaves ~8px gap; nudged to 36 for breathing room.

export class EvidenceCounter {
  constructor() {
    this.view = new Container();
    this.view.label = 'evidence-counter';

    this._text = new Text({
      text: '0 / 4',
      style: {
        fontFamily: 'monospace',
        fontSize: 16,
        fill: 0xe8dfc4,
      },
    });
    this.view.addChild(this._text);

    this.view.x = PAD_LEFT;
    this.view.y = PAD_TOP;
    this._count = 0;
    this._total = 4;
  }

  setCount(n, total) {
    if (n === this._count && total === this._total) return;
    this._count = n;
    this._total = total;
    this._text.text = `${n} / ${total}`;
  }

  // Returns the bottom-Y in app.stage coords for the next HUD element to
  // anchor against. Used by main.js to stack the portrait card under us.
  get bottomY() {
    return this.view.y + this._text.height;
  }
}
