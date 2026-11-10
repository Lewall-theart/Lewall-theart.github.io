---
title: Papi Cris' Fortune
date: '2026-03-08'
excerpt: >-
  RSA with an asymmetric small prime hidden inside family lore. Trial division unravels
  the entire cipher in under a second.
flag: S3cr3t_to_p4pis_f0rtune
tags:
  - Crypto
  - RSA
  - Small Prime
  - Trial Division
featured: /thumbnails/vintage-library.jpg
---

Upon opening the challenge, I was greeted with an extensive family tree populated with eccentric characters — beneath which sat three cold lines of numeric parameters.

> *"In CTF challenges, lore is never just narrative fluff. It is cryptographic specification disguised as prose."*

## Initial Artifacts

The challenge supplies standard RSA parameters:

```text
n = 6258845379969220213010003414339325069273755857...
e = 0x10001
c = 6231872210586447563307026724797410213049258686...
```

Objective: compute $m = c^d \pmod n$. To achieve that, we must factor $n = p \times q$.

## Deconstructing the Family Tree

Each character statement embeds a distinct mathematical hint.

### Prima Sofia — The Decisive Breakthrough

> *"O papi Cris dizia que até 100000 era perto e que basta descobrir um que o outro é óbvio"*

The moment I parsed this clue, the path became clear: **$q < 100,000$**.

### Primo Ricardo

> *"Se pudesse escolher um número da sorte seria 777..."*

**$p \approx 2^{777}$**. An enormous prime weighing in at ~777 bits. Combining this with Sofia's clue gives us an unbalanced RSA modulus where $q$ is trivially small.

### Irmão Rafinha

```text
Fortnite_Pass = f1e2d3c4b5a69788796a5b4c3d2e1f0a9
```

A 32-character hex token — noted down in case key derivation is needed post-decryption.

### Avó Bastarda — The Red Herring

*"Roubou 2€ da carteira do papi Cris em 2009"*

The numbers `2` and `2009` resemble typical CTF hints but lead nowhere. **Discarded.**

## Attack Surface & Strategy

Synthesizing the core clues:

| Variable | Inferred Boundary | Attack Vector |
|----------|-------------------|---------------|
| $q$ | $< 100,000$ | Trial division over small primes |
| $p$ | $\approx 2^{777}$ | Direct quotient $n / q$ |

## Solver Script

**Step 1 — Factor $n$:**

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

**Step 2 — Decrypt Payload:**

```python
from Crypto.Util.number import inverse, long_to_bytes

phi = (p - 1) * (q - 1)
d   = inverse(e, phi)
m   = pow(c, d, n)
print(long_to_bytes(m))
```

## Recovered Flag

The moment the terminal outputs the recovered plaintext:

```
S3cr3t_to_p4pis_f0rtune
```

## Takeaways

- **Small prime vulnerabilities** completely dismantle RSA in milliseconds.
- Always scrutinize narrative prompts — authors deliberately weave math constraints into character descriptions.
- Filtering red herrings from genuine constraints is as crucial as algorithmic computation.
