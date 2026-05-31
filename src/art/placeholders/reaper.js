// reaper.js — Reaper placeholder sprite (painterly register).
// Split from src/art/placeholders.js per refactor issue #1 Phase 2b.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from './constants.js';

export function createReaperPlaceholder() {
  const container = new Container();
  container.label = 'reaper-placeholder';

  const { WIDTH, HEIGHT, BODY_W, BODY_H, HOOD_W, HOOD_H } = SCALE.REAPER;

  const bodyX = (WIDTH - BODY_W) / 2;
  const bodyY = HEIGHT - BODY_H;

  const body = new Graphics();
  body.rect(bodyX, bodyY, BODY_W, BODY_H).fill(PALETTE.REAPER_BODY);
  container.addChild(body);

  const hood = new Graphics();
  const hoodBaseY = bodyY;
  hood
    .poly([
      0, hoodBaseY,
      HOOD_W, hoodBaseY,
      WIDTH / 2, hoodBaseY - HOOD_H,
    ])
    .fill(PALETTE.REAPER_HOOD);
  container.addChild(hood);

  const eye = new Graphics();
  eye.rect(WIDTH / 2 - 2, hoodBaseY - HOOD_H + 10, 4, 2).fill(PALETTE.REAPER_EYE);
  container.addChild(eye);

  container.pivot.set(WIDTH / 2, HEIGHT);
  return container;
}

