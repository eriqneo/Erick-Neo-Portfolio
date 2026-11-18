import { prefersReducedMotion } from './env';

/**
 * Silent project loops ([data-autoplay]): nothing downloads until a clip nears the viewport
 * (preload="none" + poster), it plays while ≥ 35% visible and pauses when it leaves or the
 * tab is hidden. Reduced motion or Save-Data → the poster only, never autoplay.
 */
export function initVideoAutoplay() {
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')];
  if (!videos.length) return;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (prefersReducedMotion() || saveData) return;

  const visible = new Set<HTMLVideoElement>();
  const play = (v: HTMLVideoElement) => {
    if (v.preload !== 'auto') v.preload = 'auto';
    v.play().catch(() => {
      /* autoplay refused (e.g. power saving) — the poster stays */
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          visible.add(v);
          if (!document.hidden) play(v);
        } else {
          visible.delete(v);
          v.pause();
        }
      }
    },
    { threshold: 0.35 },
  );
  videos.forEach((v) => io.observe(v));

  document.addEventListener('visibilitychange', () => {
    for (const v of visible) document.hidden ? v.pause() : play(v);
  });
}
