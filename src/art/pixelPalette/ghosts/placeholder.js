// ghosts/placeholder.js — PIXEL_GHOST_FACTORIES dispatch table +
// createPixelArtGhostPlaceholder public entry point.
// Split from src/art/pixelPalette/ghosts.js per issue #2 Phase D.

import { createPixelArtChaliceGhost } from './chalice.js';
import { createPixelArtSermonGhost } from './sermon.js';
import { createPixelArtConfessionBoothGhost } from './confessionBooth.js';
import { createPixelArtSacristyGhost } from './sacristy.js';

// Dispatch by evidence id — same shape as the painterly GHOST_FACTORIES table
// in placeholders.js, so callers can hot-swap on render mode.
const PIXEL_GHOST_FACTORIES = {
  chalice: createPixelArtChaliceGhost,
  sermonBook: createPixelArtSermonGhost,
  confessionLedger: createPixelArtConfessionBoothGhost,
  limeSpade: createPixelArtSacristyGhost,
};

/**
 * Pixel-art ghost factory matching the painterly createGhostPlaceholder API
 * shape (takes the evidence-data record, dispatches on `.id`). Returns
 * a PIXI.Container pivoted bottom-center.
 *
 * Used by GhostReplay (or main.js wrapper) when render mode is PIXELART.
 */
export function createPixelArtGhostPlaceholder(evidence) {
  const factory = PIXEL_GHOST_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createPixelArtGhostPlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(PIXEL_GHOST_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}
