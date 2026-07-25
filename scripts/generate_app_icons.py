"""Generate Mframapa app icons: teal raindrop on white (no wordmark)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND = (0, 200, 150)  # #00C896
WHITE = (255, 255, 255)

PWA_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
MOBILE_SIZE = 1024

# Smooth raindrop path in a 0..1 design box (tip up, body down).
# Scaled into the icon with padding.
DROP_NORM = [
    (0.50, 0.08),
    (0.62, 0.22),
    (0.74, 0.38),
    (0.82, 0.52),
    (0.84, 0.64),
    (0.80, 0.76),
    (0.70, 0.86),
    (0.50, 0.92),
    (0.30, 0.86),
    (0.20, 0.76),
    (0.16, 0.64),
    (0.18, 0.52),
    (0.26, 0.38),
    (0.38, 0.22),
]


def draw_icon(size: int, *, padding_ratio: float = 0.16) -> Image.Image:
    img = Image.new("RGB", (size, size), WHITE)
    draw = ImageDraw.Draw(img)
    pad = size * padding_ratio
    box = size - 2 * pad
    pts = [(pad + x * box, pad + y * box) for x, y in DROP_NORM]
    draw.polygon(pts, fill=BRAND)
    # Subtle highlight
    if size >= 96:
        hx = pad + 0.40 * box
        hy = pad + 0.55 * box
        hr = 0.08 * box
        overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 255, 255, 55))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img


FAVICON_SVG = """\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FFFFFF"/>
  <path fill="#00C896" d="M256 48c40 72 112 152 112 248a112 112 0 0 1-224 0c0-96 72-176 112-248z"/>
</svg>
"""


def main() -> None:
    pwa_icons = ROOT / "frontend-pwa" / "public" / "icons"
    pwa_icons.mkdir(parents=True, exist_ok=True)
    for s in PWA_SIZES:
        out = pwa_icons / f"icon-{s}.png"
        draw_icon(s).save(out, "PNG", optimize=True)
        print("wrote", out.relative_to(ROOT))

    apple = pwa_icons / "apple-touch-icon.png"
    draw_icon(180).save(apple, "PNG", optimize=True)
    print("wrote", apple.relative_to(ROOT))

    fav = ROOT / "frontend-pwa" / "public" / "favicon.svg"
    fav.write_text(FAVICON_SVG, encoding="utf-8")
    print("wrote", fav.relative_to(ROOT))

    mobile_assets = ROOT / "mobile" / "assets"
    mobile_assets.mkdir(parents=True, exist_ok=True)
    draw_icon(MOBILE_SIZE, padding_ratio=0.18).save(mobile_assets / "icon.png", "PNG", optimize=True)
    draw_icon(MOBILE_SIZE, padding_ratio=0.26).save(
        mobile_assets / "adaptive-icon.png", "PNG", optimize=True
    )
    mobile_fav = ROOT / "mobile" / "favicon.svg"
    if mobile_fav.parent.exists():
        mobile_fav.write_text(FAVICON_SVG, encoding="utf-8")
        print("wrote", mobile_fav.relative_to(ROOT))
    print("wrote mobile/assets/icon.png + adaptive-icon.png")


if __name__ == "__main__":
    main()
