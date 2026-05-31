// TileRenderer.js — render-mode + day/night state for the Happy Hills pivot.
//
// Owner: #1 Foundation Engineer.
//
// This module holds two slice-local globals that other systems read each
// construction (and, for `renderMode`, also at runtime when the `M` debug key
// fires):
//
//   - renderMode:  'painterly' | 'pixelart'   (default: 'pixelart' for the rebuild)
//   - dayLit:      boolean                    (default: true)
//
// The defaults match the post-2026-05-30 pivot: when the user reloads, they
// see the new pixel-art chapel. The painterly chapel is still on disk and
// reachable by pressing `M` so the user can compare side-by-side during the
// rebuild. The `N` key is wired but is a no-op-with-log this dispatch — the
// night-state nave sprite ships in the next dispatch.
//
// Scope discipline:
//   - This file owns ONLY the mode flag + day/night flag + debug key wiring.
//   - It does NOT know how to render anything. Stage / main.js read
//     getRenderMode() at construction and pick the appropriate factory.
//   - It does NOT own the day/night state machine (next dispatch).
//
// All debug key handlers are marked TEMP DEBUG so they're easy to grep + rip
// out when the day/night state machine lands.

export const RENDER_MODE = Object.freeze({
  PAINTERLY: 'painterly',
  PIXELART: 'pixelart',
});

// --- Render mode -----------------------------------------------------------

// Default to PIXELART for the post-pivot rebuild. The painterly path stays
// reachable via setRenderMode(RENDER_MODE.PAINTERLY) or the `M` debug key.
let _currentMode = RENDER_MODE.PIXELART;

export function getRenderMode() {
  return _currentMode;
}

export function setRenderMode(mode) {
  if (mode !== RENDER_MODE.PAINTERLY && mode !== RENDER_MODE.PIXELART) {
    throw new Error(`unknown render mode: ${mode}`);
  }
  _currentMode = mode;
}

// --- Day/night flag --------------------------------------------------------
//
// Slice-local boolean only. The full day/night state machine ships in the
// next dispatch; this is the parameter that machine will drive. Today the
// `N` debug key flips this flag and logs — no visual change yet, because the
// night-state pixel-art nave is on #5's next dispatch list, not this one.

let _dayLit = true;

export function isDayLit() {
  return _dayLit;
}

export function setDayLit(lit) {
  _dayLit = !!lit;
}

// --- Listener registry for runtime hot-swap --------------------------------
//
// Stage subscribes here so it can flip its painterly / pixel-art nave
// containers in/out when `M` is pressed without being re-constructed. Each
// listener is called with (newMode, prevMode) after the global flag has been
// updated. Used by Stage.js only; main.js opts out (character sprites are
// construction-time only this dispatch — `M` while running just toggles the
// environment + logs the reload-for-characters hint).

const _modeListeners = new Set();

export function onRenderModeChange(listener) {
  _modeListeners.add(listener);
  return () => _modeListeners.delete(listener);
}

const _dayLitListeners = new Set();

export function onDayLitChange(listener) {
  _dayLitListeners.add(listener);
  return () => _dayLitListeners.delete(listener);
}

// --- Debug key handler -----------------------------------------------------
//
// TEMP DEBUG: keyboard hot-swap. Removed once the day/night state machine
// ships and the user no longer needs to compare painterly/pixelart at runtime.
//
// We use InputManager actions (TOGGLE_RENDER_MODE, TOGGLE_DAY_NIGHT) rather
// than raw keydown so the bindings live in one place (InputManager.js) and
// future remap work doesn't have to touch this file. `M` and `N` are added
// to DEFAULT_BINDINGS by this dispatch.

/**
 * Attach the debug-key handler to a GameLoop tick. Caller passes the
 * InputManager + the loop so we can register an updater that polls
 * wasPressedThisFrame each frame. Returns a teardown fn.
 *
 * @param {object} args
 * @param {import('../engine/InputManager.js').InputManager} args.input
 * @param {import('../engine/GameLoop.js').GameLoop} args.loop
 */
export function attachDebugKeys({ input, loop }) {
  // TEMP DEBUG — slice-local hot-swap. Remove when day/night FSM lands.
  const tick = {
    update: () => {
      if (input.wasPressedThisFrame('TOGGLE_RENDER_MODE')) {
        const prev = _currentMode;
        const next = prev === RENDER_MODE.PIXELART
          ? RENDER_MODE.PAINTERLY
          : RENDER_MODE.PIXELART;
        _currentMode = next;
        // eslint-disable-next-line no-console
        console.log(
          `[Renderer] mode → ${next} (was ${prev}). Environment swaps inline; ` +
          'character sprites require page reload.',
        );
        for (const cb of _modeListeners) {
          try { cb(next, prev); }
          catch (e) { /* eslint-disable-next-line no-console */ console.error('[Renderer] mode listener threw', e); }
        }
      }

      if (input.wasPressedThisFrame('TOGGLE_DAY_NIGHT')) {
        const prev = _dayLit;
        _dayLit = !prev;
        // eslint-disable-next-line no-console
        console.log(
          `[Renderer] dayLit → ${_dayLit} (was ${prev}). ` +
          'No visual effect yet — night-state pixel-art lands next dispatch.',
        );
        for (const cb of _dayLitListeners) {
          try { cb(_dayLit, prev); }
          catch (e) { /* eslint-disable-next-line no-console */ console.error('[Renderer] dayLit listener threw', e); }
        }
      }
    },
  };
  loop.add(tick);
  return () => { /* loop has no remove() today; teardown is a no-op for slice-local debug keys */ };
}

/**
 * Boot log — main.js calls this once after Application init so the user knows
 * which mode they're looking at and how to swap.
 */
export function logBootMode() {
  // eslint-disable-next-line no-console
  console.log(
    `[Renderer] mode = ${_currentMode}, dayLit = ${_dayLit}. ` +
    'Press M to toggle painterly/pixelart, N to toggle day/night ' +
    '(no visual effect yet — night sprites land next dispatch).',
  );
}
