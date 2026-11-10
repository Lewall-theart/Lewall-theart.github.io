---
title: Double Trouble
date: '2025-03-11'
excerpt: >-
  攻撃者は検知回避を狙い、同一のエンコードを多重適用することがある。
  単純な構造でありながら、現場では驚くほど効果的な回避手法だ。
flag: 'HackForge{double_base64_layers}'
tags:
  - Crypto
  - Base64
  - Hex
  - Encoding
  - Double-Encoding
featured: /thumbnails/lake-reflection.jpg
---

本問のタイトルは **Double Trouble** ——これは決して偶然の命名ではない。問題文にも明確に示されていた:

> *"Sometimes attackers apply the same encoding multiple times to evade detection. Simple but effective."*
> （攻撃者は検知を免れるため、同一のエンコードを複数回適用することがある。単純だが極めて効果的だ）

単一のBase64であれば、あらゆるセキュリティ監視ツールが即座にデコードして検知する。しかし2重にエンコードされた場合はどうだろうか？多くの自動スキャナーは1回目のデコード結果が依然として無意味な英数字列（gibberish）であるのを見て、悪意のないバイナリトークンと誤認し検査を打ち切ってしまう。これこそが、多重エンコードが実攻撃で採用される理由だ。

## 問題の暗号文 (Ciphertext)

```text
55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d
```

## パターンの見極め

暗号文を観察すると、構成文字は `0-9` および `a-f` のみで、長さは120文字の偶数長——疑う余地なく **Hex（16進数）エンコード** だ。

Hexをデコードすると末尾に `=` が現れ、**Base64 のパディング** であることが確認できる。さらにそのBase64を1回デコードした結果もまた末尾に `==` を含んでおり、**さらにもう一層Base64がネストされている** ことが判明する。典型的な多重エンコードのシグネチャだ。

## ステップ 1 — Hex デコード

120文字のHex文字列は60バイトの生データとなる（2文字 = 1バイト）。

```python
ct = "55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d"

step1 = bytes.fromhex(ct).decode()
print(step1)
# U0dGamEwWnZjbWRsZTJSdmRXSnNaVjlpWVhObE5qUmZiR0Y1WlhKemZRPT0=
```

末尾の `=` からBase64であることが裏付けられた。しかし、これをデコードしても平文ではなく依然としてBase64形式の文字列が返る。

## ステップ 2 — Base64 デコード（1回目）

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# SGFja0Zvcmdle2RvdWJsZV9iYXNlNjRfbGF5ZXJzfQ==
```

中間出力は依然として有効なBase64文字列（末尾 `==`）だ。まだ完了ではない。

## ステップ 3 — Base64 デコード（2回目）

```python
step3 = base64.b64decode(step2).decode()
print(step3)
# HackForge{double_base64_layers}
```

フラグが完全に復元された。

## ソルバースクリプト (Python)

```python
import base64

ct = "55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d"

step1 = bytes.fromhex(ct).decode()
step2 = base64.b64decode(step1).decode()
step3 = base64.b64decode(step2).decode()

print(f"[Hex]   → {step1}")
print(f"[B64×1] → {step2}")
print(f"[B64×2] → {step3}")
```

実行結果:

```text
[Hex]   → U0dGamEwWnZjbWRsZTJSdmRXSnNaVjlpWVhObE5qUmZiR0Y1WlhKemZRPT0=
[B64×1] → SGFja0Zvcmdle2RvdWJsZV9iYXNlNjRfbGF5ZXJzfQ==
[B64×2] → HackForge{double_base64_layers}
```

## デコードフロー概要

```text
55306447...3d                                     ← Hex (120文字)
        ↓  bytes.fromhex()
U0dGamEw...PT0=                                   ← Base64 レイヤー 1
        ↓  base64.b64decode()
SGFja0Zv...fQ==                                   ← Base64 レイヤー 2
        ↓  base64.b64decode()
HackForge{double_base64_layers}                   ← FLAG
```

## 多重エンコードが利用される実務的背景

セキュリティの実務において、多重エンコードは **WAF（Webアプリケーションファイアウォール）の検知回避** に頻繁に悪用される。

例: SQLインジェクションのペイロード `' OR 1=1 --`

```
平文      : ' OR 1=1 --
Base64×1  : JyBPUiAxPTEgLS0=          ← WAFのシグネチャで検知されやすい
Base64×2  : SnlCUFVpQXhQVEVnTFMwPQ==  ← 1回デコードの検査を容易にすり抜ける
```

監視システムはリクエストを1回だけデコードして評価することが多い。デコード結果が別のBase64文字列のままであれば「無害な文字列」と判定して通過させ、バックエンドのアプリケーション側で再度デコードされて悪意あるコードが実行されることになる。

## 迅速な判別のポイント

| 状況 | 暗号学的な意味 |
|---|---|
| Base64デコード後も有効なBase64文字列 | → 少なくとも2層以上の多重構造 |
| 末尾に `=` や `==` があるが文字化けしている | → デコードのステップ不足 |
| 2回デコードしても読めない | → 3層以上の構造、または他形式との複合 |

**実戦の鉄則:** 意味のある平文が現れるか、あるいは判別可能なエンコード形式が尽きるまで、貪欲にデコードを継続すること。

> *"隠蔽するのに1枚で足りないのなら、もう1枚重ねればよい。"*
