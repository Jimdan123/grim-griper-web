// GhostReplay — Pixi Container wrapper around the ghost placeholder factory
// owned by #5 (src/art/placeholders.js → createGhostPlaceholder for painterly;
// src/art/pixelPalette.js → createPixelArtGhostPlaceholder for pixelart).
//
// Static translucent sprite (alpha 0.4 per PRD line 105). Visibility is driven
// by SightFX based on (sightOn AND !boundEvidence.isCollected).
//
// Stage + Art Lead (2026-05-30): the ghosts have been re-authored for the
// pixel-art register as two-figure crime-act compositions (Aldric + pilgrim).
// To stay tolerant of either register without coupling GhostReplay to the
// render-mode global, callers may inject `viewFactory(evidenceData) -> Container`.
// Falls back to the painterly placeholder when no factory is provided.

import { createGhostPlaceholder } from '../art/placeholders/evidence/ghosts/composite.js';

const GHOST_ALPHA = 0.4;

export class GhostReplay {
  constructor(evidenceData, boundEvidence, viewFactory = null) {
    this.hauntId = evidenceData.hauntId;
    this.boundEvidence = boundEvidence;

    this.view = typeof viewFactory === 'function'
      ? viewFactory(evidenceData)
      : createGhostPlaceholder(evidenceData);
    this.view.x = evidenceData.ghostX;
    this.view.y = evidenceData.ghostY;
    this.view.alpha = GHOST_ALPHA;
    this.view.visible = false;
  }

  setVisible(visible) {
    this.view.visible = visible;
  }

  isBoundEvidenceCollected() {
    return this.boundEvidence ? this.boundEvidence.isCollected : false;
  }
}
