// decor/lighting.js — createLightingAccent factory (DEPRECATED — returns
// empty Container).
// Split from src/art/placeholders/decor.js per issue #2 Phase I.

import { Container } from 'pixi.js';

/**
 * DEPRECATED in redo pass. The previous implementation rendered a large
 * literal warm rectangle in the upper-left that competed with the signage
 * and stained window for the same compositional anchor. Happy Hills uses
 * ONE light source per scene, expressed diegetically (warm pane of a window),
 * not a free-floating bloom on the wall.
 *
 * Returns an empty Container so existing Foundation wiring keeps working
 * until Foundation removes the addChild call. The chapel's candlelit feel
 * now comes from the stained-window glow + vignette tonal grading alone.
 *
 * TODO Foundation follow-up: stop calling this and remove the import.
 */
export function createLightingAccent() {
  const container = new Container();
  container.label = 'lighting-accent-deprecated';
  return container;
}
