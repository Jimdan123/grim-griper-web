// aldric/portraitCard.js — ALDRIC_CARD geometry + createAldricPortraitCard.
// Split from src/art/placeholders/aldric.js per issue #2 Phase H.

import { Container, Graphics } from 'pixi.js';
import { PALETTE, SCALE } from '../constants.js';

const ALDRIC_CARD = {
  WIDTH: 120,
  HEIGHT: 160,
  PADDING: 10,       // inset from card edge to portrait area
  FRAME_W: 3,        // carved-stone frame thickness
};

export function createAldricPortraitCard() {
  const container = new Container();
  container.label = 'aldric-portrait-card';

  const { WIDTH: CW, HEIGHT: CH, PADDING: PAD, FRAME_W: FW } = ALDRIC_CARD;

  // Card backing — same stone tone as the cross-plaque signage, so the two
  // bits of HUD furniture share a visual family.
  const backing = new Graphics();
  backing.rect(0, 0, CW, CH).fill(PALETTE.COMPOSITION.CROSS_PLAQUE);
  container.addChild(backing);

  // Inner pane — dimmer recess behind the silhouette, evokes a darkened
  // niche the portrait sits in.
  const pane = new Graphics();
  pane
    .rect(FW, FW, CW - FW * 2, CH - FW * 2)
    .fill(PALETTE.CHAPEL_FRAME);
  container.addChild(pane);

  // Frame highlight — thin warm inner edge so the card reads as "lit from
  // candle light", matching the chapel's diegetic lighting.
  const highlight = new Graphics();
  highlight
    .rect(FW, FW, CW - FW * 2, 1)
    .fill(PALETTE.COMPOSITION.CANDLE_WARM);
  highlight.alpha = 0.5;
  container.addChild(highlight);

  // Inner portrait area — where the Aldric silhouette sits.
  const portraitX = PAD;
  const portraitY = PAD;
  const portraitW = CW - PAD * 2;
  const portraitH = CH - PAD * 2;

  // Aldric silhouette — same shape grammar as the ghost priest (cleric body
  // + round head + collar band), but in WARM CREAM. Pivot bottom-center on
  // the portrait area so the figure stands on the bottom of the card.
  // Scale character to fit within the portrait area while preserving the
  // 40x116 logical Aldric proportions from SCALE.ALDRIC.
  const A = SCALE.ALDRIC;
  // Fit the 40x116 figure into portraitW x portraitH at uniform scale.
  const scale = Math.min(portraitW / A.WIDTH, portraitH / A.HEIGHT);
  const figW = A.WIDTH * scale;
  const figH = A.HEIGHT * scale;
  const figX = portraitX + (portraitW - figW) / 2;
  const figY = portraitY + (portraitH - figH);  // stand on card bottom-pad

  // Body — warm cream vestment.
  const bodyH = A.BODY_H * scale;
  const body = new Graphics();
  body.rect(figX, figY + figH - bodyH, figW, bodyH).fill(PALETTE.ALDRIC_BODY);
  container.addChild(body);

  // Collar band — dark band where head meets body, distinguishes cleric
  // from the headless ghost silhouettes.
  const collarH = A.COLLAR_H * scale;
  const collar = new Graphics();
  collar
    .rect(figX, figY + figH - bodyH, figW, collarH)
    .fill(PALETTE.ALDRIC_COLLAR);
  container.addChild(collar);

  // Head — warm cream circle, sits on top of the body.
  const headR = A.HEAD_R * scale;
  const head = new Graphics();
  head
    .circle(figX + figW / 2, figY + figH - bodyH - headR, headR)
    .fill(PALETTE.ALDRIC_HEAD);
  container.addChild(head);

  // Subtle vignette inside the card — dim the bottom corners so the figure
  // feels lit from candle above. Two faint corner rects, very low alpha.
  const vignette = new Graphics();
  vignette.rect(FW, CH - FW - 12, CW - FW * 2, 12).fill(PALETTE.COMPOSITION.VIGNETTE);
  vignette.alpha = 0.35;
  container.addChild(vignette);

  return container;
}
