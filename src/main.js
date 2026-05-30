import { Application } from 'pixi.js';

const LOGICAL_WIDTH = 720;
const LOGICAL_HEIGHT = 1280;

(async () => {
  const app = new Application();

  await app.init({
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    background: '#000000',
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  document.getElementById('app').appendChild(app.canvas);
})();
