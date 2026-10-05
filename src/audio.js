let ctx = null, noise = null, droneGain = null;

export function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const len = ctx.sampleRate * 1;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  startDrone();
}

function startDrone() {
  droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  droneGain.connect(ctx.destination);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 200; lp.Q.value = 3;
  lp.connect(droneGain);
  [36, 36.7, 54.3].forEach(f => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f;
    o.connect(lp); o.start();
  });
}

// v: 0..1 dread
export function setTension(v) {
  if (!ctx || !droneGain) return;
  droneGain.gain.setTargetAtTime(0.015 + v * 0.085, ctx.currentTime, 0.5);
}

export function click(pitch = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1900 * pitch; bp.Q.value = 9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t); src.stop(t + 0.1);
}

export function bang() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(7000, t);
  lp.frequency.exponentialRampToValueAtTime(180, t + 0.45);
  const g = ctx.createGain();
  g.gain.setValueAtTime(1.0, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  src.connect(lp).connect(g).connect(ctx.destination);
  src.start(t); src.stop(t + 0.6);

  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(32, t + 0.3);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.9, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  o.connect(og).connect(ctx.destination);
  o.start(t); o.stop(t + 0.45);
}

export function bite() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t); src.stop(t + 0.4);
}

export function miss() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.6);
}

export function kill() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 700;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  src.connect(lp).connect(g).connect(ctx.destination);
  src.start(t); src.stop(t + 0.8);
}
