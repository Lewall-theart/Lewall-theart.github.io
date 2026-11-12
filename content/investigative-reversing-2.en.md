---
title: Investigative Reversing 2 – Recovering LSB Steganography & Bitwise Transforms via IDA Pro
date: '2026-11-10'
excerpt: >-
  In-depth analysis of LSB Steganography within raw BMP image structures, combined with
  arithmetic transforms and Little-Endian bit ordering using IDA Pro to author an automated extraction solver in Python.
featured: /thumbnails/investigative-reversing-2.jpg
flag: 'academy{n3xt_0n30000000000000000000000000b2a84f53}'
tags:
  - Reverse Engineering
  - Forensics
  - Steganography
  - IDA Pro
  - Bitwise Operations
  - BMP Format
  - Python
  - CTF
---

> *"In digital forensics and offensive security, steganography does not seek to transform data into opaque mathematical ciphertext; rather, it aims to conceal the very existence of the covert channel itself. A conventional uncompressed bitmap image comprising millions of pixels can readily serve as a carrier medium for arbitrary payloads by exploiting the psycho-visual threshold of the human visual system."*

---

## 1. Artifact Triage & Profiling

Upon assessing the forensic scene for `investigative-reversing-2`, we are provisioned with two primary artifacts:

1. **Target Binary:** `mystery`
2. **Suspect Image:** `encoded.bmp`

### Artifact Profile Matrix:

| Attribute | Executable (`mystery`) | Media Artifact (`encoded.bmp`) |
| :--- | :--- | :--- |
| **File Format** | ELF 64-bit LSB pie executable, x86-64 | PC bitmap, Windows 3.x format |
| **Size** | 16,784 bytes | 1,507,414 bytes (1.43 MB) |
| **Resolution** | N/A | 1765 × 852 pixels, 24 bpp (RGB) |
| **SHA-256 Hash** | `2802b225bd1d019fe099bae09ad659726874fd0e7eca60b10d7077f35de7263e` | `0fa3f4a80b9dbf81de84b25d86d5aec37baf3e0658b9f3eb6f295fb658d00293` |

![Encoded BMP Image](/img/writeups/investigative-reversing-2/encoded.png)
*Visual inspection of encoded.bmp: Natural pixel presentation devoid of perceptual distortions, artifact halos, or chromatic aberration.*

In Part 1 (`Investigative Reversing 1`), we encountered **Append Steganography (EOF Injection)** — exploiting parser termination past the `IEND` chunk. In Part 2, the medium transitions to an uncompressed **BMP**, and the data hiding technique shifts down to the microscopic plane: manipulating the Least Significant Bit (LSB) across individual raster byte channels.

---

## 2. BMP Anatomy & The Safe Harbor Buffer

### 2.1. Binary Architecture of Windows Bitmaps (BMP)
Unlike compressed formats (JPEG, PNG, WebP), BMP stores raw raster scanlines across structured headers:

- **BITMAPFILEHEADER (14 bytes):** Magic `BM` (`0x4D42`), followed by `bfSize` and `bfOffBits` (pixel array starting offset).
- **BITMAPINFOHEADER (40 bytes):** Geometric metadata: Width, Height, Planes, BitCount (24 bpp = 3 raw B-G-R bytes per pixel), and Compression method (`BI_RGB` = 0, uncompressed).
- **Pixel Array (Raster Data):** Contiguous scanlines structured bottom-up.

```
+--------------------------+  Offset 0x00
| BITMAPFILEHEADER (14 B)  |  Magic "BM", File Size
+--------------------------+  Offset 0x0E
| BITMAPINFOHEADER (40 B)  |  Width, Height, 24 bpp
+--------------------------+  Offset 0x36
| Color Profile / Padding  |
+--------------------------+  Offset 0x7D0 (2000 decimal)
| >>> EMBEDDED PAYLOAD <<< |  400 bytes LSB payload
+--------------------------+  Offset 0x960 (2400 decimal)
| Remaining Raster Pixels  |  Original image data continues
+--------------------------+  EOF (1,507,414 bytes)
```

### 2.2. The Safe Harbor Buffer: Why Skip the First 2000 Bytes?
Inspecting `main` reveals that the program clones the first **2000 bytes** (`0x7D0`) verbatim from `original.bmp` to `encoded.bmp`:

```c
v11 = 2000;
for ( i = 0; i < v11; ++i )
{
  fputc(ptr, v15);
  v6 = fread(&ptr, 1u, 1u, stream);
}
```

This 2000-byte preservation buffer serves two critical engineering purposes:
1. **Header & DIB Preservation:** Prevents byte corruption across geometry and format fields, ensuring native operating system image decoders render the file seamlessly without integrity errors.
2. **Triage Bypass:** Simple signature scanning tools frequently limit header validation to the first few hundred bytes.

---

## 3. Disassembly & Decompilation with IDA Pro

Loading `mystery` into IDA Pro allows us to isolate the execution flow between `main` and the bitwise primitive `codedChar`.

### 3.1. Main Execution Flow

Decompiled C pseudocode from Hex-Rays (`F5`):

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char ptr; 
  char v5; 
  int v6; 
  int i, j, k; 
  int v10, v11, v12; 
  FILE *v13;    // flag.txt stream
  FILE *stream; // original.bmp stream
  FILE *v15;    // encoded.bmp stream
  _BYTE v16[56];// Flag input buffer
  unsigned __int64 v17;

  v17 = __readfsqword(0x28u);
  v10 = 0;
  v13 = fopen("flag.txt", "r");
  stream = fopen("original.bmp", "r");
  v15 = fopen("encoded.bmp", "a");

  if ( v13 == nullptr )
    puts("No flag found, please make sure this is run on the server");
  if ( stream == nullptr )
    puts("original.bmp is missing, please run this on the server");

  v6 = fread(&ptr, 1u, 1u, stream);

  // [Phase 1] Copy the first 2000 bytes (0x7D0) unmolested
  v11 = 2000;
  for ( i = 0; i < v11; ++i )
  {
    fputc(ptr, v15);
    v6 = fread(&ptr, 1u, 1u, stream);
  }

  // [Phase 2] Validate flag length: 0x32 = 50 characters
  v12 = fread(v16, 0x32u, 1u, v13);
  if ( v12 <= 0 )
  {
    puts("flag is not 50 chars");
    exit(0);
  }

  // [Phase 3] Bit-level embedding loop
  for ( j = 0; j <= 49; ++j )        // Iterate 50 characters
  {
    for ( k = 0; k <= 7; ++k )       // Iterate 8 bits per character
    {
      v5 = codedChar(k, v16[j] - 5, ptr);
      fputc(v5, v15);
      fread(&ptr, 1u, 1u, stream);
    }
  }

  // [Phase 4] Flush remaining original raster bytes
  while ( v6 == 1 )
  {
    fputc(ptr, v15);
    v6 = fread(&ptr, 1u, 1u, stream);
  }

  fclose(v15);
  fclose(stream);
  fclose(v13);
  return 0;
}
```

> [!TIP]
> **IDA Pro Shortcut:** Hovering over `0x32u` in `fread(v16, 0x32u, 1u, v13);` and pressing **`H`** immediately converts the literal to decimal (`50`). Similarly, pressing `H` on `0x7D0` yields `2000`.

---

### 3.2. Dissecting the Assembly in `codedChar`

Examining the raw x86-64 assembly in `codedChar`:

```x86asm
.text:0000000000001195  codedChar       proc near
.text:0000000000001195                  push    rbp
.text:0000000000001196                  mov     rbp, rsp
.text:0000000000001199                  mov     [rbp+var_14], edi       ; edi = a1 = k (bit index 0..7)
.text:000000000000119C                  mov     eax, esi
.text:000000000000119E                  mov     [rbp+var_18], al        ; al  = a2 = (flag[j] - 5)
.text:00000000000011A1                  mov     eax, edx
.text:00000000000011A3                  mov     [rbp+var_1C], al        ; al  = a3 = pixel_byte
.text:00000000000011A6                  mov     [rbp+var_2], 1          ; Mask 0x01
.text:00000000000011AA                  mov     [rbp+var_1], 0FEh       ; Mask 0xFE (11111110b)
.text:00000000000011AE                  cmp     [rbp+var_14], 0         ; Check if k == 0
.text:00000000000011B2                  jz      short loc_11C4
.text:00000000000011B4                  movsx   edx, [rbp+var_18]
.text:00000000000011B8                  mov     eax, [rbp+var_14]
.text:00000000000011BB                  mov     ecx, eax
.text:00000000000011BD                  sar     edx, cl                 ; Arithmetic shift right: (char - 5) >> k
.text:00000000000011BF                  mov     eax, edx
.text:00000000000011C1                  mov     [rbp+var_18], al
.text:00000000000011C4  loc_11C4:
.text:00000000000011C4                  movzx   eax, [rbp+var_2]
.text:00000000000011C8                  and     [rbp+var_18], al        ; Extract bit k: ((char - 5) >> k) & 1
.text:00000000000011CB                  movzx   eax, [rbp+var_1]
.text:00000000000011CF                  and     [rbp+var_1C], al        ; Clear pixel LSB: pixel_byte & 0xFE
.text:00000000000011D2                  movzx   eax, [rbp+var_18]
.text:00000000000011D6                  or      [rbp+var_1C], al        ; Splice bit: (pixel & 0xFE) | bit_k
.text:00000000000011D9                  movzx   eax, [rbp+var_1C]       ; Return modified byte
.text:00000000000011DD                  pop     rbp
.text:00000000000011DE                  retn
.text:00000000000011DE  codedChar       endp
```

Equivalent C logic:

```c
__int64 __fastcall codedChar(int a1, char a2, char a3)
{
  char v4;

  v4 = a2;
  if ( a1 != 0 )
    v4 = a2 >> a1;
  return (v4 & 1) | (a3 & 0xFEu);
}
```

---

## 4. Mathematical Reconstruction & Bit Ordering

The reverse engineering findings confirm two operational properties:

### 4.1. Arithmetic Obfuscation
Prior to bit slicing, character $C_j$ undergoes subtraction by 5:
$$C'_j = C_j - 5 \implies C_j = C'_j + 5$$

### 4.2. Little-Endian Bitstream Ordering
The inner loop index $k$ increments progressively from $0 \to 7$:
- $k = 0$: Bit 0 (LSB) of $C'_j$ is written to pixel byte 0.
- $k = 1$: Bit 1 of $C'_j$ is written to pixel byte 1.
- $\dots$
- $k = 7$: Bit 7 (MSB) of $C'_j$ is written to pixel byte 7.

This defines a **Little-Endian Bitstream**. Any modified byte $C'_j$ is reassembled from 8 sequential bytes ($B_0 \dots B_7$) via:

$$C'_j = \sum_{k=0}^{7} (B_k \ \& \ 1) \cdot 2^k = \bigvee_{k=0}^{7} \Big((B_k \ \& \ 1) \ll k\Big)$$

---

## 5. Step-by-Step Manual Extraction

### 5.1. Locating the Target Offset
In a hex editor opening `encoded.bmp`:
- **Starting Offset:** Skip 2000 bytes $\rightarrow \mathbf{0x7D0}_{16}$ ($2000_{10}$).
- **Payload Span:** 50 characters $\times$ 8 bytes = 400 bytes.
- **Active Range:** `0x7D0` through `0x95F` ($2000 \to 2399$ decimal).

### 5.2. Decoding `flag[0]`
Reading the initial 8 bytes at offset `0x7D0`:

```
Offset          Hex View                     ASCII
000007D0        E8 E8 E9 E9 E9 E8 E9 E8      ........
```

Slicing individual LSBs ($k = 0 \dots 7$):

| Bit ($k$) | Offset | Byte | Binary | LSB (`b & 1`) | Weight ($2^k$) | Partial Contribution |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Bit 0** | `0x7D0` | `0xE8` | `1110 1000` | **`0`** | $2^0 = 1$ | $0 \times 1 = 0$ |
| **Bit 1** | `0x7D1` | `0xE8` | `1110 1000` | **`0`** | $2^1 = 2$ | $0 \times 2 = 0$ |
| **Bit 2** | `0x7D2` | `0xE9` | `1110 1001` | **`1`** | $2^2 = 4$ | $1 \times 4 = 4$ |
| **Bit 3** | `0x7D3` | `0xE9` | `1110 1001` | **`1`** | $2^3 = 8$ | $1 \times 8 = 8$ |
| **Bit 4** | `0x7D4` | `0xE9` | `1110 1001` | **`1`** | $2^4 = 16$ | $1 \times 16 = 16$ |
| **Bit 5** | `0x7D5` | `0xE8` | `1110 1000` | **`0`** | $2^5 = 32$ | $0 \times 32 = 0$ |
| **Bit 6** | `0x7D6` | `0xE9` | `1110 1001` | **`1`** | $2^6 = 64$ | $1 \times 64 = 64$ |
| **Bit 7** | `0x7D7` | `0xE8` | `1110 1000` | **`0`** | $2^7 = 128$ | $0 \times 128 = 0$ |

Summing weights:
$$\text{Val} = 0 + 0 + 4 + 8 + 16 + 0 + 64 + 0 = \mathbf{92} \quad (0x5C, \ 01011100_2)$$

Applying the inverse arithmetic transform:
$$\text{flag}[0] = 92 + 5 = \mathbf{97} \implies \mathbf{\text{'a'}}$$

The first character matches the expected `academy{` prefix!

### 5.3. Prefix Verification Table (`academy{`)

| Index | Offset Span | 8-Byte Hex Stream | LSB Array (`k=0..7`) | Value | $+5$ Formula | Decoded Glyph |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **0** | `0x07D0 - 0x07D7` | `E8 E8 E9 E9 E9 E8 E9 E8` | `[0, 0, 1, 1, 1, 0, 1, 0]` | `92` (`0x5C`) | $92 + 5 = 97$ | **`a`** |
| **1** | `0x07D8 - 0x07DF` | `E8 E9 E9 E9 E9 E8 E9 E8` | `[0, 1, 1, 1, 1, 0, 1, 0]` | `94` (`0x5E`) | $94 + 5 = 99$ | **`c`** |
| **2** | `0x07E0 - 0x07E7` | `E8 E8 E9 E9 E9 E8 E9 E8` | `[0, 0, 1, 1, 1, 0, 1, 0]` | `92` (`0x5C`) | $92 + 5 = 97$ | **`a`** |
| **3** | `0x07E8 - 0x07EF` | `E9 E9 E9 E9 E9 E8 E9 E8` | `[1, 1, 1, 1, 1, 0, 1, 0]` | `95` (`0x5F`) | $95 + 5 = 100$ | **`d`** |
| **4** | `0x07F0 - 0x07F7` | `E8 E8 E8 E8 E8 E9 E9 E8` | `[0, 0, 0, 0, 0, 1, 1, 0]` | `96` (`0x60`) | $96 + 5 = 101$ | **`e`** |
| **5** | `0x07F8 - 0x07FF` | `E8 E8 E8 E9 E8 E9 E9 E8` | `[0, 0, 0, 1, 0, 1, 1, 0]` | `104` (`0x68`) | $104 + 5 = 109$ | **`m`** |
| **6** | `0x0800 - 0x0807` | `E8 E8 4F 4E 4F 4F 4F E8` | `[0, 0, 1, 0, 1, 1, 1, 0]` | `116` (`0x74`) | $116 + 5 = 121$ | **`y`** |
| **7** | `0x0808 - 0x080F` | `E8 E9 E9 E8 E9 E9 E9 E8` | `[0, 1, 1, 0, 1, 1, 1, 0]` | `118` (`0x76`) | $118 + 5 = 123$ | **`{`** |

---

## 6. Automated Python Solver (`solve.py`)

```python
#!/usr/bin/env python3
"""
solve.py — Investigative Reversing 2 Solver
Extracts LSB steganography payload from BMP image files and inverts arithmetic modulation.
"""

import sys
import os

def solve(filename: str, flag_len: int = 50, header_offset: int = 2000) -> str:
    if not os.path.exists(filename):
        raise FileNotFoundError(f"[-] Target file not found: {filename}")

    file_size = os.path.getsize(filename)
    required_bytes = header_offset + (flag_len * 8)
    
    if file_size < required_bytes:
        raise ValueError(
            f"[-] File size too small ({file_size} bytes). Required minimum: {required_bytes} bytes."
        )

    print(f"[*] Processing: {filename} ({file_size:,} bytes)")
    print(f"[*] Skipping Header Offset: {header_offset} bytes")
    print(f"[*] Extracting payload: {flag_len * 8} bytes ({flag_len} chars × 8 bits)")

    flag_bits = []
    with open(filename, "rb") as f:
        f.seek(header_offset)
        payload = f.read(flag_len * 8)
        for byte in payload:
            flag_bits.append(byte & 1)

    recovered_chars = []
    for i in range(0, len(flag_bits), 8):
        byte_bits = flag_bits[i:i+8]
        val = sum(bit << idx for idx, bit in enumerate(byte_bits))
        recovered_chars.append(chr(val + 5))

    flag = "".join(recovered_chars)
    return flag

if __name__ == "__main__":
    target = "encoded.bmp"
    try:
        flag = solve(target)
        print("\n" + "=" * 65)
        print(f"[+] RECOVERED FLAG: {flag}")
        print(f"[+] Length        : {len(flag)} characters")
        print("=" * 65)
    except Exception as e:
        print(f"[!] Error during extraction: {e}", file=sys.stderr)
        sys.exit(1)
```

Execution output:
```text
[*] Processing: encoded.bmp (1,507,414 bytes)
[*] Skipping Header Offset: 2000 bytes
[*] Extracting payload: 400 bytes (50 chars × 8 bits)

=================================================================
[+] RECOVERED FLAG: academy{n3xt_0n30000000000000000000000000b2a84f53}
[+] Length        : 50 characters
=================================================================
```

---

## 7. Forensic Detection & Steganalysis

If an investigator encounters an artifact **without an accompanying binary**, advanced steganalysis methods expose the presence of the hidden channel:

### 7.1. Chi-Square ($\chi^2$) Attack on Pairs of Values (PoVs)
In natural uncompressed imagery, adjacent color channel values $(2k, 2k+1)$ follow continuous natural gradients. Sequential LSB substitution equalizes the distribution of adjacent pairs:

$$N_{2k} \approx N_{2k+1} \approx \frac{N_{2k} + N_{2k+1}}{2}$$

Running a sliding-window Chi-Square test:
- Across natural pixel coordinates: $p\text{-value} \approx 0$.
- Within offsets **2000 to 2400**: $p\text{-value}$ spikes sharply toward **1.0**, exposing the localized embedding envelope without disassembly.

### 7.2. LSB Bit-Plane Slicing
Isolating the lowest bit plane reveals visual anomalies:

$$\text{Mask}(x, y) = (\text{Pixel}(x, y) \ \& \ 1) \times 255$$

While natural pixel planes exhibit uniform sensor noise, the 400-byte embedding window creates a sharp structural horizontal streak distinct from ambient sensor noise.

### 7.3. Real-World Threat Parallels (Stegware & APTs)
- **Stegoloader (Gatak Malware):** Stored encrypted PE payload modules inside BMP channels on legitimate public image hosting platforms, dynamically carving them directly into memory to bypass EDR file inspection.
- **OceanLotus (APT32):** Embedded secondary shellcode within `.ico` and `.bmp` files to evade deep packet inspection gateways.
