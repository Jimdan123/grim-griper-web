const DEFAULT_BINDINGS = {
  MOVE_LEFT: ['KeyA', 'ArrowLeft'],
  MOVE_RIGHT: ['KeyD', 'ArrowRight'],
  SIGHT: ['ShiftLeft', 'ShiftRight'],
  COLLECT: ['KeyE'],
  // INTERACT (Foundation Engineer, 2026-05-30): door-entry / generic
  // contextual action. Shares KeyE with COLLECT — context decides which
  // handler reacts (action handlers in main.js check door-proximity BEFORE
  // evidence collection so the boot-time entry beat wins cleanly while the
  // Reaper is still outside).
  INTERACT: ['KeyE'],
  ADVANCE: ['Tab'],
  HAUNT_1: ['Digit1'],
  HAUNT_2: ['Digit2'],
  HAUNT_3: ['Digit3'],
  HAUNT_4: ['Digit4'],
  PAUSE: ['Escape'],
  // TEMP DEBUG (Foundation Engineer, 2026-05-30): render-mode + day/night
  // hot-swap keys used by src/render/TileRenderer.js. M flips painterly ↔
  // pixelart; N flips dayLit (no visual effect this dispatch — night-state
  // nave ships next dispatch). Remove these once the day/night state machine
  // lands and the painterly path is retired.
  TOGGLE_RENDER_MODE: ['KeyM'],
  TOGGLE_DAY_NIGHT: ['KeyN'],
};

const PREVENT_DEFAULT_CODES = new Set([
  'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
]);

export class InputManager {
  constructor(target = window, bindings = DEFAULT_BINDINGS) {
    this.target = target;
    this.bindings = bindings;
    this._codeToActions = new Map();
    for (const [action, codes] of Object.entries(bindings)) {
      for (const code of codes) {
        if (!this._codeToActions.has(code)) this._codeToActions.set(code, []);
        this._codeToActions.get(code).push(action);
      }
    }
    this._pressed = new Set();
    this._pressedThisFrame = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  attach() {
    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('keyup', this._onKeyUp);
    this.target.addEventListener('blur', this._onBlur);
  }

  detach() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('blur', this._onBlur);
  }

  isPressed(action) {
    return this._pressed.has(action);
  }

  wasPressedThisFrame(action) {
    return this._pressedThisFrame.has(action);
  }

  endFrame() {
    this._pressedThisFrame.clear();
  }

  _onKeyDown(e) {
    const actions = this._codeToActions.get(e.code);
    if (!actions) return;
    if (PREVENT_DEFAULT_CODES.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    for (const action of actions) {
      if (!this._pressed.has(action)) {
        this._pressed.add(action);
        this._pressedThisFrame.add(action);
      }
    }
  }

  _onKeyUp(e) {
    const actions = this._codeToActions.get(e.code);
    if (!actions) return;
    for (const action of actions) this._pressed.delete(action);
  }

  _onBlur() {
    this._pressed.clear();
  }
}
