export function wobble(t, seed) {
  return Math.sin(t * 1.7 + seed) * 0.55
       + Math.sin(t * 3.1 + seed * 2.3) * 0.30
       + Math.sin(t * 5.7 + seed * 3.7) * 0.15;
}

export class Aim {
  constructor() {
    this.x = 0; this.y = 0; this.t = 0;
    this.seed = Math.random() * 1000;
  }
  place(x, y) { this.x = x; this.y = y; }

  // sanity 0..1
  update(dt, mx, my, sanity) {
    this.t += dt;
    const panic = 1 - Math.max(0, Math.min(1, sanity));
    const amp = 5 + panic * panic * 95;
    const tx = mx + wobble(this.t, this.seed) * amp;
    const ty = my + wobble(this.t, this.seed + 500) * amp;
    const k = 1 - Math.exp(-dt * 9);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
  }
}

export const hits = (a, r) =>
  a.x >= r.x && a.x <= r.x + r.w && a.y >= r.y && a.y <= r.y + r.h;
