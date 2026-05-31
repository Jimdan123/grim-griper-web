// confessionRoom/geometry.js — shared geometric constants for the confession-
// room props composition (PROPS_FLOOR_Y) and the two outward-facing geometry
// constants consumed by ambientMounts.js (CONFESSION_ROOM_CANDLES,
// STAINED_WINDOW_SHAFT).
// Split from src/art/placeholders/confessionRoom.js per issue #2 Phase E.
//
// No PIXI dependency — plain numeric constants. Imported by every sibling
// per-prop builder so that PROPS_FLOOR_Y is a single source of truth.

export const PROPS_FLOOR_Y = 520;

// Coordinates exposed so ambientMotion mount in main.js can place flames at
// the wicks of THE SAME candles drawn by the props composite. Single source
// of truth — if a candle position changes in altar.js / lectern.js /
// sacristy.js, the flame coordinates change here.
export const CONFESSION_ROOM_CANDLES = {
  // Altar block top y = PROPS_FLOOR_Y - 44 = 476. Candles are 18 tall, sit
  // on top of altar, wick = (top - 1).
  altarLeft:  { x: 220 - 55 + 10 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  altarRight: { x: 220 + 55 - 14 + 2,    y: 476 - 18 - 1, flameRadius: 4 },
  // Snuffed candle — same row, in the middle of the altar.
  altarSnuffed: { x: 220 - 2 + 2,        y: 476 - 14 - 1, flameRadius: 0 },
  // Lectern top candle.
  lecternTop: { x: 500 + 10 + 1,         y: PROPS_FLOOR_Y - 60 - 10 - 1, flameRadius: 3 },
  // Sacristy stand candle.
  sacristyStand: { x: 1060 + 38 - 1 + 1, y: PROPS_FLOOR_Y - 24 - 12 - 1, flameRadius: 3 },
};

// Stained-glass shaft geometry — exposed for DustMotes mount in main.js.
// The window is mounted at (altar.x - 30, 300), W=80, H=180.
// Light shaft drops from the window's lower edge down to the floor surface,
// narrowing slightly. We approximate it as a vertical rectangle directly
// below the window pane, clamped to the floor strip top.
export const STAINED_WINDOW_SHAFT = {
  // Window is at x = altar.x - 30 = 190. Shaft starts inset by 10 (pane
  // inset from window frame), width = pane width (60), drops from window
  // bottom (300 + 180 = 480) to floor top (520). 40px tall shaft.
  x: 190 + 10,
  y: 480,
  width: 60,
  height: PROPS_FLOOR_Y - 480,  // 40
};
