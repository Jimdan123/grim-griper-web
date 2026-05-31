// decor/stainedWindow.js — createStainedWindowSilhouette factory.
// Split from src/art/placeholders/decor.js per issue #2 Phase I.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../constants.js';

/**
 * Tall stained-window silhouette to sit behind the Altar waypoint. This is
 * now the chapel's PRIMARY stage-identifier (the signage having been demoted
 * and the lighting accent deleted). It carries two compositional jobs:
 *   1. Stage identity — the warm pane reads "this is a chapel" at thumbnail.
 *   2. Implied light source — the warm glow plays the role the deleted
 *      lightingAccent used to do, but diegetically (light through window).
 *
 * Redo pass: widened from 60 to 80 (more compositional weight) and bumped
 * pane alpha from 0.55 to 0.72 so the warm glow does the work the deleted
 * lightingAccent used to do (diegetically, through the window). Height
 * kept at 180 to avoid colliding with the Altar waypoint marker below, since
 * Foundation positions this container at a fixed y on the back wall.
 *
 * Total bounding box: 80 wide x 180 tall. Caller places top-left at desired
 * spot (typically y ~ 300, x ~ Altar waypoint x minus W/2).
 */
export function createStainedWindowSilhouette() {
  const container = new Container();
  container.label = 'stained-window';

  const frame = PALETTE.CHAPEL_FRAME;
  const glow = PALETTE.COMPOSITION.STAINED_WINDOW_GLOW;

  const W = 80;
  const H = 180;

  // Outer frame — dark stone surround.
  const outer = new Graphics();
  outer.rect(0, 0, W, H).fill(frame);
  container.addChild(outer);

  // Inner warm pane — inset, brighter than before so the window carries the
  // role of the deleted lighting accent.
  const pane = new Graphics();
  pane.rect(10, 12, W - 20, H - 24).fill(glow);
  pane.alpha = 0.72;
  container.addChild(pane);

  // Cross-mullion (vertical + horizontal divider).
  const mullion = new Graphics();
  mullion.rect(W / 2 - 2, 12, 4, H - 24).fill(frame);
  mullion.rect(10, H / 2 - 2, W - 20, 4).fill(frame);
  container.addChild(mullion);

  return container;
}
