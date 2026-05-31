// Ambient motion mounts — candle flames at the four lit candles, dust
// motes drifting through the stained-glass shaft, and a smoke wisp at
// the snuffed altar candle. Caller registers the returned `updates`
// array into the GameLoop.

import { CandleFlame, DustMotes, SmokeWisp } from '../art/ambientMotion.js';
import {
  CONFESSION_ROOM_CANDLES,
  STAINED_WINDOW_SHAFT,
} from '../art/placeholders/confessionRoom/geometry.js';

export function mountAmbientMotion({ worldInside }) {
  const updates = [];

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
    worldInside.addChild(flame.view);
    updates.push(flame);
  }

  const motes = new DustMotes({
    x: STAINED_WINDOW_SHAFT.x,
    y: STAINED_WINDOW_SHAFT.y,
    width: STAINED_WINDOW_SHAFT.width,
    height: STAINED_WINDOW_SHAFT.height,
    count: 8,
  });
  worldInside.addChild(motes.view);
  updates.push(motes);

  const smoke = new SmokeWisp({
    x: CONFESSION_ROOM_CANDLES.altarSnuffed.x,
    y: CONFESSION_ROOM_CANDLES.altarSnuffed.y,
  });
  worldInside.addChild(smoke.view);
  updates.push(smoke);

  return { updates };
}
