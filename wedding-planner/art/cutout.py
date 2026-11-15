"""Turns the public-domain botanical paintings into clean artwork on pure white
(the paper tone and stains are divided out), cropped to the plant.
Saved as transparent PNGs so they sit on any page color in every PDF viewer.
Run: python3 art/cutout.py  ->  art/out/*.png
"""
import os, json
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, 'src'), os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# crop boxes as fractions (left, top, right, bottom) to drop plate borders and inscriptions
CROPS = {
    'rose': (0.08, 0.03, 0.97, 0.84),
    'poppy': (0.06, 0.02, 0.96, 0.97),
    'columbine': (0.08, 0.05, 0.92, 0.885),
    'crown-imperial': (0.08, 0.03, 0.92, 0.84),
    'sweet-pea': (0.09, 0.06, 0.91, 0.92),
    'gloriosa': (0.13, 0.08, 0.90, 0.92),
    'tulips': (0.05, 0.06, 0.97, 0.82),
    'star-flower': (0.08, 0.04, 0.92, 0.93),
    'erica': (0.2, 0.09, 0.84, 0.86),
    'fritillaries': (0.13, 0.09, 0.89, 0.86),
}


def paper_surface(a):
    """Fit a smooth 2nd-order surface to the paper so stains and gradients divide out."""
    h, w, _ = a.shape
    lum = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    ref = np.median(a[(lum > np.percentile(lum, 55)) & (sat < np.percentile(sat, 50))], axis=0)
    dist = np.abs(a - ref).sum(axis=2)
    mask = (dist < 45) & (sat < np.percentile(sat, 60))
    ys, xs = np.nonzero(mask)
    sel = np.random.default_rng(0).choice(len(ys), min(40000, len(ys)), replace=False)
    yi, xi = ys[sel], xs[sel]
    ys, xs = yi / h, xi / w
    A = np.stack([np.ones_like(xs), xs, ys, xs * ys, xs**2, ys**2], 1)
    gy, gx = np.mgrid[0:h, 0:w]
    gy, gx = gy / h, gx / w
    G = np.stack([np.ones_like(gx), gx, gy, gx * gy, gx**2, gy**2], -1)
    bg = np.zeros_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, a[yi, xi, c], rcond=None)
        bg[..., c] = G @ coef
    return bg


credits = json.load(open(os.path.join(SRC, 'CREDITS.json')))
for name, box in CROPS.items():
    im = Image.open(os.path.join(SRC, name + '.jpg')).convert('RGB')
    W, H = im.size
    im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    scale = 1800 / max(im.size)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    bg = paper_surface(a)
    n = np.clip(a / np.maximum(bg, 1) * 255, 0, 255)
    # lift near-white to pure white (kills paper texture), keep the paint
    lum = n.mean(axis=2, keepdims=True)
    t = np.clip((lum - 195) / 40, 0, 1)
    n = n * (1 - t) + 255 * t
    out = Image.fromarray(n.astype(np.uint8))
    # trim to content
    m = (255 - np.asarray(out.convert('L'))) > 18
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    ys, xs = np.nonzero(m)
    pad = 20
    out = out.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, out.width), min(ys.max() + pad, out.height)))
    # color-to-alpha against white: exact on white, natural on any tinted page
    if max(out.size) > 1150:
        k = 1150 / max(out.size)
        out = out.resize((int(out.width * k), int(out.height * k)), Image.LANCZOS)
    c = np.asarray(out).astype(np.float32) / 255
    alpha = np.clip((1 - c).max(axis=2), 0, 1)
    alpha = np.where(alpha < 0.035, 0, alpha)
    rgb = np.where(alpha[..., None] > 0, (c - (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-4), 0)
    rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
    Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, name + '.png'), optimize=True)
    small = Image.open(os.path.join(OUT, name + '.png'))
    small.thumbnail((260, 260), Image.LANCZOS)
    small.save(os.path.join(OUT, name + '-sm.png'), optimize=True)
    print('✓', name, out.size)
