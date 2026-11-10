---
title: Double Trouble
date: '2025-03-11'
excerpt: >-
  Threat actors often stack the same encoding multiple times to evade detection.
  Simple in design — yet surprisingly effective in practice.
flag: 'HackForge{double_base64_layers}'
tags:
  - Crypto
  - Base64
  - Hex
  - Encoding
  - Double-Encoding
featured: /thumbnails/lake-reflection.jpg
---

This challenge is titled **Double Trouble** — and that is no coincidence. The challenge prompt stated plainly:

> *"Sometimes attackers apply the same encoding multiple times to evade detection. Simple but effective."*

A single Base64 layer is trivially caught by virtually any security filter. Double layers? Many automated scanners inspect only one layer deep, observe that the output remains unintelligible gibberish, and flag the traffic as harmless. That is precisely why this evasion technique persists in real-world attacks.

## Challenge Ciphertext

```text
55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d
```

## Initial Identification

Inspecting the payload reveals only characters `0-9` and `a-f` with an even length of 120 characters — undeniably **Hex encoding**.

Upon decoding hex, the string terminates with `=` — indicating **Base64 padding**. Unpacking this first Base64 layer yields another string ending in `==` — signaling **yet another Base64 layer**. This is the quintessential signature of nested encoding.

## Step 1 — Hex Decode

120 hexadecimal characters translate to 60 raw bytes (2 characters per byte).

```python
ct = "55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d"

step1 = bytes.fromhex(ct).decode()
print(step1)
# U0dGamEwWnZjbWRsZTJSdmRXSnNaVjlpWVhObE5qUmZiR0Y1WlhKemZRPT0=
```

The trailing `=` confirms Base64. However, observing the payload reveals that decoding it still produces padding tokens — meaning **a nested Base64 layer lies underneath**.

## Step 2 — Base64 Decode (Layer 1)

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# SGFja0Zvcmdle2RvdWJsZV9iYXNlNjRfbGF5ZXJzfQ==
```

The intermediate result remains a valid Base64 string ending with `==`. Not done yet.

## Step 3 — Base64 Decode (Layer 2)

```python
step3 = base64.b64decode(step2).decode()
print(step3)
# HackForge{double_base64_layers}
```

The flag emerges cleanly.

## Complete Solver Script

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

Output:

```text
[Hex]   → U0dGamEwWnZjbWRsZTJSdmRXSnNaVjlpWVhObE5qUmZiR0Y1WlhKemZRPT0=
[B64×1] → SGFja0Zvcmdle2RvdWJsZV9iYXNlNjRfbGF5ZXJzfQ==
[B64×2] → HackForge{double_base64_layers}
```

## Decoding Pipeline Overview

```text
55306447...3d                                     ← Hex (120 chars)
        ↓  bytes.fromhex()
U0dGamEw...PT0=                                   ← Base64 layer 1
        ↓  base64.b64decode()
SGFja0Zv...fQ==                                   ← Base64 layer 2
        ↓  base64.b64decode()
HackForge{double_base64_layers}                   ← FLAG
```

## Why Threat Actors Use Nested Encodings

In offensive security, attackers employ nested encoding to **evade Web Application Firewalls (WAFs)** and deep packet inspection signatures.

Consider an SQL injection payload: `' OR 1=1 --`

```
Plaintext : ' OR 1=1 --
Base64×1  : JyBPUiAxPTEgLS0=          ← Detectable by modern WAF rules
Base64×2  : SnlCUFVpQXhQVEVnTFMwPQ==  ← Bypasses single-pass decoders
```

Security appliances commonly decode request streams only once. If the intermediate output remains opaque Base64 strings, many inspection engines categorize it as binary data or random tokens and permit passage. The backend application then performs redundant decoding and executes the raw payload.

## Quick Identification Matrix

| Symptom | Cryptographic Significance |
|---|---|
| Base64 decoded output is still valid Base64 | → At least two nested layers present |
| Decoded payload contains `=` or `==` but remains illegible | → Incomplete decoding pass |
| Double decode remains scrambled | → Additional layers, or alternate encoding pipeline |

**Golden Rule:** Continuously unwrap layers until human-readable plaintext appears, or until no recognizable encoding signatures remain.

> *"When one layer isn't enough to hide, just add another."*
