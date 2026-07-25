"""Generate Mframapa app icons from website/public/favicon.svg (raincloud mark).

Raster master: website/public/og-icon.png (512) — same raincloud on white.
SVG favicons are copied from website/public/favicon.svg.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WEBSITE_SVG = ROOT / "website" / "public" / "favicon.svg"
WEBSITE_MASTER = ROOT / "website" / "public" / "og-icon.png"

PWA_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
MOBILE_SIZE = 1024


def draw_icon(size: int, *, padding_ratio: float = 0.0) -> Image.Image:
    """Scale the website raincloud master onto a white square."""
    master = Image.open(WEBSITE_MASTER).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    if padding_ratio > 0:
        inner = max(1, int(round(size * (1 - 2 * padding_ratio))))
        mark = master.resize((inner, inner), Image.Resampling.LANCZOS)
        ox = (size - inner) // 2
        canvas.paste(mark, (ox, ox), mark)
    else:
        mark = master.resize((size, size), Image.Resampling.LANCZOS)
        canvas.paste(mark, (0, 0), mark)
    return canvas.convert("RGB")


def main() -> None:
    if not WEBSITE_SVG.is_file():
        raise SystemExit(f"missing brand SVG: {WEBSITE_SVG}")
    if not WEBSITE_MASTER.is_file():
        raise SystemExit(f"missing brand PNG: {WEBSITE_MASTER}")

    svg_text = WEBSITE_SVG.read_text(encoding="utf-8")

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
    fav.write_text(svg_text, encoding="utf-8")
    print("wrote", fav.relative_to(ROOT))

    # Keep email mark in sync (raincloud only, transparent-friendly via master)
    email = ROOT / "frontend-pwa" / "public" / "email-logo.png"
    Image.open(WEBSITE_MASTER).convert("RGBA").resize((128, 128), Image.Resampling.LANCZOS).save(
        email, "PNG", optimize=True
    )
    print("wrote", email.relative_to(ROOT))

    mobile_assets = ROOT / "mobile" / "assets"
    mobile_assets.mkdir(parents=True, exist_ok=True)
    draw_icon(MOBILE_SIZE).save(mobile_assets / "icon.png", "PNG", optimize=True)
    draw_icon(MOBILE_SIZE, padding_ratio=0.08).save(
        mobile_assets / "adaptive-icon.png", "PNG", optimize=True
    )
    draw_icon(MOBILE_SIZE, padding_ratio=0.18).save(mobile_assets / "splash.png", "PNG", optimize=True)

    mobile_fav = ROOT / "mobile" / "favicon.svg"
    mobile_fav.write_text(svg_text, encoding="utf-8")
    print("wrote", mobile_fav.relative_to(ROOT))
    print("wrote mobile/assets/icon.png + adaptive-icon.png + splash.png")

    # Mirror SVG into a shared brand path for docs/scripts
    brand_dir = ROOT / "assets" / "brand"
    brand_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(WEBSITE_SVG, brand_dir / "raincloud.svg")
    print("wrote", (brand_dir / "raincloud.svg").relative_to(ROOT))


if __name__ == "__main__":
    main()
