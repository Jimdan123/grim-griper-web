// evidence/items/composite.js — EVIDENCE_FACTORIES dispatch +
// createEvidencePlaceholder public entry point.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { buildChalice } from './chalice.js';
import { buildSermonBook } from './sermonBook.js';
import { buildConfessionLedger } from './confessionLedger.js';
import { buildLimeSpade } from './limeSpade.js';

const EVIDENCE_FACTORIES = {
  chalice: buildChalice,
  sermonBook: buildSermonBook,
  confessionLedger: buildConfessionLedger,
  limeSpade: buildLimeSpade,
};

export function createEvidencePlaceholder(evidence) {
  const factory = EVIDENCE_FACTORIES[evidence?.id];
  if (!factory) {
    throw new Error(
      `createEvidencePlaceholder: unknown evidence.id "${evidence?.id}" ` +
        `(expected one of: ${Object.keys(EVIDENCE_FACTORIES).join(', ')})`,
    );
  }
  return factory();
}
