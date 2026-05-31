export class StateMachine {
  constructor(states, initial) {
    this.states = states;
    this.currentName = null;
    this.current = null;
    if (initial) this.transition(initial);
  }

  transition(nextName) {
    const next = this.states[nextName];
    if (!next) throw new Error(`StateMachine: unknown state "${nextName}"`);
    const prevName = this.currentName;
    if (this.current && typeof this.current.exit === 'function') {
      this.current.exit(nextName);
    }
    this.currentName = nextName;
    this.current = next;
    if (typeof next.enter === 'function') {
      next.enter(prevName);
    }
  }

  update(dtMs) {
    if (this.current && typeof this.current.update === 'function') {
      this.current.update(dtMs);
    }
  }

  is(name) {
    return this.currentName === name;
  }
}
