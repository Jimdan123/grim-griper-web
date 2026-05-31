// outsideScene/atmosphere.js — warm-light cream wash overlay.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.
//
// Section 5 of the outside scene composite. Final overlay pass.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function drawAtmosphere(container, spec) {
  const { canvasW, canvasH } = spec;

  // A very low alpha DAY_LIGHT rectangle over the whole canvas to suggest
  // midday warmth without bleaching the palette. Anti-slasher: NOT a heavy
  // orange overlay (would read sunset-foreboding) — cream-yellow, alpha 0.06.
  const warmWash = new Graphics();
  warmWash.rect(0, 0, canvasW, canvasH).fill(PIXEL_PALETTE.DAY_LIGHT);
  warmWash.alpha = 0.06;
  container.addChild(warmWash);
}
