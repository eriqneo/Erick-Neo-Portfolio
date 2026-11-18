# Erick Neo — Portfolio

One-page portfolio plus `/work` case studies for Erick Neo (AI Engineer & Business Intelligence, Nairobi).
Static [Astro](https://astro.build) site, vanilla TypeScript motion, Lenis smooth scroll. No framework runtime, no backend.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321  (or: npx astro dev --background)
npm run check      # type-check .astro + .ts
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run verify     # check + build (run before pushing)
```

Requires Node 24 (see `engines` in `package.json`).

## Deploy (Vercel)

The repo is deploy-ready: `vercel.json` sets the framework, build command, output directory, caching and security headers.

1. Push the repo to GitHub (or GitLab/Bitbucket).
2. In Vercel: **Add New → Project → Import** the repo. Settings are picked up from `vercel.json`; nothing to change.
3. Deploy. Canonical URLs, OG images, `robots.txt` and the sitemap automatically use the Vercel production domain.
4. **Custom domain:** add it under *Project → Settings → Domains*, then set an environment variable `SITE_URL=https://your-domain` (Production) and redeploy, so canonical/OG/sitemap URLs use the custom domain.

## Where things live

| What | Where |
| --- | --- |
| Copy & content | `src/data/*.ts` (projects, services, stack, timeline, FAQ, engagements, site/links) |
| Sections | `src/components/*.astro`, composed in `src/pages/index.astro` |
| Case studies | `src/pages/work/[slug].astro` (generated from `src/data/projects.ts`) |
| Motion | `src/scripts/*.ts` — all scroll effects subscribe via `scroll-frame.ts` |
| Design tokens | `src/styles/tokens.css` (dark/light via `data-theme`) |
| Fonts | self-hosted in `src/assets/fonts/` (Astro Fonts API, `astro.config.mjs`) |
| Project media | `public/images/work/<slug>/NN.webp` (+ `NN-800.webp`), videos in `public/videos/work/<slug>/` |
| Brand kit | `public/brand/` — regenerate with `scripts/brand/generate.py` (see `scripts/brand/README.md`) |

### Adding a project video

Record 16:10 (Chrome full-screen / F11), then:

```sh
ffmpeg -ss <start> -t <length> -i input.mp4 -an -vf "scale=1280:800,fps=30" \
  -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart public/videos/work/<slug>/01.mp4
ffmpeg -ss <start> -t <length> -i input.mp4 -an -vf "scale=1280:800,fps=30" \
  -c:v libvpx-vp9 -crf 37 -b:v 0 public/videos/work/<slug>/01.webm
ffmpeg -ss <start> -i input.mp4 -frames:v 1 -vf scale=1280:800 public/videos/work/<slug>/poster.webp
```

Then add `video: { mp4, webm, poster }` to the project in `src/data/projects.ts`.

## Accessibility & motion

All motion respects `prefers-reduced-motion`; videos never autoplay under reduced motion or Save-Data.
`design handoff/` holds the original design reference (not part of the build).
