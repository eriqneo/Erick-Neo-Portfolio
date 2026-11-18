Paste this into Claude Code from the root of your new Astro project (with this folder copied to `/design_handoff/`):

---

Read `design_handoff/README.md` fully, then open `design_handoff/reference/Erick Neo Portfolio v3.dc.html` and `RollText.dc.html` as the source of truth for copy, layout, canvas chart code, physics and motion.

Build this portfolio as a production Astro site:

1. Set up `src/styles/tokens.css` with the exact design tokens (dark + light via `data-theme`) and load Familjen Grotesk, Newsreader (italic) and IBM Plex Mono.
2. Create `src/data/` files for services, projects (two tracks), stack, timeline, certifications, engagements and FAQ — copy text verbatim from the reference.
3. Build one Astro component per section: Nav, Hero (implement variant A · Clusters; keep B and C behind a `variant` prop), ProofStrip, Services, Playground, Work, Stack, Experience, ContactFooter, ContactDrawer, Cursor.
4. Port the motion as small vanilla TS modules: roll-text, headline word reveal, scroll reveal (IntersectionObserver + WAAPI), custom cursor, drawer (Esc, backdrop, scroll lock, click-to-copy, Nairobi clock), physics letters, hero canvas chart. Use Lenis for smooth scroll.
5. Respect `prefers-reduced-motion`, persist theme in localStorage, add a mobile menu under 720px, and keep everything keyboard accessible.
6. Put the portrait at `public/images/erick-neo.png`; use placeholder boxes for project screenshots.
7. Add SEO meta (title "Erick Neo — AI Engineer · Haute Couture AI. Bespoke Data."), an OG image placeholder, and a sitemap.

Work section by section, run `npm run dev` and compare against the reference after each one. Ask me before inventing any new copy.
