import { prefersReducedMotion } from './env';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
const DURATION = 700;

/**
 * Letter scramble for mono labels (.eyebrow and [data-scramble]): characters cycle through
 * random glyphs and lock in left-to-right the first time the label scrolls into view.
 * Screen readers get the real text; the animated copy is aria-hidden.
 */
export function initScramble(root: ParentNode = document) {
  if (prefersReducedMotion()) return;
  const els = [...root.querySelectorAll<HTMLElement>('.eyebrow, [data-scramble]')].filter(
    (el) => el.childElementCount === 0 && el.textContent?.trim(),
  );
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          io.unobserve(e.target);
          setTimeout(() => run(e.target as HTMLElement), i * 80);
        });
    },
    { threshold: 0.6 },
  );

  els.forEach((el) => {
    const text = el.textContent!;
    const hidden = el.closest('[aria-hidden="true"]');
    el.textContent = '';
    if (!hidden) {
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = text;
      el.append(sr);
    }
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    vis.dataset.text = text;
    vis.textContent = text;
    el.append(vis);
    io.observe(el);
  });
}

function run(el: HTMLElement) {
  const vis = el.querySelector<HTMLElement>('[data-text]');
  if (!vis) return;
  const text = vis.dataset.text!;
  const chars = [...text];
  const t0 = performance.now();
  const frame = (t: number) => {
    const p = Math.min(1, (t - t0) / DURATION);
    const locked = Math.floor(p * chars.length);
    vis.textContent = chars
      .map((c, i) => (i < locked || /\s|—|·/.test(c) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join('');
    if (p < 1) requestAnimationFrame(frame);
    else vis.textContent = text;
  };
  requestAnimationFrame(frame);
}
