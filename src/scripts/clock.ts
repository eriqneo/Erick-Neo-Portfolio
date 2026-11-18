import { site } from '../data/site';

/** Live Nairobi time into every [data-clock] element, refreshed every 20s. */
export function initClock() {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: site.timeZone,
  });
  const tick = () => {
    const now = new Date();
    const text = fmt.format(now);
    els.forEach((el) => {
      el.textContent = text;
      if (el instanceof HTMLTimeElement) el.dateTime = now.toISOString();
    });
  };
  tick();
  setInterval(tick, 20_000);
}
