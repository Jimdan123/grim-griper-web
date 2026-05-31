// chapel/background.js — createChapelBackground factory.
// Split from src/art/placeholders/chapel.js per issue #2 Phase G.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE, CANVAS } from '../constants.js';

export function createChapelBackground(bounds) {
  const container = new Container();
  container.label = 'chapel-background';

  // Path A composition: the chapel ROOM extends from canvas top down to the
  // floor surface. The floor is a thin strip at the bottom of the bounds rect;
  // everything above is the same dark wall mass (back wall + chapel interior
  // void the Reaper haunts).
  const floorTopY = bounds.y + bounds.height - SCALE.FRAME.FLOOR_STRIP_H;

  // Layer 1: chapel interior + back wall — one continuous dark mass that fills
  // the ENTIRE canvas top-to-bottom. The floor strip (Layer 5) is then painted
  // ON TOP of this wall mass. VP pass 7 (defect 7): extending the wall all the
  // way to CANVAS.HEIGHT prevents the page-level letterbox background from
  // bleeding through below the floor strip in viewports where the rendered
  // canvas is taller than the chapel composition.
  const wall = new Graphics();
  wall.rect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT).fill(PALETTE.CHAPEL_WALL);
  container.addChild(wall);

  // Layer 2: top frame strip (cornice) — keeps the canvas top edge defined.
  const topFrame = new Graphics();
  topFrame.rect(0, 0, CANVAS.WIDTH, SCALE.FRAME.TOP_H).fill(PALETTE.CHAPEL_FRAME);
  container.addChild(topFrame);

  // Layer 3: pillars — full-height columns from cornice down to the floor
  // surface. Painted in CHAPEL_ACCENT (lighter shade) on top of the wall so
  // they read as architecture standing inside the room.
  const pillarTop = SCALE.FRAME.TOP_H;
  const pillarBottom = floorTopY;
  const pillarH = pillarBottom - pillarTop;
  for (const px of [0.2, 0.4, 0.6, 0.8]) {
    const x = Math.round(CANVAS.WIDTH * px - SCALE.PILLAR.WIDTH / 2);
    const pillar = new Graphics();
    pillar.rect(x, pillarTop, SCALE.PILLAR.WIDTH, pillarH).fill(PALETTE.CHAPEL_ACCENT);
    container.addChild(pillar);

    // Pillar cap + base trim — reads as carved stone.
    // VP pass 7 (defect 8): caps painted in CHAPEL_WALL (same as the wall mass)
    // so they effectively disappear. Previously CHAPEL_WALL_TRIM made them
    // read as floating lighter blocks detached from the cornice. Placeholder
    // chapel pillars don't need ornament at this phase; restore trim later
    // once the cornice has its own tonal differentiation.
    const cap = new Graphics();
    cap
      .rect(x - 3, pillarTop, SCALE.PILLAR.WIDTH + 6, SCALE.PILLAR.CAP_H)
      .fill(PALETTE.CHAPEL_WALL);
    container.addChild(cap);

    const base = new Graphics();
    base
      .rect(x - 3, pillarBottom - SCALE.PILLAR.BASE_H, SCALE.PILLAR.WIDTH + 6, SCALE.PILLAR.BASE_H)
      .fill(PALETTE.CHAPEL_WALL_TRIM);
    container.addChild(base);
  }

  // Layer 4: horizon line where chapel meets floor — sharp top edge for the
  // floor strip so characters' feet have a clean ground plane to stand on.
  const horizon = new Graphics();
  horizon
    .rect(0, floorTopY - SCALE.HORIZON_H, CANVAS.WIDTH, SCALE.HORIZON_H)
    .fill(PALETTE.CHAPEL_HORIZON);
  container.addChild(horizon);

  // Layer 5: floor strip — a thin band from floorTopY down by FLOOR_STRIP_H,
  // spanning the full canvas width so it reads as a continuous stage.
  const floor = new Graphics();
  floor
    .rect(0, floorTopY, CANVAS.WIDTH, SCALE.FRAME.FLOOR_STRIP_H)
    .fill(PALETTE.CHAPEL_FLOOR);
  container.addChild(floor);

  // Layer 6: bottom frame strip (baseboard) at the very bottom of the floor
  // strip — closes the composition.
  const floorBottomY = floorTopY + SCALE.FRAME.FLOOR_STRIP_H;
  const floorFrame = new Graphics();
  floorFrame
    .rect(0, floorBottomY - SCALE.FRAME.FLOOR_H, CANVAS.WIDTH, SCALE.FRAME.FLOOR_H)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(floorFrame);

  return container;
}
