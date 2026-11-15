"""Cuts the bride (Petit Courrier des Dames, 1828, Rijksmuseum, CC0) and the groom
(Journal des Tailleurs, 1848, The Met, CC0) out of their fashion plates with GrabCut,
divides out the paper tone, and saves transparent PNGs used on the opening page.
Run: python3 art/couple.py  ->  art/out/bride.png, art/out/groom.png
"""
import os
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, 'src'), os.path.join(HERE, 'out')

# crop (fractions of the plate), then extra "definitely background" bands inside the crop
FIGS = {
    'bride': {'crop': (0.335, 0.095, 0.845, 0.862), 'bg': [(0.0, 0.25, 0.10, 1.0)],
              'fg': [(0.30, 0.02, 0.62, 0.22), (0.22, 0.22, 0.80, 0.40)]},
    'groom': {'crop': (0.635, 0.165, 0.885, 0.815), 'bg': [(0.0, 0.25, 0.035, 0.75)],
              'fg': [(0.42, 0.04, 0.70, 0.14), (0.30, 0.14, 0.75, 0.30)]},
}


def cut(name, cfg, height=1500):
    im = cv2.imread(os.path.join(SRC, name + '.jpg'))
    H, W = im.shape[:2]
    l, t, r, b = cfg['crop']
    im = im[int(t * H):int(b * H), int(l * W):int(r * W)]
    k = height / im.shape[0]
    im = cv2.resize(im, (int(im.shape[1] * k), height), interpolation=cv2.INTER_AREA)
    h, w = im.shape[:2]

    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    m = int(w * 0.02)
    mask[:, :m] = mask[:, -m:] = cv2.GC_BGD
    mask[:int(h * 0.01), :] = cv2.GC_BGD
    # likely figure: a central column
    mask[int(h * .05):int(h * .97), int(w * .18):int(w * .82)] = cv2.GC_PR_FGD
    mask[int(h * .3):int(h * .9), int(w * .4):int(w * .6)] = cv2.GC_FGD
    for (x0, y0, x1, y1) in cfg.get('fg', []):
        mask[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = cv2.GC_FGD
    for (x0, y0, x1, y1) in cfg['bg']:
        mask[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = cv2.GC_BGD
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(im, mask, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # keep the largest connected shape, fill holes, soften the edge
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        fg = np.where(lab == big, 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    alpha = cv2.GaussianBlur(fg, (5, 5), 0)

    # divide out the paper tone so whites read as white
    paper = np.median(im[mask == cv2.GC_BGD].reshape(-1, 3), axis=0)
    rgb = np.clip(im.astype(np.float32) / np.maximum(paper, 1) * 255, 0, 255).astype(np.uint8)
    # white paper becomes transparent (color-to-alpha), so the engraving sits on any page tint
    c = rgb.astype(np.float32) / 255
    a2 = np.clip((1 - c).max(axis=2) * 1.15, 0, 1)
    if name == 'groom':  # the bluish-grey floor between the legs
        bgr = im.astype(np.int16)
        floor = bgr.mean(axis=2) > 120   # below the coat everything light is floor, not suit
        floor[: int(h * .62)] = False
        a2[floor] = 0
    out_a = (alpha.astype(np.float32) / 255) * a2
    safe = np.maximum(out_a, 1e-4)[..., None]
    col = np.clip((c - (1 - out_a[..., None])) / safe, 0, 1)
    col = np.where(out_a[..., None] > 0.02, col, 0)
    rgba = np.dstack([(col * 255).astype(np.uint8), (out_a * 255).astype(np.uint8)])
    ys, xs = np.nonzero(rgba[..., 3] > 10)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA)).save(os.path.join(OUT, name + '.png'), optimize=True)
    print('✓', name, rgba.shape[1], 'x', rgba.shape[0])


for k, v in FIGS.items():
    cut(k, v)
