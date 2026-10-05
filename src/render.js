import { GUNS } from './revolver.js';

export const W = 960, H = 600;
const GROUND = H * 0.80;

export function zombieRect(dist, maxDist) {
  const t = 1 - Math.max(0, Math.min(1, dist / maxDist));
  const size = 110 + t * t * 340;
  const cx = W * 0.5;
  return { x: cx - size / 2, y: GROUND - size, w: size, h: size };
}

export function gunButtons() {
  const w = 216, h = 210, gap = 34;
  const total = GUNS.length * w + (GUNS.length - 1) * gap;
  const x0 = (W - total) / 2;
  return GUNS.map((g, i) => ({ x: x0 + i * (w + gap), y: 236, w, h, def: g }));
}

const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/* ---------------- main ---------------- */

export function draw(ctx, G, mouse) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  if (G.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  }

  const zr = zombieRect(G.dist, G.maxDist);
  drawRoom(ctx, G);
  drawZombie(ctx, zr, G.dist / G.maxDist, G);

  if (G.state === 'menu') drawMenu(ctx, G);
  else if (G.state === 'choose') drawChoose(ctx, G, mouse, zr);
  else if (G.state === 'stare') drawStare(ctx, G, zr);
  else if (G.state === 'aim') drawAim(ctx, G, mouse, zr);
  else if (G.state === 'dead') drawDead(ctx, G);

  drawHUD(ctx, G);
  drawVignette(ctx, G);
  drawMessages(ctx, G);

  if (G.flash > 0.01) {
    ctx.fillStyle = `rgba(255,225,190,${G.flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ---------------- scene ---------------- */

function drawRoom(ctx, G) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0c0f');
  g.addColorStop(0.7, '#0e1114');
  g.addColorStop(1, '#050607');
  ctx.fillStyle = g;
  ctx.fillRect(-40, -40, W + 80, H + 80);

  // floor line
  ctx.strokeStyle = 'rgba(120,130,120,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

  // wall slats
  ctx.strokeStyle = 'rgba(120,130,120,0.045)';
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke();
  }
}

function drawZombie(ctx, r, t, G) {
  const cx = r.x + r.w / 2;
  const s = r.w;
  const wob = Math.sin(G.t * 3.2) * s * 0.012;
  const lean = t * s * 0.03;

  ctx.save();
  ctx.translate(wob, 0);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND + 4, s * 0.42, s * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#151d19';
  ctx.strokeStyle = 'rgba(90,140,105,0.35)';
  ctx.lineWidth = Math.max(1.5, s * 0.006);

  // torso
  const tw = s * 0.40, th = s * 0.46;
  ctx.beginPath();
  ctx.rect(cx - tw / 2 + lean, r.y + s * 0.33, tw, th);
  ctx.fill(); ctx.stroke();

  // head
  ctx.beginPath();
  ctx.arc(cx + lean * 1.4, r.y + s * 0.21, s * 0.155, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // arms reaching forward (toward viewer = thicker lower)
  ctx.beginPath();
  ctx.moveTo(cx - tw / 2 + lean, r.y + s * 0.38);
  ctx.lineTo(cx - s * 0.30, r.y + s * 0.60);
  ctx.lineTo(cx - s * 0.24, r.y + s * 0.70);
  ctx.lineTo(cx - tw / 2 + lean, r.y + s * 0.50);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + tw / 2 + lean, r.y + s * 0.38);
  ctx.lineTo(cx + s * 0.30, r.y + s * 0.60);
  ctx.lineTo(cx + s * 0.24, r.y + s * 0.70);
  ctx.lineTo(cx + tw / 2 + lean, r.y + s * 0.50);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // legs
  ctx.fillRect(cx - tw * 0.42 + lean, r.y + s * 0.79, tw * 0.32, s * 0.19);
  ctx.fillRect(cx + tw * 0.10 + lean, r.y + s * 0.79, tw * 0.32, s * 0.19);

  // eyes
  const eyeGlow = 0.35 + t * 0.65;
  ctx.fillStyle = `rgba(210,255,120,${eyeGlow})`;
  const ey = r.y + s * 0.20, ex = s * 0.055;
  ctx.beginPath(); ctx.arc(cx + lean * 1.4 - ex, ey, s * 0.024, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + lean * 1.4 + ex, ey, s * 0.024, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  // the square hitbox — visible so aiming is honest
  ctx.save();
  ctx.strokeStyle = `rgba(255,120,90,${0.20 + t * 0.25})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 7]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

/* ---------------- states ---------------- */

function drawMenu(ctx, G) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#e9e2d2';
  ctx.font = 'bold 52px ui-monospace, monospace';
  ctx.fillText('ONE IN THE CHAMBER', W / 2, 232);

  ctx.fillStyle = '#7f8a7c';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText('You do not want to do this.', W / 2, 276);
  ctx.fillText('The cylinder does not care.', W / 2, 300);

  const pulse = 0.55 + Math.sin(G.t * 3) * 0.35;
  ctx.fillStyle = `rgba(233,226,210,${pulse})`;
  ctx.font = 'bold 19px ui-monospace, monospace';
  ctx.fillText('[ CLICK TO BEGIN ]', W / 2, 400);

  ctx.fillStyle = '#4d5450';
  ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('empty clicks steady you. the bang does not.', W / 2, 470);
}

function drawChoose(ctx, G, mouse, zr) {
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#e9e2d2';
  ctx.font = 'bold 30px ui-monospace, monospace';
  ctx.fillText('CHOOSE YOUR REVOLVER', W / 2, 108);

  ctx.font = '15px ui-monospace, monospace';
  ctx.fillStyle = G.dist < 34 ? '#e2705a' : '#7f8a7c';
  ctx.fillText(`It is ${Math.round(G.dist)} paces away.`, W / 2, 140);

  const btns = gunButtons();
  const adv = G.advance;

  for (const b of btns) {
    const over = inRect(mouse, b);
    const worst = b.def.chambers * adv;
    const risky = worst >= G.dist;
    const hair = worst >= G.dist * 0.82 && !risky;

    ctx.fillStyle = over ? 'rgba(30,36,34,0.95)' : 'rgba(17,21,20,0.92)';
    ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = risky ? 'rgba(226,112,90,0.85)'
                    : hair  ? 'rgba(226,180,90,0.75)'
                    : over  ? 'rgba(180,200,180,0.7)'
                            : 'rgba(90,100,95,0.5)';
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

    const cx = b.x + b.w / 2;
    ctx.fillStyle = '#e9e2d2';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillText(b.def.name, cx, b.y + 34);

    drawMiniCylinder(ctx, cx, b.y + 92, 40, b.def.chambers);

    ctx.fillStyle = '#98a396';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(`${b.def.chambers} chambers`, cx, b.y + 158);
    ctx.fillStyle = '#6d7669';
    ctx.fillText(`first pull: 1 in ${b.def.chambers}`, cx, b.y + 178);

    if (risky) {
      ctx.fillStyle = '#e2705a';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.fillText('MAY NOT REACH IN TIME', cx, b.y + 200);
    } else if (hair) {
      ctx.fillStyle = '#e2b45a';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.fillText('IT WILL BE CLOSE', cx, b.y + 200);
    } else {
      ctx.fillStyle = '#5c6659';
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(b.def.tag, cx, b.y + 200);
    }
  }
}

function drawMiniCylinder(ctx, cx, cy, r, n) {
  ctx.strokeStyle = 'rgba(140,150,140,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66, r * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,70,64,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,160,150,0.35)';
    ctx.stroke();
  }
}

function drawStare(ctx, G, zr) {
  ctx.textAlign = 'center';
  const pulse = 0.4 + Math.sin(G.t * 4) * 0.25;
  ctx.fillStyle = `rgba(200,210,195,${pulse})`;
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.fillText('CLICK TO PULL THE TRIGGER', W / 2, H - 210);

  drawCylinder(ctx, G, W / 2, H - 108, 76);
}

function drawAim(ctx, G, mouse, zr) {
  drawCylinder(ctx, G, W / 2, H - 108, 76);

  // aim reticle
  const a = G.aim;
  const spread = 16 + (1 - Math.max(0, Math.min(1, G.sanity / 100))) * 34;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,120,90,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(a.x - spread, a.y); ctx.lineTo(a.x - 5, a.y);
  ctx.moveTo(a.x + 5, a.y);      ctx.lineTo(a.x + spread, a.y);
  ctx.moveTo(a.x, a.y - spread); ctx.lineTo(a.x, a.y - 5);
  ctx.moveTo(a.x, a.y + 5);      ctx.lineTo(a.x, a.y + spread);
  ctx.stroke();
  ctx.restore();

  // timer bar
  const p = Math.max(0, G.aimLeft / G.aimTotal);
  const bw = 300;
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(W / 2 - bw / 2, 74, bw, 6);
  ctx.fillStyle = p < 0.3 ? '#e2705a' : '#d8cfae';
  ctx.fillRect(W / 2 - bw / 2, 74, bw * p, 6);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(233,226,210,0.75)';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('AIM AND CLICK', W / 2, 62);
}

function drawDead(ctx, G) {
  ctx.fillStyle = 'rgba(20,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#e2705a';
  ctx.font = 'bold 46px ui-monospace, monospace';
  ctx.fillText('YOU STOPPED', W / 2, 250);

  ctx.fillStyle = '#a89c8c';
  ctx.font = '17px ui-monospace, monospace';
  ctx.fillText(`You put down ${G.kills} of them.`, W / 2, 296);
  ctx.fillText(`Wave ${G.wave} was the last.`, W / 2, 322);

  const pulse = 0.5 + Math.sin(G.t * 3) * 0.35;
  ctx.fillStyle = `rgba(233,226,210,${pulse})`;
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillText('[ CLICK TO TRY AGAIN ]', W / 2, 410);
}

/* ---------------- HUD ---------------- */

function drawCylinder(ctx, G, cx, cy, r) {
  if (!G.gun) return;

  const g = G.gun;
  const shown = Math.max(0, Math.min(g.chambers, g.index + G.lie));

  ctx.save();
  ctx.strokeStyle = 'rgba(150,160,150,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,160,150,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.80, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < g.chambers; i++) {
    const a = (i / g.chambers) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r * 0.66;
    const y = cy + Math.sin(a) * r * 0.66;
    const rad = r * 0.155;

    const struck = i < shown;
    const next = i === shown && !g.spent;

    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = struck ? 'rgba(30,34,32,0.95)' : 'rgba(70,78,72,0.9)';
    ctx.fill();
    ctx.strokeStyle = struck ? 'rgba(70,78,72,0.5)' : 'rgba(170,180,170,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (struck) {
      ctx.strokeStyle = 'rgba(120,128,120,0.45)';
      ctx.beginPath();
      ctx.moveTo(x - rad * 0.6, y - rad * 0.6);
      ctx.lineTo(x + rad * 0.6, y + rad * 0.6);
      ctx.stroke();
    }

    if (next) {
      const p = 0.45 + Math.sin(G.t * 6) * 0.35;
      ctx.strokeStyle = `rgba(226,112,90,${p})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, rad + 5, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // odds readout
  const left = g.chambers - shown;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(233,226,210,0.9)';
  ctx.font = 'bold 15px ui-monospace, monospace';
  const label = g.spent ? 'SPENT' : (left > 0 ? `1 in ${left}` : '—');
  ctx.fillText(label, cx, cy + r + 26);

  ctx.fillStyle = 'rgba(120,130,120,0.75)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(g.name, cx, cy - r - 12);

  ctx.restore();
}

function drawHUD(ctx, G) {
  // sanity
  const bw = 250, bh = 14, bx = 28, by = 28;
  const p = Math.max(0, Math.min(1, G.sanity / 100));

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(140,150,140,0.75)';
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText('NERVE', bx, by - 8);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(bx, by, bw, bh);

  const col = p > 0.6 ? '#8fbf7a' : p > 0.3 ? '#d9b45a' : '#e2705a';
  ctx.fillStyle = col;
  ctx.fillRect(bx, by, bw * p, bh);

  ctx.strokeStyle = 'rgba(150,160,150,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.fillStyle = 'rgba(200,210,195,0.85)';
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.fillText(`${Math.round(G.sanity)}`, bx + bw + 10, by + 12);

  // wave
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(140,150,140,0.75)';
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText('WAVE', W - 28, by - 8);
  ctx.fillStyle = 'rgba(233,226,210,0.9)';
  ctx.font = 'bold 30px ui-monospace, monospace';
  ctx.fillText(String(G.wave), W - 28, by + 24);

  // distance
  if (G.state !== 'menu' && G.state !== 'dead') {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(140,150,140,0.7)';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillText('DISTANCE', W - 28, by + 54);
    ctx.fillStyle = G.dist < 34 ? '#e2705a' : 'rgba(200,210,195,0.8)';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText(`${Math.max(0, Math.round(G.dist))}`, W - 28, by + 76);
  }
}

function drawVignette(ctx, G) {
  const panic = 1 - Math.max(0, Math.min(1, G.sanity / 100));
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.92);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(${Math.round(panic * 40)},0,0,${0.55 + panic * 0.4})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawMessages(ctx, G) {
  if (G.msgT <= 0) return;
  const a = Math.min(1, G.msgT / 0.35);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2705a';
  ctx.font = 'bold 38px ui-monospace, monospace';
  ctx.fillText(G.msg, W / 2, 196);
  if (G.msgSub) {
    ctx.fillStyle = 'rgba(200,190,170,0.85)';
    ctx.font = '15px ui-monospace, monospace';
    ctx.fillText(G.msgSub, W / 2, 224);
  }
  ctx.restore();
}
