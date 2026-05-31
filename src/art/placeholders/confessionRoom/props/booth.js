// confessionRoom/props/booth.js — buildBoothProps factory.
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.

import { Container, Graphics } from 'pixi.js';
import { PALETTE } from '../../constants.js';
import { PROPS_FLOOR_Y } from '../geometry.js';

/**
 * Confession Booth (waypoint x=780) — EXTORTION.
 * - Booth structure (tall narrow wooden box).
 * - Curtain hanging on the confessor's side.
 * - Small kneeler bench in front (where pilgrims confessed).
 * - Tally marks scratched into the wooden side (count of pilgrims).
 */
export function buildBoothProps() {
  const c = new Container();
  c.label = 'props-booth';

  const boothCX = 780;
  const boothW = 78;
  const boothH = 110;
  const boothTopY = PROPS_FLOOR_Y - boothH;

  // Booth back wall — dark wood mass.
  const back = new Graphics();
  back
    .rect(boothCX - boothW / 2, boothTopY, boothW, boothH)
    .fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(back);

  // Booth roof trim — lighter wood, reads as a cornice on the box.
  const roof = new Graphics();
  roof
    .rect(boothCX - boothW / 2 - 3, boothTopY, boothW + 6, 6)
    .fill(PALETTE.PROPS.WOOD_BOWL);
  c.addChild(roof);

  // Vertical divider — splits booth into confessor (left) and penitent
  // (right) compartments. Reads as the lattice partition.
  const divider = new Graphics();
  divider
    .rect(boothCX - 2, boothTopY + 6, 4, boothH - 6)
    .fill(PALETTE.CHAPEL_FRAME);
  c.addChild(divider);

  // Confessor curtain — hanging fabric on the LEFT side. Drawn as a stack
  // of vertical pleats (3 thin rects of muted purple).
  const curtainX = boothCX - boothW / 2 + 4;
  const curtainY = boothTopY + 8;
  const curtainW = (boothW / 2) - 6;
  const curtainH = boothH - 26;
  const curtainBase = new Graphics();
  curtainBase
    .rect(curtainX, curtainY, curtainW, curtainH)
    .fill(PALETTE.PROPS.CURTAIN);
  c.addChild(curtainBase);
  // Three pleat shadows.
  for (let i = 1; i <= 3; i++) {
    const pleat = new Graphics();
    pleat
      .rect(curtainX + (curtainW / 4) * i - 1, curtainY, 2, curtainH)
      .fill(PALETTE.CHAPEL_FRAME);
    pleat.alpha = 0.4;
    c.addChild(pleat);
  }

  // Tally marks scratched into the RIGHT (penitent) side. Eight thin vertical
  // lines in two clusters of 4 (the classic count). Parchment tone.
  // Anti-slasher: scratches into wood read as "count of pilgrims processed",
  // not as wounds. Place at chest height on the back wall RIGHT half.
  const tallyY = boothTopY + 50;
  const tallyBaseX = boothCX + 10;
  for (let i = 0; i < 8; i++) {
    const cluster = Math.floor(i / 4);
    const within = i % 4;
    const tx = tallyBaseX + cluster * 14 + within * 3;
    const tally = new Graphics();
    tally.rect(tx, tallyY, 1, 10).fill(PALETTE.PROPS.TALLY_MARK);
    tally.alpha = 0.75;
    c.addChild(tally);
  }

  // Kneeler bench in front of the booth (penitent side, x ≈ booth right
  // half, on the floor). Small low rect, brown wood. Keep clear of the
  // confessionLedger evidence at x=860 — shift left slightly.
  const kneelerX = boothCX + 6;
  const kneelerW = 40;
  const kneeler = new Graphics();
  kneeler
    .rect(kneelerX, PROPS_FLOOR_Y - 6, kneelerW, 6)
    .fill(PALETTE.PROPS.KNEELER);
  c.addChild(kneeler);
  // Bench legs (two thin verticals so it reads 3D).
  const legL = new Graphics();
  legL.rect(kneelerX + 2, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legL);
  const legR = new Graphics();
  legR.rect(kneelerX + kneelerW - 5, PROPS_FLOOR_Y, 3, 6).fill(PALETTE.PROPS.WOOD_DARK);
  c.addChild(legR);

  return c;
}
