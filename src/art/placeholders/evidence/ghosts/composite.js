// evidence/ghosts/composite.js — GHOST_FACTORIES dispatch +
// createGhostPlaceholder public entry point.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { buildGhostSermon } from './sermon.js';
import { buildGhostPoison } from './poison.js';
import { buildGhostExtort } from './extort.js';
import { buildGhostBury } from './bury.js';

const GHOST_FACTORIES = {
  chalice: buildGhostPoison,
  sermonBook: buildGhostSermon,
  confessionLedger: buildGhostExtort,
  limeSpade: buildGhostBury,
};

export function createGhostPlaceholder(evidence) {
  const factory = GHOST_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createGhostPlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(GHOST_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}
