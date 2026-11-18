import { prefersReducedMotion } from './env';
import { onScrollFrame, requestScrollFrame } from './scroll-frame';

/**
 * Scroll-built CTA: the section is taller than the viewport and its stage is sticky.
 * As the section scrolls past, its [data-nc] pieces rise in one by one, in DOM order.
 * Reduced motion: everything is shown at once and the section collapses to normal height.
 */
export function initNextChapter(section: HTMLElement) {
  if (prefersReducedMotion()) {
    section.classList.add('is-static');
    return;
  }
  const pieces = [...section.querySelectorAll<HTMLElement>('[data-nc]')];
  const n = pieces.length;
  const last = pieces.map(() => -1);
  let inView = false;
  let p = 0;

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    requestScrollFrame();
  }).observe(section);

  onScrollFrame({
    measure() {
      if (!inView) return;
      const r = section.getBoundingClientRect();
      const travel = Math.max(1, r.height - innerHeight);
      // Finish building at 75% of the travel so the full line holds for a beat before leaving.
      p = Math.min(1, Math.max(0, -r.top / (travel * 0.75)));
    },
    mutate() {
      if (!inView) return;
      pieces.forEach((el, i) => {
        // Each piece animates over a window that overlaps its neighbours.
        const local = Math.min(1, Math.max(0, p * (n + 1.5) - i));
        const e = Math.round((1 - Math.pow(1 - local, 3)) * 1000) / 1000;
        if (e === last[i]) return;
        last[i] = e;
        el.style.opacity = String(e);
        // Fly in from alternating sides while zooming up from 40% (inspiration: "next page" words).
        const side = i % 2 ? 1 : -1;
        el.style.transform =
          e === 1
            ? ''
            : `translate(${(side * (1 - e) * 38).toFixed(2)}%, ${((1 - e) * 45).toFixed(2)}%) scale(${(0.4 + 0.6 * e).toFixed(3)})`;
      });
    },
  });
}
