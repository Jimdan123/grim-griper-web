// EvidenceItem — Pixi Container wrapper around the placeholder factory
// owned by #5 (src/art/placeholders.js → createEvidencePlaceholder).
//
// Owns its hauntId, world-space position, collected flag, and proximity
// detection against the Reaper for the COLLECT key (E).
//
// Proximity radius is locked at 60px for slice 2 (not in PRD — see
// design doc §9.1). May migrate to reaperTraits in a later pass.
//
// Hidden-evidence support (2026-05-30, Stage + Art Lead):
// JSON evidence entries MAY carry `visible: false` for clue-gated pieces
// (confession ledger inside the locked booth; lime spade in the not-yet-
// authored crypt). While hidden:
//   * the sprite is NOT mounted into the view (view.visible = false), so
//     SightFX's OutlineFilter has nothing to ring;
//   * isInProximity() returns false (player can't pick it up);
//   * collect() short-circuits (no programmatic collection);
//   * the bound GhostReplay still renders at ghostX/ghostY — that's the
//     clue layer ("something happened here").
// A setVisible(bool) method exists for future dispatches to UN-hide the
// ledger (when the booth opens) and the spade (when the crypt entrance is
// found).

import { createEvidencePlaceholder } from '../art/placeholders/evidence/items/composite.js';

const PROXIMITY_RADIUS_PX = 60;

export class EvidenceItem {
  constructor(evidenceData) {
    this.id = evidenceData.id;
    this.hauntId = evidenceData.hauntId;
    this.hauntSourceWaypointId = evidenceData.hauntSourceWaypointId;
    this.position = { x: evidenceData.x, y: evidenceData.y };
    this.isCollected = false;
    // Default visible:true if the field is absent (back-compat for any
    // older JSON / tests). Stage + Art Lead dispatch 2026-05-30 introduces
    // the field; ledger + spade ship as visible:false this dispatch.
    this._visible = evidenceData.visible !== false;

    this.view = createEvidencePlaceholder(evidenceData);
    this.view.x = this.position.x;
    this.view.y = this.position.y;
    // Hidden evidence: keep the sprite suppressed. SightFX walks the
    // evidenceItems array unconditionally; the filter still gets created
    // (so setVisible(true) later wires up the outline correctly), but the
    // view itself isn't rendered while _visible === false.
    if (!this._visible) {
      this.view.visible = false;
    }
  }

  isInProximity(playerX, playerY) {
    if (this.isCollected) return false;
    if (!this._visible) return false;
    const dx = playerX - this.position.x;
    const dy = playerY - this.position.y;
    return dx * dx + dy * dy <= PROXIMITY_RADIUS_PX * PROXIMITY_RADIUS_PX;
  }

  collect() {
    if (this.isCollected) return false;
    if (!this._visible) return false;
    this.isCollected = true;
    // Hide the placeholder; outline removal + ghost hiding handled by callers.
    this.view.visible = false;
    return true;
  }

  /**
   * UN-hide (or re-hide) this evidence at runtime. Used by future dispatches
   * when a clue is solved: e.g. the confession booth opens → ledger.setVisible(true),
   * the crypt entrance is found → spade.setVisible(true). When set to true on
   * an uncollected piece, the sprite re-mounts visually and proximity / collect
   * become live again.
   *
   * Note: SightFX caches an OutlineFilter per evidence at attach() time. We do
   * NOT need to re-register here — flipping view.visible is enough because
   * the filter is applied to view.filters and view.visible gates the whole
   * pipeline (filter included).
   */
  setVisible(bool) {
    this._visible = !!bool;
    // If the evidence has already been collected, keep it hidden — collect()
    // already set view.visible = false and that should stick.
    if (this.isCollected) {
      this.view.visible = false;
      return;
    }
    this.view.visible = this._visible;
  }

  get visible() {
    return this._visible;
  }
}

export { PROXIMITY_RADIUS_PX };
