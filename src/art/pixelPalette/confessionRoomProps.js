// confessionRoomProps.js — composite that assembles altar+lectern+booth+sacristy details.
// Split from src/art/pixelPalette.js per refactor issue #1 Phase 2a.

import { Container } from 'pixi.js';
import {
  createPixelArtAltar,
  createPixelArtLectern,
  createPixelArtConfessionBooth,
  createPixelArtSacristyDetails,
} from './furniture.js';

export function createPixelArtConfessionRoomProps({ floorY } = {}) {
  if (floorY == null) {
    throw new Error('createPixelArtConfessionRoomProps: floorY is required');
  }
  const container = new Container();
  container.label = 'pixel-confession-room-props';
  container.addChild(createPixelArtAltar({ x: 220, floorY }));
  container.addChild(createPixelArtLectern({ x: 500, floorY }));
  container.addChild(createPixelArtConfessionBooth({ x: 780, floorY }));
  container.addChild(createPixelArtSacristyDetails({ x: 1060, floorY }));
  return container;
}
