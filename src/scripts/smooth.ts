import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { hasFinePointer, prefersReducedMotion } from './env';
import { bindLenis } from './scroll-frame';

let lenis: Lenis | null = null;

export const getLenis = () => lenis;

const NAV_OFFSET = 70;

/**
 * Lenis smooth scroll for fine pointers without reduced motion.
 * Same-page anchor links get a 70px offset for the sticky nav in every mode;
 * touch / reduced-motion fall back to native scrolling (CSS scroll-padding).
 */
export function initSmoothScroll() {
  if (!prefersReducedMotion() && hasFinePointer()) {
    lenis = new Lenis({ lerp: 0.1, autoRaf: true });
    bindLenis(lenis);
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.hasAttribute('data-drawer-open')) return;
    const id = a.getAttribute('href')!.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();

    if (lenis) {
      lenis.scrollTo(el, { offset: -NAV_OFFSET });
    } else {
      const top = el.getBoundingClientRect().top + scrollY - NAV_OFFSET;
      scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    history.pushState(null, '', `#${id}`);

    // Move keyboard focus to the target without a second scroll jump.
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });
}
