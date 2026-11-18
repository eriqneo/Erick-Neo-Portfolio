/** Shared environment checks for motion modules. */
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;

export type Theme = 'dark' | 'light';

export const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

/** Run a rAF loop only while `target` is on screen. Returns a disposer. */
export function loopWhileVisible(target: Element, frame: (t: number) => void): () => void {
  let raf = 0;
  let visible = false;
  const tick = (t: number) => {
    frame(t);
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !visible) {
      visible = true;
      raf = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting && visible) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  io.observe(target);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}
