import { prefersReducedMotion } from './env';

const KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'translateY(56px)' },
  { opacity: 1, transform: 'none' },
];
const TIMING: KeyframeAnimationOptions = {
  duration: 1100,
  easing: 'cubic-bezier(.16,1,.3,1)',
  fill: 'both',
};

const anims = new WeakMap<Element, Animation>();
let io: IntersectionObserver | null = null;

/**
 * Scroll reveal: [data-reveal] elements rise 56px and fade in once.
 * Elements entering in the same observer batch stagger by 90ms.
 */
export function initReveal(root: ParentNode = document) {
  if (prefersReducedMotion() || !('animate' in Element.prototype)) return;
  io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          const a = anims.get(e.target);
          if (a) {
            a.effect?.updateTiming({ delay: i * 90 });
            a.play();
          }
          io!.unobserve(e.target);
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  root.querySelectorAll('[data-reveal]').forEach(arm);
}

function arm(el: Element) {
  let a = anims.get(el);
  if (!a) {
    a = el.animate(KEYFRAMES, TIMING);
    // When done, hand the end state to CSS and drop the animation, so finished
    // elements don't stay pinned as composited layers by a `fill: both` effect.
    a.onfinish = () => {
      el.classList.add('is-revealed');
      a!.cancel();
    };
    anims.set(el, a);
  }
  el.classList.remove('is-revealed');
  a.effect?.updateTiming({ delay: 0 });
  a.pause();
  a.currentTime = 0;
  io?.observe(el);
}

/** Reset elements to their pre-reveal state so they animate in again (e.g. after a tab switch). */
export function rearmReveal(els: Iterable<Element>) {
  if (!io) return;
  for (const el of els) arm(el);
}
