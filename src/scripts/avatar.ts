import { prefersReducedMotion } from './env';

/** Max pupil travel, in grid cells. */
const REACH_X = 0.34;
const REACH_Y = 0.26;

/**
 * Avatar eyes: glance toward the pointer (strength eases in with distance) and blink at
 * random 2.6–6.2s intervals, sometimes twice. Off under reduced motion.
 */
export function initAvatars() {
  if (prefersReducedMotion()) return;
  const avatars = [...document.querySelectorAll<SVGSVGElement>('[data-avatar]')].map((el) => {
    const eyes = JSON.parse(el.dataset.eyes || '[]') as [number, number][];
    const vb = el.viewBox.baseVal;
    // Eye-line centre as a fraction of the box.
    const fx = (eyes.reduce((s, [c]) => s + c + 0.5, 0) / eyes.length) / vb.width;
    const fy = (eyes.reduce((s, [, r]) => s + r + 0.5, 0) / eyes.length) / vb.height;
    return { el, fx, fy, visible: false, lx: 0, ly: 0 };
  });
  if (!avatars.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const a = avatars.find((x) => x.el === e.target);
      if (a) a.visible = e.isIntersecting;
    }
  });
  avatars.forEach((a) => io.observe(a.el));

  let px = -1;
  let py = -1;
  let raf = 0;
  const look = () => {
    raf = 0;
    for (const a of avatars) {
      if (!a.visible) continue;
      const r = a.el.getBoundingClientRect();
      const dx = px - (r.left + r.width * a.fx);
      const dy = py - (r.top + r.height * a.fy);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 260);
      const lx = Math.round((dx / dist) * REACH_X * k * 100) / 100;
      const ly = Math.round((dy / dist) * REACH_Y * k * 100) / 100;
      if (lx !== a.lx || ly !== a.ly) {
        a.lx = lx;
        a.ly = ly;
        a.el.style.setProperty('--lx', String(lx));
        a.el.style.setProperty('--ly', String(ly));
      }
    }
  };
  addEventListener(
    'pointermove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(look);
    },
    { passive: true },
  );
  // Re-aim while scrolling too: the avatar moves under a still pointer.
  addEventListener(
    'scroll',
    () => {
      if (px >= 0 && !raf) raf = requestAnimationFrame(look);
    },
    { passive: true },
  );

  for (const a of avatars) {
    const blink = () => {
      a.el.classList.add('is-blink');
      setTimeout(() => a.el.classList.remove('is-blink'), 130);
    };
    const schedule = () => {
      setTimeout(() => {
        if (a.visible && !document.hidden) {
          blink();
          if (Math.random() < 0.2) setTimeout(blink, 260);
        }
        schedule();
      }, 2600 + Math.random() * 3600);
    };
    schedule();
  }
}
