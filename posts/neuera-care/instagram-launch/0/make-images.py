#!/usr/bin/env python3
"""Generate 4 brand-intro image options for post 0.
Subtle, no campaign references, 1080×1350 IG-compliant.

Run from repo root:
    python3 posts/neuera-care/instagram-launch/0/make-images.py
"""
from __future__ import annotations
import io
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).parent
SVG = Path("/tmp/neuera.svg")  # already fetched earlier; refetch fallback below
if not SVG.exists():
    import urllib.request
    urllib.request.urlretrieve("https://www.neuera.care/static/neuera.svg", SVG)

W, H = 1080, 1350

# Brand palette pulled directly from the SVG (consistent with the site).
CREAM       = (250, 247, 242)
CREAM_DEEP  = (245, 237, 226)
CREAM_WARM  = (240, 226, 209)
INK         = (32, 36, 36)
INK_MUTED   = (98, 100, 96)
TEAL        = (108, 174, 165)
TEAL_DEEP   = (88, 144, 138)
PEACH       = (239, 186, 157)
CORAL       = (234, 112, 92)
FOREST      = (47, 79, 62)

FONT_SERIF_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/Library/Fonts/Georgia.ttf",
]
FONT_SANS_CANDIDATES = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
]
FONT_SERIF_ITALIC = [
    "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
]

def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def load_logo(width: int) -> Image.Image:
    png_bytes = cairosvg.svg2png(url=str(SVG), output_width=width, output_height=width)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")

def soft_blob(canvas: Image.Image, cx: int, cy: int, r: int, color, alpha: int = 110):
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(overlay).ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(80))
    canvas.alpha_composite(overlay)

def center_x(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> int:
    w = draw.textlength(text, font=f)
    return int((W - w) / 2)

def save(canvas: Image.Image, name: str):
    out = HERE / f"image-{name}.jpg"
    canvas.convert("RGB").save(out, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"OK · {out.name} · {out.stat().st_size // 1024} KB")


# ── Option A — Wordmark led, the lightest hand ──────────────────────────────
# Big Fraunces-style "neuera" on warm cream, tiny logo above, single italic
# tagline below. Maximum restraint. Reads like a print masthead.
def option_a():
    canvas = Image.new("RGBA", (W, H), CREAM).convert("RGBA")
    # Very faint blob — almost invisible — to break the perfect flat
    soft_blob(canvas, W // 2, H + 80, 460, PEACH, 35)

    logo = load_logo(120)
    canvas.alpha_composite(logo, dest=((W - logo.width) // 2, 360))

    draw = ImageDraw.Draw(canvas)
    f_brand = font(FONT_SERIF_CANDIDATES, 200)
    f_italic = font(FONT_SERIF_ITALIC, 36)
    f_caps = font(FONT_SANS_CANDIDATES, 22)

    brand = "neuera"
    bx = center_x(draw, brand, f_brand)
    draw.text((bx, 510), brand, font=f_brand, fill=INK)

    tag = "women's health, considered."
    tx = center_x(draw, tag, f_italic)
    draw.text((tx, 790), tag, font=f_italic, fill=INK_MUTED)

    foot = "NEUERA.CARE"
    fx = center_x(draw, foot, f_caps)
    # Tracking-wide effect by inserting hair-spaces.
    foot_spaced = "    ".join(list(foot))
    fx = center_x(draw, foot_spaced, f_caps)
    draw.text((fx, H - 120), foot_spaced, font=f_caps, fill=INK_MUTED)
    save(canvas, "a")


# ── Option B — Logo focal, two-line headline, hairline rule ─────────────────
# Big logo top, hairline divider, two-line serif headline. The most "card-y"
# but balanced and editorial.
def option_b():
    canvas = Image.new("RGBA", (W, H), CREAM_DEEP).convert("RGBA")
    soft_blob(canvas, -120, 200, 380, TEAL, 60)
    soft_blob(canvas, W + 100, H - 200, 420, PEACH, 70)

    logo = load_logo(480)
    canvas.alpha_composite(logo, dest=((W - logo.width) // 2, 200))

    draw = ImageDraw.Draw(canvas)
    f_head = font(FONT_SERIF_CANDIDATES, 76)
    f_caps = font(FONT_SANS_CANDIDATES, 24)

    # Hairline rule
    ry = 770
    rx0, rx1 = 360, W - 360
    draw.line([(rx0, ry), (rx1, ry)], fill=INK, width=2)

    h1 = "Specialist women's health,"
    h2 = "as warm as it is rigorous."
    draw.text((center_x(draw, h1, f_head), 830), h1, font=f_head, fill=INK)
    draw.text((center_x(draw, h2, f_head), 920), h2, font=f_head, fill=INK)

    foot = "neuera"
    fy = H - 150
    fx = center_x(draw, foot, font(FONT_SERIF_CANDIDATES, 56))
    draw.text((fx, fy), foot, font=font(FONT_SERIF_CANDIDATES, 56), fill=INK)
    save(canvas, "b")


# ── Option C — Two-band split, brand-on-color ───────────────────────────────
# Top 70% cream, bottom 30% deep forest. Logo at the seam, wordmark below.
# Bolder visually but still typographic — closest to a Pentagram poster.
def option_c():
    canvas = Image.new("RGBA", (W, H), CREAM).convert("RGBA")

    # Bottom band — deep forest
    band = Image.new("RGBA", (W, 420), (*FOREST, 255))
    canvas.alpha_composite(band, dest=(0, H - 420))

    # Logo sitting astride the seam
    logo = load_logo(320)
    logo_y = H - 420 - logo.height // 2
    canvas.alpha_composite(logo, dest=((W - logo.width) // 2, logo_y))

    draw = ImageDraw.Draw(canvas)
    f_serif_big = font(FONT_SERIF_CANDIDATES, 140)
    f_caps = font(FONT_SANS_CANDIDATES, 24)
    f_caps_small = font(FONT_SANS_CANDIDATES, 18)

    # Upper headline
    head1 = "We're"
    head2 = "neuera."
    draw.text((center_x(draw, head1, f_serif_big), 240), head1, font=f_serif_big, fill=INK)
    draw.text((center_x(draw, head2, f_serif_big), 400), head2, font=f_serif_big, fill=INK)

    # Lower (on forest band): small caps subtitle
    sub_top = "  ".join("WOMEN'S HEALTH · ONLINE · SPECIALIST-LED  ".split())
    sub = "WOMEN'S HEALTH    ·    ONLINE    ·    SPECIALIST-LED"
    draw.text((center_x(draw, sub, f_caps_small), H - 130), sub, font=f_caps_small, fill=CREAM)

    save(canvas, "c")


# ── Option D — Typographic stack, no logo (just wordmark + tagline) ─────────
# Pure type. No imagery at all. Maximally quiet. Reads like a serif book cover.
def option_d():
    canvas = Image.new("RGBA", (W, H), CREAM).convert("RGBA")
    # Single subtle peach wash in the lower right
    soft_blob(canvas, W + 40, H + 40, 520, CREAM_WARM, 240)

    draw = ImageDraw.Draw(canvas)
    f_serif_xl = font(FONT_SERIF_CANDIDATES, 280)
    f_italic = font(FONT_SERIF_ITALIC, 42)
    f_caps = font(FONT_SANS_CANDIDATES, 22)
    f_caps_small = font(FONT_SANS_CANDIDATES, 18)

    # Tiny top eyebrow
    eyebrow = "A    W O M E N ' S    H E A L T H    P R A C T I C E"
    draw.text((center_x(draw, eyebrow, f_caps_small), 200), eyebrow, font=f_caps_small, fill=INK_MUTED)

    # Big wordmark
    brand = "neuera"
    draw.text((center_x(draw, brand, f_serif_xl), 380), brand, font=f_serif_xl, fill=INK)

    # Italic subtitle
    sub1 = "Cycles. Hormones. Fertility."
    sub2 = "Perimenopause. Menopause. Heard."
    draw.text((center_x(draw, sub1, f_italic), 820), sub1, font=f_italic, fill=INK_MUTED)
    draw.text((center_x(draw, sub2, f_italic), 880), sub2, font=f_italic, fill=INK_MUTED)

    # Foot URL in small caps (with extra tracking)
    foot = "N E U E R A . C A R E"
    draw.text((center_x(draw, foot, f_caps), H - 130), foot, font=f_caps, fill=INK)

    save(canvas, "d")


if __name__ == "__main__":
    option_a()
    option_b()
    option_c()
    option_d()
    print("done.")
