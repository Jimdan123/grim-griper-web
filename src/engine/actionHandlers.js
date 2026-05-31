// Per-frame action handlers — INTERACT (door), COLLECT (evidence),
// ADVANCE (TAB phase), and the Haunt keys (1-4). Returns a `{ update }`
// object that the GameLoop ticks; the update closure also drives the
// per-frame EntryPrompt visibility, SightMeter readout, EvidenceCounter,
// and RadialHauntMenu position.

const HAUNT_COOLDOWN_MS = 15_000;
const FEAR_MAX = 100;
const DEFAULT_DOOR_PROXIMITY_PX = 40;

function findPuzzleDoorInProximity(puzzleDoors, playerX) {
  for (const door of puzzleDoors) {
    if (!Number.isFinite(door.x)) continue;
    const prox = Number.isFinite(door.proximityPx) ? door.proximityPx : DEFAULT_DOOR_PROXIMITY_PX;
    if (Math.abs(playerX - door.x) <= prox) return door;
  }
  return null;
}

const DEFAULT_OUTSIDE_DOOR_MESSAGE = 'Press E to enter the chapel';
// Only SHATTER is wired this slice; the others remain mapped so slice 4
// only needs to flip the SET below.
const HAUNT_ACTION_MAP = {
  HAUNT_1: 'SHATTER',
  HAUNT_2: 'WHISPER',
  HAUNT_3: 'VOICE',
  HAUNT_4: 'RISE',
};

export function createActionHandlers({
  input,
  player,
  world,
  stage,
  stageData,
  gameState,
  sceneSwap,
  sightFSM,
  sightFX,
  sightBudget,
  victim,
  evidenceItems,
  ghostReplays,
  hud,
  puzzleHost,
}) {
  const puzzleDoors = Array.isArray(stageData.puzzleDoors) ? stageData.puzzleDoors : [];

  // Map evidenceUnlockedId → EvidenceItem so the puzzle-solve callback can
  // flip visibility without iterating the array each time.
  const evidenceById = new Map();
  for (const ev of evidenceItems) evidenceById.set(ev.id, ev);

  // `puzzleHost` is the integration point with main.js — it knows how to
  // mount/unmount a PuzzleScene onto the HUD layer and exposes `isMounted()`
  // so we can gate input suppression. Optional so tests / older callers that
  // don't wire it still work.
  const safePuzzleHost = puzzleHost && typeof puzzleHost.mount === 'function'
    ? puzzleHost
    : null;

  return {
    update: (dtMs = 16) => {
      // While a puzzle is mounted: suppress everything except the puzzle's
      // own per-frame update + its ESC unmount handler. Player movement /
      // SIGHT / COLLECT / TAB / haunts are all parked. Solving the puzzle
      // (from inside PuzzleScene) calls back into the puzzleHost which
      // unmounts and re-enables this branch.
      if (safePuzzleHost && safePuzzleHost.isMounted()) {
        // Drive the puzzle scene's own bounce/solve-defer timers.
        safePuzzleHost.update(dtMs);
        if (input.wasPressedThisFrame('PAUSE')) {
          // ESC: graceful exit, pieces reset, no progress. Re-enterable.
          safePuzzleHost.unmount({ reason: 'esc' });
        }
        // Keep the player frozen at their current x; setDisabled was already
        // called at mount-time.
        return;
      }

      // INTERACT prompt — picks one of three contexts each frame:
      //   1. Outside chapel + at front door → "Press E to enter the chapel"
      //   2. Inside chapel + INVESTIGATION + at a puzzle door → that door's enterMessage
      //   3. Otherwise → hidden
      // Solved doors no longer light up — the evidence is collectable in the
      // chapel via Sight + E now.
      // The entryPrompt is one shared HUD pill; setMessage swaps the text +
      // re-fits the pill bg width so the label stays centered.
      const outsideAtDoor =
        sceneSwap.state === 'outside' && sceneSwap.isInProximity();
      const rawPuzzleDoor =
        sceneSwap.state === 'inside' && stage.phase.is('INVESTIGATION')
          ? findPuzzleDoorInProximity(puzzleDoors, player.view.x)
          : null;
      const puzzleDoorAtPlayer =
        rawPuzzleDoor && !gameState.puzzlesSolved.has(rawPuzzleDoor.id)
          ? rawPuzzleDoor
          : null;
      const promptVisible = outsideAtDoor || puzzleDoorAtPlayer !== null;
      if (promptVisible) {
        const msg = outsideAtDoor
          ? DEFAULT_OUTSIDE_DOOR_MESSAGE
          : puzzleDoorAtPlayer.enterMessage || `Press E to enter the ${puzzleDoorAtPlayer.kind}`;
        hud.entryPrompt.setMessage(msg);
      }
      if (hud.entryPrompt.view.visible !== promptVisible) {
        hud.entryPrompt.setVisible(promptVisible);
      }

      // INTERACT (chapel front door) — outside → enter sequence.
      if (input.wasPressedThisFrame('INTERACT') && sceneSwap.canConsumeInteract()) {
        sceneSwap.beginEnter();
        return; // consume E for this frame
      }

      // INTERACT (puzzle door) — inside chapel + INVESTIGATION + at an
      // unsolved door. Mount the drag-to-slot PuzzleScene; on solve, flip
      // the bound evidence to visible:true. Per #23 §"Wire to evidence
      // reveal": the evidence still requires Sight + E to collect after
      // the puzzle solve — that's handled by the existing COLLECT path.
      if (input.wasPressedThisFrame('INTERACT') && puzzleDoorAtPlayer) {
        if (safePuzzleHost) {
          const door = puzzleDoorAtPlayer;
          // eslint-disable-next-line no-console
          console.log('[PuzzleDoor] mount', {
            id: door.id,
            kind: door.kind,
            puzzleFile: door.puzzleFile,
          });
          // Freeze player + clear any in-flight SIGHT before the puzzle
          // takes over the screen. SightFSM owns its own state but it
          // reads input each tick, so we just hide the FX and re-enable
          // on unmount.
          if (typeof player.setDisabled === 'function') player.setDisabled(true);
          safePuzzleHost.mount({
            door,
            onSolved: () => {
              gameState.puzzlesSolved.add(door.id);
              const ev = evidenceById.get(door.evidenceUnlockedId);
              if (ev && typeof ev.setVisible === 'function') {
                ev.setVisible(true);
              }
              // Feedback bubble at the door position (screen-space). The
              // human reads this as the diegetic "ledger / spade revealed"
              // beat — the actual evidence sprite is now visible in the
              // chapel and collectable via Sight + E.
              const screenPt = world.toGlobal({ x: door.x, y: player.view.y - 40 });
              const copy = door.successCopy
                || (door.evidenceUnlockedId === 'confessionLedger'
                  ? 'Ledger found'
                  : 'Spade found');
              hud.collectionFeedback.show(copy, screenPt.x, screenPt.y);
            },
            onUnmount: () => {
              if (typeof player.setDisabled === 'function') player.setDisabled(false);
            },
          });
        }
        return; // consume E
      }

      // COLLECT — only meaningful while sight is on (PRD §5/§9).
      if (input.wasPressedThisFrame('COLLECT') && sightFSM.isOn()) {
        const playerX = player.view.x;
        const playerY = player.view.y;
        for (const ev of evidenceItems) {
          if (ev.isInProximity(playerX, playerY)) {
            const ok = ev.collect();
            if (!ok) continue;
            gameState.collectedEvidence.add(ev.id);
            gameState.unlockedHaunts.add(ev.hauntId);
            sightFX.removeFromOutlineList(ev);
            const ghost = ghostReplays.find((g) => g.boundEvidence === ev);
            if (ghost) ghost.setVisible(false);
            const screenPt = world.toGlobal({ x: playerX, y: playerY - 40 });
            hud.collectionFeedback.show(`${ev.hauntId} unlocked`, screenPt.x, screenPt.y);
            break;
          }
        }
      }

      // ADVANCE — TAB attempts phase transition; Stage decides.
      if (input.wasPressedThisFrame('ADVANCE')) {
        stage.tryAdvancePhase();
      }

      // Haunt keys (1-4) — only active during HAUNT phase.
      if (stage.phase.is('HAUNT')) {
        for (const [action, hauntId] of Object.entries(HAUNT_ACTION_MAP)) {
          if (!input.wasPressedThisFrame(action)) continue;
          if (!gameState.unlockedHaunts.has(hauntId)) continue;

          const now = performance.now();

          // Drop entries older than HAUNT_COOLDOWN_MS from recentHaunts so
          // applyHaunt sees an accurate "recent" set when it consults
          // gameState.recentHaunts via _buildRecentHauntsMap.
          gameState.recentHaunts = gameState.recentHaunts.filter(
            (entry) => now - entry.timeMs < HAUNT_COOLDOWN_MS,
          );

          // Single entry point — Victim drives FSM transitions, side effects,
          // and fear delta. actionHandlers keeps the existing recentHaunts +
          // phase2EventLog bookkeeping below (applyHaunt does NOT push events).
          const result = victim.applyHaunt(hauntId, { now });
          const delta = result.fearDelta;

          // Record the firing in recentHaunts BEFORE checking delta=0 — a
          // 0-delta re-fire still resets the cooldown clock per PRD's
          // "re-use within 15s yields 0 fear" semantics.
          gameState.recentHaunts.push({ hauntId, timeMs: now });

          gameState.phase2EventLog.push({ type: 'hauntFired', atMs: now });
          if (gameState.phase2FirstHauntTimeMs === null) {
            gameState.phase2FirstHauntTimeMs = now;
          }

          // Correct-waypoint accuracy stat, independent of cooldown.
          const hauntConfig = stageData.haunts && stageData.haunts[hauntId];
          if (
            hauntConfig &&
            victim.currentWaypointId === hauntConfig.correctWaypointId
          ) {
            gameState.phase2EventLog.push({ type: 'correctWaypointHit' });
          }

          if (delta > 0) {
            gameState.fear = Math.min(FEAR_MAX, gameState.fear + delta);
            hud.fearBar.setFear(gameState.fear);
          }

          if (gameState.fear >= FEAR_MAX && !stage.phase.is('SCORE')) {
            stage.phase.transition('SCORE');
          }
        }
      }

      // Per-frame HUD readouts.
      hud.sightMeter.setSightBudget(sightBudget.getMs(), sightBudget.capacityMs);
      hud.evidenceCounter.setCount(gameState.collectedEvidence.size, 4);

      // RadialHauntMenu follows the Reaper in screen-space.
      const reaperScreen = world.toGlobal({ x: player.view.x, y: player.view.y });
      hud.radialHauntMenu.setReaperPosition(reaperScreen.x, reaperScreen.y);
    },
  };
}
