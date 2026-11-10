---
title: Papi Cris' Fortune
date: '2026-03-08'
excerpt: >-
  一族の系図に隠された非対称な微小素数RSA。単純な試し割り法（Trial Division）により、
  1秒未満で暗号全体が瓦解する。
flag: S3cr3t_to_p4pis_f0rtune
tags:
  - Crypto
  - RSA
  - Small Prime
  - Trial Division
featured: /thumbnails/vintage-library.jpg
---

問題を開くと、個性的な登場人物が並ぶ長大な家系図と、その下に添えられた3行の冷徹な数値データが現れた。

> *"CTFにおいて、ストーリーは単なる飾りではない。散文の皮を被った暗号の仕様書である。"*

## 提供されたパラメータ

典型的なRSA暗号のパラメータが与えられている:

```text
n = 6258845379969220213010003414339325069273755857...
e = 0x10001
c = 6231872210586447563307026724797410213049258686...
```

目標は平文 $m = c^d \pmod n$ の導出だ。そのためには公開鍵の法 $n$ を $n = p \times q$ へと素因数分解する必要がある。

## 家系図の解析

登場人物のセリフそれぞれに、数学的な制約条件が巧みに織り込まれている。

### 従姉妹ソフィア (Prima Sofia) — 最大のヒント

> *"O papi Cris dizia que até 100000 era perto e que basta descobrir um que o outro é óbvio"*
> （クリスおじいちゃんは100000までは近いと言っていた。片方さえ見つかればもう片方は自明だと）

この記述から、素数因数の片方が極めて小さいことが即座に読み取れる: **$q < 100,000$**。

### 従兄弟リカルド (Primo Ricardo)

> *"Se pudesse escolher um número da sorte seria 777..."*

**$p \approx 2^{777}$**。約777ビットという巨大な素数だ。ソフィアの証言と組み合わせると、本問は素数サイズが著しくアンバランスなRSA暗号であると確定できる。

### 兄弟ラフィーニャ (Irmão Rafinha)

```text
Fortnite_Pass = f1e2d3c4b5a69788796a5b4c3d2e1f0a9
```

32文字の16進数文字列。復号後の鍵導出などに使用される可能性を考慮しメモしておく。

### 祖母 (Avó Bastarda) — レッドヘリング（偽の手掛かり）

*"Roubou 2€ da carteira do papi Cris em 2009"*

`2` や `2009` といった数字は一見ヒントらしく思えるが、暗号解読には寄与しない。**無視して問題ない。**

## 攻撃戦略

得られたコアの手掛かりを整理する:

| 変数 | 推定される範囲 | 攻撃手法 |
|------|----------------|----------|
| $q$ | $< 100,000$ | 微小素数に対する試し割り法（Trial Division） |
| $p$ | $\approx 2^{777}$ | $n / q$ による直接除算 |

## 解法スクリプト (Python)

**ステップ 1 — $n$ の素因数分解:**

```python
from sympy import primerange

n = 625884537996922021301000341433932506927375585765...
e = 0x10001
c = 623187221058644756330702672479741021304925868602...

for q in primerange(2, 100_000):
    if n % q == 0:
        p = n // q
        print(f"[+] Factor found: q = {q}")
        print(f"  p = {p}")
        break
```

**ステップ 2 — 復号処理:**

```python
from Crypto.Util.number import inverse, long_to_bytes

phi = (p - 1) * (q - 1)
d   = inverse(e, phi)
m   = pow(c, d, n)
print(long_to_bytes(m))
```

## 獲得したフラグ

スクリプトを実行すると、瞬時に平文が出力される:

```
S3cr3t_to_p4pis_f0rtune
```

## まとめ

- **微小素数（Small Prime）の存在**は、RSA暗号をミリ秒単位で完全に無力化する。
- 問題文のストーリーを精読すること。作問者の意図や数学的パラメータのヒントはテキストに散りばめられている。
- 無関係なダミー情報（レッドヘリング）を見分ける嗅覚も、CTFでは極めて重要となる。
