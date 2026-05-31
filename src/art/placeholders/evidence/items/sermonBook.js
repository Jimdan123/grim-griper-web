// evidence/items/sermonBook.js — buildSermonBook factory.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../../constants.js';

export function buildSermonBook() {
  const c = new Container();
  c.label = 'evidence-sermonBook';
  const { WIDTH, HEIGHT, SPINE_W } = SCALE.EVIDENCE.SERMON_BOOK;

  // Squat ochre rectangle = book lying open.
  const cover = new Graphics();
  cover.rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.EVIDENCE.SERMON_BOOK);
  c.addChild(cover);

  // Central spine band — splits the cover, reads as "open book".
  const spine = new Graphics();
  spine
    .rect((WIDTH - SPINE_W) / 2, 0, SPINE_W, HEIGHT)
    .fill(PALETTE.ALDRIC_COLLAR);
  c.addChild(spine);

  c.pivot.set(WIDTH / 2, HEIGHT);
  return c;
}
