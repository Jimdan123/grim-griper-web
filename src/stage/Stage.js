import { Container, Text } from 'pixi.js';
import { StateMachine } from '../engine/StateMachine.js';
import { createChapelBackground } from '../art/placeholders/chapel/background.js';
import { createSacristyRoom } from '../art/placeholders/chapel/sacristyRoom.js';
import { createWaypointMarker } from '../art/placeholders/evidence/waypoint.js';
import { PALETTE, SCALE } from '../art/placeholders/constants.js';
import { createNaveRoomPixelArt } from '../art/pixelPalette/chapel/nave.js';
import { createChapelFrontDoor } from '../art/pixelPalette/chapel/frontDoor.js';
import { createChapelCeilingPixelArt } from '../art/pixelPalette/chapel/ceiling.js';
import { createChapelDayAmbientPixelArt } from '../art/pixelPalette/chapelBustle/dayAmbient.js';
import { createPewPixelArt } from '../art/pixelPalette/chapelBustle/pew.js';
import { createPixelArtConfessionRoomProps } from '../art/pixelPalette/confessionRoomProps.js';
import {
  RENDER_MODE,
  getRenderMode,
  onRenderModeChange,
} from '../render/TileRenderer.js';

function roomBoundsToLogical(room, tile) {
  return {
    x: room.x * tile,
    y: room.y * tile,
    width: room.w * tile,
    height: room.h * tile,
  };
}

const HAUNT_GRACE_MS = 1000;

export class Stage {
  constructor(data, gameState) {
    this.data = data;
    this.gameState = gameState;
    this.view = new Container();

    this.victim = null;
    this._onScoreEnter = null;

    const bounds = data.chapelBounds;
    this.floorY = bounds.y + bounds.height - SCALE.FRAME.FLOOR_STRIP_H;

    const tile = data.meta?.tile ?? 16;

    this._naveContainerPainterly = createChapelBackground(bounds);
    this._naveContainerPixelArt = createNaveRoomPixelArt({ tile, bounds });

    this._activeNaveContainer =
      getRenderMode() === RENDER_MODE.PIXELART
        ? this._naveContainerPixelArt
        : this._naveContainerPainterly;
    this.view.addChild(this._activeNaveContainer);

    // Pixel-art ceiling fills the band above chapelBounds. Visibility toggled
    // with the M-key render mode swap so painterly mode doesn't clash with
    // the painterly back wall. (The left-of-bounds "exterior" container was
    // deleted 2026-05-30 — it rendered outdoor art that read as bleed against
    // the chapel interior; worldOutside owns the entry scene now.)
    this._ceilingContainer = createChapelCeilingPixelArt({ bounds });
    this.view.addChild(this._ceilingContainer);
    this._ceilingContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;

    this._unsubRenderMode = onRenderModeChange((next) => {
      const target =
        next === RENDER_MODE.PIXELART
          ? this._naveContainerPixelArt
          : this._naveContainerPainterly;
      if (target !== this._activeNaveContainer) {
        this.view.removeChild(this._activeNaveContainer);
        this._activeNaveContainer = target;
        this.view.addChildAt(target, 0);
      }
      const pixel = next === RENDER_MODE.PIXELART;
      this._ceilingContainer.visible = pixel;
      this._pixelPropsContainer.visible = pixel;
      this._dayAmbientContainer.visible = pixel;
      this._pewsContainer.visible = pixel;
    });

    // Chapel front door — the hooded pilgrim walks INTO the chapel from
    // outside on boot via the entry-scene beat in main.js. Mounted AFTER
    // the nave so it sits on the back-wall plane, but BEFORE the sacristy
    // overlay + door arch so those paint over it on the right.
    this._frontDoorContainer = createChapelFrontDoor({ bounds });
    this.view.addChild(this._frontDoorContainer);

    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    const sacristyRoom = rooms.find((r) => r.id === 'sacristy');
    if (sacristyRoom) {
      const sacBounds = roomBoundsToLogical(sacristyRoom, tile);
      // In PIXELART mode the pixel-art nave already covers the sacristy band
      // and pixel-art props redress it; skip the painterly sacristy overlay
      // to avoid a register clash. Painterly mode keeps it for A/B.
      if (getRenderMode() !== RENDER_MODE.PIXELART) {
        this.view.addChild(createSacristyRoom(sacBounds));
      }
    }

    // Sacristy door arch removed 2026-05-30 evening — the walled-rooms pivot
    // (`[[walled-rooms-pivot-2026-05-30]]`) gives the partition walls their
    // own door openings inside `createNaveRoomPixelArt`, making the
    // JSON-link-driven back-wall arch at x=1040 redundant. The Victim walker
    // still consults `data.links` for multi-leg routing through the door
    // tile; only the visual marker is dropped here.

    // Waypoint markers removed 2026-05-30 per the Happy Hills pivot — the
    // chapel must read as an actual chapel, not a labelled puzzle board. The
    // waypoint DATA stays in confession-room.json because the Victim routine
    // walker uses those positions as anchors.
    void createWaypointMarker;

    this._dayAmbientContainer = createChapelDayAmbientPixelArt({ bounds });
    this.view.addChild(this._dayAmbientContainer);
    this._dayAmbientContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;

    this._pixelPropsContainer = createPixelArtConfessionRoomProps({ floorY: this.floorY });
    this.view.addChild(this._pixelPropsContainer);
    this._pixelPropsContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;

    // 2026-05-30 evening (post walled-rooms pivot): the floor candle shrines
    // dropped — the chapel ALREADY has wall-mounted lamps via the day-ambient
    // layer above, so floor shrines were redundant. Two pews kneel under the
    // 2nd and last sun shafts from `createChapelDayAmbientPixelArt`'s
    // SHAFT_XS = [192, 384, 576, 720, 880, 1072]. x=384 sits cleanly in the
    // nave between altar (220) and lectern (500), clear of pillars at 256 +
    // 512. x=1072 sits in the sacristy between door 2 (920) and the right
    // wall, near the sacristy waypoint (1060) without colliding with the
    // sacristy prop. Previous placement at x=512 collided with the lectern;
    // x=1180 was too close to the chapel right wall.
    this._pewsContainer = new Container();
    this._pewsContainer.label = 'pews-shrines-pixel';
    for (const px of [384, 1072]) {
      this._pewsContainer.addChild(createPewPixelArt({ x: px, floorY: this.floorY }));
    }
    this.view.addChild(this._pewsContainer);
    this._pewsContainer.visible = getRenderMode() === RENDER_MODE.PIXELART;

    this._haunt_placeholder = new Text({
      text: 'Phase 2 — slice 3',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 28,
        fill: PALETTE.WAYPOINT_LABEL,
        align: 'center',
      },
    });
    this._haunt_placeholder.anchor.set(0.5, 0);
    this._haunt_placeholder.x = bounds.x + bounds.width / 2;
    this._haunt_placeholder.y = bounds.y + 24;
    this._haunt_placeholder.visible = false;
    this.view.addChild(this._haunt_placeholder);

    this._hauntGraceElapsedMs = 0;
    this._routineStarted = false;

    this.phase = new StateMachine(
      {
        INVESTIGATION: {
          enter: () => {},
          update: () => {},
          exit: () => {},
        },
        HAUNT: {
          enter: () => {
            this._haunt_placeholder.visible = true;
            this._hauntGraceElapsedMs = 0;
            this._routineStarted = false;
            if (this.victim) {
              this.victim.view.visible = true;
            }
            // eslint-disable-next-line no-console
            console.log('[Stage] phase → HAUNT (slice 3)');
          },
          update: (dtMs) => {
            if (
              this.gameState &&
              this.gameState.fear >= 100 &&
              !this.phase.is('SCORE')
            ) {
              this.phase.transition('SCORE');
              return;
            }

            if (!this._routineStarted) {
              this._hauntGraceElapsedMs += dtMs;
              if (this._hauntGraceElapsedMs >= HAUNT_GRACE_MS) {
                this._routineStarted = true;
                if (this.victim) this.victim.startRoutine();
              }
            }

            if (this.victim) this.victim.update(dtMs);
          },
          exit: () => {
            this._haunt_placeholder.visible = false;
          },
        },
        SCORE: {
          enter: () => {
            if (this.victim) this.victim.enterFatedDeath();
          },
          update: (dtMs) => {
            if (this.victim) this.victim.update(dtMs);
          },
          exit: () => {},
        },
      },
      'INVESTIGATION',
    );
  }

  setVictim(victim) {
    this.victim = victim;
    if (this.victim && this.victim.view) {
      this.victim.view.visible = false;
    }
  }

  onScoreEnter(cb) {
    this._onScoreEnter = cb;
  }

  notifyFatedDeathComplete() {
    if (this._onScoreEnter) this._onScoreEnter();
  }

  tryAdvancePhase() {
    if (!this.phase.is('INVESTIGATION')) return false;
    if (!this.gameState || this.gameState.collectedEvidence.size < 4) return false;
    this.phase.transition('HAUNT');
    return true;
  }

  update(dtMs) {
    this.phase.update(dtMs);
  }
}
