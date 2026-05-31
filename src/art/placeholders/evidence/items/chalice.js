// evidence/items/chalice.js — buildChalice factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';

export function buildChalice() {
  const c = new Container();
  c.label = 'evidence-chalice';
  const { WIDTH, HEIGHT, STEM_W, STEM_H, CUP_W, CUP_H } = SCALE.EVIDENCE.CHALICE;

  // Base disc (foot).
  const foot = new Graphics();
  foot.rect(0, HEIGHT - 2, WIDTH, 2).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(foot);

  // Stem.
  const stem = new Graphics();
  const stemX = (WIDTH - STEM_W) / 2;
  stem.rect(stemX, HEIGHT - 2 - STEM_H, STEM_W, STEM_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(stem);

  // Cup (rect with 2 px notch to suggest the opening / residue rim).
  const cup = new Graphics();
  cup.rect(0, 0, CUP_W, CUP_H).fill(PALETTE.EVIDENCE.CHALICE);
  c.addChild(cup);
  const rim = new Graphics();
  rim.rect(2, 0, CUP_W - 4, 2).fill(PALETTE.EVIDENCE_GLOW);
  rim.alpha = 0.7;
  c.addChild(rim);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}
