import { prefersReducedMotion } from './env';
import { onScrollFrame, requestScrollFrame } from './scroll-frame';

const MIN_SCALE = 0.86;

/**
 * Featured-work reel: media scrolls through the centre column while the project title (left)
 * and "Case study ↗" link (right) stay pinned, always describing the frame nearest the middle
 * of the viewport. Frames zoom up to full size as they reach the centre and ease back after.
 */
export function initReel(root: HTMLElement) {
  const items = [...root.querySelectorAll<HTMLElement>('[data-reel-item]')];
  const titles = [...root.querySelectorAll<HTMLElement>('[data-reel-title]')];
  const link = root.querySelector<HTMLAnchorElement>('[data-reel-link]');
  const linkName = root.querySelector<HTMLElement>('[data-reel-link-name]');
  if (!items.length) return;
  const reduce = prefersReducedMotion();

  let inView = false;
  let active = -1;
  const dist = items.map(() => 1);
  const last = items.map(() => -1);

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    requestScrollFrame();
  }).observe(root);

  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    titles.forEach((t, k) => t.classList.toggle('is-on', k === i));
    const it = items[i];
    if (link) link.href = it.dataset.href || link.href;
    if (linkName) linkName.textContent = it.dataset.title || '';
  };

  onScrollFrame({
    measure() {
      if (!inView) return;
      const mid = innerHeight / 2;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        // 0 at the viewport centre, 1 at ~90% of a viewport away.
        dist[i] = Math.min(1, Math.abs(r.top + r.height / 2 - mid) / (innerHeight * 0.9));
      });
    },
    mutate() {
      if (!inView) return;
      let best = 0;
      dist.forEach((d, i) => {
        if (d < dist[best]) best = i;
      });
      setActive(best);
      if (reduce) return;
      dist.forEach((d, i) => {
        const s = Math.round((1 - (1 - MIN_SCALE) * d * d) * 1000) / 1000;
        if (s === last[i]) return;
        last[i] = s;
        items[i].style.setProperty('--z', String(s));
      });
    },
  });
  setActive(0);
}
