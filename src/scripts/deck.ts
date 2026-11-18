import { prefersReducedMotion } from './env';
import { getLenis } from './smooth';
import { onScrollFrame, requestScrollFrame } from './scroll-frame';

/**
 * Services card deck. While the track scrolls past, its sticky stage stays pinned and the
 * cards move through a continuous position `s` (0 … n-1). Each card's distance d = i - s:
 *   d = 0     face-up, centred, flat
 *   |d| ≥ 1   face-down (rotateY 180°), fanned out behind to the right (upcoming) or left (done)
 * Between beats the active card rests face-up (plateau), then flips away as the next arrives.
 * Live only ≥ 720px wide and without reduced motion; otherwise the cards are a static grid.
 */
export function initDeck(deck: HTMLElement) {
  const track = deck.querySelector<HTMLElement>('[data-deck-track]')!;
  const stage = deck.querySelector<HTMLElement>('[data-deck-stage]')!;
  const cards = [...deck.querySelectorAll<HTMLElement>('[data-deck-card]')];
  const pager = [...deck.querySelectorAll<HTMLButtonElement>('[data-deck-go]')];
  // Side panels reflecting the face-up card (left: toolkit, right: related work).
  const panels = [...deck.querySelectorAll<HTMLElement>('[data-deck-panel]')];
  const n = cards.length;
  const mq = matchMedia('(min-width: 720px)');
  let live = false;
  let inView = false;
  let p = 0;
  let lastS = -1;
  let active = -1;
  // Fan spread per step (% of card width), from the CSS variable shared with the layout.
  let fan = 34;
  const readFan = () => {
    fan = parseFloat(getComputedStyle(deck).getPropertyValue('--fan')) || 34;
    lastS = -1; // force a re-place with the new spread
  };

  const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Scroll progress p (0..1) → card position s with rest plateaus around each card.
  const position = (prog: number) => {
    const u = Math.min(n - 1, Math.max(0, prog * n - 0.5));
    const base = Math.floor(u);
    return Math.min(n - 1, base + smoothstep(0.3, 0.7, u - base));
  };

  const place = (s: number) => {
    cards.forEach((card, i) => {
      const d = i - s;
      const ad = Math.min(Math.abs(d), 2);
      const side = Math.sign(d);
      const flip = Math.min(1, Math.abs(d)) * 180 * (side || 1);
      const x = side * ad * fan; // % of card width
      const y = ad * 3;
      const rotZ = d * 6;
      const z = -ad * 160;
      card.style.transform =
        `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, ${z.toFixed(1)}px) rotateZ(${rotZ.toFixed(2)}deg) rotateY(${flip.toFixed(2)}deg)`;
      card.style.zIndex = String(100 - Math.round(ad * 10));
    });
    const a = Math.round(s);
    if (a !== active) {
      active = a;
      cards.forEach((c, i) => c.classList.toggle('is-active', i === a));
      panels.forEach((el) => {
        const on = Number(el.dataset.deckPanel) === a;
        el.classList.toggle('is-on', on);
        // Hidden panels must not hold focusable links or be read out.
        el.toggleAttribute('inert', !on);
        el.setAttribute('aria-hidden', String(!on));
      });
      pager.forEach((b, i) => {
        b.classList.toggle('is-active', i === a);
        if (i === a) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    }
  };

  const setLive = (on: boolean) => {
    live = on;
    deck.classList.toggle('is-live', on);
    if (!on) {
      cards.forEach((c) => {
        c.style.transform = '';
        c.style.zIndex = '';
      });
      lastS = -1;
    } else {
      requestScrollFrame();
    }
  };

  const evaluate = () => {
    readFan();
    setLive(mq.matches && !prefersReducedMotion());
  };
  mq.addEventListener('change', evaluate);
  matchMedia('(min-width: 1100px)').addEventListener('change', () => {
    readFan();
    requestScrollFrame();
  });
  evaluate();

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    // Arrival (once): the deck rises and zooms in, side panels slide in (CSS in Services.astro).
    if (inView) deck.classList.add('is-arrived');
    requestScrollFrame();
  }).observe(track);

  onScrollFrame({
    measure() {
      if (!live || !inView) return;
      const r = track.getBoundingClientRect();
      const travel = Math.max(1, r.height - stage.offsetHeight);
      p = Math.min(1, Math.max(0, -r.top / travel));
    },
    mutate() {
      if (!live || !inView) return;
      const s = Math.round(position(p) * 1000) / 1000;
      if (s === lastS) return;
      lastS = s;
      place(s);
    },
  });

  // Pager: jump to a card's resting point.
  pager.forEach((btn, i) =>
    btn.addEventListener('click', () => {
      if (!live) {
        cards[i].scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      const top = track.getBoundingClientRect().top + scrollY;
      const travel = track.offsetHeight - stage.offsetHeight;
      const y = top + ((i + 0.5) / n) * travel;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y);
      else scrollTo({ top: y, behavior: 'smooth' });
    }),
  );
}
