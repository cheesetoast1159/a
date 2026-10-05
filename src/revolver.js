export const GUNS = [
  { name: 'SNUB',          chambers: 6,  tag: 'Fast. Cheap. Loud on the nerves.' },
  { name: 'SERVICE',       chambers: 8,  tag: 'The middle ground.' },
  { name: 'LONG CYLINDER', chambers: 10, tag: 'Quiet odds. Long walk.' },
];

export class Revolver {
  constructor(def) {
    this.name = def.name;
    this.chambers = def.chambers;
    this.reset();
  }
  reset() {
    this.bullet = Math.floor(Math.random() * this.chambers);
    this.index = 0;
    this.spent = false;
  }
  get remaining() { return this.chambers - this.index; }
  get odds() { return this.spent ? 0 : 1 / this.remaining; }

  pull() {
    if (this.spent) return { fired: false, odds: 0 };
    const odds = this.odds;
    const fired = this.index === this.bullet;
    this.index++;
    if (fired) this.spent = true;
    return { fired, odds };
  }
}
