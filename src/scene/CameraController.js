// Zoom camera — drives the puzzle-door zoom-in beat for ticket #23
// (clue-hidden evidence reached via diegetic mouse-drag puzzles inside
// the booth + sacristy). Lerps a Pixi Container's scale + position with
// an ease-in-out curve. The container it owns sits between the outer
// fit/letterbox `world` and the scene-swap containers (`worldOutside` +
// `worldInside`), so the zoom transform composes on top of the existing
// viewport fit without disturbing it.
//
// Coordinate model. The container's transform maps a logical-canvas
// point P (in the 1280×720 design space) to a post-transform point
// scale * P + position. To frame a target world-rect {x, y, w, h} so
// its center lands at the logical-canvas center (640, 360) at a
// uniform scale that just contains the rect, we pick
//   scale    = min(LOGICAL_W / w, LOGICAL_H / h)
//   center_w = (x + w/2, y + h/2)               // target's world center
//   position = (LOGICAL_W/2 - scale * center_w.x,
//               LOGICAL_H/2 - scale * center_w.y)
//
// `zoomOut` returns to identity (scale 1, position (0, 0)).

import { StateMachine } from '../engine/StateMachine.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../boot/createApp.js';

const DEFAULT_DURATION_MS = 400;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function targetFromBounds(bounds) {
  const scale = Math.min(LOGICAL_WIDTH / bounds.w, LOGICAL_HEIGHT / bounds.h);
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;
  return {
    scale,
    x: LOGICAL_WIDTH / 2 - scale * centerX,
    y: LOGICAL_HEIGHT / 2 - scale * centerY,
  };
}

const IDENTITY = { scale: 1, x: 0, y: 0 };

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this._from = { ...IDENTITY };
    this._to = { ...IDENTITY };
    this._elapsedMs = 0;
    this._durationMs = DEFAULT_DURATION_MS;
    this._currentZoomId = null;
    this._pendingZoomId = null;

    this.fsm = new StateMachine(
      {
        idle: {},
        zoomingIn: {
          update: (dtMs) => this._tickLerp(dtMs, 'zoomed'),
        },
        zoomed: {},
        zoomingOut: {
          update: (dtMs) => this._tickLerp(dtMs, 'idle'),
        },
      },
      'idle',
    );
  }

  isZoomed() {
    return this.fsm.is('zoomed') || this.fsm.is('zoomingIn');
  }

  get currentZoomId() {
    return this._currentZoomId;
  }

  zoomTo(bounds, { durationMs = DEFAULT_DURATION_MS, id = null } = {}) {
    this._from = this._snapshotCamera();
    this._to = targetFromBounds(bounds);
    this._elapsedMs = 0;
    this._durationMs = Math.max(1, durationMs);
    this._pendingZoomId = id;
    // eslint-disable-next-line no-console
    console.log('[CameraController] zoomTo', { bounds, durationMs, id });
    this.fsm.transition('zoomingIn');
  }

  zoomOut({ durationMs = DEFAULT_DURATION_MS } = {}) {
    if (this.fsm.is('idle')) return;
    this._from = this._snapshotCamera();
    this._to = { ...IDENTITY };
    this._elapsedMs = 0;
    this._durationMs = Math.max(1, durationMs);
    this._pendingZoomId = null;
    // eslint-disable-next-line no-console
    console.log('[CameraController] zoomOut', { durationMs, from: this._currentZoomId });
    this.fsm.transition('zoomingOut');
  }

  update(dtMs) {
    this.fsm.update(dtMs);
  }

  _snapshotCamera() {
    return {
      scale: this.camera.scale.x,
      x: this.camera.position.x,
      y: this.camera.position.y,
    };
  }

  _applyCamera({ scale, x, y }) {
    this.camera.scale.set(scale);
    this.camera.position.set(x, y);
  }

  _tickLerp(dtMs, completionState) {
    this._elapsedMs += dtMs;
    const t = Math.min(1, this._elapsedMs / this._durationMs);
    const eased = easeInOutQuad(t);
    this._applyCamera({
      scale: this._from.scale + (this._to.scale - this._from.scale) * eased,
      x: this._from.x + (this._to.x - this._from.x) * eased,
      y: this._from.y + (this._to.y - this._from.y) * eased,
    });
    if (t >= 1) {
      this._currentZoomId = this._pendingZoomId;
      this._pendingZoomId = null;
      this.fsm.transition(completionState);
    }
  }
}
