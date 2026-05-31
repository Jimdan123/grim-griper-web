// evidence/waypoint.js — WAYPOINT_KIND_COLOR + createWaypointMarker.
// Split from src/art/placeholders/evidence.js per issue #2 Phase F.

import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE, SCALE } from '../constants.js';

const WAYPOINT_KIND_COLOR = {
  Altar: PALETTE.WAYPOINT_ALTAR,
  Lectern: PALETTE.WAYPOINT_LECTERN,
  ConfessionBooth: PALETTE.WAYPOINT_CONFESSION,
  Sacristy: PALETTE.WAYPOINT_SACRISTY,
};

export function createWaypointMarker(waypoint) {
  const container = new Container();
  container.label = `waypoint-${waypoint.id}`;

  const { WIDTH, HEIGHT, INSET, LABEL_OFFSET_Y, LABEL_FONT_PX } = SCALE.WAYPOINT_MARKER;
  const color = WAYPOINT_KIND_COLOR[waypoint.kind] ?? PALETTE.CHAPEL_ACCENT;

  // Stage.js anchors this container at `marker.y = floorY` (floor surface
  // top, Path A). We draw the marker bar DOWN from the anchor by INSET, so
  // it sits ON the floor strip — its top edge a few px below the horizon line
  // and its bottom edge well above the baseboard trim.
  const rectTop = INSET;

  const marker = new Graphics();
  marker.rect(-WIDTH / 2, rectTop, WIDTH, HEIGHT).fill(color);
  container.addChild(marker);

  // Thin glow strip on top of the marker for readability against the floor.
  const glow = new Graphics();
  glow.rect(-WIDTH / 2, rectTop, WIDTH, 2).fill(PALETTE.WAYPOINT_LABEL);
  glow.alpha = 0.45;
  container.addChild(glow);

  const label = new Text({
    text: waypoint.label,
    style: {
      fontFamily: 'sans-serif',
      fontSize: LABEL_FONT_PX,
      fill: PALETTE.WAYPOINT_LABEL,
      align: 'center',
    },
  });
  // Label sits ABOVE the floor surface (into the chapel interior) so it
  // doesn't crowd the marker bar inside the thin floor strip.
  label.anchor.set(0.5, 1);
  label.x = 0;
  label.y = -LABEL_OFFSET_Y;
  container.addChild(label);

  return container;
}
