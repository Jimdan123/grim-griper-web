// evidence/items/limeSpade.js — buildLimeSpade factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';

export function buildLimeSpade() {
  const c = new Container();
  c.label = 'evidence-limeSpade';
  const { WIDTH, HEIGHT, SHAFT_W, SHAFT_H, BLADE_W, BLADE_H } = SCALE.EVIDENCE.LIME_SPADE;

  // Brown wood shaft — tall and thin, centered.
  const shaft = new Graphics();
  const shaftX = (WIDTH - SHAFT_W) / 2;
  shaft.rect(shaftX, BLADE_H, SHAFT_W, SHAFT_H).fill(PALETTE.EVIDENCE.SPADE_SHAFT);
  c.addChild(shaft);

  // Cream blade at top — the lime-dust link to ALDRIC_BODY tone.
  const blade = new Graphics();
  blade.rect(0, 0, BLADE_W, BLADE_H).fill(PALETTE.EVIDENCE.SPADE_BLADE);
  c.addChild(blade);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}
