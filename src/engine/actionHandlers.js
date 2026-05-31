// Per-frame action handlers — INTERACT (door), COLLECT (evidence),
// ADVANCE (TAB phase), and the Haunt keys (1-4). Returns a `{ update }`
// object that the GameLoop ticks; the update closure also drives the
// per-frame EntryPrompt visibility, SightMeter readout, EvidenceCounter,
// and RadialHauntMenu position.

import { computeHauntFearDelta } from '../math/fearMath.js';

function findPuzzleDoorInProximity(puzzleDoors, waypointById, playerX) {
  for (const door of puzzleDoors) {
    const wp = waypointById.get(door.waypointId);
    if (!wp || !Number.isFinite(wp.x)) continue;
    const prox = Number.isFinite(door.proximityPx) ? door.proximityPx : 60;
    if (Math.abs(playerX - wp.x) <= prox) return door;
  }
  return null;
}

const HAUNT_COOLDOWN_MS = 15_000;
const FEAR_MAX = 100;
// Only SHATTER is wired this slice; the others remain mapped so slice 4
// only needs to flip the SET below.
const HAUNT_ACTION_MAP = {
  HAUNT_1: 'SHATTER',
  HAUNT_2: 'WHISPER',
  HAUNT_3: 'VOICE',
  HAUNT_4: 'RISE',
};
const HAUNTS_WIRED_THIS_SLICE = new Set(['SHATTER']);

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
  cameraController,
}) {
  const puzzleDoors = Array.isArray(stageData.puzzleDoors) ? stageData.puzzleDoors : [];
  const waypointById = new Map(
    (stageData.waypoints || []).map((w) => [w.id, w]),
  );

  return {
    update: () => {
      // PAUSE while zoomed → zoomOut (ESC graceful exit per ticket #23 design).
      // While zoomed all other action wiring is suppressed — the puzzle UI
      // owns input (slice 23b lands the puzzle surface; for 23a infra-only,
      // zoom in/out is the entire interaction).
      if (cameraController?.isZoomed()) {
        if (input.wasPressedThisFrame('PAUSE')) {
          cameraController.zoomOut();
        }
        // Still drive the per-frame HUD readouts at the bottom of this fn —
        // fall through past the gated handlers.
        hud.sightMeter.setSightBudget(sightBudget.getMs(), sightBudget.capacityMs);
        hud.evidenceCounter.setCount(gameState.collectedEvidence.size, 4);
        return;
      }

      // INTERACT (door entry) — must run BEFORE COLLECT so a press at the
      // door triggers entry instead of a no-op collect.
      const showPrompt =
        sceneSwap.state === 'outside' && sceneSwap.isInProximity();
      if (hud.entryPrompt.view.visible !== showPrompt) {
        hud.entryPrompt.setVisible(showPrompt);
      }
      if (input.wasPressedThisFrame('INTERACT') && sceneSwap.canConsumeInteract()) {
        sceneSwap.beginEnter();
        return; // consume E for this frame
      }

      // INTERACT (puzzle door zoom-in) — Day phase only, inside chapel only.
      // Suppressed during HAUNT per ticket #23 ("zoom is a Day-phase beat").
      if (
        cameraController &&
        sceneSwap.state === 'inside' &&
        stage.phase.is('INVESTIGATION') &&
        input.wasPressedThisFrame('INTERACT')
      ) {
        const door = findPuzzleDoorInProximity(puzzleDoors, waypointById, player.view.x);
        if (door) {
          cameraController.zoomTo(door.zoomBounds, { id: door.id });
          return; // consume E for this frame
        }
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
          if (!HAUNTS_WIRED_THIS_SLICE.has(hauntId)) continue;

          const now = performance.now();

          // Drop entries older than HAUNT_COOLDOWN_MS from recentHaunts,
          // then project to the hauntId→ms map fearMath wants.
          gameState.recentHaunts = gameState.recentHaunts.filter(
            (entry) => now - entry.timeMs < HAUNT_COOLDOWN_MS,
          );
          const recentHauntsMap = {};
          for (const entry of gameState.recentHaunts) {
            recentHauntsMap[entry.hauntId] = entry.timeMs;
          }

          const delta = computeHauntFearDelta({
            haunt: hauntId,
            waypoint: victim.currentWaypointId,
            recentHaunts: recentHauntsMap,
            victimState: victim.state,
            traits: gameState.reaperTraits,
            now,
          });

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
