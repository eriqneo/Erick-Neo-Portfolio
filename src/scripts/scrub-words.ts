import { prefersReducedMotion } from './env';
import { onScrollFrame, requestScrollFrame } from './scroll-frame';

const MIN = 0.22; // resting opacity of words not yet "read"

/**
 * Scroll-scrubbed word highlight: words inside [data-scrub] brighten one by one as the
 * heading travels up the viewport (and dim again on the way back). Inline markup such as
 * the serif-italic spans is preserved — only text nodes are split.
 */
export function initScrubWords(root: ParentNode = document) {
  if (prefersReducedMotion()) return;
  const items = [...root.querySelectorAll<HTMLElement>('[data-scrub]')].map((el) => {
    const words = split(el);
    words.forEach((w) => (w.style.opacity = String(MIN)));
    return { el, words, last: words.map(() => MIN), inView: false, p: 0 };
  });
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const it = items.find((x) => x.el === e.target);
      if (it) it.inView = e.isIntersecting;
    }
    requestScrollFrame();
  });
  items.forEach((it) => io.observe(it.el));

  onScrollFrame({
    measure() {
      const vh = innerHeight;
      const start = vh * 0.85; // heading top at 85% of the viewport → 0
      const end = vh * 0.4; // heading bottom at 40% → 1
      for (const it of items) {
        if (!it.inView) continue;
        const r = it.el.getBoundingClientRect();
        it.p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
      }
    },
    mutate() {
      for (const it of items) {
        if (!it.inView) continue;
        const lit = it.p * it.words.length;
        it.words.forEach((w, i) => {
          // Quantise to 1/100 so tiny scroll deltas don't trigger style writes.
          const o = Math.round((MIN + (1 - MIN) * Math.min(1, Math.max(0, lit - i))) * 100) / 100;
          if (o !== it.last[i]) {
            it.last[i] = o;
            w.style.opacity = String(o);
          }
        });
      }
    },
  });
}

function split(el: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
      } else {
        const span = document.createElement('span');
        span.className = 'sw';
        span.textContent = part;
        frag.append(span);
        words.push(span);
      }
    }
    node.replaceWith(frag);
  }
  return words;
}
