// SightFX — owns the visual side of Reaper Sight.
//
// - ColorMatrixFilter on the world Container desaturates the entire investigable
//   world while sight is ON (PRD line 103). It is NOT applied to app.stage, so
//   the FpsOverlay and SightMeter (screen-space UI) stay full color.
// - OutlineFilter (from pixi-filters) per uncollected EvidenceItem rings each
//   piece while sight is ON (PRD line 104). One filter instance per evidence
//   so VP can tweak per-item later.
// - GhostReplay visibility is toggled by setOn() against its bound evidence's
//   collected flag.

import { ColorMatrixFilter } from 'pixi.js';
import { OutlineFilter } from 'pixi-filters';
import { PALETTE } from '../art/placeholders/constants.js';

const OUTLINE_THICKNESS = 3;
const OUTLINE_QUALITY = 0.5;

// Cream / pale outline color — palette-aligned. PALETTE.WAYPOINT_LABEL is the
// cream we use elsewhere for legibility against the dark chapel mass.
const OUTLINE_COLOR = PALETTE.WAYPOINT_LABEL;

export class SightFX {
  constructor() {
    this._world = null;
    this._evidenceItems = [];
    this._ghostReplays = [];
    this._colorMatrix = new ColorMatrixFilter();
    // pixi v8 API: desaturate() is a clean named call; equivalent to saturate(0).
    this._colorMatrix.desaturate();
    this._outlines = new Map(); // evidenceItem -> OutlineFilter
    this._isOn = false;
  }

  attach(world, evidenceItems, ghostReplays = []) {
    this._world = world;
    this._evidenceItems = evidenceItems;
    this._ghostReplays = ghostReplays;
    for (const ev of evidenceItems) {
      const filter = new OutlineFilter({
        thickness: OUTLINE_THICKNESS,
        color: OUTLINE_COLOR,
        quality: OUTLINE_QUALITY,
      });
      this._outlines.set(ev, filter);
    }
    // Initialize OFF state.
    this.setOn(false);
  }

  setOn(isOn) {
    this._isOn = isOn;
    if (!this._world) return;

    // World desaturation. Use null (not []) when off to drop the filter
    // pipeline entirely — slightly cheaper per-frame.
    this._world.filters = isOn ? [this._colorMatrix] : null;

    // Per-evidence outlines + ghosts. Walk both lists; respect collected flag.
    for (const ev of this._evidenceItems) {
      const filter = this._outlines.get(ev);
      ev.view.filters = isOn && !ev.isCollected && filter ? [filter] : null;
    }
    for (const ghost of this._ghostReplays) {
      // Ghost knows its own bound evidence's collected state via Stage wiring;
      // for slice 2 we keep it simple — Stage calls setVisible() directly on
      // collect. Here we drive the sight-on/off half of the predicate.
      ghost.setVisible(isOn && !ghost.isBoundEvidenceCollected());
    }
  }

  // Called by Stage when an evidence is collected, so the outline & ghost
  // disappear instantly even while sight is held.
  removeFromOutlineList(evidenceItem) {
    if (evidenceItem.view) evidenceItem.view.filters = null;
  }

  isOn() {
    return this._isOn;
  }
}
