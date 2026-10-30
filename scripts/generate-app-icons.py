"""Generate platform PNG icons from the *existing* official AutonoService SVG.

This is a deterministic asset generation step, not a redesign.
Dependencies for developers: pip install cairosvg pillow
"""
from pathlib import Path
from io import BytesIO

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/app/icon.svg"
OUTPUTS = {
    ROOT / "src/app/apple-icon.png": 180,
    ROOT / "public/apple-touch-icon.png": 180,
    ROOT / "public/icons/autonoservice-192.png": 192,
    ROOT / "public/icons/autonoservice-512.png": 512,
}

for path, size in OUTPUTS.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    rendered = cairosvg.svg2png(url=str(SOURCE), output_width=size, output_height=size)
    image = Image.open(BytesIO(rendered)).convert("RGBA")
    # Fully opaque icon backgrounds display predictably on Safari and Android.
    canvas = Image.new("RGBA", (size, size), "#FFFFFF")
    canvas.alpha_composite(image)
    canvas.convert("RGB").save(path, format="PNG", optimize=True)
    assert Image.open(path).size == (size, size)
    print(f"Generated {path.relative_to(ROOT)}: {size}x{size}")
