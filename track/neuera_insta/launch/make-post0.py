#!/usr/bin/env python3
"""Build a 1080×1350 IG-compliant intro image for post 0.
Uses the neuera.care SVG logo + brand-palette text.
Output: /tmp/neuera-post0.jpg
"""
import io
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SVG = Path("/tmp/neuera.svg")
OUT = Path("/tmp/neuera-post0.jpg")

W, H = 1080, 1350

# Brand palette pulled from the SVG itself.
CREAM = (250, 240, 230)       # warm cream background
CREAM_HI = (253, 247, 240)    # lighter top of gradient
TEAL = (108, 174, 165)        # #6caea5 (deeper teal)
TEAL_HI = (137, 193, 184)     # #89c1b8
PEACH = (239, 186, 157)       # #efba9d
CORAL = (234, 112, 92)        # #ea705c
INK = (45, 60, 60)            # near-forest text

# ---- Background: vertical cream → peach-tinted gradient -------------------
bg = Image.new("RGB", (W, H), CREAM_HI)
top = CREAM_HI
bot = (245, 224, 208)  # warm peach-cream
for y in range(H):
    t = y / H
    r = int(top[0] + (bot[0] - top[0]) * t)
    g = int(top[1] + (bot[1] - top[1]) * t)
    b = int(top[2] + (bot[2] - top[2]) * t)
    for x in range(W):
        bg.putpixel((x, y), (r, g, b))

# ---- Render the SVG to a transparent PNG at high resolution ---------------
logo_png_bytes = cairosvg.svg2png(url=str(SVG), output_width=520, output_height=520)
logo = Image.open(io.BytesIO(logo_png_bytes)).convert("RGBA")

# ---- Soft pastel circles for visual interest ------------------------------
def soft_blob(canvas, cx, cy, r, color, alpha=110):
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(60))
    canvas.alpha_composite(overlay)

canvas = bg.convert("RGBA")
soft_blob(canvas, -50, 100, 320, TEAL_HI, 80)
soft_blob(canvas, W + 60, H - 240, 360, PEACH, 100)
soft_blob(canvas, W // 2 - 60, H + 40, 380, CORAL, 60)

# ---- Place the logo centred upper third ----------------------------------
lx = (W - logo.width) // 2
ly = 230
canvas.alpha_composite(logo, dest=(lx, ly))

# ---- Typography helpers ---------------------------------------------------
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
def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

f_brand = font(FONT_SERIF_CANDIDATES, 110)
f_tag = font(FONT_SERIF_CANDIDATES, 44)
f_meta = font(FONT_SANS_CANDIDATES, 28)

draw = ImageDraw.Draw(canvas)

# Brand name under logo
brand_text = "neuera"
bw = draw.textlength(brand_text, font=f_brand)
draw.text(((W - bw) / 2, ly + logo.height + 10), brand_text, font=f_brand, fill=INK)

# Subhead — pulled from the program-page voice
tag_line1 = "Specialist-led women's health."
tag_line2 = "Warm. Evidence-based. Yours."
tw1 = draw.textlength(tag_line1, font=f_tag)
tw2 = draw.textlength(tag_line2, font=f_tag)
draw.text(((W - tw1) / 2, ly + logo.height + 150), tag_line1, font=f_tag, fill=INK)
draw.text(((W - tw2) / 2, ly + logo.height + 210), tag_line2, font=f_tag, fill=INK)

# Small marker badge (uppercase, slightly transparent)
badge = "45-DAY LAUNCH · STARTS MAY 20"
bb = draw.textlength(badge, font=f_meta)
pad_x, pad_y = 28, 12
bx0 = (W - bb) / 2 - pad_x
by0 = H - 180
bx1 = bx0 + bb + pad_x * 2
by1 = by0 + 28 + pad_y * 2
# Pill background
pill = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
ImageDraw.Draw(pill).rounded_rectangle((bx0, by0, bx1, by1), radius=30, fill=(*TEAL, 60))
canvas.alpha_composite(pill)
draw.text((bx0 + pad_x, by0 + pad_y - 2), badge, font=f_meta, fill=TEAL)

# Foot marker
foot = "neuera.care"
fw = draw.textlength(foot, font=f_meta)
draw.text(((W - fw) / 2, H - 80), foot, font=f_meta, fill=(120, 120, 110))

# ---- Save as JPG ----------------------------------------------------------
final = canvas.convert("RGB")
final.save(OUT, "JPEG", quality=92, optimize=True, progressive=True)
print(f"OK: {OUT} ({OUT.stat().st_size // 1024} KB)")
