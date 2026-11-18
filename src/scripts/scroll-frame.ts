import type Lenis from 'lenis';

/**
 * One scroll-linked frame loop for every scroll effect.
 *
 * - Native scroll events (fired every frame the page moves — Lenis, scrollbar, keyboard,
 *   anchors) are coalesced to one rAF flush. This is the guaranteed path.
 * - With Lenis, its 'scroll' event additionally flushes synchronously, in the same frame the
 *   page moved, whenever it fires. (It does not fire every frame, so it can't be the only path.)
 * - All `measure` callbacks run before any `mutate` callback, so DOM reads never follow
 *   writes within a frame (no forced style/layout recalculation).
 */
export interface ScrollSubscriber {
  measure(): void;
  mutate(): void;
}

const subs = new Set<ScrollSubscriber>();
let raf = 0;

const flush = () => {
  raf = 0;
  for (const s of subs) s.measure();
  for (const s of subs) s.mutate();
};

const schedule = () => {
  if (!raf) raf = requestAnimationFrame(flush);
};

addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });

/** Called once by smooth.ts when Lenis is created. */
export function bindLenis(lenis: Lenis) {
  lenis.on('scroll', () => {
    // Same-frame update; cancel the pending rAF flush so this frame isn't measured twice.
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    flush();
  });
}

/** Register a scroll effect. Returns an unsubscribe function. Runs once immediately. */
export function onScrollFrame(sub: ScrollSubscriber): () => void {
  subs.add(sub);
  schedule();
  return () => subs.delete(sub);
}

/** Ask for a frame outside scrolling (e.g. after an element enters view). */
export const requestScrollFrame = schedule;
