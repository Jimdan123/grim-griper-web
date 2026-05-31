// Minimal lifecycle container for UI components. Components are duck-typed —
// each must expose `.view` (a PIXI.Container); `update(dtMs)` and `destroy()`
// are optional and only called when present.
//
// Usage:
//   const ui = new UIRoot(app.stage);
//   ui.add('fps', new FpsOverlay(app.ticker));
//   ui.add('fearBar', new FearBar());
//   // ...
//   ui.update(dtMs);   // per-frame tick (skips components without update)
//   ui.destroyAll();   // teardown

export class UIRoot {
  constructor(parent) {
    this.parent = parent;
    this._entries = [];
    this._byName = new Map();
  }

  add(name, component) {
    if (this._byName.has(name)) {
      throw new Error(`UIRoot: duplicate component name '${name}'`);
    }
    this._entries.push({ name, component });
    this._byName.set(name, component);
    this.parent.addChild(component.view);
    return component;
  }

  get(name) {
    return this._byName.get(name);
  }

  update(dtMs) {
    for (const { component } of this._entries) {
      if (typeof component.update === 'function') component.update(dtMs);
    }
  }

  destroyAll() {
    for (const { component } of this._entries) {
      if (typeof component.destroy === 'function') component.destroy();
    }
    this._entries.length = 0;
    this._byName.clear();
  }
}
