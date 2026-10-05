import { Revolver, GUNS } from './revolver.js';
import { Aim, hits } from './aim.js';
import * as R from './render.js';
import * as audio from './audio.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const DPR = Math.min(2, window.devicePixelRatio || 1);
canvas.width = R.W * DPR;
canvas.height = R.H * DPR;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

/* ---- tuning ---- */
const SANITY_MAX = 100;
const FIRE_COST  = 30;   // the bang
const BITE_COST  = 20;   // it reached you
const RELIEF     = 5;    // empty click
const BITE_PUSH  = 30;   // shoved back to here after a bite
const MISS_COST  = 8;
const MISS_LUNGE = 12;
const ADV_BASE   = 13;   // paces per pull, wave 1
const ADV_WAVE   = 2.5;
const DIST_MAX   = 100;

/* ---- state ---- */
const G = {
  state: 'menu',
  sanity: SANITY_MAX,
  wave: 1,
  dist: DIST_MAX,
  maxDist: DIST_MAX,
  advance: ADV_BASE,
  gun: null,
  aim: null,
  aimLeft: 0,
  aimTotal: 0,
  msg: '', msgSub: '', msgT: 0,
  shake: 0, flash: 0,
  lie: 0, lieT: 0,
  kills: 0,
  t: 0,
};

const mouse = { x: R.W / 2, y: R.H / 2 };

/* ---- input ---- */
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (R.W / r.width),
    y: (e.clientY - r.top) * (R.H / r.height),
  };
}

canvas.addEventListener('pointermove', e => {
  const p = toCanvas(e);
  mouse.x = p.x; mouse.y = p.y;
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  audio.init();
  const p = toCanvas(e);
  mouse.x = p.x; mouse.y = p.y;
  onClick(p);
});

/* ---- flow ---- */
function newRun() {
  G.state = 'choose';
  G.sanity = SANITY_MAX;
  G.wave = 1;
  G.dist = DIST_MAX;
  G.maxDist = DIST_MAX;
  G.gun = null;
  G.kills = 0;
  G.msg = ''; G.msgSub = ''; G.msgT = 0;
  G.shake = 0; G.flash = 0;
  G.lie = 0; G.lieT = 0;
  flash('CHOOSE.', 'Pick how badly you want to live.');
}

function chooseGun(i) {
  const def = GUNS[i];
  G.gun = new Revolver(def);
  G.state = 'stare';
  G.lie = 0; G.lieT = 0;
}

function pull() {
  if (!G.gun || G.gun.spent) return;

  const odds = G.gun.odds;
  const res = G.gun.pull();

  G.dist -= G.advance;
  const reached = G.dist <= 0;

  if (res.fired) {
    audio.bang();
    G.shake = 26;
    G.flash = 1;
    G.sanity -= FIRE_COST;
    if (reached) bite();
    if (G.sanity > 0) startAim();
    else die();
  } else {
    audio.click(0.9 + odds * 0.7);
    G.sanity = Math.min(SANITY_MAX, G.sanity + RELIEF);
    if (reached) bite();
    if (G.sanity <= 0) die();
  }
}

function bite() {
  audio.bite();
  G.sanity -= BITE_COST;
  G.dist = BITE_PUSH;
  G.shake = 30;
  G.flash = 0.55;
  flash('IT BIT YOU.', 'Get it off. GET IT OFF.');
}

function startAim() {
  G.state = 'aim';
  G.aimTotal = 1.1 + (Math.max(0, G.sanity) / SANITY_MAX) * 2.3;
  G.aimLeft = G.aimTotal;
  G.aim = new Aim();
  G.aim.place(mouse.x, mouse.y);
  flash('BANG.', 'Aim.');
}

function fire(p) {
  const zr = R.zombieRect(G.dist, G.maxDist);

  if (hits({ x: G.aim.x, y: G.aim.y }, zr)) {
    audio.kill();
    G.kills++;
    G.wave++;
    G.dist = DIST_MAX;
    G.maxDist = DIST_MAX;
    G.gun = null;
    G.state = 'choose';
    flash('DOWN.', 'Another one is coming.');
    return;
  }

  audio.miss();
  G.sanity -= MISS_COST;
  G.dist = Math.max(0, G.dist - MISS_LUNGE);
  if (G.dist <= 0) bite();
  if (G.sanity <= 0) { die(); return; }

  G.gun = null;
  G.state = 'choose';
  flash('MISSED.', 'It charges.');
}

function die() {
  if (G.state === 'dead') return;
  G.state = 'dead';
  G.sanity = 0;
  G.shake = 40;
  audio.miss();
}

function flash(m, s) {
  G.msg = m; G.msgSub = s || ''; G.msgT = 1.9;
}

/* ---- click routing ---- */
function onClick(p) {
  switch (G.state) {
    case 'menu':
      newRun();
      break;

    case 'choose': {
      const btns = R.gunButtons();
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
          chooseGun(i);
          return;
        }
      }
      break;
    }

    case 'stare':
      pull();
      break;

    case 'aim':
      fire(p);
      break;

    case 'dead':
      newRun();
      break;
  }
}

/* ---- lie to the player when panicking ---- */
function updateLie(dt) {
  G.lieT -= dt;
  if (G.lieT > 0) return;
  G.lieT = 0.18 + Math.random() * 0.28;

  const panic = Math.max(0, (65 - G.sanity) / 65);
  if (Math.random() < panic * 0.8) {
    const mag = Math.random() < 0.4 ? 2 : 1;
    G.lie = (Math.random() < 0.5 ? -1 : 1) * mag;
  } else {
    G.lie = 0;
  }
}

/* ---- loop ---- */
let last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  G.t += dt;

  G.advance = ADV_BASE + (G.wave - 1) * ADV_WAVE;

  G.shake *= Math.pow(0.0015, dt);
  G.flash *= Math.pow(0.0008, dt);
  if (G.msgT > 0) G.msgT -= dt;

  if (G.state === 'stare') {
    const rate = 1.2 + (G.wave - 1) * 0.25;
    G.dist -= rate * dt;
    if (G.dist <= 0) {
      bite();
      if (G.sanity <= 0) die();
    }
    updateLie(dt);
  }

  if (G.state === 'aim') {
    G.aimLeft -= dt;
    G.aim.update(dt, mouse.x, mouse.y, G.sanity / SANITY_MAX);
    if (G.aimLeft <= 0) {
      audio.miss();
      G.sanity -= MISS_COST;
      G.dist = Math.max(0, G.dist - MISS_LUNGE);
      if (G.dist <= 0) bite();
      if (G.sanity <= 0) die();
      else {
        G.gun = null;
        G.state = 'choose';
        flash('TOO SLOW.', 'It charges.');
      }
    }
  }

  if (G.state === 'menu' || G.state === 'dead') G.lie = 0;

  // audio tension
  const dread = Math.max(
    1 - G.dist / DIST_MAX,
    1 - G.sanity / SANITY_MAX
  );
  audio.setTension(Math.max(0, Math.min(1, dread)));

  R.draw(ctx, G, mouse);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
