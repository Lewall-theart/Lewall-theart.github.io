---
title: Cold Case – Difference Steganography
date: '2026-03-15'
excerpt: >-
  ノイズで満ちた2枚の画像。肉眼では何の手掛かりも見当たらない。
  フラグは2画像間の微小な差分振幅の中に完全に潜伏していた。
featured: /thumbnails/cold-case.jpg
flag: 'psych{4lph4_ch4nn3l_d1d_th3_th1ng}'
tags:
  - Steganography
  - CTF
  - Difference
  - Python
---

> *"ノイズで満ちた2枚の画像。肉眼では何の手掛かりも見当たらない。フラグは2画像間の微小な差分振幅の中に完全に潜伏していた。"*

---

## 問題の概要

解析対象として2つのPNGファイルが提供される:

- `ward_a.png`
- `ward_b.png`

画像を開くと、アナログテレビの砂嵐（ホワイトノイズ）のような画面が広がる。目視で判別可能なオブジェクトはなく、Exif等のメタデータにもヒントは残されていない。

![並べられたward_aとward_b](/img/writeups/cold-case/step1_side_by_side.png)
*一見すると同一のノイズ画像に見える——しかし、その「ほぼ同じ」という点にこそ解法の糸口がある。*

---

## ステップ 1: 差分解析（Differential Surface Analysis）

ノイズ画像を複数渡された際、最初に行うべきアプローチは自明だ。**「両画像間にピクセル値の差異は存在するか？」**

```python
from PIL import Image
import numpy as np

img_a = np.array(Image.open("ward_a.png"))
img_b = np.array(Image.open("ward_b.png"))

diff = img_a.astype(int) - img_b.astype(int)

print(f"Diff range  : {diff.min()} → {diff.max()}")
print(f"Pixels khác : {(diff != 0).any(axis=2).sum()} / {360*640}")
```

実行結果:

```
Diff range  : -214 → 223
Pixels khác : 230155 / 230400
```

**全体の99.9%のピクセルで値が一致していない。** この結果は何を意味するのか？

- 完全に独立した乱数生成ノイズであれば、差分は空間的に一様かつランダムに分散する。
- 一方の画像に対し、*何らかの秘密信号を加算・減算して* もう一方の画像を作成した場合、全体的に値はズレるものの、**その変動幅（振幅）は特定領域で偏りを持つ**。

これこそが **差分ステガノグラフィ（Difference Steganography）** のシグネチャだ。データはピクセルの絶対値ではなく、画像間の*差異の大きさ*に埋め込まれている。

---

## ステップ 2: 差分可視化と信号増幅

まず、差分マトリクスを標準的な0〜255の範囲に正規化して可視化する:

```python
diff_normalized = ((diff + 255) / 2).astype(np.uint8)
Image.fromarray(diff_normalized).save("diff_normalized.png")
```

![正規化された差分](/img/writeups/cold-case/step2_diff_normalized.png)
*正規化された差分画像——全体的にはノイズに見えるが、下部領域に何らかの構造が確認できる。*

下部領域に何かが潜んでいる兆候がある。この微弱な信号を **増幅（Amplification）** してコントラストを引き上げる:

```python
from PIL import ImageEnhance

abs_max = np.abs(diff).max(axis=2).astype(np.float32)
amplified = np.clip(abs_max * 5, 0, 255).astype(np.uint8)

img_amp = Image.fromarray(amplified)
img_amp = ImageEnhance.Contrast(img_amp).enhance(3.0)
img_amp.save("amplified.png")
```

![増幅された差分画像](/img/writeups/cold-case/step3_amplified.png)
*5倍に増幅しコントラストを強調——下部にテキスト文字列の輪郭がはっきりと浮き上がった。*

左下部分に文字の並びが確認できる。意図的に埋め込まれた信号であることは明白だ。

---

## ステップ 3: 埋め込みメカニズムの特定

本手法の数理モデルは以下の通りだ:

```
B = A + secret * intensity_factor
```

秘密データが存在する座標では、背景ノイズと比較してピクセル値の変動振幅が統計的に大きくなる:

- 背景（データなし）: $|A[i,j] - B[i,j]|$ の値は小さい（微小ノイズ）
- ペイロード領域: $|A[i,j] - B[i,j]|$ の値が顕著に大きい

**解法のアプローチ:** 差分の絶対値 $|A - B|$ に対して適切な閾値（Threshold）を設定し、変動の大きいピクセルのみを二値マスクとして抽出する。

```
mask = |A - B|.max(across channels) > threshold
```

---

## ステップ 4: 閾値スイープ（Threshold Tuning）

最適な二値化閾値を探索する:

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

閾値 30 —— まだ背景ノイズが多く残っている:

![閾値 30](/img/writeups/cold-case/step4_thresh30.png)

閾値 50 —— ノイズが大幅に除去され、文字のストロークが鮮明になる:

![閾値 50](/img/writeups/cold-case/step5_thresh50.png)

*閾値50が最もバランスの良い「スイートスポット」だ。文字の欠損を防ぎつつ背景の乱数を遮断できている。*

---

## ステップ 5: フラグ文字のクロップと拡大

文字領域をクロップし、Nearest Neighbor補間により4倍に拡大する:

```python
text_region = mask[285:358, 0:640]
flag_img = Image.fromarray(text_region).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
)
flag_img.save("flag_zoom.png")
```

![拡大されたフラグ](/img/writeups/cold-case/step6_flag_zoom.png)

さらに閾値を60に引き上げてエッジをクリーンにする:

```python
t60 = (abs_max > 60).astype(np.uint8) * 255
clean_text = t60[285:358, 0:640]
Image.fromarray(clean_text).resize(
    (640 * 4, 73 * 4),
    Image.NEAREST
).save("flag_clean.png")
```

![クリーン化されたフラグ](/img/writeups/cold-case/step7_flag_clean.png)

---

## フラグの文字起こし

画像から文字を読み取る。リート表記（Leet speak）が用いられている点に留意する:

| 平文文字 | リート表記 |
|---|---|
| `a` | `4` |
| `e` | `3` |
| `i` | `1` |

```
psych{4lph4_ch4nn3l_d1d_th3_th1ng}
```

---

## 完全なソルバースクリプト (Python)

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

    # --- 1. 正規化差分 ---
    diff_norm = ((diff + 255) / 2).astype(np.uint8)
    Image.fromarray(diff_norm).save(f"{out}_diff.png")

    # --- 2. 信号増幅 ---
    amp = np.clip(abs_max * 5, 0, 255).astype(np.uint8)
    img_amp = ImageEnhance.Contrast(Image.fromarray(amp)).enhance(3.0)
    img_amp.save(f"{out}_amplified.png")

    # --- 3. 閾値スイープ ---
    for t in [30, 50, 60, 70, 100]:
        mask = (abs_max > t).astype(np.uint8) * 255
        Image.fromarray(mask).save(f"{out}_thresh_{t}.png")

    # --- 4. 最適閾値による拡大出力 ---
    best = (abs_max > 50).astype(np.uint8) * 255
    h, w = best.shape
    best_zoom = Image.fromarray(best).resize((w * 4, h * 4), Image.NEAREST)
    best_zoom.save(f"{out}_BEST.png")

    print(f"\n[+] 完了! {out}_BEST.png を開いてフラグを確認してください。")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python solve.py <image_a> <image_b> [output_prefix]")
        sys.exit(1)

    solve(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "output")
```

---

## 総括

差分ステガノグラフィは以下の理由から検知回避能力が極めて高い:

1. **目視による検知が不可能** —— 単体では2画像とも完全なノイズにしか見えない。
2. **メタデータに痕跡がない** —— `binwalk` や `strings`、`exiftool` では何も検出されない。
3. **振幅の大きさが鍵** —— ピクセル値のパターンではなく、差分の大きさという統計的指標に着目する必要がある。
