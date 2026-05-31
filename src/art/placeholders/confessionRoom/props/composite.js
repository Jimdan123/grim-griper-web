// confessionRoom/props/composite.js — createConfessionRoomProps composite.
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.

import { Container } from 'pixi.js';
import { buildAltarProps } from './altar.js';
import { buildLecternProps } from './lectern.js';
import { buildBoothProps } from './booth.js';
import { buildSacristyProps } from './sacristy.js';

/**
 * Composite — all storytelling props for The Confession Room.
 * Returns a Container that callers mount into `world` at (0,0). Props are
 * authored in world-logical (1280x720) coordinates.
 *
 * Z-order discipline (per ticket #21 composition order):
 *   - Mount BETWEEN chapel background and waypoint markers / evidence / ghosts
 *     so props sit ON the chapel floor / back wall but BEHIND the gameplay
 *     midground.
 *   - The brick niche must read on the back wall (not in front of waypoints) —
 *     it is positioned high enough (y=360..440) to sit above the floor strip.
 */
export function createConfessionRoomProps() {
  const container = new Container();
  container.label = 'confession-room-props';
  container.addChild(buildAltarProps());
  container.addChild(buildLecternProps());
  container.addChild(buildBoothProps());
  container.addChild(buildSacristyProps());
  return container;
}
