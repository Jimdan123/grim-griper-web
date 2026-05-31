// decor/signage.js — createConfessionRoomSignage factory.
// Split from src/art/placeholders/decor.js per issue #2 Phase I.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../constants.js';

/**
 * Small subtle cross plaque — stage-identifier that reads at thumbnail.
 * Redo pass: shrunk from 60x88 to 40x56 (≤ 120px-wide spec margin) and
 * stripped the warm catchlight (the lighting accent it referenced is gone).
 * Foundation should reposition this to upper-RIGHT (opposite the stained
 * window anchor) so it doesn't cluster with the window in the upper-left.
 *
 * Total bounding box ~ 40 wide x 60 tall. Caller places top-left at desired
 * spot (e.g. upper-right: roughly (CANVAS.WIDTH - 80, 30)).
 */
export function createConfessionRoomSignage() {
  const container = new Container();
  container.label = 'confession-room-signage';

  const stone = PALETTE.COMPOSITION.CROSS_PLAQUE;

  // Small hanging chain stub (two pixels of darker tone above the plaque).
  const chain = new Graphics();
  chain.rect(19, 0, 2, 6).fill(PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE);
  container.addChild(chain);

  // Plaque background — modest carved-stone rect, half the previous size.
  const plaque = new Graphics();
  plaque.rect(0, 6, 40, 54).fill(stone);
  container.addChild(plaque);

  // Cross — vertical bar + horizontal cross-bar inside the plaque.
  // Thinner strokes match the smaller plaque.
  const cross = new Graphics();
  cross.rect(19, 14, 2, 38).fill(PALETTE.WAYPOINT_LABEL);
  cross.rect(11, 24, 18, 2).fill(PALETTE.WAYPOINT_LABEL);
  container.addChild(cross);

  return container;
}
