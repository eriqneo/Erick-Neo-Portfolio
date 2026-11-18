// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical origin: drives canonical URLs, absolute OG image URLs, robots.txt and the sitemap.
// 1. SITE_URL if set (use it once you attach a custom domain, e.g. https://erickneo.com)
// 2. on Vercel production builds: the project's production domain (set automatically)
// 3. on Vercel preview builds: that deployment's URL
// 4. locally: the dev server
const vercelHost =
  process.env.VERCEL_ENV === 'production'
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;
const site =
  process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [sitemap()],
  // Self-hosted (latin subset) — no network needed at build time.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Familjen Grotesk',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/familjen-grotesk-latin-var.woff2'], weight: '400 700', style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-serif',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/newsreader-italic-latin-var.woff2'], weight: '400 500', style: 'italic' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/ibm-plex-mono-latin-400.woff2'], weight: '400', style: 'normal' },
          { src: ['./src/assets/fonts/ibm-plex-mono-latin-500.woff2'], weight: '500', style: 'normal' },
        ],
      },
    },
  ],
});
