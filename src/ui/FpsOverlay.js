import { Text } from 'pixi.js';

export class FpsOverlay {
  constructor(ticker) {
    this.ticker = ticker;
    this.view = new Text({
      text: 'FPS 60',
      style: {
        fontFamily: 'monospace',
        fontSize: 16,
        fill: 0x9be39b,
      },
    });
    this.view.x = 12;
    this.view.y = 8;
    this._accMs = 0;
  }

  update(dtMs) {
    this._accMs += dtMs;
    if (this._accMs >= 250) {
      this._accMs = 0;
      this.view.text = `FPS ${Math.round(this.ticker.FPS)}`;
    }
  }
}
