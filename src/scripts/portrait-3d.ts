import { prefersReducedMotion, hasFinePointer } from './env';
import { onScrollFrame } from './scroll-frame';

const MAX_TILT = 9; // degrees, pointer
const SCROLL_TILT = 7; // degrees, scroll (also gives touch users depth)
const EASE = 0.12; // pointer smoothing per frame

/**
 * 3D portrait stage: the card tilts toward the pointer and with scroll position. Child layers
 * sit at different translateZ depths (see PortraitStage.astro), so the tilt produces real
 * parallax. Writes only CSS variables: --rx, --ry (deg) and --sx, --sy (sheen position, %).
 */
export function initPortrait3D(stage: HTMLElement) {
  if (prefersReducedMotion()) return;
  const fine = hasFinePointer();
  let inView = false;
  let hovering = false;
  // pointer target / current, in -1..1
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let scrollTilt = 0;
  let raf = 0;

  const write = () => {
    const rx = -cy * MAX_TILT + scrollTilt;
    const ry = cx * MAX_TILT;
    stage.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    stage.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    stage.style.setProperty('--sx', `${(50 + cx * 40).toFixed(1)}%`);
    stage.style.setProperty('--sy', `${(50 + cy * 40).toFixed(1)}%`);
  };

  const tick = () => {
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    write();
    const settling = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002;
    raf = settling || hovering ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => {
    if (!raf && inView) raf = requestAnimationFrame(tick);
  };

  if (fine) {
    stage.addEventListener('pointerenter', () => {
      hovering = true;
      stage.classList.add('is-hover');
      kick();
    });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      kick();
    });
    stage.addEventListener('pointerleave', () => {
      hovering = false;
      stage.classList.remove('is-hover');
      tx = 0;
      ty = 0;
      kick();
    });
  }

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) kick();
  }).observe(stage);

  // Scroll tilt: card leans back as it rises up the viewport, like looking at it from below.
  let centre = 0;
  onScrollFrame({
    measure() {
      if (!inView) return;
      const r = stage.getBoundingClientRect();
      centre = (r.top + r.height / 2) / innerHeight; // 0 top … 1 bottom
    },
    mutate() {
      if (!inView) return;
      scrollTilt = Math.max(-1, Math.min(1, (centre - 0.5) * 1.6)) * SCROLL_TILT;
      if (!raf) write();
    },
  });
}
