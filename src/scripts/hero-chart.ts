import { currentTheme, loopWhileVisible, prefersReducedMotion } from './env';

export type HeroVariant = 'A' | 'B' | 'C';

interface Palette {
  dot: string;
  faint: string;
  grid: string;
  fg: string;
  acc: string;
  accA: (a: number) => string;
  onacc: string;
}

const PAL: Record<'dark' | 'light', Palette> = {
  dark: {
    dot: 'rgba(236,232,225,0.42)',
    faint: 'rgba(236,232,225,0.16)',
    grid: 'rgba(236,232,225,0.08)',
    fg: '#ece8e1',
    acc: '#c24d64',
    accA: (a) => `rgba(194,77,100,${a})`,
    onacc: '#ffffff',
  },
  light: {
    dot: 'rgba(23,21,18,0.42)',
    faint: 'rgba(23,21,18,0.16)',
    grid: 'rgba(23,21,18,0.08)',
    fg: '#171512',
    acc: '#7d1d32',
    accA: (a) => `rgba(125,29,50,${a})`,
    onacc: '#ffffff',
  },
};

const CLUSTERS = [
  { x: 0.14, y: 0.26, l: 'claims recovery' },
  { x: 0.38, y: 0.16, l: 'live sales stream' },
  { x: 0.6, y: 0.3, l: 'churn risk' },
  { x: 0.84, y: 0.2, l: 'sentiment · NLP' },
  { x: 0.76, y: 0.5, l: 'demand forecast' },
];

interface Cluster {
  x: number;
  y: number;
  l: string;
  n: number;
}
interface Pt {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  k: number;
  ph: number;
  r: number;
}
interface Bar {
  b: number;
  cur: number;
}

const OFF = -9999;

export function initHeroChart(canvas: HTMLCanvasElement, mode: HeroVariant) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = prefersReducedMotion();
  const mouse = { x: OFF, y: OFF };
  const t0 = performance.now();
  let w = 0;
  let h = 0;

  // A · Clusters
  let clusters: Cluster[] = [];
  let pts: Pt[] = [];
  // B · Forecast
  let series: number[] = [];
  let ys: number[] = [];
  let split = 0;
  let cx: number | null = null;
  // C · Pulse
  let bars: Bar[] = [];

  // Store raw client coords; convert to canvas space once per frame (no layout read per event).
  const client = { x: OFF, y: OFF };
  window.addEventListener(
    'pointermove',
    (e) => {
      client.x = e.clientX;
      client.y = e.clientY;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    client.x = OFF;
    client.y = OFF;
  });
  const syncMouse = () => {
    if (client.x === OFF) {
      mouse.x = OFF;
      mouse.y = OFF;
      return;
    }
    const r = canvas.getBoundingClientRect();
    mouse.x = client.x - r.left;
    mouse.y = client.y - r.top;
  };

  const seed = () => {
    if (mode === 'A') {
      clusters = CLUSTERS.map((d) => ({ x: d.x * w, y: d.y * h, l: d.l, n: 0 }));
      const spread = Math.min(w, h) * 0.085;
      const g = () => {
        let u = 0;
        for (let i = 0; i < 3; i++) u += Math.random();
        return (u - 1.5) / 1.5;
      };
      pts = [];
      for (let i = 0; i < 520; i++) {
        const noise = Math.random() < 0.12;
        const k = Math.floor(Math.random() * 5);
        const cl = clusters[k];
        const hx = noise ? Math.random() * w : cl.x + g() * spread * 1.6;
        const hy = noise ? Math.random() * h * 0.7 : cl.y + g() * spread;
        if (!noise) cl.n++;
        pts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, k: noise ? -1 : k, ph: Math.random() * 6.28, r: 1 + Math.random() * 1.2 });
      }
    } else if (mode === 'B') {
      const n = 140;
      let v = 50;
      series = [];
      for (let i = 0; i < n; i++) {
        v += (Math.random() - 0.4) * 3 + Math.sin(i / 8) * 0.9;
        series.push(v);
      }
      const mn = Math.min(...series);
      const mx = Math.max(...series);
      ys = series.map((s) => h * 0.82 - ((s - mn) / (mx - mn)) * h * 0.6);
      split = Math.floor(n * 0.76);
      cx = null;
    } else {
      const N = Math.max(24, Math.min(80, Math.floor(w / 20)));
      bars = Array.from({ length: N }, (_, i) => ({
        b: 0.22 + 0.18 * Math.sin(i * 0.35) + 0.12 * Math.sin(i * 0.9 + 1) + Math.random() * 0.12,
        cur: 0,
      }));
    }
  };

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nw = canvas.clientWidth;
    const nh = canvas.clientHeight;
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Astro's Fonts API hashes family names, so resolve the real stack from the CSS variable.
  const mono =
    getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() ||
    '"IBM Plex Mono", monospace';
  const labelFont = `500 12px ${mono}`;
  document.fonts?.load(labelFont).catch(() => {});

  const inside = () => mouse.x >= 0 && mouse.x <= w && mouse.y >= -60 && mouse.y <= h + 60;

  const label = (x: number, y: number, text: string, P: Palette) => {
    ctx.font = labelFont;
    const tw = ctx.measureText(text).width;
    const bx = Math.min(Math.max(x, 2), w - tw - 20);
    ctx.fillStyle = P.acc;
    ctx.fillRect(bx, y - 22, tw + 18, 24);
    ctx.fillStyle = P.onacc;
    ctx.fillText(text, bx + 9, y - 6);
  };

  const drawA = (t: number, P: Palette) => {
    const m = mouse;
    const time = reduce ? 0 : t * 0.0006;
    let near: Cluster | null = null;
    let nd = 170;
    for (const cl of clusters) {
      const d = Math.hypot(cl.x - m.x, cl.y - m.y);
      if (d < nd) {
        nd = d;
        near = cl;
      }
    }
    const ni = near ? clusters.indexOf(near) : -2;
    const links: Pt[] = [];
    // Batch dots into three paths by colour: 3 fills per frame instead of ~520.
    const dots = new Path2D();
    const faint = new Path2D();
    const hotDots = new Path2D();
    for (const p of pts) {
      const tx = p.hx + Math.sin(time + p.ph) * 4;
      const ty = p.hy + Math.cos(time * 0.8 + p.ph) * 4;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 140 && d > 0.1) {
        const f = (1 - d / 140) * 0.9;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (tx - p.x) * 0.03;
      p.vy += (ty - p.y) * 0.03;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.x += p.vx;
      p.y += p.vy;
      const hot = p.k === ni;
      if (d < 110 && links.length < 18) links.push(p);
      const path = hot ? hotDots : p.k < 0 ? faint : dots;
      const r = hot ? p.r + 0.5 : p.r;
      path.moveTo(p.x + r, p.y);
      path.arc(p.x, p.y, r, 0, 6.283);
    }
    ctx.fillStyle = P.faint;
    ctx.fill(faint);
    ctx.fillStyle = P.dot;
    ctx.fill(dots);
    ctx.fillStyle = P.acc;
    ctx.fill(hotDots);
    if (links.length) {
      ctx.beginPath();
      for (const p of links) {
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = P.accA(0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (near) {
      const by = near.y - Math.min(w, h) * 0.12;
      ctx.strokeStyle = P.accA(0.6);
      ctx.beginPath();
      ctx.moveTo(near.x, near.y);
      ctx.lineTo(near.x, by);
      ctx.stroke();
      label(near.x, by, `${near.l.toUpperCase()}   n=${near.n}`, P);
    }
  };

  const drawB = (t: number, P: Palette) => {
    const n = ys.length;
    const sp = split;
    const prog = reduce ? 1 : Math.min(1, (t - t0) / 1600);
    const ease = 1 - Math.pow(1 - prog, 3);
    const lim = Math.max(2, Math.floor(ease * n));
    const X = (i: number) => (i / (n - 1)) * w;
    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 1;
    for (let g = 1; g < 4; g++) {
      const y = (h * g) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const aEnd = Math.min(lim, sp + 1);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < aEnd; i++) ctx.lineTo(X(i), ys[i]);
    ctx.lineTo(X(aEnd - 1), h);
    ctx.closePath();
    ctx.fillStyle = P.accA(0.07);
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < aEnd; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(i), ys[i]);
    ctx.strokeStyle = P.fg;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (lim > sp) {
      ctx.beginPath();
      for (let i = sp; i < lim; i++) ctx.lineTo(X(i), ys[i] - (i - sp) * 1.4);
      for (let i = lim - 1; i >= sp; i--) ctx.lineTo(X(i), ys[i] + (i - sp) * 1.4);
      ctx.closePath();
      ctx.fillStyle = P.accA(0.14);
      ctx.fill();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      for (let i = sp; i < lim; i++) (i === sp ? ctx.moveTo : ctx.lineTo).call(ctx, X(i), ys[i]);
      ctx.strokeStyle = P.acc;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const target = inside() ? mouse.x : X(sp);
    cx = cx == null ? target : cx + (target - cx) * 0.18;
    const idx = Math.max(0, Math.min(n - 1, Math.round((cx / w) * (n - 1))));
    if (idx < lim) {
      const x = X(idx);
      const y = ys[idx];
      const fc = idx > sp;
      ctx.strokeStyle = P.faint;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 6.283);
      ctx.fillStyle = fc ? P.acc : P.fg;
      ctx.fill();
      const val = series[idx].toFixed(1);
      const kind = fc ? 'FORECAST' : idx === sp ? 'TODAY' : 'ACTUAL';
      const band = fc ? ` ±${((idx - sp) * 0.4).toFixed(1)}` : '';
      label(x + 12, Math.max(30, y - 14), `${kind} · WK ${idx + 1} · ${val}${band}`, P);
    }
  };

  const drawC = (t: number, P: Palette) => {
    const N = bars.length;
    const step = w / N;
    const bw = step * 0.62;
    const mx = inside() ? mouse.x : reduce ? w * 0.5 : w * (0.5 + 0.38 * Math.sin(t * 0.00045));
    let hi = -1;
    let hv = 0;
    for (let i = 0; i < N; i++) {
      const bcx = i * step + step / 2;
      const bump = Math.exp(-Math.pow((bcx - mx) / 110, 2));
      const b = bars[i];
      b.cur += (b.b + bump * 0.5 - b.cur) * 0.12;
      const bh = b.cur * h * 0.95;
      ctx.fillStyle = bump > 0.35 ? P.accA(0.35 + bump * 0.6) : P.faint;
      ctx.fillRect(bcx - bw / 2, h - bh, bw, bh);
      if (bump > hv) {
        hv = bump;
        hi = i;
      }
    }
    if (hi >= 0 && hv > 0.6) {
      const b = bars[hi];
      const bcx = hi * step + step / 2;
      const y = h - b.cur * h * 0.95;
      label(bcx - 20, y - 10, `SIGNAL ${String(hi + 1).padStart(2, '0')} · ${Math.round(b.cur * 1000)}`, P);
    }
  };

  loopWhileVisible(canvas, (t) => {
    if (!w || !h) return;
    const P = PAL[currentTheme()];
    syncMouse();
    ctx.clearRect(0, 0, w, h);
    if (mode === 'A') drawA(t, P);
    else if (mode === 'B') drawB(t, P);
    else drawC(t, P);
  });
}
