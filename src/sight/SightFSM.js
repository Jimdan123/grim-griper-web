// SightFSM — binary state machine wrapping the shared StateMachine class.
//
// PRD §"State machines" + §"Sight budget":
//   OFF ⇄ ON, driven by the SIGHT action from InputManager.
//   Budget drains while ON, recharges while OFF (handled by SightBudget).
//   When budget hits 0 while ON, force OFF this frame.
//
// SightFSM owns the per-frame tick: read input → tick budget → check
// exhaustion → drive FX. Stage and main.js consume it via update(dtMs).

import { StateMachine } from '../engine/StateMachine.js';

export class SightFSM {
  constructor({ input, budget, fx }) {
    this.input = input;
    this.budget = budget;
    this.fx = fx;

    // Latched after exhaustion-triggered force-OFF. Prevents ON ⇄ OFF
    // oscillation when SHIFT is held past budget=0: budget recharges fast
    // enough that a held SHIFT would re-enter ON within 1–2 frames. PRD
    // "Hold-to-sustain" requires release+repress to re-engage.
    this.blockedUntilRelease = false;

    this.fsm = new StateMachine(
      {
        OFF: {
          enter: () => {
            this.fx.setOn(false);
          },
        },
        ON: {
          enter: () => {
            this.fx.setOn(true);
          },
        },
      },
      'OFF',
    );
  }

  update(dtMs) {
    const wantsOn = this.input.isPressed('SIGHT');

    // Clear the post-exhaustion latch only once the player has released SHIFT.
    if (!wantsOn) {
      this.blockedUntilRelease = false;
    }

    // Tick budget against the *current* state (not the desired one) so a single
    // frame that drains to zero can still transition ON → OFF after the tick.
    const currentlyOn = this.fsm.is('ON');
    this.budget.tick(dtMs, currentlyOn);

    if (currentlyOn) {
      // Auto-cutoff: budget reached zero this frame, force OFF.
      const exhausted = this.budget.isExhausted();
      if (exhausted || !wantsOn) {
        if (exhausted) {
          // Latch so a held SHIFT can't re-trigger ON next frame after the
          // budget partially recharges. Player must release to re-engage.
          this.blockedUntilRelease = true;
        }
        this.fsm.transition('OFF');
      }
    } else {
      // Refuse to enter ON if budget is empty — no SFX cue for slice 2.
      if (wantsOn && !this.budget.isExhausted() && !this.blockedUntilRelease) {
        this.fsm.transition('ON');
      }
    }
  }

  isOn() {
    return this.fsm.is('ON');
  }
}
