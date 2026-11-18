import { prefersReducedMotion } from './env';
import { onScrollFrame } from './scroll-frame';

interface Glyph {
  el: HTMLElement;
  dx: number;
  dy: number;
  rot: number;
  spread: number;
}

/**
 * Letter scatter on scroll-out: [data-scatter] text inside `host` breaks apart — letters drift,
 * tilt and fade — as `host` scrolls up out of the viewport, and reassembles on the way back.
 * Screen readers get the intact text; the animated letters are aria-hidden.
 */
export function initScatter(host: HTMLElement) {
  if (prefersReducedMotion()) return;
  const glyphs: Glyph[] = [];

  host.querySelectorAll<HTMLElement>('[data-scatter]').forEach((el) => {
    const text = el.textContent ?? '';
    el.textContent = '';
    const sr = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text });
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    const chars = [...text];
    const mid = (chars.length - 1) / 2;
    chars.forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c === ' ' ? ' ' : c;
      s.style.display = 'inline-block';
      vis.append(s);
      glyphs.push({
        el: s,
        dx: (Math.random() - 0.5) * 60,
        dy: -20 - Math.random() * 70,
        rot: (Math.random() - 0.5) * 70,
        spread: (i - mid) * 3,
      });
    });
    el.append(sr, vis);
  });
  if (!glyphs.length) return;

  let p = 0;
  let last = -1;
  onScrollFrame({
    measure() {
      // Cheap early-out: once the page is far below the hero there is nothing to do.
      if (scrollY > host.offsetHeight) {
        p = 1;
        return;
      }
      const r = host.getBoundingClientRect();
      // 0 at rest, 1 once the hero has scrolled ~40% of its height away.
      p = Math.round(Math.min(1, Math.max(0, -r.top / (r.height * 0.4))) * 200) / 200;
    },
    mutate() {
      if (p === last) return;
      last = p;
      const e = p * p; // gentle start, then breaks apart
      const o = String(1 - Math.min(1, p * 1.15));
      for (const g of glyphs) {
        if (p === 0) {
          g.el.style.transform = '';
          g.el.style.opacity = '';
        } else {
          g.el.style.transform = `translate(${(g.dx + g.spread) * e}px, ${g.dy * e}px) rotate(${g.rot * e}deg)`;
          g.el.style.opacity = o;
        }
      }
    },
  });
}
