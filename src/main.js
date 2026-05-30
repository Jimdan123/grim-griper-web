import { Application, Container } from 'pixi.js';

const LOGICAL_WIDTH = 720;
const LOGICAL_HEIGHT = 1280;

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: '#000000',
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  document.getElementById('app').appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  const fit = () => {
    const scale = Math.min(
      app.renderer.width / app.renderer.resolution / LOGICAL_WIDTH,
      app.renderer.height / app.renderer.resolution / LOGICAL_HEIGHT,
    );
    world.scale.set(scale);
    world.x = (app.renderer.width / app.renderer.resolution - LOGICAL_WIDTH * scale) / 2;
    world.y = (app.renderer.height / app.renderer.resolution - LOGICAL_HEIGHT * scale) / 2;
  };

  fit();
  window.addEventListener('resize', fit);
})();
