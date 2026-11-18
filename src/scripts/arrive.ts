import { prefersReducedMotion } from './env';

/**
 * Section-arrival animations (audited from the inspiration site), CSS-driven:
 *   [data-arrive="media"]  frame wipes up from the bottom while the image/video zooms out
 *   [data-arrive="words"]  heading splits into words that rise from behind masks, staggered
 * Each element gets `.is-in` once when it first enters the viewport. Hidden elements (e.g. an
 * inactive tab) simply wait — the observer fires when they are shown. Reduced motion: nothing
 * is pre-hidden (see global.css), so this module just exits.
 */
export function initArrive(root: ParentNode = document) {
  if (prefersReducedMotion()) return;

  root.querySelectorAll<HTMLElement>('[data-arrive="words"]').forEach(splitWords);

  // Observe a proxy for each element: media starts fully clipped (clip-path), and an observer
  // measures the *clipped* area — zero — so it would never fire. Its unclipped parent stands in.
  const targets = new Map<Element, Element[]>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        targets.get(e.target)?.forEach((el) => el.classList.add('is-in'));
        targets.delete(e.target);
        io.unobserve(e.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );
  root.querySelectorAll<HTMLElement>('[data-arrive]').forEach((el) => {
    if (el.classList.contains('is-in')) return; // e.g. already shown by a page transition
    const proxy = el.dataset.arrive === 'media' ? (el.parentElement ?? el) : el;
    const list = targets.get(proxy);
    if (list) list.push(el);
    else {
      targets.set(proxy, [el]);
      io.observe(proxy);
    }
  });
}

/** Wrap each word (text nodes only — inline markup like the serif-italic spans survives) in a mask. */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let i = 0;
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        continue;
      }
      const mask = document.createElement('span');
      mask.className = 'aw';
      const inner = document.createElement('span');
      inner.className = 'aw__in';
      inner.style.setProperty('--i', String(i++));
      inner.textContent = part;
      mask.append(inner);
      frag.append(mask);
    }
    node.replaceWith(frag);
  }
}
