import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE } from '../art/placeholders/constants.js';

// RadialHauntMenu — four-wedge ring around the Reaper, visible only in HAUNT.
// Slice 3 only fires SHATTER (key 1). Greyed wedges = haunts NOT in
// gameState.unlockedHaunts (those evidence pieces were not collected during
// Phase 1 — should never happen in slice 3 because tryAdvancePhase gates on
// collectedEvidence.size === 4, but the rendering rule still applies).
//
// Tone discipline:
//   - color per wedge sampled from the waypoint palette family (altar, booth,
//     lectern, sacristy) so the radial reads as the SAME chapel-language as
//     the floor markers. No saturated UI primaries.
//   - greyed wedges drop alpha to 0.25 and re-tint to a dim CHAPEL_WALL_TRIM
//     so they read "inert" without yelling "DISABLED".
//   - cream number labels (PALETTE.WAYPOINT_LABEL) on every wedge.
//
// Coordinates: this Container lives on app.stage (screen-space). main.js calls
// setReaperPosition(x, y) every frame with the Reaper's screen-space center,
// computed via world.toGlobal(...). Internally we keep the wedge geometry
// drawn at the local origin and just translate the container.

const INNER_RADIUS = 50;
const OUTER_RADIUS = 95;
const GAP_RAD = 0.06; // ~3.4° tangential gap between wedges so they read as four pieces
const LABEL_FONT_PX = 18;

// Wedge angles (radians, with 0 = right, growing CCW like the unit circle).
// PIXI's y-axis points DOWN, so we draw with screen-space conventions: the
// "top" wedge centers at angle = -90° = -PI/2.
// Slot order: SHATTER (top, key 1), VOICE (right, key 2),
//             WHISPER (bottom, key 3), RISE (left, key 4).
// Each wedge spans 90° centered on its slot angle.
const QUARTER = Math.PI / 2;
const WEDGES = [
  {
    hauntId: 'SHATTER',
    key: '1',
    centerAngle: -Math.PI / 2,           // top
    color: PALETTE.WAYPOINT_ALTAR,       // 0x8a3a3a — gold-ochre family per altar palette
  },
  {
    hauntId: 'VOICE',
    key: '2',
    centerAngle: 0,                      // right
    color: PALETTE.WAYPOINT_CONFESSION,  // 0x3a3a6a — deep blue per confession booth
  },
  {
    hauntId: 'WHISPER',
    key: '3',
    centerAngle: Math.PI / 2,            // bottom
    color: PALETTE.WAYPOINT_LECTERN,     // 0x6a5a2a — warm ochre per lectern
  },
  {
    hauntId: 'RISE',
    key: '4',
    centerAngle: Math.PI,                // left
    color: PALETTE.WAYPOINT_SACRISTY,    // 0x3a6a4a — mossy green per sacristy
  },
];

const GREY_TINT = PALETTE.CHAPEL_WALL_TRIM; // 0x352a40 — inert wall colour
const LABEL_COLOR = PALETTE.WAYPOINT_LABEL; // 0xece6d8 — cream

export class RadialHauntMenu {
  constructor({ unlockedHaunts }) {
    this.view = new Container();
    this.view.label = 'radial-haunt-menu';

    // Pre-allocate one Graphics + one Text per wedge. Re-fill on state change.
    this._wedges = WEDGES.map((spec) => {
      const g = new Graphics();
      this.view.addChild(g);

      // Label centroid: midway between inner and outer radius along the
      // wedge's center angle. PIXI Text anchored center-center.
      const labelR = (INNER_RADIUS + OUTER_RADIUS) / 2;
      const label = new Text({
        text: spec.key,
        style: {
          fontFamily: 'serif',
          fontSize: LABEL_FONT_PX,
          fontWeight: '600',
          fill: LABEL_COLOR,
          align: 'center',
        },
      });
      label.anchor.set(0.5, 0.5);
      label.x = Math.cos(spec.centerAngle) * labelR;
      label.y = Math.sin(spec.centerAngle) * labelR;
      this.view.addChild(label);

      return { spec, g, label };
    });

    this._unlocked = unlockedHaunts ?? new Set();
    this._lastUnlockedSnapshot = '';
    this._redraw();
  }

  // Coords are SCREEN-SPACE (app.stage). main.js converts from world coords
  // via world.toGlobal({x, y}) and passes the result here every frame while
  // the radial is visible.
  setReaperPosition(x, y) {
    this.view.x = Math.round(x);
    this.view.y = Math.round(y);
  }

  // Re-render wedges based on which haunts the Reaper has collected. Cheap
  // snapshot string used to short-circuit the redraw when the set hasn't
  // changed (which is "every frame" in steady state).
  setUnlockedHaunts(unlockedHauntsSet) {
    this._unlocked = unlockedHauntsSet ?? new Set();
    const snapshot = WEDGES.map((w) => (this._unlocked.has(w.hauntId) ? '1' : '0')).join('');
    if (snapshot === this._lastUnlockedSnapshot) return;
    this._lastUnlockedSnapshot = snapshot;
    this._redraw();
  }

  // Slice 3: static render. Slice 4 can add a pulse on the armed wedge.
  // eslint-disable-next-line no-unused-vars
  update(_dtMs) {}

  setVisible(visible) {
    this.view.visible = !!visible;
  }

  // --- internals -----------------------------------------------------------

  _redraw() {
    for (const { spec, g, label } of this._wedges) {
      const collected = this._unlocked.has(spec.hauntId);
      const color = collected ? spec.color : GREY_TINT;
      const alpha = collected ? 0.85 : 0.25;

      g.clear();
      // Draw an annular wedge: arc out at OUTER_RADIUS, arc back at
      // INNER_RADIUS, connected by two straight radii. Gap at the seams.
      const half = QUARTER / 2 - GAP_RAD / 2;
      const a0 = spec.centerAngle - half;
      const a1 = spec.centerAngle + half;

      // PIXI v8 Graphics path:
      g
        .arc(0, 0, OUTER_RADIUS, a0, a1, false)
        .arc(0, 0, INNER_RADIUS, a1, a0, true)
        .closePath()
        .fill({ color, alpha });

      label.alpha = collected ? 1.0 : 0.4;
    }
  }
}
