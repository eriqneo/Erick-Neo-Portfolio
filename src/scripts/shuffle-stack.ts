import { prefersReducedMotion } from './env';

const VISIBLE = 4; // cards drawn in the pile; the rest wait (hidden) behind
const TOSS_MS = 460;

/**
 * Footer shuffle stack: a pile of project polaroids. The button flicks the top card away,
 * the others step forward, and the flicked card goes to the back. Only the top card is
 * focusable / exposed; each shuffle announces the new top project.
 */
export function initShuffleStack(root: HTMLElement) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-fcard]')];
  const btn = root.querySelector<HTMLButtonElement>('[data-fstack-next]');
  const live = root.querySelector<HTMLElement>('[data-fstack-live]');
  if (cards.length < 2 || !btn) return;
  const reduce = prefersReducedMotion();
  const n = cards.length;
  const tilt = cards.map((c) => parseFloat(c.dataset.tilt || '0'));

  // Start from a random project each visit (deterministic order otherwise).
  const start = reduce ? 0 : Math.floor(Math.random() * n);
  let order = Array.from({ length: n }, (_, i) => (i + start) % n);
  // The card currently being flicked away (if any).
  let pending: { card: HTMLElement; anim: Animation } | null = null;

  const slot = (k: number, i: number) => {
    const d = Math.min(k, VISIBLE - 1);
    const x = d * 12;
    const y = d * -14;
    const s = 1 - d * 0.04;
    return `translate(${x}px, ${y}px) rotate(${tilt[i]}deg) scale(${s})`;
  };

  const layout = (announce = false) => {
    order.forEach((i, k) => {
      const c = cards[i];
      c.style.transform = slot(k, i);
      c.style.zIndex = String(n - k);
      c.style.opacity = k < VISIBLE ? '1' : '0';
      const top = k === 0;
      c.toggleAttribute('inert', !top);
      c.setAttribute('aria-hidden', String(!top));
      c.classList.toggle('is-top', top);
    });
    if (announce && live) live.textContent = cards[order[0]].dataset.title || '';
  };

  // Drop an in-flight flick straight into its back slot (no transition).
  const settle = () => {
    if (!pending) return;
    const { card, anim } = pending;
    pending = null;
    card.classList.add('is-snapping');
    card.style.zIndex = '0';
    anim.cancel();
    // Commit the no-transition jump with one style flush on this card, then re-enable
    // transitions — deterministic, independent of frame timing.
    void card.offsetWidth;
    card.classList.remove('is-snapping');
  };

  const shuffle = () => {
    // A click mid-flick settles the flying card instantly, so fast clicks riffle the pile.
    settle();
    const topIdx = order[0];
    const top = cards[topIdx];
    order = [...order.slice(1), topIdx];
    if (reduce || !top.animate) {
      layout(true);
      return;
    }
    // Flick the top card off; the rest step forward via their CSS transform transition.
    const from = top.style.transform;
    const anim = top.animate(
      [
        { transform: from, opacity: 1 },
        { transform: `translate(72%, -22%) rotate(${tilt[topIdx] + 18}deg) scale(0.96)`, opacity: 0 },
      ],
      { duration: TOSS_MS, easing: 'cubic-bezier(.55,-0.1,.75,.4)', fill: 'forwards' },
    );
    pending = { card: top, anim };
    layout(true);
    top.style.zIndex = String(n + 1); // stay above the pile while flying
    anim.onfinish = () => {
      if (pending?.anim === anim) settle();
    };
    // Fallback in case the finish event is delayed (background tab, throttled timers).
    setTimeout(() => {
      if (pending?.anim === anim) settle();
    }, TOSS_MS + 120);
  };

  btn.addEventListener('click', shuffle);
  layout();
  root.classList.add('is-ready');

  // Reveal the hand-drawn "Shuffle the work" note the first time the stack is seen.
  // Arrival: deal the visible cards onto the table one by one (bottom card first).
  const deal = () => {
    order.slice(0, VISIBLE).forEach((i, k) => {
      const side = k % 2 ? 1 : -1;
      cards[i].animate(
        [
          {
            transform: `translate(${side * 140}px, 180px) rotate(${tilt[i] + side * 28}deg) scale(0.4)`,
            opacity: 0,
          },
          { transform: slot(k, i), opacity: 1 },
        ],
        { duration: 950, delay: (VISIBLE - 1 - k) * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' },
      );
    });
  };

  const seen = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      root.classList.add('is-seen');
      if (!reduce) deal();
      seen.disconnect();
    },
    { threshold: 0.35 },
  );
  seen.observe(root);
}
