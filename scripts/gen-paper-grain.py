"""Generates src/assets/paper-grain.png: a seamless paper texture (grayscale).
Optional tool; the PNG is committed. Needs numpy + Pillow:
    python3 scripts/gen-paper-grain.py
The image is meant to be used with `background-blend-mode: multiply` on top of
a paper color, so near-white = no change and darker specks = grain.
"""
import numpy as np
from PIL import Image

N = 256
rng = np.random.default_rng(7)


def blur_noise(sigma):
    """Seamless low-pass noise (FFT blur wraps around, so it tiles)."""
    f = np.fft.fft2(rng.standard_normal((N, N)))
    fy = np.fft.fftfreq(N)[:, None]
    fx = np.fft.fftfreq(N)[None, :]
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    out = np.real(np.fft.ifft2(f * g))
    return (out - out.mean()) / out.std()


fine = rng.standard_normal((N, N))      # per-pixel grain
mid = blur_noise(1.6)                   # small clumps
blotch = blur_noise(10)                 # soft mottling
cloud = blur_noise(32)                  # very broad unevenness

fibers = np.zeros((N, N))
for _ in range(260):                    # short curved fibers, wrapping at the edges
    x, y = rng.uniform(0, N, 2)
    ang = rng.uniform(0, np.pi)
    length = rng.uniform(5, 18)
    curl = rng.normal(0, 0.06)
    shade = rng.choice([-1, 1]) * rng.uniform(0.5, 1)
    for s in range(int(length)):
        fibers[int(y) % N, int(x) % N] += shade
        ang += curl
        x += np.cos(ang)
        y += np.sin(ang)

v = 0.40 * fine + 0.45 * mid + 0.45 * blotch + 0.30 * cloud + 0.35 * fibers
v = (v - v.mean()) / v.std()
# multiply texture: mostly near-white, darker where v is low
dark = np.clip(-v * 0.55 + 0.35, 0, None) * 11 + np.clip(v, 0, None) * 2
img = np.clip(255 - dark, 225, 255)
img = (np.round(img / 3) * 3).astype(np.uint8)   # fewer gray levels = smaller file
Image.fromarray(img, "L").save("src/assets/paper-grain.png", optimize=True)
print("wrote src/assets/paper-grain.png, mean", img.mean().round(1))
