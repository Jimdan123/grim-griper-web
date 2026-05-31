// decor/foreground.js — createConfessionRoomForeground factory.
// Split from src/art/placeholders/decor.js per issue #2 Phase I.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, CANVAS } from '../constants.js';

/**
 * Single dark silhouette anchored at the left canvas edge — the Happy Hills
 * voyeur frame. ONE shape, pure black, cutting the canvas edge so the player
 * reads the scene as "peering through" something.
 *
 * All filled COMPOSITION.FOREGROUND_SILHOUETTE — the darkest tone in scene.
 * No internal detail — true black silhouette.
 * Container pivot = (0, 0); caller places at world origin.
 */
export function createConfessionRoomForeground() {
  const container = new Container();
  container.label = 'confession-room-foreground';

  const dark = PALETTE.COMPOSITION.FOREGROUND_SILHOUETTE;
  // Foreground budget: <= 14% of canvas width (tightened from 18%).
  // Canvas is 1280, so we hold the silhouette within x ∈ [0, ~180].

  // ONE silhouette: a tall narrow vertical mass on the far-left edge that
  // reads as "the edge of a pew / pillar / doorframe we are peering past".
  // No arms, no ornament, no second prop. Just one continuous dark wedge
  // cutting in from the canvas edge.
  const silhouette = new Graphics();
  silhouette
    .poly([
      0, 0,           // top-left corner of canvas
      90, 0,          // narrow at top
      60, CANVAS.HEIGHT,  // tapers slightly inward toward bottom
      0, CANVAS.HEIGHT,   // bottom-left corner
    ])
    .fill(dark);
  container.addChild(silhouette);

  return container;
}
