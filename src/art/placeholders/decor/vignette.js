// decor/vignette.js — createVignette factory.
// Split from src/art/placeholders/decor.js per issue #2 Phase I.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, CANVAS } from '../constants.js';

/**
 * Four-side edge-darken vignette overlay. Each side is implemented as 3
 * stepped-alpha rects to approximate a soft gradient (PIXI Graphics does not
 * give us a free radial). Bottom corners get extra alpha — the player is
 * peering down into the chapel (Part B.1 §7).
 *
 * Caller mounts this on app.stage (NOT world) so it sits above everything
 * including any UI candidates. addChild last.
 *
 * Redo pass: returns a Container with a `resize(viewW, viewH)` method
 * attached so Foundation can call it on `window.resize`. Initial draw uses
 * the canvas defaults; resize() rebuilds all rects to the new viewport so
 * the vignette tracks the actual rendered canvas size rather than the
 * logical CANVAS.WIDTH/HEIGHT.
 *
 * Contract for Foundation:
 *   const vignette = createVignette();
 *   app.stage.addChild(vignette);
 *   window.addEventListener('resize', () =>
 *     vignette.resize(window.innerWidth, window.innerHeight)
 *   );
 *   // Also call once after mount in case initial viewport != 1280x720:
 *   vignette.resize(window.innerWidth, window.innerHeight);
 */
export function createVignette() {
  const container = new Container();
  container.label = 'vignette';

  const dark = PALETTE.COMPOSITION.VIGNETTE;

  const draw = (W, H) => {
    // Clear any previously-drawn band rects before re-drawing for new size.
    container.removeChildren();

    // QA Bug 7 fix (2026-05-30 evening) — both the original 3-stripe stepped
    // approach AND the 24-stripe gradient approach showed visible banding
    // seams in capture and on-screen. Replaced with the SIMPLEST possible
    // edge-darken: one solid rect per side at low alpha. Loses the smooth
    // gradient falloff but is COMPLETELY artifact-free at any viewport size.
    // The chapel art + scene composition carry the focal weight; the vignette
    // is just a subtle edge frame.

    const HORIZ_BAND = Math.round(H * 0.12);
    const VERT_BAND = Math.round(W * 0.08);

    // Single top rect.
    const top = new Graphics();
    top.rect(0, 0, W, HORIZ_BAND).fill(dark);
    top.alpha = 0.4;
    container.addChild(top);

    // Single bottom rect — slightly darker.
    const bottom = new Graphics();
    bottom.rect(0, H - HORIZ_BAND, W, HORIZ_BAND).fill(dark);
    bottom.alpha = 0.5;
    container.addChild(bottom);

    // Single left rect.
    const left = new Graphics();
    left.rect(0, 0, VERT_BAND, H).fill(dark);
    left.alpha = 0.35;
    container.addChild(left);

    // Single right rect.
    const right = new Graphics();
    right.rect(W - VERT_BAND, 0, VERT_BAND, H).fill(dark);
    right.alpha = 0.35;
    container.addChild(right);
  };

  // Initial draw at logical canvas size; Foundation should call resize()
  // after mount and on every window resize to track the real viewport.
  draw(CANVAS.WIDTH, CANVAS.HEIGHT);

  container.resize = (viewW, viewH) => {
    draw(viewW, viewH);
  };

  return container;
}
