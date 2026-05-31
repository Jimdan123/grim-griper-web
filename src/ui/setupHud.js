// HUD setup — instantiates every screen-space UI element, mounts via UIRoot,
// and wires the viewport-resize listeners that pin certain elements to the
// window edges.
//
// Returns a `hud` object whose fields are the constructed components, so
// main.js can drive component-specific methods (show, setSightBudget, etc.)
// without going through the UIRoot lookup table.

import { UIRoot } from './UIRoot.js';
import { FpsOverlay } from './FpsOverlay.js';
import { SightMeter } from './SightMeter.js';
import { CollectionFeedback } from './CollectionFeedback.js';
import { EntryPrompt } from './EntryPrompt.js';
import { TutorialPrompt } from './TutorialPrompt.js';
import { SceneFadeOverlay } from './SceneFadeOverlay.js';
import { EvidenceCounter } from './EvidenceCounter.js';
import { StageTitleCard } from './StageTitleCard.js';
import { RadialHauntMenu } from './RadialHauntMenu.js';
import { FearBar } from './FearBar.js';
import { EndScreen } from './EndScreen.js';
import { createAldricPortraitCard } from '../art/placeholders/aldric.js';
import { createVignette } from '../art/placeholders/decor.js';

export function setupHud({ app, ticker, stageData, sightBudget, gameState }) {
  const root = new UIRoot(app.stage);

  // Mount order matters for z-stacking. SightMeter pins itself to top-right;
  // EvidenceCounter + portrait stack on the left edge; vignette / scene fade
  // / endScreen sit on top.

  const fps = root.add('fps', new FpsOverlay(ticker));

  const sightMeter = root.add('sightMeter', new SightMeter());
  sightMeter.setSightBudget(sightBudget.getMs(), sightBudget.capacityMs);
  sightMeter.view.visible = false;

  const evidenceCounter = root.add('evidenceCounter', new EvidenceCounter());
  evidenceCounter.view.visible = false;

  // Portrait card is a bare Container (not a UIComponent); mount directly so
  // UIRoot doesn't tick it. Anchored to the EvidenceCounter's bottomY.
  const portraitCard = createAldricPortraitCard();
  portraitCard.x = 12;
  portraitCard.y = evidenceCounter.bottomY + 12;
  portraitCard.visible = false;
  app.stage.addChild(portraitCard);

  const stageTitleCard = root.add(
    'stageTitleCard',
    new StageTitleCard({ stageData, ticker }),
  );
  stageTitleCard.view.visible = false;

  // Vignette draws at logical 1280x720 and needs a resize hook to cover
  // larger viewports.
  const vignette = createVignette();
  app.stage.addChild(vignette);
  const applyVignetteResize = () => vignette.resize(window.innerWidth, window.innerHeight);
  applyVignetteResize();
  window.addEventListener('resize', applyVignetteResize);

  const collectionFeedback = root.add('collectionFeedback', new CollectionFeedback());

  const entryPrompt = root.add('entryPrompt', new EntryPrompt('Press E to enter the chapel'));
  const placeEntryPrompt = () =>
    entryPrompt.setScreenPosition(window.innerWidth, window.innerHeight);
  placeEntryPrompt();
  window.addEventListener('resize', placeEntryPrompt);

  const tutorialPrompt = root.add('tutorialPrompt', new TutorialPrompt());
  const placeTutorialPrompt = () => tutorialPrompt.setScreenPosition(window.innerWidth);
  placeTutorialPrompt();
  window.addEventListener('resize', placeTutorialPrompt);
  tutorialPrompt.show({
    message: 'A / D or  ← →   Walk toward the chapel\n\nE   Interact (at the door)',
    holdMs: 7000,
  });

  const fearBar = root.add('fearBar', new FearBar());
  fearBar.view.visible = false;

  const radialHauntMenu = root.add(
    'radialHauntMenu',
    new RadialHauntMenu({ unlockedHaunts: gameState.unlockedHaunts }),
  );
  radialHauntMenu.view.visible = false;

  const endScreen = root.add('endScreen', new EndScreen());
  endScreen.setOnRetry(() => location.reload());
  endScreen.setOnReturn(() => {
    // eslint-disable-next-line no-console
    console.log('[EndScreen] RETURN TO MENU — slice 5 wires this');
  });

  // SceneFadeOverlay sits ABOVE the HUD so it can mask scene swaps.
  const sceneFadeOverlay = root.add('sceneFadeOverlay', new SceneFadeOverlay());
  const applySceneFadeResize = () =>
    sceneFadeOverlay.resize(window.innerWidth, window.innerHeight);
  applySceneFadeResize();
  window.addEventListener('resize', applySceneFadeResize);

  return {
    root,
    fps,
    sightMeter,
    evidenceCounter,
    portraitCard,
    stageTitleCard,
    collectionFeedback,
    entryPrompt,
    tutorialPrompt,
    fearBar,
    radialHauntMenu,
    endScreen,
    sceneFadeOverlay,
  };
}
