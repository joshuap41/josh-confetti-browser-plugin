#!/usr/bin/env python3
"""
Generates icons/icon16.png, icon32.png, icon48.png, icon128.png
as the party-popper emoji using Pillow + Apple Color Emoji.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

EMOJI = "\U0001F389"  # 🎉

# macOS ships Apple Color Emoji at this path
APPLE_EMOJI_FONT = "/System/Library/Fonts/Apple Color Emoji.ttc"

# Apple Color Emoji is a bitmap font that only supports specific pixel sizes
VALID_SIZES = [20, 32, 40, 48, 64, 96, 160]


def nearest_valid_size(target: int) -> int:
    """Return the smallest valid size >= target, or the largest available."""
    for s in VALID_SIZES:
        if s >= target:
            return s
    return VALID_SIZES[-1]


def make_icon(size: int) -> Image.Image:
    render_size = nearest_valid_size(size)
    img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(APPLE_EMOJI_FONT, size=render_size)
    draw.text((0, 0), EMOJI, font=font, embedded_color=True)
    if render_size != size:
        img = img.resize((size, size), Image.LANCZOS)
    return img


def main():
    for size in (16, 32, 48, 128):
        img = make_icon(size)
        path = os.path.join(OUT_DIR, f"icon{size}.png")
        img.save(path)
        print(f"  wrote {path}  ({size}\xd7{size})")


if __name__ == "__main__":
    print("Generating \U0001F389 icons \u2026")
    main()
    print("Done!")
