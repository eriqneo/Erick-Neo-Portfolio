import { hasFinePointer, prefersReducedMotion } from './env';

/** "VIEW ↗" follower that scales in over [data-cursor="view"]. Fine pointers only. */
export function initCursor(cursor: HTMLElement) {
  if (!hasFinePointer()) return;
  const k = prefersReducedMotion() ? 1 : 0.2;
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let tx = x;
  let ty = y;
  let on = false;
  let raf = 0;

  const set = (v: boolean) => {
    if (v === on) return;
    on = v;
    cursor.classList.toggle('is-on', on);
  };

  const step = () => {
    x += (tx - x) * k;
    y += (ty - y) * k;
    cursor.style.translate = `${x}px ${y}px`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 || on ? requestAnimationFrame(step) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as Element | null;
      set(!!target?.closest?.('[data-cursor="view"]'));
      if (!raf) raf = requestAnimationFrame(step);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => set(false));
}
