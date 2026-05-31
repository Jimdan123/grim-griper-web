import { Container } from 'pixi.js';
import { GameLoop } from './engine/GameLoop.js';
import { InputManager } from './engine/InputManager.js';
import { GameState } from './engine/GameState.js';
import { loadStage } from './stage/StageLoader.js';
import { Stage } from './stage/Stage.js';
import { Player } from './entities/Player.js';
import { EvidenceItem } from './entities/EvidenceItem.js';
import { GhostReplay } from './entities/GhostReplay.js';
import { Victim } from './entities/Victim.js';
import { SightBudget } from './sight/SightBudget.js';
import { SightFX } from './sight/SightFX.js';
import { SightFSM } from './sight/SightFSM.js';
import { wireEndRunController } from './scoring/endRunController.js';
import { createAldricWalkingSprite } from './art/placeholders/aldric/walkingSprite.js';
import { createFatedDeathPose } from './art/placeholders/aldric/fatedDeathPose.js';
import { createConfessionRoomForeground } from './art/placeholders/decor/foreground.js';
import { createStainedWindowSilhouette } from './art/placeholders/decor/stainedWindow.js';
import { createConfessionRoomProps } from './art/placeholders/confessionRoom/props/composite.js';
import { createAldricPixelSprite } from './art/pixelPalette/sprites/aldric.js';
import { createReaperPixelSprite } from './art/pixelPalette/sprites/reaper.js';
import { createPixelArtGhostPlaceholder } from './art/pixelPalette/ghosts/placeholder.js';
import { createOutsideChapelScenePixelArt } from './art/pixelPalette/outsideScene/composite.js';
import {
  RENDER_MODE,
  getRenderMode,
  attachDebugKeys,
  logBootMode,
} from './render/TileRenderer.js';
import { setupHud } from './ui/setupHud.js';
import { createApp, fitWorldToViewport } from './boot/createApp.js';
import { mountAmbientMotion } from './scene/ambientMounts.js';
import { setupChapelBustle } from './scene/chapelBustle.js';
import { createSceneSwap, resolveReaperSpawn } from './scene/sceneSwap.js';
import { CameraController } from './scene/CameraController.js';
import { createActionHandlers } from './engine/actionHandlers.js';

(async () => {
  const app = await createApp();

  // World container holds the camera, which holds the two scene-swap parents.
  // - `world` owns the contain-mode letterbox transform (fitWorldToViewport)
  // - `camera` owns the zoom transform for puzzle-door beats (ticket #23)
  // - `worldOutside` / `worldInside` are the scene-swap pair toggled by visibility
  // The Player sprite is NOT under camera — it stays on world directly so its
  // movement coords are independent of zoom, and it is hidden while zoomed
  // (per ticket #23 open Q1).
  const world = new Container();
  app.stage.addChild(world);
  const camera = new Container();
  camera.label = 'camera';
  world.addChild(camera);
  const worldOutside = new Container();
  worldOutside.label = 'world-outside';
  const worldInside = new Container();
  worldInside.label = 'world-inside';
  camera.addChild(worldOutside);
  camera.addChild(worldInside);
  const cameraController = new CameraController(camera);

  const fit = () => fitWorldToViewport(app, world);
  fit();
  window.addEventListener('resize', fit);

  const input = new InputManager(window);
  input.attach();

  const gameState = new GameState();
  const stageData = await loadStage('/src/stages/confession-room.json');
  const stage = new Stage(stageData, gameState);
  worldInside.addChild(stage.view);

  // Outside-chapel scene fills logical 0,0 → 1280,720.
  worldOutside.addChild(
    createOutsideChapelScenePixelArt({
      bounds: stageData.chapelBounds,
      floorY: stage.floorY,
    }),
  );

  // Painterly composition layer — skipped in PIXELART mode (Stage.js mounts
  // pixel-art equivalents and the painterly pieces would visually clash).
  const usingPixelArtChapel = getRenderMode() === RENDER_MODE.PIXELART;
  if (!usingPixelArtChapel) {
    const altarWaypoint = stageData.waypoints.find((w) => w.kind === 'Altar');
    const stainedWindow = createStainedWindowSilhouette();
    stainedWindow.x = (altarWaypoint?.x ?? 220) - 30;
    stainedWindow.y = 300;
    worldInside.addChild(stainedWindow);
    worldInside.addChild(createConfessionRoomProps());
  }

  const { updates: ambientUpdates } = mountAmbientMotion({ worldInside });

  // Ghosts under evidence (gold outline reads on top).
  const ghostViewFactory =
    getRenderMode() === RENDER_MODE.PIXELART ? createPixelArtGhostPlaceholder : null;
  const evidenceItems = [];
  const ghostReplays = [];
  for (const eData of stageData.evidence) {
    const evidence = new EvidenceItem(eData);
    const ghost = new GhostReplay(eData, evidence, ghostViewFactory);
    evidenceItems.push(evidence);
    ghostReplays.push(ghost);
  }
  for (const ghost of ghostReplays) worldInside.addChild(ghost.view);
  for (const ev of evidenceItems) worldInside.addChild(ev.view);

  const spawn = resolveReaperSpawn(stageData);
  const walkBounds = stageData.playerBounds ?? stageData.chapelBounds;
  const reaperViewFactory =
    getRenderMode() === RENDER_MODE.PIXELART ? createReaperPixelSprite : null;
  const player = new Player({
    input,
    bounds: walkBounds,
    spawnX: spawn.entrySpawnX,
    floorY: stage.floorY,
    viewFactory: reaperViewFactory,
  });
  world.addChild(player.view);

  // Victim (Aldric). createFatedDeathPose is passed by reference so Victim
  // swaps view at FEAR=100 without importing the art module itself.
  const aldricView =
    getRenderMode() === RENDER_MODE.PIXELART
      ? createAldricPixelSprite()
      : createAldricWalkingSprite();
  const victim = new Victim({
    stageData,
    gameState,
    view: aldricView,
    createFatedDeathPose,
    floorY: stage.floorY,
    onFatedDeathComplete: () => stage.notifyFatedDeathComplete(),
  });
  worldInside.addChild(victim.view);
  stage.setVictim(victim);

  // Day-presence override — chapel-bustle dispatch keeps Aldric statically
  // visible at the altar during DAY. Routine walker only starts on HAUNT.enter.
  if (victim?.view) {
    victim.view.x = 220;
    victim.view.y = stage.floorY;
    victim.view.visible = true;
  }

  const { npcs: ambientNpcs, scheduler: chatterScheduler } = setupChapelBustle({
    enabled: usingPixelArtChapel,
    worldInside,
    world,
    hudLayer: app.stage,
    floorY: stage.floorY,
  });

  // Painterly foreground silhouettes — pixelart path uses a different
  // composition strategy.
  if (!usingPixelArtChapel) {
    worldInside.addChild(createConfessionRoomForeground());
  }

  // Sight wiring. Capacity from gameState.reaperTraits per PRD.
  const sightBudget = new SightBudget(gameState.reaperTraits.sightDurationMs);
  const sightFX = new SightFX();
  sightFX.attach(worldInside, evidenceItems, ghostReplays);
  const sightFSM = new SightFSM({ input, budget: sightBudget, fx: sightFX });

  const hud = setupHud({ app, ticker: app.ticker, stageData, sightBudget, gameState });

  const sceneSwap = createSceneSwap({
    worldOutside,
    worldInside,
    player,
    sceneFadeOverlay: hud.sceneFadeOverlay,
    doorInteractMinX: spawn.doorInteractMinX,
    doorInteractMaxX: spawn.doorInteractMaxX,
    insideSpawnX: spawn.insideSpawnX,
    insideSpawnY: stage.floorY,
    sceneFadeMs: spawn.sceneFadeMs,
  });

  wireEndRunController({ stage, gameState, endScreen: hud.endScreen });

  const actionHandlers = createActionHandlers({
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
  });

  let _shownInsideTutorial = false;

  const loop = new GameLoop(app.ticker);
  loop
    .add(cameraController)
    .add(stage)
    .add(sightFSM)
    .add(actionHandlers)
    .add(sceneSwap)
    .add(player)
    .add({
      // Hide + disable the Player while the camera is zoomed into a puzzle
      // door (ticket #23 open Q1 — the player's perspective during the
      // puzzle is the puzzle surface, not the Pilgrim sprite). Re-enables
      // on zoomOut.
      update: () => {
        const zoomed = cameraController.isZoomed();
        if (player?.view && player.view.visible === zoomed) {
          player.view.visible = !zoomed;
        }
        if (player?.setDisabled) player.setDisabled(zoomed);
      },
    })
    .add(hud.sightMeter)
    .add(hud.collectionFeedback)
    .add(hud.sceneFadeOverlay)
    .add(hud.endScreen)
    .add(hud.tutorialPrompt)
    .add({
      // First-time inside-scene tutorial.
      update: () => {
        if (!_shownInsideTutorial && sceneSwap.state === 'inside') {
          _shownInsideTutorial = true;
          hud.tutorialPrompt.show({
            message:
              'Hold SHIFT — Reaper Sight reveals evidence\n\nE   Collect glowing evidence\n\nTAB   Advance phase once all 4 collected',
            holdMs: 8000,
          });
        }
      },
    })
    .add({
      // Phase-based HUD visibility sync.
      update: () => {
        const inHaunt = stage.phase.is('HAUNT');
        const isInside = sceneSwap.state === 'inside';

        if (hud.evidenceCounter.view.visible !== isInside) hud.evidenceCounter.view.visible = isInside;
        if (hud.portraitCard.visible !== isInside) hud.portraitCard.visible = isInside;
        if (hud.stageTitleCard.view.visible !== isInside) hud.stageTitleCard.view.visible = isInside;
        if (hud.sightMeter.view.visible !== isInside) hud.sightMeter.view.visible = isInside;

        const showHauntUI = isInside && inHaunt;
        if (hud.radialHauntMenu.view.visible !== showHauntUI) hud.radialHauntMenu.view.visible = showHauntUI;
        if (hud.fearBar.view.visible !== showHauntUI) hud.fearBar.view.visible = showHauntUI;
        if (showHauntUI) hud.radialHauntMenu.setUnlockedHaunts(gameState.unlockedHaunts);
      },
    })
    .add(hud.fps)
    .add({ update: () => input.endFrame() });

  for (const motion of ambientUpdates) loop.add(motion);
  for (const npc of ambientNpcs) loop.add(npc);

  if (chatterScheduler) {
    // Gate chatter on inside scene — bubbles shouldn't render outside the
    // chapel. Reaches into _pool to hide active bubbles instantly without
    // expanding ChatterScheduler's public API.
    loop.add({
      update: (dtMs) => {
        const pool = chatterScheduler._pool;
        if (sceneSwap.state !== 'inside') {
          if (pool) for (let i = 0; i < pool.length; i++) pool[i].view.visible = false;
          return;
        }
        if (pool) {
          for (let i = 0; i < pool.length; i++) {
            if (pool[i].active) pool[i].view.visible = true;
          }
        }
        chatterScheduler.update(dtMs);
      },
    });
  }

  // TEMP DEBUG: M swaps painterly↔pixelart (environment inline; characters
  // require reload). N flips dayLit (no visual effect this dispatch).
  attachDebugKeys({ input, loop });
  loop.start();
  logBootMode();
})();
