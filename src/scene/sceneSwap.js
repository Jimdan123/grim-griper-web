// Scene-swap state machine — drives the outside-chapel → inside-chapel
// transition. The Reaper (as mortal hooded pilgrim) spawns outside, walks
// to the door, and an E press at door-proximity triggers a fade-to-black
// container swap that teleports the player to the inside spawn position.
//
// States: 'outside' → 'entering' → 'inside'. The fade overlay owns the
// timeline; we just register onBlackPeak / onComplete callbacks.

export function createSceneSwap({
  worldOutside,
  worldInside,
  player,
  sceneFadeOverlay,
  doorInteractMinX,
  doorInteractMaxX,
  insideSpawnX,
  insideSpawnY,
  sceneFadeMs,
}) {
  const swap = {
    state: 'outside',
    isInProximity() {
      const x = player.view.x;
      return x >= doorInteractMinX && x <= doorInteractMaxX;
    },
    canConsumeInteract() {
      return this.state === 'outside' && this.isInProximity();
    },
    applySceneVisibility() {
      worldOutside.visible = this.state === 'outside';
      worldInside.visible = this.state === 'inside';
    },
    beginEnter() {
      if (this.state !== 'outside' || !sceneFadeOverlay) return;
      this.state = 'entering';
      player.setDisabled(true);
      // Face right while crossing the threshold so the teleport doesn't
      // pop the sprite mid-mirror.
      if (player.view.scale.x !== 1) player.view.scale.x = 1;
      sceneFadeOverlay.start({
        fadeInMs: sceneFadeMs,
        holdMs: 0,
        fadeOutMs: sceneFadeMs,
        onBlackPeak: () => {
          worldOutside.visible = false;
          worldInside.visible = true;
          player.view.x = insideSpawnX;
          player.view.y = insideSpawnY;
        },
        onComplete: () => {
          this.state = 'inside';
          player.setDisabled(false);
          // eslint-disable-next-line no-console
          console.log('[SceneSwap] pilgrim has entered the chapel; control released.');
        },
      });
    },
    // SceneFadeOverlay owns the timeline; sceneSwap has no per-frame work
    // of its own. Kept as a no-op so loop.add(sceneSwap) remains valid.
    update() {},
  };

  swap.applySceneVisibility();
  return swap;
}

// Default spawn/proximity numbers used when stageData.reaperSpawn is absent
// or partial. Caller merges these with whatever the stage JSON provides.
export function resolveReaperSpawn(stageData) {
  const spec = stageData.reaperSpawn ?? {};
  const chapelLeftPlus = (stageData.chapelBounds?.x ?? 80) + 80;
  return {
    entrySpawnX: spec.spawnX ?? 240,
    doorInteractMinX: spec.doorInteractMinX ?? 900,
    doorInteractMaxX: spec.doorInteractMaxX ?? 1000,
    insideSpawnX: spec.insideSpawnX ?? chapelLeftPlus,
    sceneFadeMs: spec.sceneFadeMs ?? 600,
  };
}
