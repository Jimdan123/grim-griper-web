// scoreRun.js
// Owner: #6 Math & Test Author. Consumer: #4 UI/HUD (EndScreen renders the
// breakdown), #3 Haunt AI (calls it on FEAR=100 to compute the run summary).
//
// Spec sources:
//   - docs/PRD.md §"Scoring" (lines 135-141)
//   - .scratch/grim-griper-puzzle-mvp/issues/06-test-score-run.md
//   - tests/scoreRun.test.js (the test is the spec)
//
// Pure: no Date.now(), no globals. Consumes an ordered event log emitted
// during Phase 2 and returns the breakdown + star grade rendered on
// EndScreen.
//
// Event shapes:
//   { type: 'hauntFired',         atMs: number }
//   { type: 'correctWaypointHit' }
//   { type: 'reactionTriggered' }
//   { type: 'fearMaxed',          atMs: number }
//   { type: 'stageFailed',        reason?: string }
//
// Formula (integer math after rounding):
//   score = (fearMaxed ? 1000 : 0)
//         + max(0, 90 - secondsToMax) * 5
//         + max(0, 4 - hauntsUsed)    * 100
//         + correctWaypointHits       * 75
//         - reactionsTriggered        * 50
//
// Stars: ≥1500 → 3, ≥1100 → 2, >0 → 1, stageFailed → 0.
// secondsToMax = (fearMaxed.atMs - firstHauntFired.atMs) / 1000.

const FEAR_MAXED_BONUS = 1000;
const SPEED_BONUS_PER_SEC = 5;
const SPEED_BONUS_CAP_SECONDS = 90;
const EFFICIENCY_BONUS_PER_SLOT = 100;
const EFFICIENCY_HAUNTS_BUDGET = 4;
const ACCURACY_BONUS_PER_HIT = 75;
const MISTAKE_PENALTY_PER_REACTION = 50;

const STARS_3_THRESHOLD = 1500;
const STARS_2_THRESHOLD = 1100;

/**
 * @param {Array<{type: string, atMs?: number, reason?: string}>} events
 * @returns {{ score: number, breakdown: object, stars: 0|1|2|3 }}
 */
export function scoreRun(events) {
  const list = Array.isArray(events) ? events : [];

  let fearMaxedAtMs = null;
  let firstHauntFiredAtMs = null;
  let hauntsUsed = 0;
  let correctWaypointHits = 0;
  let reactionsTriggered = 0;
  let stageFailed = false;

  for (const ev of list) {
    if (!ev || typeof ev.type !== 'string') continue;
    switch (ev.type) {
      case 'hauntFired':
        hauntsUsed += 1;
        if (firstHauntFiredAtMs === null && typeof ev.atMs === 'number') {
          firstHauntFiredAtMs = ev.atMs;
        }
        break;
      case 'correctWaypointHit':
        correctWaypointHits += 1;
        break;
      case 'reactionTriggered':
        reactionsTriggered += 1;
        break;
      case 'fearMaxed':
        if (typeof ev.atMs === 'number') fearMaxedAtMs = ev.atMs;
        else fearMaxedAtMs = fearMaxedAtMs ?? 0;
        break;
      case 'stageFailed':
        stageFailed = true;
        break;
      default:
        break;
    }
  }

  // secondsToMax: if fearMaxed occurred and we have a firstHauntFired, derive
  // from the event log. If fearMaxed without any prior hauntFired (PRD line
  // 191 — "should not be reachable but test asserts safe behavior"), fall
  // back to 0 — the most conservative choice: it does not award a speed
  // bonus that the player never earned, and it does not throw.
  let secondsToMax = 0;
  if (fearMaxedAtMs !== null && firstHauntFiredAtMs !== null) {
    secondsToMax = (fearMaxedAtMs - firstHauntFiredAtMs) / 1000;
  } else if (fearMaxedAtMs !== null && firstHauntFiredAtMs === null) {
    // Safe fallback: treat as full clamp (90s) so speedBonus = 0.
    secondsToMax = SPEED_BONUS_CAP_SECONDS;
  }

  // Empty / no-terminal-event short-circuit: if the stage neither maxed fear
  // nor failed, the run never reached a scorable end. Return zero rather than
  // award latent efficiency/speed bonuses for "0 haunts, 0 seconds" — that
  // would be a 850-pt phantom score. (Test: "empty event log — returns
  // zero-score, zero-star".)
  const hasTerminalEvent = fearMaxedAtMs !== null || stageFailed;
  if (!hasTerminalEvent) {
    return {
      score: 0,
      breakdown: {
        fearMaxedBonus: 0,
        speedBonus: 0,
        efficiencyBonus: 0,
        accuracyBonus: 0,
        mistakePenalty: 0,
        secondsToMax: 0,
        hauntsUsed,
        correctWaypointHits,
        reactionsTriggered,
        fearMaxed: false,
        stageFailed: false,
      },
      stars: 0,
    };
  }

  const fearMaxedBonus = fearMaxedAtMs !== null ? FEAR_MAXED_BONUS : 0;
  const speedBonus =
    Math.max(0, SPEED_BONUS_CAP_SECONDS - secondsToMax) * SPEED_BONUS_PER_SEC;
  const efficiencyBonus =
    Math.max(0, EFFICIENCY_HAUNTS_BUDGET - hauntsUsed) * EFFICIENCY_BONUS_PER_SLOT;
  const accuracyBonus = correctWaypointHits * ACCURACY_BONUS_PER_HIT;
  // Avoid -0 for the zero-reaction case (toMatchObject distinguishes -0 from 0).
  const mistakePenalty =
    reactionsTriggered === 0 ? 0 : -reactionsTriggered * MISTAKE_PENALTY_PER_REACTION;

  const rawScore =
    fearMaxedBonus + speedBonus + efficiencyBonus + accuracyBonus + mistakePenalty;
  const score = Math.round(rawScore);

  const breakdown = {
    fearMaxedBonus,
    speedBonus,
    efficiencyBonus,
    accuracyBonus,
    mistakePenalty,
    secondsToMax,
    hauntsUsed,
    correctWaypointHits,
    reactionsTriggered,
    fearMaxed: fearMaxedAtMs !== null,
    stageFailed,
  };

  let stars;
  if (stageFailed) stars = 0;
  else if (score >= STARS_3_THRESHOLD) stars = 3;
  else if (score >= STARS_2_THRESHOLD) stars = 2;
  else if (score > 0) stars = 1;
  else stars = 0;

  return { score, breakdown, stars };
}
