#!/usr/bin/env python3
"""
Generate a 1024x1024 branded app icon for Varisankya (Windows / cross-platform).
Produces the same design as generate_icon.swift but uses Pillow instead of AppKit.

Usage: python generate_icon_win.py [output.png]
Default output: Varisankya/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png
"""

import sys
import math
import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__),
    "../Varisankya/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
)

# Brand colours
GRAD_TOP    = (46,  92, 235)   # #2E5CEB
GRAD_BOTTOM = (114, 51, 217)   # #7233D9
RING_RGBA   = (255, 255, 255, 56)   # white 22% opacity

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# --- Gradient background ---
for y in range(SIZE):
    t = y / (SIZE - 1)
    r = round(GRAD_TOP[0] + t * (GRAD_BOTTOM[0] - GRAD_TOP[0]))
    g = round(GRAD_TOP[1] + t * (GRAD_BOTTOM[1] - GRAD_TOP[1]))
    b = round(GRAD_TOP[2] + t * (GRAD_BOTTOM[2] - GRAD_TOP[2]))
    draw.line([(0, y), (SIZE - 1, y)], fill=(r, g, b, 255))

# --- Soft glass ring ---
ring_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
ring_draw  = ImageDraw.Draw(ring_layer)
RING_W = 28
MARGIN = 110
ring_draw.ellipse(
    [MARGIN, MARGIN, SIZE - MARGIN, SIZE - MARGIN],
    outline=RING_RGBA, width=RING_W
)
img = Image.alpha_composite(img, ring_layer)

# --- "V" monogram ---
# Try bold system fonts in order of preference
font_candidates = [
    "arialbd.ttf",          # Arial Bold (Windows)
    "calibrib.ttf",         # Calibri Bold
    "seguibl.ttf",          # Segoe UI Black
    "segoeuib.ttf",         # Segoe UI Bold
    "cambriab.ttf",
    "trebucbd.ttf",
]
font = None
for name in font_candidates:
    try:
        font = ImageFont.truetype(name, 700)
        break
    except OSError:
        continue
if font is None:
    font = ImageFont.load_default()

text = "V"
draw2 = ImageDraw.Draw(img)

# Measure and center
bbox = draw2.textbbox((0, 0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (SIZE - tw) / 2 - bbox[0]
y = (SIZE - th) / 2 - bbox[1]

# Subtle shadow
draw2.text((x + 6, y + 8), text, font=font, fill=(0, 0, 0, 60))
# White letter
draw2.text((x, y), text, font=font, fill=(255, 255, 255, 255))

# Save as RGB PNG (App Store requires no alpha channel on the icon)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
final = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
final.paste(img, mask=img.split()[3])
final.save(OUT, "PNG", optimize=False)
print(f"Wrote {OUT}")
