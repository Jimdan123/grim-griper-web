// Pure-ish budget math for Reaper Sight.
//
// PRD §"Sight budget" (line 108): hold-to-sustain; drain = 1ms per ms held;
// recharge = 2× drain rate; never exceed capacity.
//
// Single `tick(dtMs, isOn)` entrypoint so the SightFSM can hand off real-time
// without juggling drain/recharge calls. No Pixi imports — directly unit-
// testable by #6 (tests/SightBudget.test.js).

const RECHARGE_MULTIPLIER = 2;

export class SightBudget {
  constructor(capacityMs) {
    if (!Number.isFinite(capacityMs) || capacityMs <= 0) {
      throw new Error(`SightBudget: capacityMs must be a positive number, got ${capacityMs}`);
    }
    this.capacityMs = capacityMs;
    this._valueMs = capacityMs;
  }

  tick(dtMs, isOn) {
    if (dtMs <= 0) return;
    if (isOn) {
      // Drain. Clamp at 0 — SightFSM checks isExhausted() after to force OFF.
      this._valueMs = Math.max(0, this._valueMs - dtMs);
    } else {
      // Recharge at 2× rate. Clamp at capacity — never exceed.
      this._valueMs = Math.min(this.capacityMs, this._valueMs + dtMs * RECHARGE_MULTIPLIER);
    }
  }

  getMs() {
    return this._valueMs;
  }

  isExhausted() {
    return this._valueMs <= 0;
  }
}
