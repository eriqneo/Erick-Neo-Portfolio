import { prefersReducedMotion } from './env';

/**
 * Backdrop flip: while any [data-flip] section crosses the middle of the viewport, <html>
 * gets .is-flipped and the tokens swap to the opposite theme (see tokens.css). Skipped
 * under reduced motion to avoid a sudden full-screen colour change.
 */
export function initFlip() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-flip]')];
  if (!sections.length || prefersReducedMotion()) return;
  const root = document.documentElement;
  const on = new Set<Element>();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? on.add(e.target) : on.delete(e.target)));
      const flip = on.size > 0;
      if (flip === root.classList.contains('is-flipped')) return;
      root.classList.toggle('is-flipped', flip);
    },
    // A thin band across the middle of the viewport.
    { rootMargin: '-49% 0px -49% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}
