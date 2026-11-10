---
title: Escaped Reality
date: '2026-03-11'
excerpt: >-
  Webアプリケーションは特殊文字のエンコードを多用する——だがその適用順序が逆転したとき、
  暗号文は直感に反する不可解な姿を見せる。
flag: 'HackForge{url_encoding_escape_artist}'
tags:
  - Web
  - ROT13
  - Base64
  - URL-Encoding
  - Encoding
featured: /thumbnails/cute-cat-nature.jpg
---

問題名そのものが最大の手掛かりとなっている。**"Escaped Reality"**。このタイトルが示唆する通り、**エスケープ文字（Escaped Characters）**こそが本問の中核テーマだ。

> *"Web applications love to encode special characters. Sometimes the encoding gets applied in unexpected orders."*
> （Webアプリケーションは特殊文字をエンコードするのが大好きだ。時にそのエンコードは予期せぬ順序で適用される）

一見すると何の変哲もない問題文だが、最大のキーワードは **"unexpected orders（予期せぬ順序）"** にある。暗号化の適用順序が一般的な定石から意図的に外されていることを示唆している。

## 問題の暗号文 (Ciphertext)

```text
WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR
```

## パターンの見極め

暗号文を観察すると、英数字のみで構成され、Base64に見られるようなパディング文字 `=` や特殊記号は存在しない。外見は一見 **Base64** に酷似しているが、そのままデコードしても可読テキストではなく無意味なバイナリ列が返る。

これは古典的なシグネチャだ——**Base64の外側にさらに別のレイヤーが被せられている**。

問題名 *"escaped"* からパーセントエンコードを連想し、*"unexpected orders"* の警告を考慮する。通常の `Base64 → ROT` という順序ではなく、**`ROT → Base64`** の逆順パイプラインを疑うのが自然だ。

## ステップ 1 — ROT13

暗号文全体に対して、まずROT13を適用する:

```python
import codecs

ct = "WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR"

step1 = codecs.decode(ct, 'rot_13')
print(step1)
# JTQ4JTYxJTYzJTZCJTQ2JTZGJTcyJTY3JTY1JTdCJTc1JTcyJTZCJTVGJTY1...
```

変換後の文字列は大文字・小文字・数字がバランスよく現れ、Base64として極めて自然な文字列へと変化した。

## ステップ 2 — Base64 デコード

```python
import base64

step2 = base64.b64decode(step1 + '==').decode('ascii')
print(step2)
# %48%61%63%6B%46%6F%72%67%65%7B%75%72%6C%5F%65%6E%63%6F%64%69%6E%67%5F%65%73%63%61%70%65%5F%61%72%74%69%73%74%7D
```

`%48%61%63%6B...` —— **URLパーセントエンコード（URL Percent-Encoding）** だ。各 `%XX` は16進数表記の1バイトを表す。`%48` = `H`、`%61` = `a`、`%63` = `c`、`%6B` = `k`... **HackForge** というフラグの接頭辞がはっきりと姿を現した。

## ステップ 3 — URL デコード

```python
import urllib.parse

flag = urllib.parse.unquote(step2)
print(flag)
# HackForge{url_encoding_escape_artist}
```

## 完全なソルバースクリプト (Python)

```python
import codecs, base64, urllib.parse

ct = "WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR"

step1 = codecs.decode(ct, 'rot_13')
step2 = base64.b64decode(step1 + '==').decode('ascii')
step3 = urllib.parse.unquote(step2)

print(f"[ROT13]  → {step1[:40]}...")
print(f"[Base64] → {step2[:40]}...")
print(f"[URL]    → {step3}")
```

実行結果:

```text
[ROT13]  → JTQ4JTYxJTYzJTZCJTQ2JTZGJTcyJTY3JTY1...
[Base64] → %48%61%63%6B%46%6F%72%67%65%7B%75%72...
[URL]    → HackForge{url_encoding_escape_artist}
```

## デコードチェーンの全体像

```text
WGD4WGLk...WGqR                              ← 暗号文
        ↓  ROT13
JTQ4JTYx...JTdE                              ← Base64 文字列
        ↓  base64.decode()
%48%61%63%6B%46%6F%72%67%65%7B...%7D         ← URL パーセントエンコード文字列
        ↓  urllib.parse.unquote()
HackForge{url_encoding_escape_artist}        ← FLAG
```

## 核心: "unexpected orders" の意味

一般的なCTFのエンコードパイプラインは以下の流れが多い:

```
平文 → ROT13 → Base64 → 暗号文
```

しかし本問では、Base64変換の**後**にROT13が適用されていた。そのため解読時にはその逆順を辿る必要がある:

```
暗号文 → ROT13 → Base64デコード → URLデコード → フラグ
```

固定観念にとらわれず、手掛かりに応じて適用順序を柔軟に並び替える思考が求められる。

## ROT13 が可逆である理由

ROT13は**対合（Involution）**、すなわち自分自身が逆関数となる性質を持つ。エンコード処理とデコード処理の内容が完全に同一であるため、エンコードの最終段階が `ROT13(base64)` であったなら、解読の最初の手順もそのまま `ROT13(ciphertext)` を適用すれば元のBase64文字列が過不足なく復元される。

## 得られた知見

### 問題名の深読み

*"Escaped Reality"* はただの言葉遊びではない。パーセントエンコードやエスケープ処理へのダイレクトなヒントだ。CTFでは問題タイトルが解法の突破口になるケースが極めて多い。

### URLエンコードの主要シグネチャ

`%XX`（XXは16進数）を見たら即座にASCIIコードを連想できるよう訓練しておくと有利になる:

| 文字 | 16進数 | URLエンコード表記 |
|---|---|---|
| `{` | 0x7B | `%7B` |
| `}` | 0x7D | `%7D` |
| `_` | 0x5F | `%5F` |
| `H` | 0x48 | `%48` |
| `a` | 0x61 | `%61` |

`%48%61%63%6B` を見た瞬間に **Hack** と認識できるようになれば、解読速度は劇的に向上する。

> *"問題タイトルは常に最初の手掛かりである。慎重に読み解くべし。"*
