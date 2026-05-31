// outsideScene/composite.js — assembles the outside-chapel scene from the
// per-layer draw-into-parent functions and re-exports OUTSIDE_CHAPEL_DOOR_GEOM.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.

import { Container } from 'pixi.js';
import { drawSky } from './sky.js';
import { drawVillage } from './village.js';
import { drawFacade } from './facade.js';
import { drawPath } from './path.js';
import { drawAtmosphere } from './atmosphere.js';

// Door-x metadata exposed so cross-team (#1 Foundation's scene-swap +
// E-to-interact mechanic) can match the visual door without duplicating
// constants.
export const OUTSIDE_CHAPEL_DOOR_GEOM = Object.freeze({
  // Door footprint in OUTSIDE scene logical coords.
  doorX: 900,
  doorW: 96,
  doorH: 200,
  doorTop: 360,         // = GROUND_Y(560) - DOOR_H(200)
  doorBottom: 560,      // = GROUND_Y
  doorCx: 948,          // 900 + 96/2
  // Reaper E-to-enter trigger window — x ∈ [interactMinX, interactMaxX].
  // Matches the JSON values that ship in confession-room.json's reaperSpawn.
  interactMinX: 900,
  interactMaxX: 996,
  // Logical canvas the outside scene fills.
  canvasWidth: 1280,
  canvasHeight: 720,
  // Default ground-floor y (Reaper feet land here).
  groundY: 560,
  // Reaper spawn x — lands the Reaper visibly on the cobble path west of
  // the chapel facade with enough room to walk toward the door.
  spawnX: 240,
});

export function createOutsideChapelScenePixelArt({ bounds, floorY = 560 } = {}) {
  // bounds is accepted for symmetry with sibling factories but the outside
  // scene always renders to the full 1280×720 logical canvas — see contract.
  void bounds;

  const container = new Container();
  container.label = 'outside-chapel-pixel-day';

  // Shared spec passed to each layer so per-layer files don't depend on
  // sibling-layer module state. doorRight = doorX + doorW (path layer cobble
  // band ends at the door).
  const spec = {
    canvasW: OUTSIDE_CHAPEL_DOOR_GEOM.canvasWidth,
    canvasH: OUTSIDE_CHAPEL_DOOR_GEOM.canvasHeight,
    groundY: floorY,
    doorRight: OUTSIDE_CHAPEL_DOOR_GEOM.doorX + OUTSIDE_CHAPEL_DOOR_GEOM.doorW,
  };

  drawSky(container, spec);
  drawVillage(container, spec);
  drawFacade(container, spec);
  drawPath(container, spec);
  drawAtmosphere(container, spec);

  return container;
}
