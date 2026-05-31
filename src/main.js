import { Application, Container } from 'pixi.js';
import { GameLoop } from './engine/GameLoop.js';
import { InputManager } from './engine/InputManager.js';
import { GameState } from './engine/GameState.js';
import { FpsOverlay } from './ui/FpsOverlay.js';
import { SightMeter } from './ui/SightMeter.js';
import { CollectionFeedback } from './ui/CollectionFeedback.js';
import { EntryPrompt } from './ui/EntryPrompt.js';
import { TutorialPrompt } from './ui/TutorialPrompt.js';
import { SceneFadeOverlay } from './ui/SceneFadeOverlay.js';
import { EvidenceCounter } from './ui/EvidenceCounter.js';
import { StageTitleCard } from './ui/StageTitleCard.js';
import { RadialHauntMenu } from './ui/RadialHauntMenu.js';
import { FearBar } from './ui/FearBar.js';
import { EndScreen } from './ui/EndScreen.js';
import { loadStage } from './stage/StageLoader.js';
import { Stage } from './stage/Stage.js';
import { Player } from './entities/Player.js';
import { EvidenceItem } from './entities/EvidenceItem.js';
import { GhostReplay } from './entities/GhostReplay.js';
import { Victim } from './entities/Victim.js';
import { SightBudget } from './sight/SightBudget.js';
import { SightFX } from './sight/SightFX.js';
import { SightFSM } from './sight/SightFSM.js';
import { applyFearGain, computeHauntFearDelta } from './math/fearMath.js';
import { scoreRun } from './scoring/scoreRun.js';
import {
  createAldricPortraitCard,
  createAldricWalkingSprite,
  createConfessionRoomForeground,
  createConfessionRoomProps,
  createFatedDeathPose,
  createStainedWindowSilhouette,
  createVignette,
  CONFESSION_ROOM_CANDLES,
  STAINED_WINDOW_SHAFT,
} from './art/placeholders.js';
import {
  createAldricPixelSprite,
  createReaperPixelSprite,
  createPixelArtGhostPlaceholder,
  createParishionerSpritePixelArt,
  createOutsideChapelScenePixelArt,
} from './art/pixelPalette.js';
import { CandleFlame, DustMotes, SmokeWisp } from './art/ambientMotion.js';
import {
  RENDER_MODE,
  getRenderMode,
  attachDebugKeys,
  logBootMode,
} from './render/TileRenderer.js';
import { AmbientNPC } from './entities/AmbientNPC.js';
import { ChatterScheduler } from './ui/ChatterSystem.js';

// Slice 3 — phase 2 fear/haunt constants used by action-handlers.
const HAUNT_COOLDOWN_MS = 15_000;
const FEAR_MAX = 100;
// Map from InputManager action → haunt id. Only SHATTER is wired this slice;
// the other three keys are no-ops, but the table is here so slice 4 only has
// to fill in fearMath + reaction routing, not add input plumbing.
const HAUNT_ACTION_MAP = {
  HAUNT_1: 'SHATTER',
  HAUNT_2: 'WHISPER',
  HAUNT_3: 'VOICE',
  HAUNT_4: 'RISE',
};
const HAUNTS_WIRED_THIS_SLICE = new Set(['SHATTER']);

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: '#000000',
    resolution: 1,        // see .scratch/grim-griper-puzzle-mvp/issues/perf-slice-1.md — native DPR wasted on flat-color placeholder art
    autoDensity: false,   // see .scratch/grim-griper-puzzle-mvp/issues/perf-slice-1.md — paired with resolution:1 above
    antialias: false,     // see .scratch/grim-griper-puzzle-mvp/issues/perf-slice-1.md — MSAA wasted on axis-aligned Graphics.rect
  });

  document.getElementById('app').appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  // Scene-swap parents (Foundation Engineer, 2026-05-30 — outside-chapel
  // dispatch). Everything that lives in the world is split between two
  // sibling containers under `world` so the scene-swap state machine can
  // toggle visibility cheaply.
  //
  //   worldOutsideContainer — outside-chapel scene (only visible while
  //                           sceneSwap.state === 'outside')
  //   worldInsideContainer  — interior chapel + props + ghosts + evidence +
  //                           Aldric + ambient motion + NPCs + chatter
  //                           positioner anchor (only visible while
  //                           sceneSwap.state === 'inside')
  //
  // Both ride the same world.scale + position so the contain-mode letterbox
  // math in fit() applies identically to both scenes. HUD elements that
  // mount on app.stage (FPS, EntryPrompt, vignette, SightMeter, FearBar,
  // EvidenceCounter, portrait, title card, etc.) are scene-agnostic and
  // stay always-on.
  const worldOutsideContainer = new Container();
  worldOutsideContainer.label = 'world-outside';
  const worldInsideContainer = new Container();
  worldInsideContainer.label = 'world-inside';
  world.addChild(worldOutsideContainer);
  world.addChild(worldInsideContainer);

  const fit = () => {
    const viewW = app.renderer.width / app.renderer.resolution;
    const viewH = app.renderer.height / app.renderer.resolution;
    // Contain mode (Math.min): scale the world so it ENTIRELY fits inside the
    // viewport, with letterbox/pillarbox bars on the long axis. Switched from
    // cover mode (Math.max) on 2026-05-30 evening — cover mode pushed the world
    // off-screen in portrait viewports (user reported "looks wrong" screenshot
    // at 745x1696 where only the sacristy chunk was visible). Contain mode
    // guarantees the full chapel is always visible regardless of viewport
    // aspect; the dark borders are intentional letterboxing.
    const scale = Math.min(viewW / LOGICAL_WIDTH, viewH / LOGICAL_HEIGHT);
    world.scale.set(scale);
    world.x = (viewW - LOGICAL_WIDTH * scale) / 2;
    world.y = (viewH - LOGICAL_HEIGHT * scale) / 2;
  };

  fit();
  window.addEventListener('resize', fit);

  const input = new InputManager(window);
  input.attach();

  const gameState = new GameState();

  const stageData = await loadStage('/src/stages/confession-room.json');
  const stage = new Stage(stageData, gameState);
  worldInsideContainer.addChild(stage.view);

  // Outside-chapel scene — Container drawn in logical world coords (0,0 →
  // 1280,720) so it composes 1:1 under the same contain-mode scale as the
  // inside scene.
  worldOutsideContainer.addChild(
    createOutsideChapelScenePixelArt({
      bounds: stageData.chapelBounds,
      floorY: stage.floorY,
    }),
  );

  // Composition layer — Happy Hills touchstone. Background-to-midground
  // decorative props sit ABOVE the chapel background (pillars baked into
  // createChapelBackground) and BELOW the midground (ghosts/evidence/player).
  // See docs/art/scene-composition-spec.md §"Part C".
  //
  // Register-aware mounting (2026-05-30 evening): in PIXELART mode the
  // painterly stained-window doesn't match the register and the pixel-art
  // clerestory windows (created by createChapelCeilingPixelArt) fill the
  // daylight role. Skip the painterly stained window when render mode is
  // PIXELART. Same logic for the painterly foreground silhouettes below —
  // they were authored for the painterly chapel and visually clash with
  // the pixel-art register.
  const usingPixelArtChapel = getRenderMode() === RENDER_MODE.PIXELART;
  const altarWaypoint = stageData.waypoints.find((w) => w.kind === 'Altar');
  const stainedWindow = createStainedWindowSilhouette();
  // Window is 60 wide; center on altar x. y picked to clear the floor strip
  // (chapel floor top ~520 in logical coords) and sit on the back wall.
  stainedWindow.x = (altarWaypoint?.x ?? 220) - 30;
  stainedWindow.y = 300;
  if (!usingPixelArtChapel) {
    worldInsideContainer.addChild(stainedWindow);
  }

  // Storytelling props — painterly composition. In PIXELART mode Stage.js
  // mounts the pixel-art equivalents instead, so skip here to avoid double-
  // stacking painterly props on top of pixel-art walls.
  if (!usingPixelArtChapel) {
    const props = createConfessionRoomProps();
    worldInsideContainer.addChild(props);
  }

  // Ambient motion (ticket #21) — candle flames + dust motes in light shaft
  // + snuffed-candle smoke wisp. All update via the GameLoop's dtMs ticker;
  // no setTimeout / setInterval. Pre-allocated sprites; no per-frame alloc.
  // Mount BEFORE ghosts so motion sits behind the gameplay midground.
  const ambientUpdates = [];

  // Candle flames — one per lit candle in the chapel. The snuffed altar
  // candle gets a smoke wisp instead. Phase is randomized inside CandleFlame
  // so a row of flames doesn't pulse in sync.
  const litCandles = [
    CONFESSION_ROOM_CANDLES.altarLeft,
    CONFESSION_ROOM_CANDLES.altarRight,
    CONFESSION_ROOM_CANDLES.lecternTop,
    CONFESSION_ROOM_CANDLES.sacristyStand,
  ];
  for (const candleSpec of litCandles) {
    const flame = new CandleFlame({
      x: candleSpec.x,
      y: candleSpec.y,
      radius: candleSpec.flameRadius,
    });
    worldInsideContainer.addChild(flame.view);
    ambientUpdates.push(flame);
  }

  // Dust motes — drifting through the shaft of light coming through the
  // stained-glass window. Pooled sprites, wrap to top on exit.
  const motes = new DustMotes({
    x: STAINED_WINDOW_SHAFT.x,
    y: STAINED_WINDOW_SHAFT.y,
    width: STAINED_WINDOW_SHAFT.width,
    height: STAINED_WINDOW_SHAFT.height,
    count: 8,
  });
  worldInsideContainer.addChild(motes.view);
  ambientUpdates.push(motes);

  // Snuffed candle smoke wisp — telegraphs *recent presence*. Anchored to
  // the wick of the snuffed altar candle.
  const smoke = new SmokeWisp({
    x: CONFESSION_ROOM_CANDLES.altarSnuffed.x,
    y: CONFESSION_ROOM_CANDLES.altarSnuffed.y,
  });
  worldInsideContainer.addChild(smoke.view);
  ambientUpdates.push(smoke);

  // Build GhostReplay first, then EvidenceItem — z-order: ghosts under
  // evidence so the gold outline reads on top. In pixelart mode GhostReplay
  // gets the two-figure crime-act composition factory; painterly mode falls
  // back to the single-witness placeholder built into GhostReplay.
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
  // Add ghosts first (below), then evidence (above).
  for (const ghost of ghostReplays) worldInsideContainer.addChild(ghost.view);
  for (const ev of evidenceItems) worldInsideContainer.addChild(ev.view);

  // Hybrid map (issue #22a): the Player's walkable area now spans NAVE +
  // SACRISTY. stageData.playerBounds (added in #22a) extends chapelBounds'
  // right edge to cover the sacristy room so the Reaper can walk through the
  // door arch into the back room. Falls back to chapelBounds for any stage
  // data that doesn't carry playerBounds yet.
  const walkBounds = stageData.playerBounds ?? stageData.chapelBounds;
  // Render-mode-aware Reaper sprite. Construction-time only — runtime M
  // toggle does NOT swap character sprites; reload required. Player falls
  // back to its built-in painterly factory if viewFactory is null.
  const reaperViewFactory =
    getRenderMode() === RENDER_MODE.PIXELART ? createReaperPixelSprite : null;
  // Entry mechanic (Foundation Engineer, 2026-05-30) — REPLACES the prior
  // auto-walkin scene. Reaper-as-mortal-hooded-pilgrim spawns OUTSIDE the
  // chapel on the exterior path (logical x≈20, well to the left of the
  // chapel's left wall at x=80). Player has control from boot: walk right
  // toward the chapel front door, then press E (INTERACT) within proximity
  // of the door to trigger a short walk-through-door transition.
  //
  // JSON-driven via stageData.reaperSpawn. New schema:
  //   spawnX                — logical-x where Reaper spawns on the path
  //   doorInteractMinX / Max — proximity window for the E prompt
  //   entryTargetX          — logical-x just past the door's right edge
  //   entryWalkDurationMs   — duration of the door-cross transition
  //
  // Cross-team contract with #5 (2026-05-30 — outside-chapel dispatch):
  //   spawnX             — outside-scene spawn position (logical-x) for the
  //                        Reaper. #5 lands him visibly on the outside path.
  //   doorInteractMinX/Max — proximity window for the E prompt, matching
  //                        the outside-scene chapel door's x range.
  //   insideSpawnX       — interior spawn position (logical-x) just inside
  //                        the chapel front door. Used when the scene-swap
  //                        teleports the Reaper at the fade peak.
  //   sceneFadeMs        — fade-in / fade-out duration for the scene swap.
  //
  // Legacy entryTargetX / entryWalkDurationMs are kept readable for older
  // JSON variants but no longer drive a lerp — the scene-swap is an instant
  // teleport behind a fade, per the outside-chapel dispatch.
  const reaperSpawnSpec = stageData.reaperSpawn ?? {
    spawnX: 240,
    doorInteractMinX: 900,
    doorInteractMaxX: 1000,
    insideSpawnX: 160,
    sceneFadeMs: 600,
  };
  const entrySpawnX = reaperSpawnSpec.spawnX ?? 240;
  const doorInteractMinX = reaperSpawnSpec.doorInteractMinX ?? 900;
  const doorInteractMaxX = reaperSpawnSpec.doorInteractMaxX ?? 1000;
  const insideSpawnX =
    reaperSpawnSpec.insideSpawnX
    ?? ((stageData.chapelBounds?.x ?? 80) + 80);
  const sceneFadeMs = reaperSpawnSpec.sceneFadeMs ?? 600;
  const player = new Player({
    input,
    bounds: walkBounds,
    spawnX: entrySpawnX,
    floorY: stage.floorY,
    viewFactory: reaperViewFactory,
  });
  // Player has control from boot — NO setDisabled(true) here. The Reaper
  // stands on the exterior path; arrow keys / A-D let the player walk to
  // the door and press E to enter.
  world.addChild(player.view);

  // Scene-swap state machine (Foundation Engineer, 2026-05-30 — outside-
  // chapel dispatch). REPLACES the previous IDLE/ENTERING/ENTERED door-lerp.
  //
  // States:
  //   'outside'  — initial state on boot. worldOutsideContainer visible,
  //                worldInsideContainer hidden. Reaper spawns at entrySpawnX
  //                on the outside path; player has control; EntryPrompt
  //                shows in door proximity.
  //   'entering' — transition state, lasts ~2*sceneFadeMs total. Fade
  //                overlay drives 0→1 over sceneFadeMs ms; at black peak we
  //                swap container visibility and teleport the Reaper to
  //                insideSpawnX; overlay then fades 1→0 over sceneFadeMs ms.
  //                Player input is disabled for the full transition.
  //   'inside'   — interior visible, outside hidden. Player has control.
  //
  // The COLLECT/E action is shared with INTERACT. We sequence the check
  // here BEFORE the COLLECT handler so a press at the door triggers the
  // scene swap (when 'outside') rather than a no-op evidence collect.
  //
  // The fade overlay reference is forward-declared and bound below at its
  // construction site (it lives on app.stage above the HUD). sceneSwap
  // doesn't tick anything itself — SceneFadeOverlay drives the timeline
  // via its own update() call from the GameLoop and fires callbacks at
  // the black-peak and end moments.
  let sceneFadeOverlay = null;
  const sceneSwap = {
    state: 'outside',
    isInProximity() {
      const x = player.view.x;
      return x >= doorInteractMinX && x <= doorInteractMaxX;
    },
    canConsumeInteract() {
      // True only when an E press at the door should trigger the swap.
      return this.state === 'outside' && this.isInProximity();
    },
    applySceneVisibility() {
      worldOutsideContainer.visible = this.state === 'outside';
      worldInsideContainer.visible = this.state === 'inside';
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
          // Mid-transition: swap container visibility + teleport Reaper to
          // the interior spawn position behind the black veil. Player input
          // stays disabled until the fade-out completes.
          worldOutsideContainer.visible = false;
          worldInsideContainer.visible = true;
          player.view.x = insideSpawnX;
          player.view.y = stage.floorY;
        },
        onComplete: () => {
          this.state = 'inside';
          player.setDisabled(false);
          // eslint-disable-next-line no-console
          console.log('[SceneSwap] pilgrim has entered the chapel; control released.');
        },
      });
    },
    // No update() — SceneFadeOverlay owns the timeline. Kept as a no-op so
    // the loop.add(sceneSwap) call remains valid if ever wired.
    update() {},
  };
  // Initial visibility — outside scene shows on boot, interior hidden.
  sceneSwap.applySceneVisibility();

  // Victim (Aldric) — slice 3 routine walker. Mounted into world here so it
  // sits in the midground (above ghosts/evidence, below the foreground
  // silhouettes that come next). Stage controls activation (HAUNT.enter
  // toggles view.visible; startRoutine fires after the 1s grace).
  //
  // Two callbacks bridge Victim → Stage:
  //   - createFatedDeathPose: passed by reference so the Victim swaps its
  //     view at FEAR=100 without importing the art module itself.
  //   - onFatedDeathComplete: bubbles up through Stage to fire EndScreen
  //     (see stage.onScoreEnter below).
  // Render-mode-aware Aldric sprite. Construction-time only; reload required
  // to swap registers.
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
  worldInsideContainer.addChild(victim.view);
  stage.setVictim(victim);

  // ----------------------------------------------------------------------
  // Chapel-bustle dispatch (Stage + Art Lead, 2026-05-30 evening) — DAY
  // PRESENCE for Aldric + 4-6 parishioner NPCs + chatter scheduler.
  //
  // Aldric day-presence:
  //   Stage.setVictim() hides the victim view (the slice-3 design hid Aldric
  //   until HAUNT.enter). The new design ([[project-chapel-bustle-2026-05-30]])
  //   has Aldric STATICALLY visible at the altar during day so the chapel
  //   reads as a working church with a priest at work. We override the hide
  //   here and anchor him at the altar waypoint (x=220, floorY).
  //
  //   The routine walker only starts on HAUNT.enter (Stage.HAUNT.enter +
  //   the 1s grace timer). HAUNT requires 4 collected evidence + TAB; the
  //   build currently surfaces 2 plain-sight evidence and the other 2 are
  //   gated behind clue layers that aren't shipped this dispatch. So Aldric
  //   will stay statically at the altar through the entire day phase
  //   naturally — we don't need to gate _routineActive separately.
  if (victim && victim.view) {
    const altarX = 220;
    victim.view.x = altarX;
    victim.view.y = stage.floorY;
    victim.view.visible = true;
  }

  // ----- Parishioner NPCs ----- only mounted in pixelart mode (the painterly
  // chapel is the legacy A/B comparison register; bustle is part of the new
  // pixel-art day register). If the factory isn't injected, we skip silently.
  const ambientNpcs = [];
  if (usingPixelArtChapel) {
    // 5 NPCs total — within the 4-6 envelope. Positions chosen to sit
    // naturally relative to the existing chapel furniture:
    //   - 2 kneelers in front of pews (between altar/lectern/booth anchors)
    //   - 2 standers near the lectern (waiting for sermon? talking?)
    //   - 1 candlelighter at the side shrine left of altar
    //   - 1 walker pacing slowly across the mid-nave
    //
    // Each NPC gets a `scheduleSeed` derived from its index so the chatter
    // scheduler + animation oscillators desynchronize naturally.
    const npcSpecs = [
      // (1) Kneeler in front of the first nave pew (~x=360), bowed at it.
      { variant: 'kneeler',       x: 340, scheduleSeed: 0.11 },
      // (2) Kneeler in front of the second pew (~x=640), bowed.
      { variant: 'kneeler',       x: 660, scheduleSeed: 0.37 },
      // (3) Stander near the lectern (slight tilt), faces altar.
      { variant: 'stander',       x: 540, scheduleSeed: 0.55 },
      // (4) Stander near the third pew (~x=920), reading?
      { variant: 'stander',       x: 900, scheduleSeed: 0.72 },
      // (5) Candlelighter at the left side shrine (x=130 per Stage mount).
      // Sprite faces right; stand 16 px LEFT of the shrine so the arm
      // reaches toward the candles.
      { variant: 'candlelighter', x: 110, scheduleSeed: 0.83 },
      // (6) Walker pacing the mid-nave between pew 2 and pew 3 (x≈780-ish
      // base, +/-24 px pacing range). Outside the booth's silhouette zone.
      { variant: 'walker',        x: 800, scheduleSeed: 0.42 },
    ];
    for (const spec of npcSpecs) {
      const sprite = createParishionerSpritePixelArt({
        variant: spec.variant,
        seed: spec.scheduleSeed,
      });
      const npc = new AmbientNPC({
        sprite,
        variant: spec.variant,
        x: spec.x,
        floorY: stage.floorY,
        scheduleSeed: spec.scheduleSeed,
      });
      // Mount into worldInsideContainer so SightFX desaturation washes them
      // in Reaper Sight (NPCs are alive parishioners inside the chapel; the
      // scene-swap hides them with the rest of the interior in 'outside').
      worldInsideContainer.addChild(npc.view);
      ambientNpcs.push(npc);
    }
  }

  // ----- Chatter scheduler ----- bubbles mount on app.stage (NOT world) so
  // Reaper Sight ColorMatrixFilter doesn't desaturate the bubble cream.
  // Anti-slasher: lines are anonymous-pilgrim mundane life only.
  let chatterScheduler = null;
  if (ambientNpcs.length > 0) {
    chatterScheduler = new ChatterScheduler({
      npcs: ambientNpcs,
      world,
      layer: app.stage,
    });
  }

  // Foreground silhouettes — LAST in world so they render OVER midground
  // (ghosts/evidence/player). Decor only; interaction layers don't touch them.
  // Added to world (not app.stage) so SightFX desaturation applies and they
  // don't pop chromatically when Sight is ON.
  const foreground = createConfessionRoomForeground();
  if (!usingPixelArtChapel) {
    worldInsideContainer.addChild(foreground);
  }

  // Sight wiring. Capacity read from gameState.reaperTraits — never hardcoded
  // here (PRD acceptance criterion).
  const sightBudget = new SightBudget(gameState.reaperTraits.sightDurationMs);
  const sightFX = new SightFX();
  // Attach to worldInsideContainer (not `world`) so the ColorMatrixFilter
  // desaturation only affects the interior scene. Holding SHIFT outside is
  // a no-op (no evidence/ghosts to reveal outside) per
  // [[project-day-phase-staging-2026-05-30]]. Fix for QA Bug 2 (2026-05-30).
  sightFX.attach(worldInsideContainer, evidenceItems, ghostReplays);
  const sightFSM = new SightFSM({ input, budget: sightBudget, fx: sightFX });

  // Screen-space UI — attached to app.stage, NOT world, so the ColorMatrixFilter
  // on world doesn't desaturate the HUD.
  const fps = new FpsOverlay(app.ticker);
  app.stage.addChild(fps.view);

  const sightMeter = new SightMeter();
  app.stage.addChild(sightMeter.view);
  sightMeter.setSightBudget(sightBudget.getMs(), sightBudget.capacityMs);
  // Hidden at boot — gate loop below shows on scene === 'inside'.
  sightMeter.view.visible = false;

  // Left-edge HUD column (FpsOverlay → EvidenceCounter → portrait). SightMeter
  // pins itself to top-right (see src/ui/SightMeter.js) so it's not in this
  // column despite the dispatch wording. Intent is preserved: a stacked HUD
  // column on the left edge.
  const evidenceCounter = new EvidenceCounter();
  app.stage.addChild(evidenceCounter.view);
  evidenceCounter.view.visible = false;

  // Aldric portrait card — Stage + Art Lead deliverable. Mounted under the
  // EvidenceCounter with ~12px vertical gap so the column reads as one block.
  const portraitCard = createAldricPortraitCard();
  portraitCard.x = 12;
  portraitCard.y = evidenceCounter.bottomY + 12;
  portraitCard.visible = false;
  app.stage.addChild(portraitCard);

  // Stage title + victim caption (issue #20). Mounted BEFORE vignette so the
  // edge-darken sits on top of the text — intentional, the vignette is the
  // outermost screen frame.
  const stageTitleCard = new StageTitleCard({ stageData, ticker: app.ticker });
  stageTitleCard.view.visible = false;
  app.stage.addChild(stageTitleCard.view);

  // Screen-space vignette — Happy Hills edge-darken. Mounted on app.stage
  // (NOT world) so it sits above everything including HUD.
  // FLAG: factory draws at logical 1280x720, but app.stage is NOT scaled
  // (only world is). On viewports larger than 1280x720 the vignette will not
  // cover the full screen. Scene Director follow-up: add a resize(w,h) method
  // to createVignette, or render vignette into world after all other world
  // children (and lift it above ColorMatrixFilter scope) — TODO.
  const vignette = createVignette();
  app.stage.addChild(vignette);
  const applyVignetteResize = () => vignette.resize(window.innerWidth, window.innerHeight);
  applyVignetteResize();
  window.addEventListener('resize', applyVignetteResize);

  // Floating-text feedback on COLLECT (issue #18). Mounted after vignette is
  // fine — feedback is short-lived screen text and the vignette edges aren't
  // where the player stands, so the corner-darken won't eat the labels.
  const collectionFeedback = new CollectionFeedback();
  app.stage.addChild(collectionFeedback.view);

  // EntryPrompt (Foundation Engineer, 2026-05-30) — bottom-center HUD pill
  // that reads "Press E to enter the chapel" while the Reaper stands in the
  // door-proximity window AND has not yet entered. Mounted on app.stage so
  // SightFX desaturation doesn't touch it. Pinned to viewport on boot +
  // resize alongside the vignette.
  const entryPrompt = new EntryPrompt('Press E to enter the chapel');
  app.stage.addChild(entryPrompt.view);
  const placeEntryPrompt = () => entryPrompt.setScreenPosition(window.innerWidth, window.innerHeight);
  placeEntryPrompt();
  window.addEventListener('resize', placeEntryPrompt);

  // Tutorial prompt — fades in/out with multi-line instructional text.
  // Shows movement controls on boot, then "Reaper Sight + collect"
  // hint when the player first enters the chapel.
  const tutorialPrompt = new TutorialPrompt();
  app.stage.addChild(tutorialPrompt.view);
  const placeTutorialPrompt = () => tutorialPrompt.setScreenPosition(window.innerWidth);
  placeTutorialPrompt();
  window.addEventListener('resize', placeTutorialPrompt);
  // Show outside-scene tutorial on boot; auto-hides after 7s.
  tutorialPrompt.show({
    message: 'A / D or  ← →   Walk toward the chapel\n\nE   Interact (at the door)',
    holdMs: 7000,
  });
  // When the scene flips to inside for the first time, show the inside hint.
  let _shownInsideTutorial = false;

  // Phase-2 HUD (slice 3, #4 UI/HUD).
  //   - FearBar: top-center, visible only in HAUNT.
  //   - RadialHauntMenu: orbits the Reaper, visible only in HAUNT.
  //   - EndScreen: full-screen overlay on FEAR=100 → SCORE.
  // Mount order: FearBar / Radial first so EndScreen sits ABOVE them in
  // z-order when shown (last-added wins on a Container).
  const fearBar = new FearBar();
  app.stage.addChild(fearBar.view);
  fearBar.view.visible = false;

  const radialHauntMenu = new RadialHauntMenu({ unlockedHaunts: gameState.unlockedHaunts });
  app.stage.addChild(radialHauntMenu.view);
  radialHauntMenu.view.visible = false;

  const endScreen = new EndScreen();
  app.stage.addChild(endScreen.view);
  endScreen.setOnRetry(() => location.reload());
  endScreen.setOnReturn(() => {
    // eslint-disable-next-line no-console
    console.log('[EndScreen] RETURN TO MENU — slice 5 wires this');
  });

  // SceneFadeOverlay (Foundation Engineer, 2026-05-30) — full-screen black
  // rect at the TOP of app.stage z-order so it masks the outside↔inside
  // container swap. Mounted last on app.stage so it sits above HUD +
  // vignette + EndScreen. Driven by the GameLoop; fires onBlackPeak +
  // onComplete callbacks back into sceneSwap.
  sceneFadeOverlay = new SceneFadeOverlay();
  app.stage.addChild(sceneFadeOverlay.view);
  const applySceneFadeResize = () =>
    sceneFadeOverlay.resize(window.innerWidth, window.innerHeight);
  applySceneFadeResize();
  window.addEventListener('resize', applySceneFadeResize);

  // Wire the SCORE-enter callback: when Stage flips HAUNT→SCORE and the
  // Victim's Fated Death fade completes, run scoreRun on the event log and
  // show the EndScreen. Stage's notifyFatedDeathComplete() is what fires
  // this — wiring it here keeps scoring + UI orchestration out of Stage.
  stage.onScoreEnter(() => {
    // Append fearMaxed event using the same clock domain as hauntFired
    // (performance.now() ms). scoreRun derives secondsToMax from the delta.
    gameState.phase2EventLog.push({ type: 'fearMaxed', atMs: performance.now() });
    const result = scoreRun(gameState.phase2EventLog);
    // EndScreen is created + mounted by #4 UI/HUD's main.js block.
    endScreen.show(result);
  });

  // Per-frame action handlers: INTERACT (E, door), COLLECT (E, evidence),
  // ADVANCE (TAB), and Haunt keys 1-4.
  const actionHandlers = {
    update: () => {
      // INTERACT — door entry. Checked BEFORE COLLECT so a press at the
      // door (while still outside, sight OFF) triggers entry instead of a
      // no-op collect. Once entered, the mechanic self-deactivates and
      // future E presses fall through to COLLECT/evidence as normal.
      // Also drive prompt visibility every frame here — single source of
      // truth for the "in proximity + not yet entered" condition.
      const showPrompt = sceneSwap.state === 'outside' && sceneSwap.isInProximity();
      if (entryPrompt.view.visible !== showPrompt) entryPrompt.setVisible(showPrompt);
      if (input.wasPressedThisFrame('INTERACT') && sceneSwap.canConsumeInteract()) {
        sceneSwap.beginEnter();
        // Consume this frame's E press for COLLECT too — the same key
        // shouldn't also fire a collection attempt this frame.
        return;
      }

      // COLLECT — only meaningful while sight is ON (PRD line 5,9: highlighted
      // evidence under sight). One press = one collection (iterate, take first).
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
            // Hide its bound ghost.
            const ghost = ghostReplays.find((g) => g.boundEvidence === ev);
            if (ghost) ghost.setVisible(false);
            // Floating feedback (issue #18). Player position is in world
            // (scaled) coords; convert to screen-space for app.stage mount.
            const screenPt = world.toGlobal({ x: playerX, y: playerY - 40 });
            collectionFeedback.show(`${ev.hauntId} unlocked`, screenPt.x, screenPt.y);
            break;
          }
        }
      }

      // ADVANCE — TAB attempts phase transition; Stage decides.
      if (input.wasPressedThisFrame('ADVANCE')) {
        stage.tryAdvancePhase();
      }

      // Haunt keys (1-4). Only active during HAUNT phase. Slice 3 wires only
      // SHATTER (key 1); the others are no-ops this slice (slice 4 lights up
      // WHISPER / VOICE / RISE).
      //
      // Cooldown bookkeeping: gameState.recentHaunts is the array of
      // {hauntId, timeMs} entries — we drop entries older than 15s on each
      // press, then append the new one. computeHauntFearDelta receives a
      // hauntId→lastFiredAtMs map (its preferred shape per fearMath.js), so
      // we project the array into a map at call-time.
      if (stage.phase.is('HAUNT')) {
        for (const [action, hauntId] of Object.entries(HAUNT_ACTION_MAP)) {
          if (!input.wasPressedThisFrame(action)) continue;
          // Must have been unlocked via evidence collection in Phase 1.
          if (!gameState.unlockedHaunts.has(hauntId)) continue;
          // Only SHATTER is functional this slice.
          if (!HAUNTS_WIRED_THIS_SLICE.has(hauntId)) continue;

          const now = performance.now();

          // Drop entries older than HAUNT_COOLDOWN_MS from recentHaunts.
          gameState.recentHaunts = gameState.recentHaunts.filter(
            (entry) => now - entry.timeMs < HAUNT_COOLDOWN_MS,
          );
          // Project to hauntId→ms map for fearMath.
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

          // Record the firing in recentHaunts BEFORE checking delta=0, so
          // a 0-delta same-haunt re-fire still resets the cooldown clock to
          // "now" — matching PRD's "re-use within 15s yields 0 fear" semantics
          // (the 15s window is anchored to the last attempt, not the last
          // successful gain). NOTE: fearMath uses `now - lastFired < 15000`
          // so the clock IS the last-fired time; we set it on every press.
          gameState.recentHaunts.push({ hauntId, timeMs: now });

          // Event log for scoreRun: every press counts as a hauntFired
          // (PRD efficiency penalty considers attempts, not just hits). The
          // first hauntFired drives phase2FirstHauntTimeMs for secondsToMax.
          gameState.phase2EventLog.push({ type: 'hauntFired', atMs: now });
          if (gameState.phase2FirstHauntTimeMs === null) {
            gameState.phase2FirstHauntTimeMs = now;
          }

          // Correct-waypoint event: emitted whenever the haunt is fired at
          // its correct waypoint, independent of cooldown — that's an
          // accuracy stat, not a fear-gain stat (PRD scoring lines 137-138).
          const hauntConfig = stageData.haunts && stageData.haunts[hauntId];
          if (hauntConfig && victim.currentWaypointId === hauntConfig.correctWaypointId) {
            gameState.phase2EventLog.push({ type: 'correctWaypointHit' });
          }

          if (delta > 0) {
            gameState.fear = Math.min(FEAR_MAX, gameState.fear + delta);
            fearBar.setFear(gameState.fear);
          }

          // FEAR=100 → Stage flips to SCORE, which triggers Fated Death.
          if (gameState.fear >= FEAR_MAX && !stage.phase.is('SCORE')) {
            stage.phase.transition('SCORE');
          }
        }
      }

      // Push current budget into the meter every frame.
      sightMeter.setSightBudget(sightBudget.getMs(), sightBudget.capacityMs);

      // Evidence counter — drive every frame so it reflects the canonical
      // gameState set rather than locally tracked counts. Cheap: setCount
      // short-circuits when N hasn't changed.
      evidenceCounter.setCount(gameState.collectedEvidence.size, 4);

      // RadialHauntMenu follow-the-Reaper. #4 owns the menu; we just feed
      // it the current Reaper screen position each frame.
      const reaperScreen = world.toGlobal({ x: player.view.x, y: player.view.y });
      radialHauntMenu.setReaperPosition(reaperScreen.x, reaperScreen.y);
    },
  };

  const loop = new GameLoop(app.ticker);
  loop
    .add(stage)
    .add(sightFSM)       // before Player so input is read same frame as movement
    .add(actionHandlers) // checks INTERACT (door entry) BEFORE Player so a same-frame disable from beginEntry() lands cleanly
    .add(sceneSwap)      // no-op tick; SceneFadeOverlay drives the swap timeline (see below)
    .add(player)
    .add(sightMeter)
    .add(collectionFeedback)  // ticks floating-label fade timeline
    .add(sceneFadeOverlay)    // drives the outside↔inside fade + container swap callbacks
    .add(endScreen)           // ticks EndScreen fade animation
    .add(tutorialPrompt)      // ticks fade + hold timer
    .add({
      // First-time inside tutorial trigger.
      update: () => {
        if (!_shownInsideTutorial && sceneSwap.state === 'inside') {
          _shownInsideTutorial = true;
          tutorialPrompt.show({
            message: 'Hold SHIFT — Reaper Sight reveals evidence\n\nE   Collect glowing evidence\n\nTAB   Advance phase once all 4 collected',
            holdMs: 8000,
          });
        }
      },
    })
    .add({
      // Phase-2 HUD visibility sync (slice 3, #4 UI/HUD).
      // Cheap per-frame check: toggle radial + FearBar visibility based on
      // Stage phase. Action-handlers (#3's territory) already pushes Reaper
      // screen position via setReaperPosition each frame, so we only own
      // the visibility flip here. Separate loop entry (NOT in action-handlers)
      // per cross-team file-touch boundary.
      update: () => {
        const inHaunt = stage.phase.is('HAUNT');
        const isInside = sceneSwap.state === 'inside';

        // QA UI cleanup (2026-05-30 evening) — gate in-chapel HUD elements on
        // the inside scene. Outside, the player hasn't met Aldric or seen
        // evidence yet, so these elements shouldn't render. Keeps the outside
        // scene's chrome minimal: FPS + EntryPrompt + vignette + scene-fade.
        if (evidenceCounter.view.visible !== isInside) evidenceCounter.view.visible = isInside;
        if (portraitCard.visible !== isInside) portraitCard.visible = isInside;
        if (stageTitleCard.view.visible !== isInside) stageTitleCard.view.visible = isInside;
        if (sightMeter.view.visible !== isInside) sightMeter.view.visible = isInside;

        // Phase-2 (HAUNT) UI is inside-only AND HAUNT-only.
        const showHauntUI = isInside && inHaunt;
        if (radialHauntMenu.view.visible !== showHauntUI) radialHauntMenu.view.visible = showHauntUI;
        if (fearBar.view.visible !== showHauntUI) fearBar.view.visible = showHauntUI;
        if (showHauntUI) radialHauntMenu.setUnlockedHaunts(gameState.unlockedHaunts);
      },
    })
    .add(fps)
    .add({ update: () => input.endFrame() });
  // Ambient motion (ticket #21) — candle flames, dust motes, smoke wisp.
  // Cheap to tick; order doesn't matter (they only mutate their own sprites).
  // Add LAST among world systems so we're confident no other system is
  // reading their state for game logic.
  for (const motion of ambientUpdates) {
    loop.add(motion);
  }
  // Chapel-bustle dispatch (2026-05-30 evening) — AmbientNPCs + chatter
  // scheduler. NPCs tick their own pixel-art animation (sway / bow / pace);
  // ChatterScheduler ticks the bubble pool + fade timelines + spawn timer.
  // Both are pure dt-driven, no per-frame allocations.
  for (const npc of ambientNpcs) {
    loop.add(npc);
  }
  if (chatterScheduler) {
    // Gate chatter scheduler on inside scene per
    // [[project-chapel-bustle-2026-05-30]] (chatter is the bustling-chapel
    // register, not outside). Fix for QA Bug 1 (2026-05-30): chatter was
    // firing in the outside scene because the scheduler ticked
    // unconditionally. We hide each pool bubble's view directly when not
    // inside — accesses the private `_pool` field but keeps the fix in
    // main.js without expanding ChatterScheduler's public API.
    loop.add({
      update: (dtMs) => {
        if (sceneSwap.state !== 'inside') {
          // Hide all active bubbles. Pool size is small; cheap iteration.
          const pool = chatterScheduler._pool;
          if (pool) {
            for (let i = 0; i < pool.length; i++) pool[i].view.visible = false;
          }
          return;
        }
        // Re-show bubble views on first inside-tick (they may have been
        // hidden by the outside branch on a previous frame). Cheap idempotent.
        const pool = chatterScheduler._pool;
        if (pool) {
          for (let i = 0; i < pool.length; i++) {
            if (pool[i].active) pool[i].view.visible = true;
          }
        }
        chatterScheduler.update(dtMs);
      },
    });
  }
  // TEMP DEBUG (Foundation Engineer, 2026-05-30): render-mode + day/night
  // hot-swap keys. `M` swaps painterly ↔ pixelart (environment inline,
  // characters require reload); `N` flips dayLit (no visual effect this
  // dispatch — night sprites land next dispatch). Remove this attach + the
  // TileRenderer.attachDebugKeys helper once the day/night state machine
  // ships and the painterly path is retired.
  attachDebugKeys({ input, loop });
  // StageTitleCard drives its own animation off app.ticker directly (see
  // StageTitleCard.js); intentionally NOT added to the loop.
  loop.start();
  logBootMode();
})();
