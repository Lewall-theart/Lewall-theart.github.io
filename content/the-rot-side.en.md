---
title: The ROT Side
date: '2026-03-11'
excerpt: >-
  ROT13 is child's play. Its lesser-known sibling operates across the entire printable ASCII range
  — and that's where things get interesting.
flag: 'HackForge{rot47_the_other_rotation}'
tags:
  - Crypto
  - ROT47
  - Base32
  - Hex
  - Encoding
featured: /thumbnails/cosmic-nebula.jpg
---

ROT13 — everyone knows it. Shift 13 positions, affect only letters, apply twice to get back to where you started.

This challenge, however, focuses on its less prominent counterpart: **ROT47**. Same underlying concept, different character range — and that scope difference is the telltale sign you need to spot it.

> *"Every cipher reveals its identity — provided you know the right questions to ask."*

## Challenge Ciphertext

```text
4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f
```

## Identifying the Pipeline

Observe before running automated tools. This is the single most vital skill in encoding challenges.

| Step | Characteristic Indicator | Encoding |
|------|--------------------------|----------|
| 1 | Strictly `0-9` and `a-f`, even length | Hex |
| 2 | Post-decode: `[A-Z2-7]` uppercase, potential `=` padding | Base32 |
| 3 | Post-decode: readable layout with scrambled characters, **including digits and symbols** | ROT47 |

Three distinct layers. Strip them one by one in precise sequence.

## Step 1 — Hex Decode

A 118-character hex string translates to 59 raw bytes (2 hex digits per byte).

```python
ciphertext = "4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
```

The output consists entirely of uppercase letters with numerals `3`, `5`, and `2` — an unmistakable **Base32 pattern**. Base32 utilizes the `A-Z` and `2-7` alphabet.

## Step 2 — Base32 Decode

Base32 maps binary data into 32 printable characters. Unlike Base64, it restricts itself to uppercase characters and six numbers (`2-7`), frequently appearing in systems requiring case-insensitive representations.

```python
import base64

# Base32 requires valid padding — pad with '=' to a multiple of 8
padded = step1 + '=' * (-len(step1) % 8)
step2 = base64.b32decode(padded).decode()
print(step2)
# =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
```

Now we observe punctuation and symbols: `{`, `}`, `\`, `=`... The string remains obfuscated, but it is **no longer strictly alphabetic**. This is the hallmark signature of ROT47 — it rotates **special characters**, unlike ROT13 which leaves punctuation untouched.

## Step 3 — ROT47 Decode

### What is ROT47?

While ROT13 rotates only `A-Z` / `a-z` (26 letters, 13-shift), ROT47 shifts across **all printable ASCII characters** from `!` (ASCII 33) to `~` (ASCII 126) — spanning **94 characters** with an offset of **47**.

```
Range: 0x21 ('!') → 0x7E ('~')
Formula: chr(33 + (ord(c) - 33 + 47) % 94)
```

Because 94 = 47 × 2, ROT47 is an *involution* — applying the operation twice recovers the plaintext, identical to ROT13.

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

## Complete Solver Script

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

Output:

```text
[Hex]    → O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
[Base32] → =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
[ROT47]  → HackForge{rot47_the_other_rotation}
```

## Decoding Chain Overview

```text
4f345a44...4f                                   ← Hex (118 chars)
        ↓  bytes.fromhex()
O4ZDIPD VIBBTQNSMINAE...                        ← Base32
        ↓  base64.b32decode()
=rwAx:?5rwAx:?5\6==\eFC...                      ← ROT47'd text
        ↓  rot47()
HackForge{rot47_the_other_rotation}             ← FLAG
```

## ROT13 vs ROT47 — Quick Comparison

| | ROT13 | ROT47 |
|---|---|---|
| Range | `A-Z`, `a-z` (52 letters) | `!` → `~` (94 printable ASCII characters) |
| Shift offset | 13 | 47 |
| Shifts digits? | No | Yes |
| Shifts symbols? | No | Yes |
| Recognition | Gibberish with only shifted letters | Gibberish with **shifted digits & symbols** |

**Quick Recognition Tip:** If you notice `{` or `}` morphed into unusual symbols like `\[` or `]`, suspect ROT47 immediately — ROT13 never alters braces.

## Key Takeaways

Encoding challenges frequently stack multiple layers with deliberate intent: forcing you to **identify patterns step-by-step** rather than blindly firing automated tools.

The `Hex → Base32 → ROT47` chain is designed to camouflage downstream markers: Base32 generates uniform uppercase text to mimic other formats, while ROT47 mutates standard flag delimiters (`{}`) to prevent immediate keyword recognition.

Once you spot the underlying pattern, the cipher unravels in seconds.

> *"The best cipher is the one your enemy doesn't recognize as a cipher."*
