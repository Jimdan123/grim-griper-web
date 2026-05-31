// evidence/items/confessionLedger.js — buildConfessionLedger factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';

export function buildConfessionLedger() {
  const c = new Container();
  c.label = 'evidence-confessionLedger';
  const { WIDTH, HEIGHT, STRIPE_W } = SCALE.EVIDENCE.LEDGER;

  // Tall, narrow deep-red ledger — visibly different shape from sermonBook.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.LEDGER);
  c.addChild(cover);

  // Gold corner stripe = the priced margin notes (narr. line 53).
  const stripe = new Graphics();
  stripe.rect(WIDTH - STRIPE_W, 2, STRIPE_W, HEIGHT - 4).fill(PALETTE.EVIDENCE_GLOW);
  stripe.alpha = 0.8;
  c.addChild(stripe);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}
