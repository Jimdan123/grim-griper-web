// chapel/doorArch.js — createDoorArch factory + door geometry constants.
// Split from src/art/placeholders/chapel.js per issue #2 Phase G.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../constants.js';

// ---------------------------------------------------------------------------
// Door arch (issue #22a — hybrid map)
// ---------------------------------------------------------------------------
// A vertical wood-toned frame at the door tile, with the opening empty (door
// is `open: true` in #22a; closed-door rendering ships later). Subtle shadow
// line across the threshold so the player reads "this is a door".
//
// Geometry: the door tile sits at tileLogicalX (left edge of the 16-px tile).
// The frame is two thin vertical posts (one at tileLogicalX, one at
// tileLogicalX + tile) and a thin lintel across the top. The opening between
// is left empty — the back wall on either side shows through, suggesting an
// archway you can walk through.
//
// Args:
//   tileLogicalX — left edge of the door tile, in logical px.
//   topY         — top of the chapel interior (= chapelBounds.y typically).
//   floorY       — top of the floor strip (= Stage.floorY).
//
// Static — drawn once.
const DOOR_TILE_W = 16;        // matches stageData.meta.tile
const DOOR_POST_W = 3;         // thin wood frame
const DOOR_LINTEL_H = 6;       // thin wood band across the top of the opening
const DOOR_THRESHOLD_H = 2;    // shadow line on the floor surface

export function createDoorArch({ tileLogicalX, topY, floorY }) {
  const container = new Container();
  container.label = 'door-arch';

  const archHeight = floorY - topY;
  const archTopY = topY;

  // Left post — vertical wood-toned bar at the left side of the opening.
  const leftPost = new Graphics();
  leftPost
    .rect(tileLogicalX, archTopY, DOOR_POST_W, archHeight)
    .fill(PALETTE.DOORS);
  container.addChild(leftPost);

  // Right post — vertical wood-toned bar at the right side of the opening.
  const rightPost = new Graphics();
  rightPost
    .rect(tileLogicalX + DOOR_TILE_W - DOOR_POST_W, archTopY, DOOR_POST_W, archHeight)
    .fill(PALETTE.DOORS);
  container.addChild(rightPost);

  // Lintel — thin wood band across the top, spans between the two posts.
  const lintel = new Graphics();
  lintel
    .rect(tileLogicalX, archTopY, DOOR_TILE_W, DOOR_LINTEL_H)
    .fill(PALETTE.DOORS);
  container.addChild(lintel);

  // Subtle inner shadow — a 1px darker band just inside each post so the
  // opening reads as RECESSED, not painted-on-the-wall.
  const innerL = new Graphics();
  innerL
    .rect(tileLogicalX + DOOR_POST_W, archTopY + DOOR_LINTEL_H, 1, archHeight - DOOR_LINTEL_H)
    .fill(PALETTE.CHAPEL_FRAME);
  innerL.alpha = 0.55;
  container.addChild(innerL);
  const innerR = new Graphics();
  innerR
    .rect(tileLogicalX + DOOR_TILE_W - DOOR_POST_W - 1, archTopY + DOOR_LINTEL_H, 1, archHeight - DOOR_LINTEL_H)
    .fill(PALETTE.CHAPEL_FRAME);
  innerR.alpha = 0.55;
  container.addChild(innerR);

  // Threshold shadow line across the floor surface, between the two posts —
  // tells the player "this is a doorway, step through here".
  const threshold = new Graphics();
  threshold
    .rect(tileLogicalX + DOOR_POST_W, floorY, DOOR_TILE_W - DOOR_POST_W * 2, DOOR_THRESHOLD_H)
    .fill(PALETTE.CHAPEL_FRAME);
  threshold.alpha = 0.8;
  container.addChild(threshold);

  return container;
}
