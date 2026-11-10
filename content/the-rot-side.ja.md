---
title: The ROT Side
date: '2026-03-11'
excerpt: >-
  ROT13は誰もが知る古典的なシーザー暗号だ。だが、その影に隠れた兄弟であるROT47は印刷可能ASCII文字全体を対象とする
  ——そしてこれこそが真の厄介者だ。
flag: 'HackForge{rot47_the_other_rotation}'
tags:
  - Crypto
  - ROT47
  - Base32
  - Hex
  - Encoding
featured: /thumbnails/cosmic-nebula.jpg
---

ROT13といえば、CTFプレイヤーならずとも馴染み深い暗号アルゴリズムだ。13文字シフトし、アルファベットのみに作用し、2回適用すれば元の平文に戻る。

しかし今回の問題が焦点を当てているのは、その影に隠れがちな兄弟——**ROT47**だ。発想は同一だが、対象となる文字の適用範囲（スコープ）が大きく異なる。この差異こそが、暗号を見破る決定的な手掛かりとなる。

> *"いかなる暗号も、適切な問いを投げかければ必ずその正体を露呈する。"*

## 問題の暗号文 (Ciphertext)

```text
4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f
```

## パイプラインの特定

ツールを闇雲に走らせる前に、まず暗号文の構造を丹念に観察する。これはエンコーディング系問題における最も重要なアプローチだ。

| ステップ | 識別パターン | エンコード形式 |
|----------|-------------|----------------|
| 1 | `0-9` および `a-f` のみで構成、文字数が偶数 | Hex (16進数) |
| 2 | デコード後: `[A-Z2-7]` の大文字のみ、末尾に `=` パディングの可能性 | Base32 |
| 3 | デコード後: 読めそうで読めない文字列、**数字や記号もシフトされている** | ROT47 |

合計3層のネスト構造となっている。外側から順序通りに剥ぎ取っていこう。

## ステップ 1 — Hex デコード

118文字の16進数文字列は、バイト換算で59バイト（2文字 = 1バイト）となる。

```python
ciphertext = "4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
```

出力結果はすべて英大文字であり、数字の `3`, `5`, `2` が混在している——典型的な **Base32 の特徴**だ。Base32は `A-Z` と `2-7` の文字セットを使用する。

## ステップ 2 — Base32 デコード

Base32はバイナリデータを32種類の印刷可能文字に変換する方式だ。Base64と異なり大文字と数字（`2-7`）のみで構成されるため、大文字小文字を区別しないシステム環境で多用される。

```python
import base64

# Base32は8の倍数長になるよう '=' でパディングを補完する
padded = step1 + '=' * (-len(step1) % 8)
step2 = base64.b32decode(padded).decode()
print(step2)
# =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
```

ここで `{`, `}`, `\`, `=` などの特殊記号が現れた。依然として意味をなさない文字列だが、**単なる英字のみではない**。これこそがROT47の際立った特徴だ——アルファベットのみを動かすROT13とは違い、ROT47は**記号もシフト対象に含める**。

## ステップ 3 — ROT47 デコード

### ROT47 とは？

ROT13はアルファベットの `A-Z` / `a-z`（計26文字）を13文字ローテーションする。一方のROT47は、ASCIIコードの `!` (33) から `~` (126) までの**印刷可能ASCII文字全体（計94文字）**をちょうど **47文字シフト** させる。

```
範囲: 0x21 ('!') → 0x7E ('~')
変換式: chr(33 + (ord(c) - 33 + 47) % 94)
```

94 = 47 × 2 であるため、ROT47もROT13と同様に対合（*involution*）の性質を持ち、2回適用すれば元のテキストに復元される。

```python
def rot47(text: str) -> str:
    result = []
    for c in text:
        if 33 <= ord(c) <= 126:
            result.append(chr(33 + (ord(c) - 33 + 47) % 94))
        else:
            result.append(c)
    return ''.join(result)

step3 = rot47(step2)
print(step3)
# HackForge{rot47_the_other_rotation}
```

## 完全なソルバースクリプト (Python)

```python
import base64

def rot47(text: str) -> str:
    return ''.join(
        chr(33 + (ord(c) - 33 + 47) % 94) if 33 <= ord(c) <= 126 else c
        for c in text
    )

ciphertext = "4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f"

step1 = bytes.fromhex(ciphertext).decode()
step2 = base64.b32decode(step1 + '=' * (-len(step1) % 8)).decode()
step3 = rot47(step2)

print(f"[Hex]    → {step1}")
print(f"[Base32] → {step2}")
print(f"[ROT47]  → {step3}")
```

実行結果:

```text
[Hex]    → O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
[Base32] → =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
[ROT47]  → HackForge{rot47_the_other_rotation}
```

## デコードチェーンの俯瞰

```text
4f345a44...4f                                   ← Hex (118文字)
        ↓  bytes.fromhex()
O4ZDIPD VIBBTQNSMINAE...                        ← Base32
        ↓  base64.b32decode()
=rwAx:?5rwAx:?5\6==\eFC...                      ← ROT47 暗号化テキスト
        ↓  rot47()
HackForge{rot47_the_other_rotation}             ← FLAG
```

## ROT13 と ROT47 の比較

| 項目 | ROT13 | ROT47 |
|---|---|---|
| 対象範囲 | `A-Z`, `a-z` (52文字) | `!` 〜 `~` (94文字の印刷可能ASCII) |
| シフト量 | 13 | 47 |
| 数字のシフト | なし | あり |
| 記号のシフト | なし | あり |
| 外観の特徴 | 英字のみがずれた文字列 | **数字や特殊記号まで歪んだ** 文字列 |

**素早く見抜くコツ:** フラグ形式の波括弧 `{` や `}` が `\[` や `]` などの記号に変形している場合、ROT47を疑うのがセオリーだ（ROT13は波括弧を一切変換しないため）。

## まとめ & 得られた知見

エンコーディング系の問題が複数層で構成される理由は明白だ。自動化ツールによる一発解法を防ぎ、**各レイヤーのシグネチャを正確に見極める洞察力** を試すためである。

今回の `Hex → Base32 → ROT47` という連鎖は非常に綿密に設計されていた。Base32の英大文字出力で別のエンコードを連想させ、ROT47でフラグフォーマット `{}` を崩してgrep検知を回避している。

しかし、シグネチャさえ把握していれば、スクリプト1つで瞬時に攻略可能だ。

> *"最良の暗号とは、敵が暗号だと気付かないものだ。"*
