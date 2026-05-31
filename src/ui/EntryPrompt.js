import { Container, Graphics, Text } from 'pixi.js';

// EntryPrompt — small HUD prompt shown while the Reaper stands within
// proximity of the chapel front door and has not yet entered.
// Foundation Engineer, 2026-05-30 (replaces the auto-walkin EntryScene).
//
// Style: warm cream monospace text (matches CollectionFeedback's COLOR /
// font choice) on a faint darkened pill so it reads over either a bright
// sky or the chapel's interior. Mounts on app.stage (screen-space) so the
// SightFX ColorMatrixFilter on world doesn't desaturate it.
//
// Behaviour: setVisible(bool) toggles. setScreenPosition(width, height)
// pins to bottom-center. No per-frame update needed — the prompt is static
// while visible.

const COLOR = 0xe8dfc4;      // matches CollectionFeedback
const BG_COLOR = 0x000000;
const BG_ALPHA = 0.55;
const FONT_PX = 20;
const PAD_X = 14;
const PAD_Y = 8;
const BOTTOM_MARGIN = 96;    // sits above where FearBar might appear later

export class EntryPrompt {
  constructor(message = 'Press E to enter the chapel') {
    this.view = new Container();
    this.view.label = 'entry-prompt';

    this._bg = new Graphics();
    this.view.addChild(this._bg);

    this._text = new Text({
      text: message,
      style: {
        fontFamily: 'monospace',
        fontSize: FONT_PX,
        fill: COLOR,
        align: 'center',
      },
    });
    this._text.anchor.set(0.5, 0.5);
    this.view.addChild(this._text);

    // Draw the pill background sized to the text bounds.
    const w = Math.ceil(this._text.width) + PAD_X * 2;
    const h = Math.ceil(this._text.height) + PAD_Y * 2;
    this._bg
      .roundRect(-w / 2, -h / 2, w, h, 6)
      .fill({ color: BG_COLOR, alpha: BG_ALPHA });

    this.view.visible = false;
  }

  setVisible(visible) {
    this.view.visible = !!visible;
  }

  // Pin to bottom-center of the current viewport. Called once on boot and
  // again on window resize.
  setScreenPosition(viewportWidth, viewportHeight) {
    this.view.x = Math.round(viewportWidth / 2);
    this.view.y = Math.round(viewportHeight - BOTTOM_MARGIN);
  }
}
