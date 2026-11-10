---
title: Basic Encoding Soup
date: '2026-03-10'
excerpt: >-
  Three nested layers of obfuscation — Hex, Base64, and ROT13. No heavy mathematics required,
  just a trained eye for encoding patterns.
flag: 'HackForely{hex_b64_rot13_classic}'
tags:
  - Crypto
  - Hex
  - Base64
  - ROT13
  - Encoding
featured: /thumbnails/color-soup.jpg
---

This challenge requires zero advanced mathematics. No RSA factorizations, no AES mode confusion, and no elliptic curve discrete logarithms. It simply presents **three nested obfuscation layers** — and your task is to strip them in exact reverse order.

The challenge tests an elemental yet paramount skill: identifying data encodings by sight. A seasoned reverse engineer or CTF player does not need to blind-fire CyberChef recipes to know what they are looking at.

> *"Every secret leaks its signature — provided you know what to look for."*

## Challenge Ciphertext

```text
5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d
```

## Initial Visual Inspection

Before writing a single line of script, **observe**. This analytical habit distinguishes methodical researchers from those who depend on automated tooling without comprehending the underlying pipelines.

| Observable Indicator | Cryptographic Significance |
|---|---|
| Composed strictly of `0–9` and `a–f` | → Hexadecimal encoding |
| Intermediate string terminates with `=` | → Base64 padding |
| Unpacked text exhibits `{}` delimiters but remains scrambled | → ROT13 or Caesar rotation |

Three clear signals yield three sequential operations.

## Step 1 — Hex Decode

Hexadecimal encodes bytes as pairs of nibbles (2 hex characters = 1 byte). An 88-character hex string evaluates to 44 raw bytes.

```python
ciphertext = "5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
```

The trailing `=` is deliberate: it is standard **Base64 padding**.

## Step 2 — Base64 Decode

Base64 transforms arbitrary binary streams into safe ASCII characters using a 64-symbol index. Trailing padding `=` tokens compensate when input byte lengths are not multiples of 3.

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# UnpxSbetry{urk_o64_ebgMT3_pynffvph}
```

Now things get interesting. The `{}` delimiter surfaces — an unmistakable **flag structure**. The prefix `UnpxSbetry` immediately flags familiarity: `U→H`, `n→a`, `p→c`, `x→k`... This is **ROT13**.

## Step 3 — ROT13 Decode

ROT13 is a fixed-offset Caesar permutation shifting every alphabetical character by **13 positions**. Because the English alphabet comprises 26 glyphs, ROT13 is an *involution* — applying it twice returns the original plaintext. Digits and formatting symbols remain unaltered.

```python
import codecs

step3 = codecs.decode(step2, 'rot_13')
print(step3)
# HackForely{hex_b64_rot13_classic}
```

## Complete Solver Script

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

Execution Output:

```text
[Hex]    → VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
[Base64] → UnpxSbetry{urk_o64_ebgMT3_pynffvph}
[ROT13]  → HackForely{hex_b64_rot13_classic}
```

## Decoding Pipeline Overview

```text
5657357765464e69...3d        ← Hex
        ↓  bytes.fromhex()
VW5weFNiZXRye3Vya19v...cH0=  ← Base64
        ↓  base64.b64decode()
UnpxSbetry{urk_o64_ebgMT3_pynffvph}  ← ROT13
        ↓  codecs.decode('rot_13')
HackForely{hex_b64_rot13_classic}    ← FLAG
```

## Key Architectural Insights

### Encoding $\neq$ Encryption

A fundamental distinction beginners often conflate:

- **Encoding** (Hex, Base64, ROT13) incorporates neither secret keys nor algorithmic confidentiality. Its objective is data formatting and transport compatibility.
- **Encryption** (AES, RSA, ChaCha20) relies on cryptographic keys and mathematical hardness guarantees.

Treating Base64 as "protection" is functionally equivalent to locking your front door and leaving the physical key under the welcome mat.

### Rapid Signature Recognition Cheat Sheet

| Pattern | Encoding Format |
|---|---|
| `[0-9a-f]+`, even character count | Hexadecimal |
| `[A-Za-z0-9+/]+=*` | Base64 |
| Scrambled text preserving alphabetical distribution | ROT / Caesar cipher |
| `%XX` sequences | URL / percent encoding |
| `\u0041\u0042...` | Unicode escape |

> *"Security through obscurity is not security — it's just a locked door with the key under the mat."*
