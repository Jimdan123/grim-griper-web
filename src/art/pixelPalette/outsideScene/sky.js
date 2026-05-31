// outsideScene/sky.js — sky band, horizon haze, horizon mist, clouds, sun.
// Split from createOutsideChapelScenePixelArt per issue #2 Phase A.
//
// Section 1 of the outside scene composite. Draws into the parent container
// (draw-into-parent pattern) so that the original z-order is preserved when
// composite.js calls each layer in turn.

import { Graphics } from 'pixi.js';
import { PIXEL_PALETTE } from '../constants.js';

export function drawSky(container, spec) {
  const { canvasW, groundY } = spec;

  const sky = new Graphics();
  sky.rect(0, 0, canvasW, groundY).fill(PIXEL_PALETTE.SKY_BLUE);
  container.addChild(sky);

  // Horizon haze — slightly lighter band along y ∈ [GROUND_Y-80, GROUND_Y].
  const horizonHaze = new Graphics();
  horizonHaze
    .rect(0, groundY - 80, canvasW, 80)
    .fill(PIXEL_PALETTE.SKY_HORIZON);
  horizonHaze.alpha = 0.6;
  container.addChild(horizonHaze);

  // POLISH PASS: tight horizon-mist band straddling the sky→grass meeting
  // line so the transition is no longer a hard horizontal cut. 8px lighter
  // sky-side haze right above the ground line, then a 4px grass-side band of
  // GROUND_GRASS_HI bleeding upward into the haze. Anti-slasher: cream-cool
  // mist, NOT sunset orange, NOT blood haze.
  const horizonMistSky = new Graphics();
  horizonMistSky
    .rect(0, groundY - 8, canvasW, 8)
    .fill(PIXEL_PALETTE.SKY_HORIZON);
  horizonMistSky.alpha = 0.5;
  container.addChild(horizonMistSky);
  const horizonMistGrass = new Graphics();
  horizonMistGrass
    .rect(0, groundY, canvasW, 4)
    .fill(PIXEL_PALETTE.GROUND_GRASS_HI);
  horizonMistGrass.alpha = 0.3;
  container.addChild(horizonMistGrass);

  // Two low-alpha pale cloud-wisp streaks JUST above the horizon mist band —
  // atmospheric perspective hint. Long and thin so they read as far-away
  // cloud, not foreground smoke.
  const horizonClouds = new Graphics();
  horizonClouds.rect(60, groundY - 18, 280, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  horizonClouds.rect(380, groundY - 14, 220, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  horizonClouds.alpha = 0.35;
  container.addChild(horizonClouds);

  // Cloud streaks — 1px horizontal wisps at low alpha. Two streaks at
  // varying lengths, all in the upper third.
  const clouds = new Graphics();
  // Streak A — long, x=140..360, y=90
  clouds.rect(140, 90, 220, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.rect(160, 91, 180, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  // Streak B — short, x=520..640, y=148
  clouds.rect(520, 148, 120, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  // Streak C — long fade right, x=720..1040, y=70
  clouds.rect(720, 70, 320, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.rect(760, 71, 240, 1).fill(PIXEL_PALETTE.CLOUD_WISP);
  clouds.alpha = 0.7;
  container.addChild(clouds);

  // Sun — 12×12 muted gold disc with a faint halo. Upper-right area.
  // Anti-slasher: muted DAY_LIGHT cream-gold, NOT a neon yellow disc.
  const SUN_CX = 1140;
  const SUN_CY = 110;
  // Halo (3 concentric squares of widening size, decreasing alpha).
  const sunHalo = new Graphics();
  sunHalo.rect(SUN_CX - 14, SUN_CY - 14, 28, 28).fill(PIXEL_PALETTE.SUN_DISC);
  sunHalo.alpha = 0.18;
  container.addChild(sunHalo);
  const sunHaloMid = new Graphics();
  sunHaloMid.rect(SUN_CX - 10, SUN_CY - 10, 20, 20).fill(PIXEL_PALETTE.SUN_DISC);
  sunHaloMid.alpha = 0.28;
  container.addChild(sunHaloMid);
  // Sun disc — 12×12 with corner pixel-stairs to round it.
  const sun = new Graphics();
  sun.rect(SUN_CX - 6, SUN_CY - 6, 12, 12).fill(PIXEL_PALETTE.SUN_DISC);
  // Knock out four corner pixels for a rounded read.
  sun.rect(SUN_CX - 6, SUN_CY - 6, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX + 5, SUN_CY - 6, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX - 6, SUN_CY + 5, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  sun.rect(SUN_CX + 5, SUN_CY + 5, 1, 1).fill(PIXEL_PALETTE.SKY_BLUE);
  container.addChild(sun);
}
