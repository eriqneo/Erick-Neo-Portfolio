"""
Brand asset generator for the Erick Neo dot-matrix "EN" monogram.

Reads the single source of truth (src/data/logo-grid.json) and writes:
  public/favicon.svg, public/favicon.ico, public/apple-touch-icon.png, public/icon-512.png
  public/images/og-image.png
  public/brand/*  (outlined SVG lockups + marks, PNG previews)
  src/data/avatar.json  (dot-matrix halftone portrait used by Avatar.astro)

Requires: fonttools[woff], brotli, uharfbuzz, Pillow
  python -m venv .venv && .venv/bin/pip install "fonttools[woff]" brotli uharfbuzz pillow
  .venv/bin/python scripts/brand/generate.py
"""
import json
import sys
import tempfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
GRID = json.loads((ROOT / "src/data/logo-grid.json").read_text())
FONTS = ROOT / "src/assets/fonts"
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
TMP = Path(tempfile.mkdtemp(prefix="brand-"))

# Design tokens (src/styles/tokens.css)
INK, PAPER = "#12110f", "#f4f1ea"
FG_DARK, FG_LIGHT = "#ece8e1", "#171512"
ACC_DARK, ACC_LIGHT = "#c24d64", "#7d1d32"
MUT_DARK = "#a9a398"


# ---------------------------------------------------------------- geometry
def geometry(small=False):
    """Mirror of src/data/logo.ts — keep in sync."""
    step, gap = GRID["step"], GRID["letterGap"]
    r = GRID["radiusSmall" if small else "radius"]
    pad = r["accent"]
    dots, x0 = [], pad
    for rows in GRID["letters"]:
        cols = len(rows[0])
        for ri, row in enumerate(rows):
            for ci, ch in enumerate(row):
                if ch != ".":
                    acc = ch == "A"
                    dots.append((x0 + ci * step, pad + ri * step, r["accent"] if acc else r["regular"], acc))
        x0 += (cols - 1) * step + gap
    width = x0 - gap + pad
    height = pad * 2 + (len(GRID["letters"][0]) - 1) * step
    return dots, width, height


# ---------------------------------------------------------------- fonts
def instance(name, axes):
    f = TTFont(FONTS / name)
    f.flavor = None
    if "fvar" in f:
        f = instancer.instantiateVariableFont(f, axes)
    out = TMP / f"{name}-{'-'.join(f'{k}{v}' for k, v in axes.items())}.ttf"
    f.save(out)
    return out


SANS_600 = instance("familjen-grotesk-latin-var.woff2", {"wght": 600})
SERIF_I = instance("newsreader-italic-latin-var.woff2", {"wght": 400, "opsz": 72})
MONO_500 = instance("ibm-plex-mono-latin-500.woff2", {})


def text_outline(ttf, text, size, tracking_em=-0.01):
    """Shape with HarfBuzz (kerning on) and return (svg path d, width, cap height); baseline at y=0."""
    face = hb.Face(hb.Blob.from_file_path(str(ttf)))
    font = hb.Font(face)
    upem = face.upem
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    tt = TTFont(ttf)
    gs, order = tt.getGlyphSet(), tt.getGlyphOrder()
    s = size / upem
    x, parts = 0.0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(gs)
        gs[order[info.codepoint]].draw(TransformPen(pen, (s, 0, 0, -s, (x + pos.x_offset) * s, -pos.y_offset * s)))
        parts.append(pen.getCommands())
        x += pos.x_advance + tracking_em * upem
    width = (x - tracking_em * upem) * s
    cap = tt["OS/2"].sCapHeight * s
    return " ".join(p for p in parts if p), width, cap


# ---------------------------------------------------------------- SVG
def svg_mark(fg, acc, small=False, height=None, mono=False):
    dots, w, h = geometry(small)
    k = (height / h) if height else 1
    circles = "".join(
        f'<circle cx="{x * k:.2f}" cy="{y * k:.2f}" r="{r * k:.2f}" fill="{fg if (mono or not a) else acc}"/>'
        for x, y, r, a in dots
    )
    return circles, w * k, h * k


def svg_doc(w, h, body, bg=None, rx=0):
    rect = f'<rect width="{w:.2f}" height="{h:.2f}" rx="{rx}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}">'
        f"{rect}{body}</svg>\n"
    )


def lockup_svg(fg, acc, mono=False, mark_h=120):
    circles, mw, mh = svg_mark(fg, acc, height=mark_h, mono=mono)
    # Wordmark cap height ≈ 55% of the mark, optically centred; gap ≈ 36% of the mark.
    probe_d, _, probe_cap = text_outline(SANS_600, "Erick Neo", 100)
    size = 100 * (0.55 * mark_h) / probe_cap
    d, tw, cap = text_outline(SANS_600, "Erick Neo", size)
    gap = 0.36 * mark_h
    baseline = mh / 2 + cap / 2
    body = f"{circles}<path transform=\"translate({mw + gap:.2f} {baseline:.2f})\" fill=\"{fg}\" d=\"{d}\"/>"
    return svg_doc(mw + gap + tw, mh, body)


# ---------------------------------------------------------------- raster
SS = 4  # supersampling


def draw_mark(img_ss, x, y, height, fg, acc, small=False, mono=False):
    """Draw the mark onto a supersampled image; x, y, height in final pixels."""
    dots, w, h = geometry(small)
    k = height / h * SS
    d = ImageDraw.Draw(img_ss)
    for cx, cy, r, a in dots:
        px, py, pr = x * SS + cx * k, y * SS + cy * k, r * k
        d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=fg if (mono or not a) else acc)
    return w * height / h


def tile(size, small=True, radius_frac=0.22):
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=size * SS * radius_frac, fill=INK)
    dots, w, h = geometry(small)
    mark_w = size * 0.72
    mark_h = mark_w * h / w
    draw_mark(img, (size - mark_w) / 2, (size - mark_h) / 2, mark_h, FG_DARK, ACC_DARK, small)
    return img.resize((size, size), Image.LANCZOS)


def draw_text(d, xy, text, font, fill, tracking_em=0.0):
    """Per-glyph draw so negative tracking can be applied (prefix widths keep kerning).
    `xy` is the left end of the BASELINE, so mixed fonts line up on one baseline."""
    x, y = xy
    size = font.size
    for i, ch in enumerate(text):
        px = x + font.getlength(text[:i]) + i * tracking_em * size
        d.text((px, y), ch, font=font, fill=fill, anchor="ls")
    return font.getlength(text) + (len(text) - 1) * tracking_em * size


def og_image():
    W, H = 1200, 630
    img = Image.new("RGB", (W * SS, H * SS), INK)
    d = ImageDraw.Draw(img)
    pad = 80
    # faint grid, echoing the project placeholders
    for gx in range(0, W, 40):
        d.line([(gx * SS, 0), (gx * SS, H * SS)], fill="#191816", width=SS)
    for gy in range(0, H, 40):
        d.line([(0, gy * SS), (W * SS, gy * SS)], fill="#191816", width=SS)

    # lockup
    mark_h = 46
    mw = draw_mark(img, pad, pad, mark_h, FG_DARK, ACC_DARK)
    sans = ImageFont.truetype(str(SANS_600), 34 * SS)
    d.text(((pad + mw + 18) * SS, (pad + mark_h / 2) * SS), "Erick Neo", font=sans, fill=FG_DARK, anchor="lm")

    mono = ImageFont.truetype(str(MONO_500), 15 * SS)
    label = "AI ENGINEER · NAIROBI, KENYA"
    d.text(((W - pad) * SS, (pad + mark_h / 2) * SS), label, font=mono, fill=MUT_DARK, anchor="rm")

    # headline — "Haute Couture" serif italic, "AI." sans, "Bespoke" sans, "Data." accent
    size = 112
    serif = ImageFont.truetype(str(SERIF_I), size * SS)
    head = ImageFont.truetype(str(SANS_600), size * SS)
    y2 = H - pad  # baselines
    y1 = y2 - size * 0.98
    x = pad * SS
    x += draw_text(d, (x, y1 * SS), "Haute Couture ", serif, FG_DARK, -0.03)
    draw_text(d, (x, y1 * SS), "AI.", head, FG_DARK, -0.045)
    x = pad * SS
    x += draw_text(d, (x, y2 * SS), "Bespoke ", head, FG_DARK, -0.045)
    draw_text(d, (x, y2 * SS), "Data.", head, ACC_DARK, -0.045)

    img.resize((W, H), Image.LANCZOS).save(PUBLIC / "images/og-image.png", optimize=True)


def cells():
    """Grid cells as (col, row, accent) across the whole monogram, letters 1 cell apart."""
    out, c0 = [], 0
    for rows in GRID["letters"]:
        for ri, row in enumerate(rows):
            for ci, ch in enumerate(row):
                if ch != ".":
                    out.append((c0 + ci, ri, ch == "A"))
        c0 += len(rows[0]) + 1
    return out, c0 - 1, len(GRID["letters"][0])


def pixel_icon(size, cell, dot):
    """Pixel-exact favicon frame: each grid cell is `cell` px, each dot a `dot` px square."""
    cs, cols, rows = cells()
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=max(2, round(size * 0.22)), fill=INK)
    ox = (size - cols * cell) // 2
    oy = (size - rows * cell) // 2
    for c, r, a in cs:
        x, y = ox + c * cell, oy + r * cell
        d.rectangle([x, y, x + dot - 1, y + dot - 1], fill=ACC_DARK if a else FG_DARK)
    return img


def favicon_svg():
    """16-unit pixel grid: crisp at 16px (1 unit = 1px) and 32px (2px)."""
    cs, cols, rows = cells()
    ox, oy = (16 - cols) // 2, (16 - rows) // 2
    px = "".join(
        f'<rect x="{ox + c}" y="{oy + r}" width="1" height="1" fill="{ACC_DARK if a else FG_DARK}"/>' for c, r, a in cs
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">'
        f'<rect width="16" height="16" rx="3.5" fill="{INK}" shape-rendering="geometricPrecision"/>{px}</svg>\n'
    )


# ---------------------------------------------------------------- avatar
AVATAR_SRC = PUBLIC / "images/erick-neo.png"
AVATAR_BOX = (282, 4, 562, 356)  # head crop in the 814×1048 portrait (forehead → chin)
AVATAR_EYES = [(358, 158), (465, 153)]  # pupil centres in the portrait
AVATAR_COLS = 21


def avatar():
    """Halftone the head into the logo's dot grid.

    - Skin mask (closed to keep eyes/mouth/beard inside) drops the black background + suit.
    - Brightness is normalised *within* the face, then blended with a high-pass so features
      (brows, nose, smile, beard) survive at 21 columns.
    - Two radius sets: dark mode = light areas get big dots; light mode = shadows get big
      dots (as in print), so neither theme looks like a photo negative.
    """
    crop = Image.open(AVATAR_SRC).convert("RGB").crop(AVATAR_BOX)
    a = np.asarray(crop).astype(float)
    r_, g_, b_ = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * r_ + 0.587 * g_ + 0.114 * b_
    skin = (r_ > g_) & (g_ >= b_ * 0.9) & (r_ - b_ > 18) & (lum > 38)
    mask = (
        np.asarray(
            Image.fromarray((skin * 255).astype("uint8")).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MinFilter(15))
        )
        > 127
    )
    lo, hi = np.percentile(lum[mask], 4), np.percentile(lum[mask], 97)
    v = np.clip((lum - lo) / (hi - lo), 0, 1)
    blur = np.asarray(Image.fromarray((v * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(22))).astype(float) / 255
    hp = np.clip(0.5 + 1.6 * (v - blur), 0, 1)

    cols = AVATAR_COLS
    rows = round(cols * crop.height / crop.width)
    cw, ch = crop.width / cols, crop.height / rows
    eyes = [[int((x - AVATAR_BOX[0]) / cw), int((y - AVATAR_BOX[1]) / ch)] for x, y in AVATAR_EYES]

    def dark(raw):  # always a minimum dot inside the face → no hollow sockets
        return 0.09 + 0.41 * float(np.clip((raw - 0.12) / 0.78, 0, 1) ** 1.5)

    def light(raw):
        t = float(np.clip((0.88 - raw) / 0.7, 0, 1) ** 1.3)
        return 0 if t < 0.12 else 0.06 + 0.46 * t

    dots = []
    for r in range(rows):
        for c in range(cols):
            ys, ye, xs, xe = int(r * ch), int((r + 1) * ch), int(c * cw), int((c + 1) * cw)
            mm = mask[ys:ye, xs:xe]
            if mm.mean() < 0.45 or [c, r] in eyes:
                continue
            raw_d = 0.4 * v[ys:ye, xs:xe][mm].mean() + 0.6 * hp[ys:ye, xs:xe][mm].mean()
            raw_l = 0.25 * v[ys:ye, xs:xe][mm].mean() + 0.75 * hp[ys:ye, xs:xe][mm].mean()
            dots.append([c, r, round(dark(raw_d), 3), round(light(raw_l), 3)])

    out = {
        "$comment": "Generated by scripts/brand/generate.py from public/images/erick-neo.png — do not edit.",
        "cols": cols,
        "rows": rows,
        "eyes": eyes,
        "dots": dots,
    }
    (ROOT / "src/data/avatar.json").write_text(json.dumps(out, separators=(",", ":")) + "\n")
    return out


# ---------------------------------------------------------------- write
def main():
    BRAND.mkdir(parents=True, exist_ok=True)

    # Favicons: pixel-exact small cuts (dots become pixels) …
    (PUBLIC / "favicon.svg").write_text(favicon_svg())
    f16, f32, f48 = pixel_icon(16, 1, 1), pixel_icon(32, 2, 2), pixel_icon(48, 3, 2)
    f48.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[f16, f32])
    # … and round dots where there is room for them.
    tile(512).save(PUBLIC / "icon-512.png", optimize=True)
    tile(180, radius_frac=0).save(PUBLIC / "apple-touch-icon.png", optimize=True)  # iOS rounds corners itself

    # Brand kit — transparent backgrounds, coloured for the surface they sit on
    kit = {
        "erick-neo-lockup-on-dark.svg": lockup_svg(FG_DARK, ACC_DARK),
        "erick-neo-lockup-on-light.svg": lockup_svg(FG_LIGHT, ACC_LIGHT),
        "erick-neo-lockup-mono-black.svg": lockup_svg("#000000", "#000000", mono=True),
        "erick-neo-lockup-mono-white.svg": lockup_svg("#ffffff", "#ffffff", mono=True),
    }
    for name, (fg, acc, mono) in {
        "erick-neo-mark-on-dark.svg": (FG_DARK, ACC_DARK, False),
        "erick-neo-mark-on-light.svg": (FG_LIGHT, ACC_LIGHT, False),
        "erick-neo-mark-mono-black.svg": ("#000000", "#000000", True),
        "erick-neo-mark-mono-white.svg": ("#ffffff", "#ffffff", True),
    }.items():
        c, w, h = svg_mark(fg, acc, height=120, mono=mono)
        kit[name] = svg_doc(w, h, c)
    for name, svg in kit.items():
        (BRAND / name).write_text(svg)

    # PNG previews of the lockup on its intended surface (2x)
    for name, bg, fg, acc in [("on-dark", INK, FG_DARK, ACC_DARK), ("on-light", PAPER, FG_LIGHT, ACC_LIGHT)]:
        W, H = 1600, 600
        img = Image.new("RGB", (W * SS, H * SS), bg)
        d = ImageDraw.Draw(img)
        mark_h = 200
        _, gw, gh = geometry()
        sans = ImageFont.truetype(str(SANS_600), 10 * SS)
        cap_probe = TTFont(SANS_600)["OS/2"].sCapHeight / TTFont(SANS_600)["head"].unitsPerEm
        size = 0.55 * mark_h / cap_probe
        sans = ImageFont.truetype(str(SANS_600), int(size * SS))
        text_w = draw_text(ImageDraw.Draw(Image.new("RGB", (1, 1))), (0, 0), "Erick Neo", sans, fg, -0.01) / SS
        mw = gw * mark_h / gh
        total = mw + 0.36 * mark_h + text_w
        x0 = (W - total) / 2
        y0 = (H - mark_h) / 2
        draw_mark(img, x0, y0, mark_h, fg, acc)
        tx = (x0 + mw + 0.36 * mark_h) * SS
        # baseline so caps are vertically centred on the mark
        baseline = (y0 + mark_h / 2 + 0.55 * mark_h / 2) * SS
        draw_text(d, (tx, baseline), "Erick Neo", sans, fg, -0.01)
        img.resize((W, H), Image.LANCZOS).save(BRAND / f"erick-neo-lockup-{name}.png", optimize=True)

    og_image()
    av = avatar()
    print(f"avatar: {av['cols']}×{av['rows']} grid, {len(av['dots'])} dots, eyes at {av['eyes']}")
    print("wrote:", ", ".join(sorted(p.name for p in BRAND.iterdir())))


if __name__ == "__main__":
    sys.exit(main())
