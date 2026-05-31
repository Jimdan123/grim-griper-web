// MouseManager — thin abstraction over PixiJS v8's pointer-event API for
// the puzzle drag-to-slot subsystem (#23b). Active ONLY while a puzzle scene
// is mounted; the rest of the game is keyboard-driven (InputManager).
//
// Pattern: the caller creates one MouseManager per puzzle scene, calls
// `enable(rootContainer)` after the scene is added to the stage, registers
// draggable pieces with `registerDraggable(piece, callbacks)`, and on
// teardown calls `disable()` which detaches every listener it attached.
//
// We deliberately keep this surface narrow:
//   - enable(root): set root.eventMode = 'static' + sortableChildren so the
//     scene receives pointer events at all.
//   - registerDraggable(piece, { onDragStart, onDragMove, onDragEnd }):
//     wires pointerdown on the piece + pointermove/pointerup on the root.
//     Callbacks receive the local (root-space) pointer position.
//   - disable(): removes every listener registered through this manager and
//     resets the captured pieces' eventMode. Idempotent.
//
// We don't import pixi.js here — duck-typed against the v8 Container surface
// (eventMode, cursor, on/off, toLocal). That keeps the smoke-boot test happy
// (no top-level Pixi side effects) and lets unit tests stub the surface.

const PIECE_EVENTS = [
  'pointerdown',
];
const ROOT_EVENTS = [
  'pointermove',
  'pointerup',
  'pointerupoutside',
];

export class MouseManager {
  constructor() {
    this._root = null;
    this._active = false;
    // Tracks every (target, event, handler) tuple we attached so disable()
    // can detach them all in one sweep.
    this._listeners = [];
    // The piece currently being dragged, or null. Only one drag at a time.
    this._draggingPiece = null;
    this._dragCallbacks = null;
  }

  enable(root) {
    if (this._active) return;
    this._root = root;
    this._active = true;
    if (root) {
      root.eventMode = 'static';
      // A puzzle scene's hit area is the whole backdrop — let Pixi resolve
      // pointer hits by the backdrop's actual bounds. We don't set hitArea
      // here; the PuzzleScene draws a backdrop rect that captures events.
    }
  }

  disable() {
    if (!this._active) return;
    for (const { target, event, handler } of this._listeners) {
      if (target && typeof target.off === 'function') target.off(event, handler);
    }
    this._listeners.length = 0;
    this._draggingPiece = null;
    this._dragCallbacks = null;
    this._active = false;
    this._root = null;
  }

  /**
   * Wire pointerdown on `piece` to a drag lifecycle. Callbacks:
   *   onDragStart({ x, y })  — pointer local to root
   *   onDragMove({ x, y })
   *   onDragEnd({ x, y })
   *
   * The piece itself must already be added to the scene; this method just
   * attaches listeners. The pointer-move/up handlers are bound to the root
   * so dragging continues even if the cursor leaves the piece's bounds.
   */
  registerDraggable(piece, callbacks) {
    if (!this._active || !this._root) return;
    piece.eventMode = 'static';
    piece.cursor = 'grab';

    const onDown = (event) => {
      // Only one drag at a time.
      if (this._draggingPiece) return;
      this._draggingPiece = piece;
      this._dragCallbacks = callbacks;
      piece.cursor = 'grabbing';
      const local = this._toRootLocal(event);
      if (callbacks && typeof callbacks.onDragStart === 'function') {
        callbacks.onDragStart(local);
      }
    };
    const onMove = (event) => {
      if (this._draggingPiece !== piece) return;
      const local = this._toRootLocal(event);
      if (this._dragCallbacks && typeof this._dragCallbacks.onDragMove === 'function') {
        this._dragCallbacks.onDragMove(local);
      }
    };
    const onUp = (event) => {
      if (this._draggingPiece !== piece) return;
      const local = this._toRootLocal(event);
      const cb = this._dragCallbacks;
      this._draggingPiece = null;
      this._dragCallbacks = null;
      piece.cursor = 'grab';
      if (cb && typeof cb.onDragEnd === 'function') {
        cb.onDragEnd(local);
      }
    };

    piece.on('pointerdown', onDown);
    this._listeners.push({ target: piece, event: 'pointerdown', handler: onDown });

    this._root.on('pointermove', onMove);
    this._listeners.push({ target: this._root, event: 'pointermove', handler: onMove });

    this._root.on('pointerup', onUp);
    this._listeners.push({ target: this._root, event: 'pointerup', handler: onUp });
    this._root.on('pointerupoutside', onUp);
    this._listeners.push({ target: this._root, event: 'pointerupoutside', handler: onUp });
  }

  _toRootLocal(event) {
    // PixiJS v8 FederatedPointerEvent: `global` is the screen-space point.
    // We convert into the root's local coordinate system so callbacks can
    // position pieces directly.
    const root = this._root;
    if (!root || !event || !event.global) return { x: 0, y: 0 };
    if (typeof root.toLocal === 'function') {
      const p = root.toLocal(event.global);
      return { x: p.x, y: p.y };
    }
    return { x: event.global.x, y: event.global.y };
  }
}

export { PIECE_EVENTS, ROOT_EVENTS };
