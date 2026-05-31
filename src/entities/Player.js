import { createReaperPlaceholder, SCALE } from '../art/placeholders.js';

const DEFAULT_MOVE_SPEED = 220;

export class Player {
  /**
   * @param {object} args
   * @param {InputManager} args.input
   * @param {{x,y,width,height}} args.bounds
   * @param {number} args.spawnX
   * @param {number} args.floorY
   * @param {number} [args.moveSpeed]
   * @param {() => import('pixi.js').Container} [args.viewFactory]
   *   Optional sprite factory (Foundation Engineer, 2026-05-30). Lets main.js
   *   inject the pixel-art Reaper sprite under pixelart render mode. Falls
   *   through to the painterly createReaperPlaceholder when omitted, so all
   *   existing call sites and tests keep working unchanged.
   */
  constructor({ input, bounds, spawnX, floorY, moveSpeed = DEFAULT_MOVE_SPEED, viewFactory }) {
    this.input = input;
    this.bounds = bounds;
    this.moveSpeed = moveSpeed;
    this.floorY = floorY;
    this.halfWidth = SCALE.REAPER.WIDTH / 2;

    this.view = (typeof viewFactory === 'function')
      ? viewFactory()
      : createReaperPlaceholder();
    this.view.x = spawnX;
    this.view.y = floorY;
    this._facing = 1;

    // Input-disabled mode (Stage + Art Lead, 2026-05-30): when true,
    // update() ignores InputManager and does NOT translate the sprite.
    // Used by the entry-scene walk-in beat where main.js drives the
    // sprite's x directly (lerp from off-screen-left into the chapel)
    // before handing control to the player.
    //
    // We deliberately keep this dead simple — a single boolean flag.
    // External callers (main.js EntryScene) flip it via setDisabled(true)
    // at boot, then setDisabled(false) when the walk-in completes.
    this._disabled = false;
  }

  /**
   * Toggle player-input control. While disabled, update() is a no-op:
   * key presses are ignored and the sprite holds its current position
   * (or whatever an external owner sets externally). Used by the entry
   * scene walk-in: main.js spawns Reaper off-screen-left, calls
   * setDisabled(true), lerps view.x into the chapel, then calls
   * setDisabled(false) so the player takes control.
   */
  setDisabled(disabled) {
    this._disabled = !!disabled;
  }

  isDisabled() {
    return this._disabled;
  }

  update(dtMs) {
    if (this._disabled) return;
    const dt = dtMs / 1000;
    let vx = 0;
    if (this.input.isPressed('MOVE_LEFT')) vx -= 1;
    if (this.input.isPressed('MOVE_RIGHT')) vx += 1;
    if (vx === 0) return;

    const nextX = this.view.x + vx * this.moveSpeed * dt;
    const minX = this.bounds.x + this.halfWidth;
    const maxX = this.bounds.x + this.bounds.width - this.halfWidth;
    this.view.x = Math.max(minX, Math.min(maxX, nextX));

    if (vx !== this._facing) {
      this._facing = vx;
      this.view.scale.x = vx;
    }
  }
}
