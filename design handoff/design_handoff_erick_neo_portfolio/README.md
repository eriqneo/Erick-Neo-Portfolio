# Handoff: Erick Neo — Portfolio Website (v3)

## How to take this into VS Code (quick start)

1. Download this folder (zip) and unzip it somewhere like `~/code/erick-neo-portfolio-handoff`.
2. Create the real project next to it (recommended stack, see "Recommended stack"):
   ```bash
   npm create astro@latest erick-neo-portfolio -- --template minimal --typescript strict
   cd erick-neo-portfolio
   npm i lenis
   ```
3. Copy this whole handoff folder into the new project as `/design_handoff/`.
4. Open the project in VS Code: `code .`
5. Open Claude Code (VS Code extension or `claude` in the integrated terminal) and paste the contents of `PROMPT.md`.
6. Preview the original design anytime: in VS Code, right-click `design_handoff/reference/Erick Neo Portfolio v3.dc.html` → "Open with Live Server" (Live Server extension) — it must be served over http, not opened as file://.
7. Run the site: `npm run dev` → http://localhost:4321. Deploy: push to GitHub, import on Vercel or Netlify (zero config for Astro).

## Overview
A one-page portfolio for **Erick Neo (Erick Nyamwaya Atura)**, AI Engineer with data analysis as his superpower, based in Nairobi, Kenya. Goal: **win freelance / consulting clients**. Motion and interaction model inspired by eduardbodak.com (rolling-letter hovers, word reveals, scroll reveals, custom "View" cursor, slide-in contact drawer, draggable physics letters, smooth scroll), with a cursor-reactive data chart as the signature hero.

## About the design files
The files in `reference/` are **design references built in HTML** — prototypes showing intended look and behavior, not production code. Recreate them in the target stack (Astro recommended) using its idiomatic patterns. `.dc.html` files need `support.js` beside them and must be served over http to preview.

## Fidelity
**High-fidelity.** Final colors, type, spacing, copy and interactions. Recreate pixel-faithfully. Items marked ⚠ are placeholder content to confirm with Erick.

## Recommended stack
- **Astro** (static, fast, same as the inspiration site) + plain CSS with custom properties (one global `tokens.css`).
- Small vanilla TS modules for motion (no framework needed): `hero-chart.ts`, `reveal.ts`, `roll-text.ts`, `cursor.ts`, `drawer.ts`, `physics-letters.ts`.
- **Lenis** for smooth scroll (replaces the hand-rolled wheel lerp in the prototype).
- Optional: GSAP + SplitText if richer timelines are wanted later.
- Respect `prefers-reduced-motion` everywhere (disable reveals, smooth scroll, physics auto-drop, chart drift).

## Page structure (top → bottom)
1. Sticky nav
2. Hero (3 variants — pick one; **A · Clusters** is default)
3. Proof strip (3 stats)
4. Services `#services`
5. Playground — draggable letters `#play`
6. Selected work with tabs `#work`
7. Skills & stack `#stack`
8. Experience timeline + certifications `#experience`
9. Contact footer `#contact`
10. Overlays: custom cursor, contact drawer

Horizontal page padding everywhere: `clamp(20px, 4vw, 56px)`. Section vertical padding: `clamp(72px, 10vw, 140px)`. Sections separated by `1px solid var(--line)` bottom borders.

### 1. Nav
- `position: sticky; top: 0; z-index: 20`; padding `16px` × page padding; background `var(--nav)` + `backdrop-filter: blur(12px)`; bottom border `--line`.
- Left: 9px accent dot + "Erick Neo" (600, 17px, -0.01em).
- Right (gap `clamp(12px,2.2vw,30px)`, IBM Plex Mono 12.5px uppercase, 0.06em): Services · Work · Stack · Experience (color `--mut`, hover `--fg`, rolling text) · theme toggle pill (half-filled 12px circle + "Light"/"Dark") · **"Let's talk"** pill (bg `--fg`, text `--bg`, hover bg `--acc` text `--onacc`) → opens drawer.

### 2. Hero — shared copy
- Eyebrow pill: green dot `#5fbf73` + "Taking new clients"; plus "AI Engineer · Nairobi, Kenya".
- H1: **"Haute Couture AI. Bespoke Data."** — "Haute Couture" in Newsreader italic 400 (-0.03em); "Data." in `--acc`; rest Familjen Grotesk 600, line-height 0.9, letter-spacing -0.045em.
- Sub: "I architect intelligent systems and turn raw numbers into your most unfair business advantage." (clamp(18px,1.6vw,22px), lh 1.45, `--fg2`, max-width 540px).
- CTAs: "Book a discovery call →" (bg `--acc`, text `--onacc`, padding 16×24, radius 999, 600 16px; opens drawer) and "See the work" (1px `--line` outline → `#work`).

**A · Clusters (default)** — full-viewport (`min-height: calc(100vh - 62px)`), content bottom-aligned, top padding `clamp(160px,26vh,300px)`. Full-bleed `<canvas>`: ~520 dots in 5 gaussian clusters at (x,y fractions) 0.14/0.26 "claims recovery", 0.38/0.16 "live sales stream", 0.60/0.30 "churn risk", 0.84/0.20 "sentiment · NLP", 0.76/0.50 "demand forecast", plus 12% noise. Dots spring to home + slight sin drift; within 140px of cursor they're attracted; up to 18 link lines from cursor; nearest cluster (≤170px) turns accent and gets a leader line + label chip "CLUSTER NAME   n=84" (Plex Mono 500 12px, accent bg). Bottom 60% gradient `--bg → transparent` for legibility. Caption row top: "FIG. 01 — EVERY CLUSTER IS A PROBLEM SOLVED" / "Move through the data ↗". H1 size clamp(56px,10.5vw,184px).

**B · Forecast** — two columns (flex-wrap: text `flex:2 1 560px`, portrait `flex:1 1 280px`, max 420px, 4:5, radius 16) above a chart strip `height: clamp(200px,28vh,300px)`. Chart: 140-point random-walk line; first 76% "actual" (solid `--fg` 1.6px + 7% accent area), rest "forecast" (dashed 5/5 accent + widening confidence band 14% accent). Crosshair eases (0.18) to cursor x, idles at "TODAY"; label "ACTUAL · WK 42 · 61.3" / "FORECAST · WK 120 · 74.0 ±3.2". Draws in over 1.6s ease-out-cubic.

**C · Pulse** — centered text, bars canvas across bottom 48%. N = clamp(w/20, 24, 80) bars; gaussian bump (σ≈110px) follows cursor (idles as slow sine sweep); bumped bars lerp up (0.12) and turn accent; label "SIGNAL 07 · 512".

### 3. Proof strip
3 cells, auto-fit min 220px, each `--line` right border: "7+ yrs — turning complex data into business decisions" · "Days → live — reporting cycles cut to real-time dashboards" · "$50K — in insurance claims recovered through analysis". Value 600 clamp(36px,4vw,56px).

### 4. Services
Header: eyebrow "01 — Services" + H2 "Tailored to your data, *never off the rack.*" (italic part Newsreader). Rows separated by `--line`:
1. **AI systems & automation** — "Custom AI tools, assistants and automated workflows built around how your business actually runs." Tags: LLM apps, RAG, Automation, Integrations
2. **Data analysis & BI** — "From messy spreadsheets to dashboards your team trusts, with reporting that moves from days to real-time." Tags: SQL, BigQuery, Tableau, Looker Studio
3. **Predictive analytics** — "Churn, demand and risk models that tell you what happens next, explained in plain business language." Tags: Forecasting, Classification, scikit-learn, XGBoost

Row: number (Plex Mono 14 accent) + title (600 clamp(26px,3vw,40px)), body 18px `--fg2`, tags as outline pills (Plex Mono 12).

### 5. Playground (draggable letters)
Height clamp(440px,64vh,640px), overflow hidden. Caption "FIG. 02 — OUTLIERS, HANDLED" / "Drag & throw ↗". Centered line "When every dashboard looks the same, *details* make the difference." (italic accent). Five bodies N·E·O·A·I, size clamp(96px,13vw,180px), font-size 56% of size:
N circle accent · E rounded-square (22%) `--fg` · O circle 2px outline · A rounded-square `--bg2` · I circle `--fg`.
Physics: start above box, drop when 35% visible; gravity 0.7/frame, floor restitution 0.42, wall 0.6, air damping 0.995, circle-circle collisions (restitution ~0.5), rotation += vx/r (rolling). Pointer drag with capture; release throws with last pointer delta × 0.9.

### 6. Work
Header "02 — Selected work" + H2 "Work" (clamp(48px,8vw,128px)) + segmented tabs pill (active: bg `--fg`, text `--bg`) with counts.
- **AI & products** intro: "Products built with Code Rafiki Technologies for retail, travel, hospitality and legal clients across Kenya."
  - FaidaPoint — POS & finance — rafikicode.com/work/faidapoint
  - SafariMaster — Tour operations — /work/safarimaster
  - Little Luxury — Hospitality — /work/little-luxury
  - D.Kisaka & Associates — Legal services — /work/dkisaka-associates
  - CTA: "All work at Code Rafiki ↗" → https://www.rafikicode.com/work
- **Data & analytics** intro: "Analytics, dashboards and models from my data portfolio, across healthcare, e-commerce and telecom."
  - Live Sales Performance Dashboard → datascienceportfol.io/neo/projects/19
  - Medical Billing Performance → /projects/14
  - Telecom Churn Prediction → /projects/13
  - iPhone 14 Launch Sentiment → /projects/16
  - CTA: "All 19 data projects ↗" → https://www.datascienceportfol.io/neo

(Full card copy is in the reference file's `renderVals()`.) Grid auto-fit min 440px; card = 16:10 image (radius 14, `--bg2`, chip "01 · POS & finance" top-left) + title row with "Case study ↗" + body 17px + stack tags (mono 12, underline). ⚠ Project screenshots needed — pull from rafikicode.com and the data portfolio.

### 7. Skills & stack
H2 "The tools I cut and stitch with." Three columns (top border 1px `--fg`), each a list with name + mono note:
- AI engineering: Python/core, LLMs & RAG/assistants, scikit-learn/ML, XGBoost · LightGBM/boosting, NLTK · TextBlob/NLP, Workflow automation/ops
- Data & BI: SQL/daily, BigQuery/warehouse, Tableau/certified, Looker Studio/certified, Pandas · NumPy/wrangling, Plotly · Streamlit/live apps
- How I work: Discovery & scoping/week 1, Exploratory analysis/always, Data storytelling/stakeholders, Dashboards to real-time/delivery, Mentoring teams/handover

### 8. Experience
Left (`flex:1 1 260px`): eyebrow, H2 "Seven years *in the data.*", portrait 4:5 max 340px (hidden in hero B since portrait is already in hero). Right (`flex:2 1 440px`) rows `grid: minmax(110px,160px) 1fr`:
- 2022 — now · Freelance Data Analyst & AI Engineer · Independent
- Now · AI & software · Code Rafiki Technologies ⚠ confirm exact title
- 2018 — 2022 · Data Analyst · TMC
Certifications pills: 2024 Looker Studio · 2024 SQL Associate, DataCamp · 2023 Data Analytics, Coursera · 2023 Data Preprocessing, Great Learning · 2022 Data Analyst in SQL, DataCamp · 2021 Tableau Desktop Specialist.

### 9. Contact footer
Eyebrow "05 — Contact", H2 "Let's tailor your *advantage.*" (clamp(56px,10.5vw,180px)), paragraph, big pill mailto **erick@rafikicode.com** (bg `--fg`), "Kenya/Nairobi · {live time} · working with clients worldwide". Bottom bar: © 2026 Erick Neo · LinkedIn · GitHub · Data portfolio · Code Rafiki · Back to top ↑.

Links:
- LinkedIn: https://www.linkedin.com/in/erick-nyamwaya-atura-874815211/
- GitHub: https://github.com/eriqneo
- Data portfolio: https://www.datascienceportfol.io/neo
- Code Rafiki: https://www.rafikicode.com/work

### 10. Contact drawer ("Let's talk")
Fixed panel `top/right/bottom: 12px`, width `min(580px, 100% - 24px)`, radius 18, `--bg`, own scroll. Backdrop rgba(8,8,7,.55). Slide `translateX(calc(100% + 24px)) → 0`, 0.9s `cubic-bezier(.16,1,.3,1)`; backdrop opacity 0.6s. Lock body scroll; close on Esc / backdrop / Close button.
Contents: "Work with me" + Close; H2 "Engagements, contact details and *answers.*"; Engagements ⚠ (Data audit 2–3 weeks · Build 6–12 weeks · Retainer Monthly) + "Each engagement is quoted to scope after a first conversation."; Contact: click-to-copy email button (label "Click to copy" → "Copied ✓" for 1.8s), links, "Kenya/Nairobi — 11:37 PM" live clock (Intl, `Africa/Nairobi`, refresh 20s); Answers accordion ⚠ (4 Q&As, first open, "+" rotates 45°).

## Interactions & motion spec
| Effect | Spec |
|---|---|
| Rolling text (nav, buttons, footer links) | Each letter is an inline-block with a duplicate absolutely below (`top:100%`), wrapper `overflow:hidden`. On hover of the parent `a/button`, letters `translateY(-100%)`, 0.6s `cubic-bezier(.65,0,.35,1)`, stagger 18ms per letter. Spaces → nbsp. Duplicate `aria-hidden`. |
| Headline word reveal | Each word in an `overflow:hidden` mask; inner span from `translateY(110%)` to 0, 1.2s `cubic-bezier(.16,1,.3,1)`, stagger 90ms (+50ms), starts 150ms after load. |
| Scroll reveal | Elements: all H2, service rows, project cards, stack groups, timeline rows, proof cells. From `opacity:0; translateY(56px)` → none, 1.1s `cubic-bezier(.16,1,.3,1)`; IntersectionObserver threshold 0.12, rootMargin bottom -6%; elements entering together stagger 90ms. Once only. |
| Custom cursor | 92px accent circle, "VIEW ↗" Plex Mono 13; follows pointer with lerp 0.2; scales 0→1 (0.45s same ease) over `[data-cursor="view"]` (project images). Fine pointers only. |
| Smooth scroll | Use Lenis (lerp ≈ 0.1). Anchor links scroll with 70px offset for the sticky nav. Disable while drawer is open and on touch/reduced motion. |
| Theme toggle | Swaps `data-theme` on root; bg/color transition 0.4s. Canvas palettes switch too. Persist choice in localStorage (not in prototype — add). |
| Work tabs | Switch project list; re-run reveal on new cards. |
| Hover | Outline buttons: border → `--fg`. Primary: swap to `--fg`/`--bg`. Links → `--acc`. |

## State
`theme` ('dark'|'light'), `heroVariant` (build-time choice), `workTrack` ('ai'|'data'), `drawerOpen`, `copied`, `faqOpenIndex`, `clock`. No data fetching — content is static (move copy into `src/data/*.ts` or Astro content collections).

## Design tokens
```css
:root, [data-theme="dark"] {
  --bg:#12110f; --bg2:#1c1a17; --nav:rgba(18,17,15,.8);
  --fg:#ece8e1; --fg2:#cfc9bf; --mut:#a9a398; --line:rgba(236,232,225,.14);
  --acc:#c24d64; /* wine/maroon, lifted for dark bg */ --onacc:#ffffff;
}
[data-theme="light"] {
  --bg:#f4f1ea; --bg2:#e8e3d9; --nav:rgba(244,241,234,.82);
  --fg:#171512; --fg2:#3b3731; --mut:#665f56; --line:rgba(23,21,18,.14);
  --acc:#7d1d32; /* deep maroon */ --onacc:#ffffff;
}
/* status green */ #5fbf73
```
Canvas palettes — dark: dots rgba(236,232,225,.42), faint .16, grid .08, accent rgba(194,77,100,a). Light: rgba(23,21,18,…) and accent rgba(125,29,50,a).

**Type** (Google Fonts): Familjen Grotesk 400/500/600/700 (UI + display), Newsreader italic 400/500 opsz 6–72 (emphasis words), IBM Plex Mono 400/500 (labels, eyebrows, data chips).
- Display H1: 600, clamp(56px,10.5vw,184px), lh .9, ls -0.045em
- Section H2: 600, clamp(36px,5vw,72px), lh 1, ls -0.035em
- H3 card: 600, clamp(24px,2.4vw,32px), ls -0.025em
- Body: 17–19px, lh 1.5, `--fg2`
- Eyebrow: Plex Mono 13px uppercase, ls 0.08em, `--mut`
**Radius:** pills 999px · cards/images 14px · hero portrait 16px · drawer 18px · engagement cards 14px.
**Shadows:** none (flat, border-led). **Easing:** `cubic-bezier(.16,1,.3,1)` (out-expo-ish) for reveals/drawer; `cubic-bezier(.65,0,.35,1)` for rolling text.

## Responsive
All layouts are flex-wrap / auto-fit grids; no fixed widths. Two-column blocks use `flex: 1 1 260px` + `flex: 2 1 440px` and stack below ~800px. Do not use `position: sticky` on stacked columns. Nav links should collapse into a menu button under ~720px (not in prototype — add).

## Assets
- `assets/erick-neo.png` — portrait (814×1048, black background), supplied by Erick.
- ⚠ 8 project screenshots needed (16:10).
- No icon set; arrows are text glyphs (→ ↗ ↓ ↑).

## Files
- `reference/Erick Neo Portfolio v3.dc.html` — full design (template + logic class with all copy, canvas chart code, physics, motion).
- `reference/RollText.dc.html` — rolling-letter hover component.
- `reference/support.js`, `reference/image-slot.js` — prototype runtime only; do not port.
- `PROMPT.md` — first message to paste into Claude Code.
