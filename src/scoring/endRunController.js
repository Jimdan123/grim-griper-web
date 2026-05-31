// Wires Stage.onScoreEnter → scoreRun → endScreen.show. Stage flips to
// SCORE on FEAR=100, the Victim plays its Fated Death fade and bubbles
// onFatedDeathComplete back through Stage, and this controller picks it
// up to render the end-of-run screen.

import { scoreRun } from './scoreRun.js';

export function wireEndRunController({ stage, gameState, endScreen }) {
  stage.onScoreEnter(() => {
    // Append fearMaxed using the same clock domain as hauntFired so
    // scoreRun's secondsToMax derives correctly.
    gameState.phase2EventLog.push({
      type: 'fearMaxed',
      atMs: performance.now(),
    });
    const result = scoreRun(gameState.phase2EventLog);
    endScreen.show(result);
  });
}
