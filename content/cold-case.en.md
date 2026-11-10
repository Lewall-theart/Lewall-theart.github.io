---
title: Cold Case – Difference Steganography
date: '2026-03-15'
excerpt: >-
  Two noise-filled images with zero visible clues. The flag hides entirely within
  the differential amplitude between them.
featured: /thumbnails/cold-case.jpg
flag: 'psych{4lph4_ch4nn3l_d1d_th3_th1ng}'
tags:
  - Steganography
  - CTF
  - Difference
  - Python
---

> *"Two noise-filled images with zero visible clues. The flag hides entirely within the differential amplitude between them."*

---

## Challenge Brief

We are provided with two image files:

- `ward_a.png`
- `ward_b.png`

Opening them reveals what appears to be pure television static noise. No perceptible features, no suspicious metadata tags, and no overt hints.

![ward_a and ward_b side by side](/img/writeups/cold-case/step1_side_by_side.png)
*Both images appear virtually identical — but that subtle "virtually" holds the key.*

---

## Step 1: Differential Surface Analysis

When confronted with two noise images, the immediate question must be: **do pixel deltas exist?**

```python
from PIL import Image
import numpy as np

img_a = np.array(Image.open("ward_a.png"))
img_b = np.array(Image.open("ward_b.png"))

diff = img_a.astype(int) - img_b.astype(int)

print(f"Diff range  : {diff.min()} → {diff.max()}")
print(f"Pixels khác : {(diff != 0).any(axis=2).sum()} / {360*640}")
```

Execution Output:

```
Diff range  : -214 → 223
Pixels khác : 230155 / 230400
```

**99.9% of all pixels exhibit differences.** What does this signify?

- If the images were truly independent white noise samples, differences would disperse uniformly across channels.
- If one image was synthesized by embedding an arbitrary secret signal into the other, most pixels will shift, but the **delta amplitudes will correlate non-uniformly**.

This is the trademark of **Difference Steganography**: the covert communication channel is encoded within the *magnitude* of variance across frames.

---

## Step 2: Visualizing Variance & Signal Amplification

First, normalize the raw difference matrix into standard 0–255 pixel space:

```python
diff_normalized = ((diff + 255) / 2).astype(np.uint8)
Image.fromarray(diff_normalized).save("diff_normalized.png")
```

![Diff normalized](/img/writeups/cold-case/step2_diff_normalized.png)
*Normalized difference image — still predominantly noisy, but structural artifacts appear along the bottom edge.*

Next, **amplify** high-variance coordinates across color channels:

```python
from PIL import ImageEnhance

abs_max = np.abs(diff).max(axis=2).astype(np.float32)
amplified = np.clip(abs_max * 5, 0, 255).astype(np.uint8)

img_amp = Image.fromarray(amplified)
img_amp = ImageEnhance.Contrast(img_amp).enhance(3.0)
img_amp.save("amplified.png")
```

![Amplified diff](/img/writeups/cold-case/step3_amplified.png)
*5x amplification with contrast enhancement — text characters emerge at the bottom with faint silhouettes above.*

**Target acquired.** Legible glyphs emerge along the lower boundary.

---

## Step 3: Secret Injection Mechanics

The underlying embedding mechanism operates as follows:

```
B = A + secret * intensity_factor
```

Image regions containing secret payload data experience significantly higher delta magnitudes compared to baseline noise:

- Background (no secret): $|A[i,j] - B[i,j]|$ remains low (random noise variance)
- Secret payload region: $|A[i,j] - B[i,j]|$ exceeds baseline thresholds

**Extraction Strategy:** Apply a threshold cutoff against $|A - B|$ to isolate only pixels exhibiting statistically significant deviations.

```
mask = |A - B|.max(across channels) > threshold
```

---

## Step 4: Sweep Threshold Values

```python
thresholds = [10, 30, 50, 70, 100]

for t in thresholds:
    mask = (abs_max > t).astype(np.uint8) * 255
    count = (abs_max > t).sum()
    print(f"Thresh {t:>3}: {count:>7} pixels  ({count/abs_max.size*100:.1f}%)")
    Image.fromarray(mask).save(f"thresh_{t}.png")
```

```
Thresh  10: 198432 pixels  (86.1%)
Thresh  30:  45234 pixels  (19.6%)
Thresh  50:   8823 pixels  ( 3.8%)
Thresh  70:   3201 pixels  ( 1.4%)
Thresh 100:   1132 pixels  ( 0.5%)
```

Threshold 30 — retains background clutter:

![Threshold 30](/img/writeups/cold-case/step4_thresh30.png)

Threshold 50 — clean separation, text glyphs fully formed:

![Threshold 50](/img/writeups/cold-case/step5_thresh50.png)

*Threshold 50 serves as the optimal sweet spot: background noise is eliminated while preserving character stroke continuity.*

---

## Step 5: Isolating & Extracting the Flag

Crop the region containing the glyphs and scale via nearest-neighbor interpolation:

```python
# Crop text bounding box and magnify 4x
text_region = mask[285:358, 0:640]
flag_img = Image.fromarray(text_region).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
)
flag_img.save("flag_zoom.png")
```

![Flag zoomed in](/img/writeups/cold-case/step6_flag_zoom.png)

Tightening the threshold to 60 for cleaner edges:

```python
t60 = (abs_max > 60).astype(np.uint8) * 255
clean_text = t60[285:358, 0:640]
Image.fromarray(clean_text).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
).save("flag_clean.png")
```

![Flag clean](/img/writeups/cold-case/step7_flag_clean.png)

---

## Recovered Flag

Transcribing glyphs with leetspeak substitutions:

| Plain Glyph | Leet Representation |
|-------------|---------------------|
| `a`         | `4`                 |
| `e`         | `3`                 |
| `i`         | `1`                 |

```
psych{4lph4_ch4nn3l_d1d_th3_th1ng}
```

---

## Complete Solver Script

```python
#!/usr/bin/env python3
"""
Difference Steganography Solver
Usage: python solve.py ward_a.png ward_b.png
"""
import sys
import numpy as np
from PIL import Image, ImageEnhance


def solve(path_a: str, path_b: str, out: str = "output") -> None:
    img_a = np.array(Image.open(path_a))
    img_b = np.array(Image.open(path_b))

    if img_a.shape != img_b.shape:
        print(f"[!] Size mismatch: {img_a.shape} vs {img_b.shape}")
        sys.exit(1)

    print(f"[+] Size: {img_a.shape[1]}x{img_a.shape[0]}")

    diff     = img_a.astype(int) - img_b.astype(int)
    abs_max  = np.abs(diff).max(axis=2).astype(np.float32)

    print(f"[+] Diff range : {int(diff.min())} → {int(diff.max())}")
    print(f"[+] Pixels diff: {(abs_max > 0).sum()} / {abs_max.size}")

    # --- 1. Normalized diff ---
    diff_norm = ((diff + 255) / 2).astype(np.uint8)
    Image.fromarray(diff_norm).save(f"{out}_diff.png")

    # --- 2. Amplified ---
    amp = np.clip(abs_max * 5, 0, 255).astype(np.uint8)
    img_amp = ImageEnhance.Contrast(Image.fromarray(amp)).enhance(3.0)
    img_amp.save(f"{out}_amplified.png")

    # --- 3. Threshold masks ---
    for t in [30, 50, 60, 70, 100]:
        mask = (abs_max > t).astype(np.uint8) * 255
        Image.fromarray(mask).save(f"{out}_thresh_{t}.png")
        print(f"[+] Thresh {t:>3}: {(abs_max > t).sum():>7} px")

    # --- 4. Optimal mask extraction ---
    best = (abs_max > 50).astype(np.uint8) * 255
    h, w = best.shape
    best_zoom = Image.fromarray(best).resize((w * 4, h * 4), Image.NEAREST)
    best_zoom.save(f"{out}_BEST.png")

    print(f"\n[+] Success! Inspect {out}_BEST.png to read the flag.")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python solve.py <image_a> <image_b> [output_prefix]")
        sys.exit(1)

    solve(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "output")
```

---

## Key Takeaways

Difference Steganography represents an effective evasion technique because:

1. **Imperceptible to human inspection** — both image sources resemble pure white noise.
2. **Devoid of metadata artifacts** — tools like `binwalk`, `strings`, or `exiftool` produce zero meaningful hits.
3. **Information resides in amplitude variance** rather than pixel values — the analyst must evaluate *delta magnitudes* rather than static pixel coordinates.

Whenever paired noise images appear in forensics challenges:
- Compute $|A - B|$ immediately.
- Sweep binary thresholds systematically across differential arrays.
- Magnify isolated bounding boxes via nearest-neighbor interpolation.
