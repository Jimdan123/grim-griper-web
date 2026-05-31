// PIXI Application boot + viewport fit math. Returns the initialized app
// and a `fit()` helper that re-runs the contain-mode scale calculation —
// caller wires that into a window resize listener.

import { Application } from 'pixi.js';

export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export async function createApp({ mountSelector = '#app' } = {}) {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: '#000000',
    // perf-slice-1: native DPR wasted on flat-color placeholder art; MSAA
    // wasted on axis-aligned Graphics.rect.
    resolution: 1,
    autoDensity: false,
    antialias: false,
  });

  document.querySelector(mountSelector).appendChild(app.canvas);

  return app;
}

// Contain-mode fit: scale the world container so the logical 1280x720
// design entirely fits inside the viewport, with letterbox bars on the
// long axis. Pre-switch was cover-mode (Math.max) which pushed content
// off-screen in portrait viewports.
export function fitWorldToViewport(app, world) {
  const viewW = app.renderer.width / app.renderer.resolution;
  const viewH = app.renderer.height / app.renderer.resolution;
  const scale = Math.min(viewW / LOGICAL_WIDTH, viewH / LOGICAL_HEIGHT);
  world.scale.set(scale);
  world.x = (viewW - LOGICAL_WIDTH * scale) / 2;
  world.y = (viewH - LOGICAL_HEIGHT * scale) / 2;
}
