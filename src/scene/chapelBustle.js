// Chapel-bustle setup — spawns parishioner NPCs and the chatter scheduler.
// Pixelart-mode only; the painterly path is the legacy A/B comparison
// register and intentionally bare. Returns the NPC list (for GameLoop
// registration) and the scheduler instance (for gated update wrapping).

import { AmbientNPC } from '../entities/AmbientNPC.js';
import { ChatterScheduler } from '../ui/ChatterSystem.js';
import { createParishionerSpritePixelArt } from '../art/pixelPalette/sprites.js';

// Five NPCs (within the 4-6 envelope) at positions that sit naturally
// between the altar (x=220), lectern (x=500), and booth (x=780) anchors.
// Each gets a scheduleSeed so chatter + animation oscillators desynchronize.
const NPC_SPECS = [
  { variant: 'kneeler',       x: 340, scheduleSeed: 0.11 },
  { variant: 'kneeler',       x: 660, scheduleSeed: 0.37 },
  { variant: 'stander',       x: 540, scheduleSeed: 0.55 },
  { variant: 'stander',       x: 900, scheduleSeed: 0.72 },
  { variant: 'candlelighter', x: 110, scheduleSeed: 0.83 },
  { variant: 'walker',        x: 800, scheduleSeed: 0.42 },
];

export function setupChapelBustle({ enabled, worldInside, world, hudLayer, floorY }) {
  const npcs = [];
  let scheduler = null;

  if (!enabled) return { npcs, scheduler };

  for (const spec of NPC_SPECS) {
    const sprite = createParishionerSpritePixelArt({
      variant: spec.variant,
      seed: spec.scheduleSeed,
    });
    const npc = new AmbientNPC({
      sprite,
      variant: spec.variant,
      x: spec.x,
      floorY,
      scheduleSeed: spec.scheduleSeed,
    });
    // Mount into worldInside so SightFX desaturation washes NPCs in Reaper
    // Sight and the scene-swap hides them with the rest of the interior.
    worldInside.addChild(npc.view);
    npcs.push(npc);
  }

  // Bubbles mount on the HUD layer (NOT world) so SightFX ColorMatrixFilter
  // doesn't desaturate the bubble cream.
  scheduler = new ChatterScheduler({ npcs, world, layer: hudLayer });

  return { npcs, scheduler };
}
