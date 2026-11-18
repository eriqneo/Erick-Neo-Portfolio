/**
 * Headline word reveal. Words are masked server-side (.hw > span); CSS holds them at
 * translateY(110%) until <html> gets .is-loaded, then each slides up with its own --d delay.
 */
export function initHeadlineReveal() {
  setTimeout(() => document.documentElement.classList.add('is-loaded'), 150);
}
