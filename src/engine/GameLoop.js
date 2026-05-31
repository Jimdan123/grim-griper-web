const MAX_DT_MS = 50;

export class GameLoop {
  constructor(ticker) {
    this.ticker = ticker;
    this.systems = [];
    this.running = false;
    this._tick = this._tick.bind(this);
  }

  add(system) {
    this.systems.push(system);
    return this;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.ticker.add(this._tick);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.ticker.remove(this._tick);
  }

  _tick(ticker) {
    const rawMs = ticker.deltaMS ?? ticker.elapsedMS ?? 16.6667;
    const dtMs = Math.min(rawMs, MAX_DT_MS);
    for (let i = 0; i < this.systems.length; i++) {
      this.systems[i].update(dtMs);
    }
  }
}
