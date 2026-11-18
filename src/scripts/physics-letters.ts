import { loopWhileVisible, prefersReducedMotion } from './env';

interface Body {
  el: HTMLElement;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  drag: { ox: number; oy: number; lx: number; ly: number } | null;
}

const GRAVITY = 0.7;
const FLOOR_BOUNCE = 0.42;
const WALL_BOUNCE = 0.6;
const AIR = 0.995;
const THROW = 0.9;

/**
 * Draggable physics letters. Bodies start above the box and drop once 35% of it is visible.
 * Under reduced motion they are settled on the floor before the first paint (no fall),
 * but can still be dragged and thrown.
 */
export function initPhysicsLetters(box: HTMLElement) {
  const els = [...box.querySelectorAll<HTMLElement>('[data-body]')];
  if (!els.length) return;
  const W = () => box.clientWidth;
  const H = () => box.clientHeight;

  const B: Body[] = els.map((el, i) => {
    const r = el.offsetWidth / 2;
    return {
      el,
      r,
      x: W() * (0.18 + 0.16 * i),
      y: -r * 2 - i * 140,
      vx: (Math.random() - 0.5) * 6,
      vy: 0,
      rot: Math.random() - 0.5,
      drag: null,
    };
  });

  let live = false;
  // Cached box/body sizes — refreshed by ResizeObserver, not read every step.
  let w = W();
  let h = H();
  // Sleep once everything has been still for a while; wake on drag / resize.
  let still = 0;
  let asleep = false;
  const wake = () => {
    asleep = false;
    still = 0;
  };
  new ResizeObserver(() => {
    w = W();
    h = H();
    for (const b of B) b.r = b.el.offsetWidth / 2;
    wake();
  }).observe(box);

  const step = () => {
    for (const b of B) {
      if (!b.drag) {
        b.vy += GRAVITY;
        b.vx *= AIR;
        b.x += b.vx;
        b.y += b.vy;
      }
      if (b.y + b.r > h) {
        b.y = h - b.r;
        b.vy *= -FLOOR_BOUNCE;
        b.vx *= 0.9;
        if (Math.abs(b.vy) < 1) b.vy = 0;
      }
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * WALL_BOUNCE;
      }
      if (b.x + b.r > w) {
        b.x = w - b.r;
        b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
      }
      b.rot += b.vx / b.r;
    }
    for (let i = 0; i < B.length; i++) {
      for (let j = i + 1; j < B.length; j++) {
        const a = B[i];
        const c = B[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const m = a.r + c.r;
        if (d >= m) continue;
        const nx = dx / d;
        const ny = dy / d;
        const o = m - d;
        const wa = a.drag ? 0 : c.drag ? 1 : 0.5;
        const wc = c.drag ? 0 : a.drag ? 1 : 0.5;
        a.x -= nx * o * wa;
        a.y -= ny * o * wa;
        c.x += nx * o * wc;
        c.y += ny * o * wc;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) {
          const imp = (-1.5 * rv) / 2;
          if (!a.drag) {
            a.vx -= imp * nx;
            a.vy -= imp * ny;
          }
          if (!c.drag) {
            c.vx += imp * nx;
            c.vy += imp * ny;
          }
        }
      }
    }
    const moving = B.some((b) => b.drag || Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05);
    still = moving ? 0 : still + 1;
    if (still > 30) asleep = true;
  };

  const render = () => {
    for (const b of B) {
      b.el.style.translate = `${b.x - b.r}px ${b.y - b.r}px`;
      b.el.style.rotate = `${b.rot}rad`;
    }
  };

  if (prefersReducedMotion()) {
    for (const b of B) {
      b.vx = 0;
      b.rot = 0;
      b.y = h - b.r - Math.random() * 40;
    }
    for (let i = 0; i < 600; i++) step();
    live = true;
  } else {
    const trigger = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          live = true;
          trigger.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    trigger.observe(box);
  }
  render();
  box.classList.add('is-ready');

  for (const b of B) {
    const local = (e: PointerEvent): [number, number] => {
      const r = box.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    b.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      live = true;
      wake();
      b.el.setPointerCapture(e.pointerId);
      const [px, py] = local(e);
      b.drag = { ox: px - b.x, oy: py - b.y, lx: px, ly: py };
      b.el.classList.add('is-dragging');
    });
    b.el.addEventListener('pointermove', (e) => {
      if (!b.drag) return;
      const [px, py] = local(e);
      b.vx = (px - b.drag.lx) * THROW;
      b.vy = (py - b.drag.ly) * THROW;
      b.drag.lx = px;
      b.drag.ly = py;
      b.x = px - b.drag.ox;
      b.y = py - b.drag.oy;
    });
    const up = () => {
      if (!b.drag) return;
      b.drag = null;
      b.el.classList.remove('is-dragging');
    };
    b.el.addEventListener('pointerup', up);
    b.el.addEventListener('pointercancel', up);
  }

  loopWhileVisible(box, () => {
    if (!live || asleep) return;
    step();
    render();
  });
}
