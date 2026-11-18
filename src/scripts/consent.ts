/**
 * Analytics consent (Consent Mode v2, "basic" mode — see the inline head script in Layout).
 * - Banner shows only when there is no valid stored choice (valid 12 months).
 * - Allow  → consent update granted + load GTM.
 * - Decline → consent update denied + clear any existing Google Analytics cookies.
 * - [data-consent-open] (footer "Cookie settings") reopens the banner to change the choice.
 */
const KEY = 'consent:analytics';
const MAX_AGE = 365 * 864e5;

type Choice = 'granted' | 'denied';
type GtagWindow = Window & { gtag?: (...args: unknown[]) => void; __loadGtm?: () => void };

const read = (): Choice | null => {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    return c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < MAX_AGE ? c.v : null;
  } catch {
    return null;
  }
};

const store = (v: Choice) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() }));
  } catch {
    /* storage unavailable: the choice applies to this page view only */
  }
};

/** Expire GA cookies (_ga, _ga_<id>, _gid, _gat…) on this host and its parent domains. */
const clearAnalyticsCookies = () => {
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => /^(_ga|_gid|_gat)/.test(n));
  const parts = location.hostname.split('.');
  const domains = parts.map((_, i) => parts.slice(i).join('.')).filter((d) => d.includes('.'));
  for (const n of names) {
    document.cookie = `${n}=; Max-Age=0; path=/`;
    for (const d of domains) document.cookie = `${n}=; Max-Age=0; path=/; domain=.${d}`;
  }
};

export function initConsent() {
  const banner = document.querySelector<HTMLElement>('[data-consent]');
  if (!banner) return;
  const w = window as GtagWindow;

  const show = () => {
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-visible'));
  };
  const hide = () => {
    banner.classList.remove('is-visible');
    // Wait for the slide-out before removing it from the accessibility tree.
    window.setTimeout(() => (banner.hidden = true), 450);
  };

  const apply = (v: Choice) => {
    store(v);
    w.gtag?.('consent', 'update', { analytics_storage: v });
    if (v === 'granted') w.__loadGtm?.();
    else clearAnalyticsCookies();
    hide();
  };

  banner.querySelector('[data-consent-allow]')?.addEventListener('click', () => apply('granted'));
  banner.querySelector('[data-consent-decline]')?.addEventListener('click', () => apply('denied'));
  document.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest?.('[data-consent-open]')) {
      e.preventDefault();
      show();
    }
  });

  if (!read()) window.setTimeout(show, 900); // let the page settle first
}
