// Chapel-bustle setup — spawns parishioner NPCs and the chatter scheduler.
// Pixelart-mode only; the painterly path is the legacy A/B comparison
// register and intentionally bare. Returns the NPC list (for GameLoop
// registration) and the scheduler instance (for gated update wrapping).

import { AmbientNPC } from '../entities/AmbientNPC.js';
import { ChatterScheduler } from '../ui/ChatterSystem.js';
import { createParishionerSpritePixelArt } from '../art/pixelPalette/sprites/parishioner.js';

// Six NPCs (within the 4-6 envelope) positioned to populate all three walled
// rooms (nave 80-600, booth 680-880, sacristy 960-1200) without clipping any
// partition wall (600-680, 880-960) or door arch (x=640, x=920).
//
// 2026-05-30 evening (walled-rooms VP audit fix #1): the previous kneeler at
// x=660 stood inside the booth partition wall (600-680) and the stander at
// x=900 stood inside the sacristy partition wall (880-960). Moved kneeler
// into the booth interior at x=720 (clears booth confessional at 752-808
// by 32 px) and stander into the sacristy interior at x=990 (clears Christ
// icon at 1028-1092 by 38 px).
//
// Each gets a scheduleSeed so chatter + animation oscillators desynchronize.
const NPC_SPECS = [
  { variant: 'kneeler',       x: 340, scheduleSeed: 0.11 }, // nave
  { variant: 'kneeler',       x: 720, scheduleSeed: 0.37 }, // booth interior
  { variant: 'stander',       x: 540, scheduleSeed: 0.55 }, // nave
  { variant: 'stander',       x: 990, scheduleSeed: 0.72 }, // sacristy interior
  { variant: 'candlelighter', x: 110, scheduleSeed: 0.83 }, // nave (front door)
  { variant: 'walker',        x: 800, scheduleSeed: 0.42 }, // booth interior
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
