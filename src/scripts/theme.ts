import type { Theme } from './env';

const KEY = 'theme';

/** Theme toggle: swaps data-theme on <html> and persists the choice. */
export function initThemeToggle() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

  const apply = (theme: Theme) => {
    root.dataset.theme = theme;
    buttons.forEach((b) => {
      const label = b.querySelector('[data-theme-label]');
      // Label names the theme you'll switch *to*, as in the design.
      if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    });
  };

  apply(root.dataset.theme === 'light' ? 'light' : 'dark');

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const next: Theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable — choice lasts for this page view */
      }
    }),
  );
}
