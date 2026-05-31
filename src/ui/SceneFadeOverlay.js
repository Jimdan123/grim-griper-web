import { Container, Graphics } from 'pixi.js';

// SceneFadeOverlay — Foundation Engineer, 2026-05-30.
//
// Full-screen black rectangle on app.stage that fades 0 → 1 → 0 to mask the
// outside ↔ inside container swap. Driven from the GameLoop via update(dtMs);
// no per-frame allocation. Resized to match window on construction + resize
// so it fully covers regardless of viewport (app.stage is unscaled — only
// `world` carries the contain-mode scale, so we draw in raw screen pixels).
//
// Lifecycle:
//   start({ fadeInMs, holdMs, fadeOutMs, onBlackPeak, onComplete })
//     - begins the fade-in immediately
//     - fires onBlackPeak once when alpha hits 1.0 (just before hold expires;
//       caller swaps container visibility + teleports Reaper here)
//     - fires onComplete once the fade-out finishes
//   resize(width, height) — redraw to new viewport size
//   update(dtMs) — drive the alpha timeline; called from GameLoop
//
// State: 'idle' | 'fade_in' | 'hold' | 'fade_out'. While idle the view is
// hidden so it doesn't intercept paint or block app.stage compositing.

const DEFAULT_FADE_IN_MS = 600;
const DEFAULT_HOLD_MS = 0;
const DEFAULT_FADE_OUT_MS = 600;

export class SceneFadeOverlay {
  constructor() {
    this.view = new Container();
    this.view.label = 'scene-fade-overlay';
    this._rect = new Graphics();
    this.view.addChild(this._rect);
    this._w = 0;
    this._h = 0;
    this.view.visible = false;
    this.view.alpha = 0;

    this._state = 'idle';
    this._elapsedMs = 0;
    this._fadeInMs = DEFAULT_FADE_IN_MS;
    this._holdMs = DEFAULT_HOLD_MS;
    this._fadeOutMs = DEFAULT_FADE_OUT_MS;
    this._onBlackPeak = null;
    this._onComplete = null;
    this._peakFired = false;
  }

  resize(width, height) {
    this._w = width;
    this._h = height;
    this._rect.clear();
    this._rect.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 1 });
  }

  isActive() {
    return this._state !== 'idle';
  }

  start({
    fadeInMs = DEFAULT_FADE_IN_MS,
    holdMs = DEFAULT_HOLD_MS,
    fadeOutMs = DEFAULT_FADE_OUT_MS,
    onBlackPeak = null,
    onComplete = null,
  } = {}) {
    this._fadeInMs = Math.max(0, fadeInMs);
    this._holdMs = Math.max(0, holdMs);
    this._fadeOutMs = Math.max(0, fadeOutMs);
    this._onBlackPeak = onBlackPeak;
    this._onComplete = onComplete;
    this._elapsedMs = 0;
    this._peakFired = false;
    this._state = 'fade_in';
    this.view.visible = true;
    this.view.alpha = 0;
  }

  update(dtMs) {
    if (this._state === 'idle') return;
    this._elapsedMs += dtMs;
    if (this._state === 'fade_in') {
      const t = this._fadeInMs > 0 ? Math.min(1, this._elapsedMs / this._fadeInMs) : 1;
      this.view.alpha = t;
      if (t >= 1) {
        this._state = 'hold';
        this._elapsedMs = 0;
        // Fire the black-peak callback once. Caller swaps containers +
        // teleports Reaper at this moment (the screen is fully black).
        if (!this._peakFired) {
          this._peakFired = true;
          if (this._onBlackPeak) this._onBlackPeak();
        }
      }
      return;
    }
    if (this._state === 'hold') {
      if (this._elapsedMs >= this._holdMs) {
        this._state = 'fade_out';
        this._elapsedMs = 0;
      }
      return;
    }
    if (this._state === 'fade_out') {
      const t = this._fadeOutMs > 0 ? Math.min(1, this._elapsedMs / this._fadeOutMs) : 1;
      this.view.alpha = 1 - t;
      if (t >= 1) {
        this._state = 'idle';
        this.view.alpha = 0;
        this.view.visible = false;
        if (this._onComplete) this._onComplete();
      }
    }
  }
}
