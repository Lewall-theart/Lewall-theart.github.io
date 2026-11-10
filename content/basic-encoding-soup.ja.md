---
title: Basic Encoding Soup
date: '2026-03-10'
excerpt: >-
  3層に重なり合う難読化の皮膜——Hex、Base64、そしてROT13。高度な数学は不要であり、
  求められるのはエンコードの痕跡を捉える確かな観察眼だ。
flag: 'HackForely{hex_b64_rot13_classic}'
tags:
  - Crypto
  - Hex
  - Base64
  - ROT13
  - Encoding
featured: /thumbnails/color-soup.jpg
---

本問には難解な数学的理論は一切登場しない。RSAの素因数分解も、AESのブロックモード解析も、楕円曲線の離散対数問題も存在しない。単に **3層のエンコードが順に重ねられているだけ** であり、求められるのはそれらを正しい順序で剥ぎ取ることだ。

試されているのは、CTFにおける極めて根源的でありながら極めて重要なスキル——**肉眼によるエンコード形式の即時識別** だ。熟練したリバースエンジニアやセキュリティ研究者は、CyberChefなどのツールに頼る前に、文字列のパターンから対象の正体を看破する。

> *"いかなる秘密も必ず痕跡を残す——何を探すべきかを知ってさえいれば。"*

## 問題の暗号文 (Ciphertext)

```text
5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d
```

## 初期観察とシグネチャの特定

コードを書き始める前に、まず文字列全体を**丹念に観察**する。

| 観察される特徴 | 暗号・エンコードの示唆 |
|---|---|
| `0–9` および `a–f` のみで構成 | → 16進数（Hex）表現 |
| Hexデコード後、末尾に `=` が存在 | → Base64 のパディング文字 |
| Base64デコード後、波括弧 `{}` を含むが意味不明な英字 | → ROT13 または シーザー暗号 |

3つのシグネチャから、3段階の解読ステップが導出される。

## ステップ 1 — Hex デコード

Hex（16進数）はバイト列を2桁の16進文字で表す方式だ（2文字 = 1バイト）。88文字の文字列は44バイトの生データに変換される。

```python
ciphertext = "5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
```

末尾の `=` は偶然ではない。これは **Base64 パディング** であり、次のレイヤーがBase64であることを物語っている。

## ステップ 2 — Base64 デコード

Base64はバイナリデータを64種類のASCII文字で表現するエンコード方式だ。入力データのバイト長が3の倍数でない場合、末尾にパディング `=` が付与される。

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# UnpxSbetry{urk_o64_ebgMT3_pynffvph}
```

ここで波括弧 `{}` が現れた。これは間違いなく **フラグのフォーマット** だ。接頭辞の `UnpxSbetry` に着目すると、`U→H`, `n→a`, `p→c`, `x→k`... という規則性が見える。典型的な **ROT13** のパターンだ。

## ステップ 3 — ROT13 デコード

ROT13はアルファベットをちょうど **13文字ローテーション** させるシーザー暗号の特殊形だ。英アルファベットは26文字であるため、ROT13は対合（*involution*）の特性を持ち、2回適用すれば元の平文に戻る。数字や記号は変換されない。

```python
import codecs

step3 = codecs.decode(step2, 'rot_13')
print(step3)
# HackForely{hex_b64_rot13_classic}
```

## 完全なソルバースクリプト (Python)

```python
import codecs, base64

ciphertext = "5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d"

step1 = bytes.fromhex(ciphertext).decode()
step2 = base64.b64decode(step1).decode()
step3 = codecs.decode(step2, 'rot_13')

print(f"[Hex]    → {step1}")
print(f"[Base64] → {step2}")
print(f"[ROT13]  → {step3}")
```

実行結果:

```text
[Hex]    → VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
[Base64] → UnpxSbetry{urk_o64_ebgMT3_pynffvph}
[ROT13]  → HackForely{hex_b64_rot13_classic}
```

## デコードチェーンの全体像

```text
5657357765464e69...3d        ← Hex (16進数)
        ↓  bytes.fromhex()
VW5weFNiZXRye3Vya19v...cH0=  ← Base64
        ↓  base64.b64decode()
UnpxSbetry{urk_o64_ebgMT3_pynffvph}  ← ROT13
        ↓  codecs.decode('rot_13')
HackForely{hex_b64_rot13_classic}    ← FLAG
```

## 得られた教訓

### エンコード（Encoding） $\neq$ 暗号化（Encryption）

初心者プレイヤーが最も混同しやすい重要な原則だ。

- **エンコード**（Hex, Base64, ROT13）は秘密鍵を持たず、機密性を担保しない。目的はデータの安全な伝送やデータ表現の規格化にある。
- **暗号化**（AES, RSA, ChaCha20）は秘密鍵に基づき、数学的な計算困難性によって機密性を保証する。

Base64でデータを「保護」することは、玄関ドアを施錠した上でその鍵を足元のマットの下に置くのと同義である。

### 即時判別のチートシート

| パターン | エンコード形式 |
|---|---|
| `[0-9a-f]+` (文字数が偶数) | 16進数 (Hex) |
| `[A-Za-z0-9+/]+=*` | Base64 |
| 英文字のみで構成された不自然な文字列 | ROT / シーザー暗号 |
| `%XX` の連続 | URL / パーセントエンコード |
| `\u0041\u0042...` | Unicode エスケープ |

> *"隠蔽によるセキュリティ（Security through obscurity）は真のセキュリティではない。"*
