import { getLenis } from './smooth';
import { site } from '../data/site';

/**
 * Contact drawer: open from any [data-drawer-open], close on Esc / backdrop / Close.
 * While open the page behind is inert (focus stays in the dialog) and scroll is locked.
 */
export function initDrawer(drawer: HTMLElement) {
  const backdrop = document.querySelector<HTMLElement>('[data-drawer-backdrop]');
  const page = document.getElementById('page');
  const closeBtn = drawer.querySelector<HTMLButtonElement>('[data-drawer-close]');
  let opener: HTMLElement | null = null;
  let isOpen = false;

  const open = (from: HTMLElement | null) => {
    if (isOpen) return;
    isOpen = true;
    opener = from;
    drawer.classList.add('is-open');
    backdrop?.classList.add('is-open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    page?.setAttribute('inert', '');
    document.documentElement.classList.add('is-locked');
    getLenis()?.stop();
    // Wait a frame so the panel is visible before moving focus into it.
    requestAnimationFrame(() => closeBtn?.focus({ preventScroll: true }));
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', 'true');
    page?.removeAttribute('inert');
    document.documentElement.classList.remove('is-locked');
    getLenis()?.start();
    opener?.focus({ preventScroll: true });
    opener = null;
  };

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element | null)?.closest?.<HTMLElement>('[data-drawer-open]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger);
  });
  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  initCopy(drawer);
  initAccordion(drawer);
}

function initCopy(root: HTMLElement) {
  const btn = root.querySelector<HTMLButtonElement>('[data-copy]');
  const label = btn?.querySelector<HTMLElement>('[data-copy-label]');
  if (!btn || !label) return;
  const idle = label.textContent ?? '';
  let t = 0;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy || site.email;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure contexts / denied permission.
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    label.textContent = 'Copied ✓';
    clearTimeout(t);
    t = window.setTimeout(() => (label.textContent = idle), 1800);
  });
}

/** Single-open accordion; the first item starts open. Open state lives on the .faq row (.is-open). */
function initAccordion(root: HTMLElement) {
  const toggles = [...root.querySelectorAll<HTMLButtonElement>('[data-faq-toggle]')];
  const setOpen = (btn: HTMLButtonElement, open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.closest('.faq')?.classList.toggle('is-open', open);
  };
  toggles.forEach((btn) =>
    btn.addEventListener('click', () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((b) => setOpen(b, b === btn && willOpen));
    }),
  );
}
