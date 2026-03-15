---
title: "Cold Case – Difference Steganography"
description: "Hai tấm ảnh nhiễu. Không có gì để nhìn. Và một flag ẩn trong khoảng cách giữa chúng."
date: 2026-03-15
category: Steganography
catColor: purple
difficulty: beginner
tags: [CTF, Steganography, Difference, Python]
readTime: 10
event: "PsychCTF"
flag: "psych{4lph4_ch4nn3l_d1d_th3_th1ng}"
---

> *"Hai tấm ảnh nhiễu. Không có gì để nhìn. Và một flag ẩn trong khoảng cách giữa chúng."*

---

## 🧩 Đề bài

Chúng ta được cho hai file ảnh:

- `ward_a.png`
- `ward_b.png`

Mở ra — cả hai trông như tĩnh điện TV lúc mất sóng. Toàn bộ là noise ngẫu nhiên, không có gì để nhìn bằng mắt thường. Không có metadata, không có hint.

![ward_a và ward_b đặt cạnh nhau](/img/writeups/cold-case/step1_side_by_side.png)
*Hai ảnh trông gần như giống hệt nhau — nhưng "gần như" chính là manh mối.*

---

## 🔍 Bước 1: Nhận diện vấn đề

Khi gặp hai ảnh noise, câu hỏi đầu tiên luôn là: **chúng có khác nhau không?**

```python
from PIL import Image
import numpy as np

img_a = np.array(Image.open("ward_a.png"))
img_b = np.array(Image.open("ward_b.png"))

diff = img_a.astype(int) - img_b.astype(int)

print(f"Diff range  : {diff.min()} → {diff.max()}")
print(f"Pixels khác : {(diff != 0).any(axis=2).sum()} / {360*640}")
```

```
Diff range  : -214 → 223
Pixels khác : 230155 / 230400
```

**99.9% pixel đều khác nhau.** Điều đó có nghĩa gì?

- Nếu hai ảnh là noise hoàn toàn độc lập → sự khác biệt sẽ phân bố đều, random.
- Nhưng nếu một ảnh được tạo ra từ ảnh kia bằng cách *cộng thêm một tín hiệu bí mật* → phần lớn pixel sẽ khác nhau, nhưng **biên độ khác nhau sẽ không đều**.

Đây là dấu hiệu của **Difference Steganography**: thông điệp ẩn được encode trong *mức độ* khác biệt giữa hai ảnh, không phải trong bản thân ảnh.

---

## 🔬 Bước 2: Khám phá cấu trúc của sự khác biệt

Trước tiên, hãy nhìn vào diff dưới dạng ảnh — chuẩn hóa về range 0–255:

```python
diff_normalized = ((diff + 255) / 2).astype(np.uint8)
Image.fromarray(diff_normalized).save("diff_normalized.png")
```

![Diff normalized](/img/writeups/cold-case/step2_diff_normalized.png)
*Ảnh diff được chuẩn hóa — trông vẫn như noise, nhưng có gì đó ẩn ở góc dưới.*

Vẫn trông như noise — nhưng chú ý kỹ vùng phía dưới. Có dấu hiệu của cấu trúc.

Hãy **khuếch đại** tín hiệu lên:

```python
from PIL import ImageEnhance

abs_max = np.abs(diff).max(axis=2).astype(np.float32)
amplified = np.clip(abs_max * 5, 0, 255).astype(np.uint8)

img_amp = Image.fromarray(amplified)
img_amp = ImageEnhance.Contrast(img_amp).enhance(3.0)
img_amp.save("amplified.png")
```

![Amplified diff](/img/writeups/cold-case/step3_amplified.png)
*Khuếch đại 5x — bắt đầu thấy text ở phía dưới và hình ảnh mờ ở trên.*

**Bingo.** Có text ở góc dưới trái. Và phía trên có vẻ như một hình ảnh bị ẩn. Đây rõ ràng là tín hiệu có chủ đích.

---

## ⚡ Bước 3: Hiểu cơ chế ẩn

Technique ở đây hoạt động như sau:

```
B = A + secret * intensity_factor
```

Những vùng thuộc về "secret image" được thêm/bớt một lượng lớn hơn so với background noise. Vì vậy:

- Nền (không có secret): `|A[i,j] - B[i,j]|` nhỏ (~random noise)
- Vùng có secret: `|A[i,j] - B[i,j]|` lớn hơn đáng kể

**Ý tưởng giải:** Dùng ngưỡng (threshold) trên `|diff|` để lọc ra chỉ những pixel "khác nhau đáng kể".

```
mask = |A - B|.max(across channels) > threshold
```

---

## 🎯 Bước 4: Tìm threshold phù hợp

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

Threshold 30 — còn nhiều noise:

![Threshold 30](/img/writeups/cold-case/step4_thresh30.png)

Threshold 50 — sạch hơn nhiều, text bắt đầu rõ:

![Threshold 50](/img/writeups/cold-case/step5_thresh50.png)

*Threshold 50 là "điểm ngọt" — đủ sạch để đọc text, đủ nhiều pixel để không mất nét.*

---

## 🔎 Bước 5: Zoom vào flag

Phóng to vùng chứa text (phần dưới của ảnh):

```python
# Crop vùng text + phóng to 4x
text_region = mask[285:358, 0:640]
flag_img = Image.fromarray(text_region).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
)
flag_img.save("flag_zoom.png")
```

![Flag zoomed in](/img/writeups/cold-case/step6_flag_zoom.png)

```python
# Threshold cao hơn cho ảnh sạch hơn
t60 = (abs_max > 60).astype(np.uint8) * 255
clean_text = t60[285:358, 0:640]
Image.fromarray(clean_text).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
).save("flag_clean.png")
```

![Flag clean](/img/writeups/cold-case/step7_flag_clean.png)

---

## 🏁 Flag

Đọc từng ký tự từ ảnh — chú ý đây là **leet speak**:

| Ký tự gốc | Leet |
|-----------|------|
| `a`       | `4`  |
| `e`       | `3`  |
| `i`       | `1`  |

```
psych{4lph4_ch4nn3l_d1d_th3_th1ng}
```

---

## 🛠️ Full Script

Đây là toàn bộ solver, chạy một lệnh ra kết quả:

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

    # --- 4. BEST: thresh 50, zoomed ---
    best = (abs_max > 50).astype(np.uint8) * 255
    h, w = best.shape
    best_zoom = Image.fromarray(best).resize((w * 4, h * 4), Image.NEAREST)
    best_zoom.save(f"{out}_BEST.png")

    print(f"\n[✓] Done! Open {out}_BEST.png to read the flag.")
    print( "[✓] If text is unclear, try _thresh_30.png (more pixels) or _thresh_70.png (cleaner).")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python solve.py <image_a> <image_b> [output_prefix]")
        sys.exit(1)

    solve(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "output")
```

```bash
pip install pillow numpy
python solve.py ward_a.png ward_b.png result
# → Mở result_BEST.png
```

---

## 💡 Takeaway

Difference Steganography là một kỹ thuật tinh tế vì:

1. **Mắt thường không thể phát hiện** — cả hai ảnh đều trông như noise hoàn toàn.
2. **Không có metadata** — không có gì để binwalk, strings, hay exiftool tìm thấy.
3. **Chìa khóa là biên độ**, không phải nội dung — bạn phải nghĩ về *mức độ khác nhau*, không phải *nơi khác nhau*.

Khi gặp hai ảnh noise trong một CTF:
- Luôn tính `|A - B|` ngay từ đầu
- Thử nhiều ngưỡng khác nhau
- Phóng to vùng nghi ngờ
- Đừng quên **leet speak** khi đọc flag 😄

---

*Challenge: Cold Case | Category: Steganography | Flag: `psych{4lph4_ch4nn3l_d1d_th3_th1ng}`*
