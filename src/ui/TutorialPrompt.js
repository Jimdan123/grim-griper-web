import { Container, Graphics, Text } from 'pixi.js';

// TutorialPrompt — small fade-in/fade-out instructional banner shown
// near the top of the viewport. Different from EntryPrompt (which is
// instant on/off at bottom-center for the door interaction) — this one
// is for hints like "A / D to walk", "Hold SHIFT for Reaper Sight" that
// appear briefly and fade out either on a timer or on detected input.
//
// Mounted on app.stage so SightFX desaturation doesn't touch it.

const COLOR = 0xe8dfc4;
const BG_COLOR = 0x000000;
const BG_ALPHA = 0.7;
const FONT_PX = 20;
const PAD_X = 20;
const PAD_Y = 14;
const TOP_MARGIN = 110;
const FADE_MS = 600;

export class TutorialPrompt {
  constructor(message = '') {
    this.view = new Container();
    this.view.label = 'tutorial-prompt';

    this._bg = new Graphics();
    this.view.addChild(this._bg);

    this._text = new Text({
      text: message,
      style: {
        fontFamily: 'monospace',
        fontSize: FONT_PX,
        fill: COLOR,
        align: 'center',
        lineHeight: FONT_PX + 6,
      },
    });
    this._text.anchor.set(0.5, 0.5);
    this.view.addChild(this._text);

    this._redrawBg();

    this.view.visible = false;
    this.view.alpha = 0;
    this._fadeTarget = 0;
    this._fadeElapsedMs = FADE_MS;
    this._holdRemainingMs = 0;
    this._holdMs = 0;
  }

  _redrawBg() {
    const w = Math.ceil(this._text.width) + PAD_X * 2;
    const h = Math.ceil(this._text.height) + PAD_Y * 2;
    this._bg.clear();
    this._bg
      .roundRect(-w / 2, -h / 2, w, h, 8)
      .fill({ color: BG_COLOR, alpha: BG_ALPHA });
  }

  setMessage(message) {
    this._text.text = message;
    this._redrawBg();
  }

  // show({ message, holdMs }) — display with text + auto-hide after holdMs.
  // If holdMs is omitted, prompt stays visible until hide() is called.
  show({ message, holdMs }) {
    if (message != null) this.setMessage(message);
    this.view.visible = true;
    this._fadeTarget = 1;
    this._fadeElapsedMs = 0;
    this._holdMs = holdMs ?? 0;
    this._holdRemainingMs = holdMs ?? 0;
  }

  hide() {
    this._fadeTarget = 0;
    this._fadeElapsedMs = 0;
    this._holdRemainingMs = 0;
  }

  setScreenPosition(viewportWidth) {
    this.view.x = Math.round(viewportWidth / 2);
    this.view.y = Math.round(TOP_MARGIN);
  }

  update(dtMs) {
    // Hold timer — if a holdMs was supplied, tick it down and auto-hide.
    if (this._holdRemainingMs > 0) {
      this._holdRemainingMs -= dtMs;
      if (this._holdRemainingMs <= 0) {
        this.hide();
      }
    }

    // Fade transition.
    const targetAlpha = this._fadeTarget;
    if (this.view.alpha !== targetAlpha) {
      this._fadeElapsedMs += dtMs;
      const t = Math.min(1, this._fadeElapsedMs / FADE_MS);
      if (targetAlpha === 1) {
        this.view.alpha = t;
      } else {
        this.view.alpha = 1 - t;
        if (t >= 1) {
          this.view.visible = false;
        }
      }
    }
  }
}
