// PuzzleScene — drag-to-slot puzzle subsystem for the booth + sacristy
// rooms (#23b). Pure-data driven: takes a config blob (pieces, slots,
// correctMap, backdrop, success copy) and produces a Pixi Container ready
// to be mounted into app.stage as a full-screen overlay.
//
// Behaviour (locked in ticket #23 "Per-room puzzles"):
//   - Pieces are draggable cards (rounded-rect + text label).
//   - Slots are outlined drop targets.
//   - Drop on the correct slot → snap (instant), piece becomes non-interactive,
//     mark placed.
//   - Drop on wrong slot or empty space → bounce back to origin over BOUNCE_MS
//     with ease-out. Player can try again.
//   - All pieces placed correctly → onSolved() callback fires once.
//
// Mount target: `app.stage` (screen-space). This sits above the world, so the
// chapel scene is dimmed but still visible behind a translucent backdrop.
//
// Sight requirement: pieces are always visible inside the puzzle scene (no
// SHIFT requirement). The resulting evidence in the chapel still requires
// Sight + E — that's handled by existing SightFX + COLLECT.
//
// Pure helpers (checkPlacement, isSolved) are exported so the unit tests can
// exercise solve detection without standing up Pixi.

import { Container, Graphics, Text } from 'pixi.js';
import { MouseManager } from '../engine/MouseManager.js';

const BOUNCE_MS = 300;

// Default viewport — must match the logical world size in main.js / boot/createApp.
const DEFAULT_VIEW_W = 1280;
const DEFAULT_VIEW_H = 720;

/**
 * Pure: does this piece belong in this slot?
 * @returns {'correct'|'wrong'}
 */
export function checkPlacement(pieceId, slotId, correctMap) {
  if (!correctMap || typeof correctMap !== 'object') return 'wrong';
  return correctMap[pieceId] === slotId ? 'correct' : 'wrong';
}

/**
 * Pure: are all pieces correctly placed?
 * `placements` is a map of pieceId → slotId (only includes pieces currently
 * resting in a slot; pieces being dragged or back at origin are absent).
 */
export function isSolved(placements, correctMap) {
  if (!placements || !correctMap) return false;
  const expectedIds = Object.keys(correctMap);
  if (expectedIds.length === 0) return false;
  for (const pieceId of expectedIds) {
    if (placements[pieceId] !== correctMap[pieceId]) return false;
  }
  return true;
}

/**
 * Hit-test: which slot (if any) does (x, y) fall inside? slots are
 * axis-aligned rects in puzzle-local space.
 */
export function findSlotAt(x, y, slots) {
  for (const s of slots) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
  }
  return null;
}

function parseHex(maybeHex, fallback) {
  if (typeof maybeHex === 'number') return maybeHex;
  if (typeof maybeHex === 'string' && maybeHex.startsWith('0x')) {
    const n = Number(maybeHex);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export class PuzzleScene {
  /**
   * @param {object} args
   * @param {object} args.config — puzzle JSON: { pieces, slots, correctMap, backdrop, ... }
   * @param {() => void} args.onSolved — fires once when all pieces correctly placed
   * @param {number} [args.screenWidth] — viewport width (defaults to 1280)
   * @param {number} [args.screenHeight] — viewport height (defaults to 720)
   * @param {MouseManager} [args.mouseManager] — optional injected manager
   *                                              (mainly so tests can stub)
   */
  constructor({ config, onSolved, screenWidth = DEFAULT_VIEW_W, screenHeight = DEFAULT_VIEW_H, mouseManager }) {
    this.config = config;
    this.onSolved = typeof onSolved === 'function' ? onSolved : () => {};
    this._solvedFired = false;

    // pieceId → { piece view, originX, originY, placedSlotId|null,
    //             bouncing: { fromX, fromY, toX, toY, remainingMs } | null }
    this._pieceState = new Map();
    // pieceId → slotId for currently-placed pieces
    this._placements = {};

    this.view = new Container();
    this.view.label = 'puzzle-scene';

    const bdW = config.backdrop?.width ?? 760;
    const bdH = config.backdrop?.height ?? 540;
    // Center the puzzle in the viewport.
    const offsetX = Math.round((screenWidth - bdW) / 2);
    const offsetY = Math.round((screenHeight - bdH) / 2);

    // Full-screen dim behind the puzzle so the chapel reads as "background".
    const dim = new Graphics();
    dim.rect(0, 0, screenWidth, screenHeight).fill({ color: 0x000000, alpha: 0.55 });
    dim.eventMode = 'static'; // swallow clicks outside the puzzle
    this.view.addChild(dim);

    // Backdrop frame (parchment / wood) — owns the puzzle-local coordinate
    // system. Pieces + slots are children of this.
    const backdrop = new Graphics();
    const bdColor = parseHex(config.backdrop?.color, 0xe8dcb3);
    const bdEdge = parseHex(config.backdrop?.edgeColor, 0x6b5538);
    backdrop
      .roundRect(0, 0, bdW, bdH, 12)
      .fill({ color: bdColor })
      .stroke({ color: bdEdge, width: 4 });
    backdrop.x = offsetX;
    backdrop.y = offsetY;
    backdrop.eventMode = 'static';
    this.view.addChild(backdrop);
    this._puzzleRoot = backdrop;

    if (config.title) {
      const title = new Text({
        text: config.title,
        style: { fontFamily: 'serif', fontSize: 22, fill: 0x2a1f12, fontWeight: 'bold' },
      });
      title.x = 20;
      title.y = 16;
      backdrop.addChild(title);
    }
    if (config.subtitle) {
      const sub = new Text({
        text: config.subtitle,
        style: { fontFamily: 'serif', fontSize: 14, fill: 0x4a3a26, fontStyle: 'italic' },
      });
      sub.x = 20;
      sub.y = 46;
      backdrop.addChild(sub);
    }

    // Slots — drawn first so pieces render on top.
    this._slots = Array.isArray(config.slots) ? config.slots : [];
    for (const s of this._slots) {
      const g = new Graphics();
      g.roundRect(0, 0, s.w, s.h, 6).stroke({ color: 0x6b5538, width: 2, alpha: 0.7 });
      g.x = s.x;
      g.y = s.y;
      backdrop.addChild(g);
    }

    // Pieces.
    this._mouse = mouseManager || new MouseManager();
    this._mouse.enable(backdrop);

    const piecesData = Array.isArray(config.pieces) ? config.pieces : [];
    for (const p of piecesData) {
      const view = this._buildPieceView(p);
      view.x = p.x;
      view.y = p.y;
      backdrop.addChild(view);

      const state = {
        id: p.id,
        view,
        data: p,
        originX: p.x,
        originY: p.y,
        placedSlotId: null,
        bouncing: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
      };
      this._pieceState.set(p.id, state);

      this._mouse.registerDraggable(view, {
        onDragStart: (pt) => this._onDragStart(state, pt),
        onDragMove: (pt) => this._onDragMove(state, pt),
        onDragEnd: (pt) => this._onDragEnd(state, pt),
      });
    }

    this._screenSize = { w: screenWidth, h: screenHeight };
  }

  _buildPieceView(p) {
    const c = new Container();
    const g = new Graphics();
    const fillColor = parseHex(p.color, 0xf6ecc7);
    g.roundRect(0, 0, p.w, p.h, 6)
      .fill({ color: fillColor })
      .stroke({ color: 0x3a2a18, width: 2 });
    c.addChild(g);

    if (p.text) {
      const t = new Text({
        text: p.text,
        style: {
          fontFamily: 'serif',
          fontSize: 13,
          fill: 0x2a1f12,
          wordWrap: true,
          wordWrapWidth: p.w - 16,
          align: 'left',
        },
      });
      t.x = 8;
      t.y = 8;
      c.addChild(t);
    }
    return c;
  }

  _onDragStart(state, pt) {
    if (state.placedSlotId) return; // already placed correctly; lock
    state.dragOffsetX = pt.x - state.view.x;
    state.dragOffsetY = pt.y - state.view.y;
    state.bouncing = null;
  }

  _onDragMove(state, pt) {
    if (state.placedSlotId) return;
    state.view.x = pt.x - state.dragOffsetX;
    state.view.y = pt.y - state.dragOffsetY;
  }

  _onDragEnd(state, pt) {
    if (state.placedSlotId) return;
    // Center of the piece in puzzle-local space.
    const cx = state.view.x + state.data.w / 2;
    const cy = state.view.y + state.data.h / 2;
    const slot = findSlotAt(cx, cy, this._slots);
    if (slot && checkPlacement(state.id, slot.id, this.config.correctMap) === 'correct') {
      // Snap into the slot.
      state.view.x = slot.x;
      state.view.y = slot.y;
      state.placedSlotId = slot.id;
      this._placements[state.id] = slot.id;
      if (isSolved(this._placements, this.config.correctMap) && !this._solvedFired) {
        this._solvedFired = true;
        // Defer one frame so the snap visually lands before unmount.
        this._solveDeferredMs = 250;
      }
      return;
    }
    // Wrong slot or empty space — bounce back to origin.
    state.bouncing = {
      fromX: state.view.x,
      fromY: state.view.y,
      toX: state.originX,
      toY: state.originY,
      remainingMs: BOUNCE_MS,
    };
  }

  update(dtMs) {
    for (const state of this._pieceState.values()) {
      const b = state.bouncing;
      if (!b) continue;
      b.remainingMs = Math.max(0, b.remainingMs - dtMs);
      const t = 1 - b.remainingMs / BOUNCE_MS; // 0 → 1
      // Ease-out cubic.
      const e = 1 - Math.pow(1 - t, 3);
      state.view.x = b.fromX + (b.toX - b.fromX) * e;
      state.view.y = b.fromY + (b.toY - b.fromY) * e;
      if (b.remainingMs === 0) {
        state.view.x = b.toX;
        state.view.y = b.toY;
        state.bouncing = null;
      }
    }

    if (typeof this._solveDeferredMs === 'number') {
      this._solveDeferredMs -= dtMs;
      if (this._solveDeferredMs <= 0) {
        this._solveDeferredMs = null;
        try {
          this.onSolved();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[PuzzleScene] onSolved threw', err);
        }
      }
    }
  }

  /**
   * Reset every piece to its origin and clear placements. Used by ESC
   * unmount per the ticket: "Pieces reset, no progress."
   */
  reset() {
    this._placements = {};
    this._solvedFired = false;
    this._solveDeferredMs = null;
    for (const state of this._pieceState.values()) {
      state.view.x = state.originX;
      state.view.y = state.originY;
      state.placedSlotId = null;
      state.bouncing = null;
    }
  }

  /**
   * Tear down listeners + remove from parent. Caller is responsible for
   * dropping the reference so it can be GC'd.
   */
  destroy() {
    if (this._mouse) this._mouse.disable();
    if (this.view && this.view.parent) {
      this.view.parent.removeChild(this.view);
    }
    if (this.view && typeof this.view.destroy === 'function') {
      this.view.destroy({ children: true });
    }
  }
}

export { BOUNCE_MS };
