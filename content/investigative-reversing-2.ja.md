---
title: Investigative Reversing 2 – IDA Pro による LSB ステガノグラフィとビット演算の解析
date: '2026-11-10'
excerpt: >-
  IDA Pro を駆使して BMP 画像に埋め込まれた LSB ステガノグラフィ、算術変調、
  およびリトルエンディアンのビット順序を徹底解明し、Python による自動フラグ復元ツールを構築する。
featured: /thumbnails/investigative-reversing.jpg
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

> *"デジタルフォレンジックおよび情報セキュリティにおいて、ステガノグラフィの目的はデータを複雑な暗号文に変形することではない。通信チャネル（Covert Channel）の存在そのものを完全に隠蔽することにある。数百万ピクセルからなる非圧縮ビットマップ画像は、人間の視覚閾値を巧みに突くことで、極めて強力なペイロード運搬媒体へと変貌する。"*

---

## 1. 証拠品のトリアージとプロファイリング

`investigative-reversing-2` の調査にあたり、2点の重要証拠物が提供される:

1. **実行ファイル:** `mystery`
2. **疑わしいメディアファイル:** `encoded.bmp`

### 証拠物プロファイル一覧:

| 属性 | 実行可能バイナリ (`mystery`) | 画像アーティファクト (`encoded.bmp`) |
| :--- | :--- | :--- |
| **ファイル形式** | ELF 64-bit LSB pie executable, x86-64 | PC bitmap, Windows 3.x format |
| **サイズ** | 16,784 bytes | 1,507,414 bytes (1.43 MB) |
| **解像度** | N/A | 1765 × 852 pixels, 24 bpp (RGB) |
| **SHA-256 ハッシュ** | `2802b225bd1d019fe099bae09ad659726874fd0e7eca60b10d7077f35de7263e` | `0fa3f4a80b9dbf81de84b25d86d5aec37baf3e0658b9f3eb6f295fb658d00293` |

![解析対象画像](/img/writeups/investigative-reversing-2/encoded.png)
*encoded.bmp の表示状態: 肉眼では歪みや色収差、ノイズパターンは一切知覚されず、完全に正常な画像に見える。*

Part 1（`Investigative Reversing 1`）では、PNG の `IEND` チャンク以降にデータを追記する **末尾追加型ステガノグラフィ（EOF Injection）** を扱った。本問（Part 2）では対象が **BMP** に変化し、隠蔽手法もピクセルの最下位ビット（LSB）を直接操作する微細構造レイヤーへと高度化している。

---

## 2. BMP 構造の解剖とセーフハーバー領域

### 2.1. Windows ビットマップ（BMP）のバイナリ構造
非圧縮ビットマップはヘッダと連続したラスターデータで構成される:

- **BITMAPFILEHEADER (14バイト):** マジックナンバー `BM` (`0x4D42`)、総ファイルサイズ `bfSize`、およびピクセル配列への開始オフセット `bfOffBits`。
- **BITMAPINFOHEADER (40バイト):** 幅、高さ、カラープレーン数、色深度（24 bpp = 1ピクセルあたり B-G-R の3バイト）、圧縮形式（`BI_RGB` = 0、非圧縮）。
- **Pixel Array (ラスターデータ):** 下から上に向かって（Bottom-up）走査線単位で配置された生のRGB値。

```
+--------------------------+  Offset 0x00
| BITMAPFILEHEADER (14 B)  |  Magic "BM", File Size
+--------------------------+  Offset 0x0E
| BITMAPINFOHEADER (40 B)  |  Width, Height, 24 bpp
+--------------------------+  Offset 0x36
| Color Profile / Padding  |
+--------------------------+  Offset 0x7D0 (2000 10進数)
| >>> 秘密データ埋め込み領域 <<<|  400 バイトの LSB ペイロード
+--------------------------+  Offset 0x960 (2400 10進数)
| 残余ピクセル配列          |  元画像のピクセルが継続
+--------------------------+  EOF (1,507,414 bytes)
```

### 2.2. なぜ先頭 2000 バイトをスキップするのか？
`main` 関数を解析すると、プログラムが `original.bmp` の先頭 **2000バイト**（`0x7D0`）をそのまま `encoded.bmp` へ複製していることが判明する:

```c
v11 = 2000;
for ( i = 0; i < v11; ++i )
{
  fputc(ptr, v15);
  v6 = fread(&ptr, 1u, 1u, stream);
}
```

この 2000 バイトのオフセットには明確な理由がある:
1. **ヘッダおよびDIB構造の破壊防止:** ジオメトリや解像度フィールドの破損を防ぎ、OS 標準の画像ビューアで何のエラーもなく表示できるようにする。
2. **簡易スキャナの回避:** 簡易的なファイル検証ツールは先頭数百バイトのみを検査するため、検証をすり抜けることができる。

---

## 3. IDA Pro によるバイナリ解析

IDA Pro で `mystery` をロードし、`main` 関数および埋め込み処理を行う `codedChar` 関数を解析する。

### 3.1. `main` 関数の処理フロー

Hex-Rays による逆コンパイルコード:

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
  _BYTE v16[56];// フラグ読み込み用バッファ
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

  // [フェーズ 1] 先頭 2000 バイト (0x7D0) を無変更で複製
  v11 = 2000;
  for ( i = 0; i < v11; ++i )
  {
    fputc(ptr, v15);
    v6 = fread(&ptr, 1u, 1u, stream);
  }

  // [フェーズ 2] フラグの長さ検証: 0x32 = 50 文字
  v12 = fread(v16, 0x32u, 1u, v13);
  if ( v12 <= 0 )
  {
    puts("flag is not 50 chars");
    exit(0);
  }

  // [フェーズ 3] ビット埋め込みループ
  for ( j = 0; j <= 49; ++j )        // 50文字を1文字ずつ走査
  {
    for ( k = 0; k <= 7; ++k )       // 1文字あたり8ビットを走査
    {
      v5 = codedChar(k, v16[j] - 5, ptr);
      fputc(v5, v15);
      fread(&ptr, 1u, 1u, stream);
    }
  }

  // [フェーズ 4] 残りの画像データをすべてフラッシュ
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
> **IDA Pro の操作テクニック:** `fread(v16, 0x32u, 1u, v13);` の `0x32u` にカーソルを合わせて **`H`** キーを押すと、即座に10進数表記（`50`）に切り替わる。`0x7D0` も同様に `2000` と表示できる。

---

### 3.2. `codedChar` のアセンブリ解析

`codedChar` の逆アセンブル（x86-64 機械語）:

```x86asm
.text:0000000000001195  codedChar       proc near
.text:0000000000001195                  push    rbp
.text:0000000000001196                  mov     rbp, rsp
.text:0000000000001199                  mov     [rbp+var_14], edi       ; edi = a1 = k (ビットインデックス 0..7)
.text:000000000000119C                  mov     eax, esi
.text:000000000000119E                  mov     [rbp+var_18], al        ; al  = a2 = (flag[j] - 5)
.text:00000000000011A1                  mov     eax, edx
.text:00000000000011A3                  mov     [rbp+var_1C], al        ; al  = a3 = pixel_byte
.text:00000000000011A6                  mov     [rbp+var_2], 1          ; マスク 0x01
.text:00000000000011AA                  mov     [rbp+var_1], 0FEh       ; マスク 0xFE (11111110b)
.text:00000000000011AE                  cmp     [rbp+var_14], 0         ; k == 0 の判定
.text:00000000000011B2                  jz      short loc_11C4
.text:00000000000011B4                  movsx   edx, [rbp+var_18]
.text:00000000000011B8                  mov     eax, [rbp+var_14]
.text:00000000000011BB                  mov     ecx, eax
.text:00000000000011BD                  sar     edx, cl                 ; 右算術シフト: (char - 5) >> k
.text:00000000000011BF                  mov     eax, edx
.text:00000000000011C1                  mov     [rbp+var_18], al
.text:00000000000011C4  loc_11C4:
.text:00000000000011C4                  movzx   eax, [rbp+var_2]
.text:00000000000011C8                  and     [rbp+var_18], al        ; ビットk抽出: ((char - 5) >> k) & 1
.text:00000000000011CB                  movzx   eax, [rbp+var_1]
.text:00000000000011CF                  and     [rbp+var_1C], al        ; ピクセルのLSBクリア: pixel_byte & 0xFE
.text:00000000000011D2                  movzx   eax, [rbp+var_18]
.text:00000000000011D6                  or      [rbp+var_1C], al        ; ビット結合: (pixel & 0xFE) | bit_k
.text:00000000000011D9                  movzx   eax, [rbp+var_1C]       ; 変調バイトを返却
.text:00000000000011DD                  pop     rbp
.text:00000000000011DE                  retn
.text:00000000000011DE  codedChar       endp
```

C言語での等価表現:

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

## 4. 埋め込みメカニズムの数理とビット順序

解析結果から、以下の2つの数学的変換規則が導出される:

### 4.1. 算術変調（Arithmetic Obfuscation）
ビット分割前に、各文字 $C_j$ は5だけ減算されている:
$$C'_j = C_j - 5 \implies C_j = C'_j + 5$$

### 4.2. リトルエンディアン形式のビット列（Little-Endian Bitstream）
内側ループ `k` は $0 \to 7$ へ昇順で実行される:
- $k = 0$: $C'_j$ の Bit 0（最下位ビット）が 1バイト目のピクセルに格納される。
- $k = 1$: $C'_j$ の Bit 1 が 2バイト目のピクセルに格納される。
- $\dots$
- $k = 7$: $C'_j$ の Bit 7（最上位ビット）が 8バイト目のピクセルに格納される。

これは **リトルエンディアン形式のビットストリーム** だ。8つの連続するピクセルバイト（$B_0 \dots B_7$）から元の $C'_j$ を再構築する計算式は以下の通りとなる:

$$C'_j = \sum_{k=0}^{7} (B_k \ \& \ 1) \cdot 2^k = \bigvee_{k=0}^{7} \Big((B_k \ \& \ 1) \ll k\Big)$$

---

## 5. 手動データ抽出ステップ（Step-by-Step Manual Extraction）

### 5.1. オフセットの特定
- **開始オフセット:** 先頭 2000 バイトをスキップ $\rightarrow \mathbf{0x7D0}_{16}$ ($2000_{10}$)。
- **ペイロード長:** 50 文字 $\times$ 8 バイト = 400 バイト。
- **抽出範囲:** `0x7D0` から `0x95F`（10進数で $2000 \to 2399$）。

### 5.2. `flag[0]` の復元実例
オフセット `0x7D0` の先頭8バイトを読み出す:

```
Offset          Hex View                     ASCII
000007D0        E8 E8 E9 E9 E9 E8 E9 E8      ........
```

各バイトの最下位ビット（$k = 0 \dots 7$）を抽出:

| ビット ($k$) | オフセット | バイト値 | 2進数表記 | LSB (`b & 1`) | 重み ($2^k$) | 加算値 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Bit 0** | `0x7D0` | `0xE8` | `1110 1000` | **`0`** | $2^0 = 1$ | $0 \times 1 = 0$ |
| **Bit 1** | `0x7D1` | `0xE8` | `1110 1000` | **`0`** | $2^1 = 2$ | $0 \times 2 = 0$ |
| **Bit 2** | `0x7D2` | `0xE9` | `1110 1001` | **`1`** | $2^2 = 4$ | $1 \times 4 = 4$ |
| **Bit 3** | `0x7D3` | `0xE9` | `1110 1001` | **`1`** | $2^3 = 8$ | $1 \times 8 = 8$ |
| **Bit 4** | `0x7D4` | `0xE9` | `1110 1001` | **`1`** | $2^4 = 16$ | $1 \times 16 = 16$ |
| **Bit 5** | `0x7D5` | `0xE8` | `1110 1000` | **`0`** | $2^5 = 32$ | $0 \times 32 = 0$ |
| **Bit 6** | `0x7D6` | `0xE9` | `1110 1001` | **`1`** | $2^6 = 64$ | $1 \times 64 = 64$ |
| **Bit 7** | `0x7D7` | `0xE8` | `1110 1000` | **`0`** | $2^7 = 128$ | $0 \times 128 = 0$ |

合計値:
$$\text{Val} = 0 + 0 + 4 + 8 + 16 + 0 + 64 + 0 = \mathbf{92} \quad (0x5C, \ 01011100_2)$$

算術変調を反転（$+5$）:
$$\text{flag}[0] = 92 + 5 = \mathbf{97} \implies \mathbf{\text{'a'}}$$

最初の文字が `academy{` の先頭文字 `'a'` と完全に合致した。

### 5.3. 先頭 8 文字のマッピング検証表 (`academy{`)

| インデックス | オフセット範囲 | 8バイトHex列 | LSB 配列 (`k=0..7`) | 算出値 | $+5$ 逆算 | 復元文字 |
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

## 6. 自動化ソルバースクリプト (Python)

```python
#!/usr/bin/env python3
"""
solve.py — Investigative Reversing 2 Solver
BMPファイルからLSBステガノグラフィのペイロードを抽出し、算術変調を反転してフラグを復元する。
"""

import sys
import os

def solve(filename: str, flag_len: int = 50, header_offset: int = 2000) -> str:
    if not os.path.exists(filename):
        raise FileNotFoundError(f"[-] ファイルが見つかりません: {filename}")

    file_size = os.path.getsize(filename)
    required_bytes = header_offset + (flag_len * 8)
    
    if file_size < required_bytes:
        raise ValueError(
            f"[-] ファイルサイズが小さすぎます ({file_size} bytes)。必要最小: {required_bytes} bytes。"
        )

    print(f"[*] 対象ファイル読み込み: {filename} ({file_size:,} bytes)")
    print(f"[*] ヘッダオフセットスキップ: {header_offset} bytes")
    print(f"[*] ペイロード抽出: {flag_len * 8} bytes ({flag_len} 文字 × 8 bits)")

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
        print(f"[+] 復元フラグ: {flag}")
        print(f"[+] フラグ長  : {len(flag)} 文字")
        print("=" * 65)
    except Exception as e:
        print(f"[!] 抽出時エラー: {e}", file=sys.stderr)
        sys.exit(1)
```

実行結果:
```text
[*] 対象ファイル読み込み: encoded.bmp (1,507,414 bytes)
[*] ヘッダオフセットスキップ: 2000 bytes
[*] ペイロード抽出: 400 bytes (50 文字 × 8 bits)

=================================================================
[+] 復元フラグ: academy{n3xt_0n30000000000000000000000000b2a84f53}
[+] フラグ長  : 50 文字
=================================================================
```

---

## 7. フォレンジック検知手法（ステガナリシス）

バイナリが存在しない状況において、統計的手法によってこの隠蔽チャネルを検出・特定する技術:

### 7.1. カイ二乗検定（$\chi^2$ Attack on PoVs）
自然画像において、隣接するカラー値のペア $(2k, 2k+1)$（Pairs of Values）の出現頻度は滑らかなグラデーションを描く。連続的なLSB置換を行うと、両者の出現頻度がほぼ等しくなる:

$$N_{2k} \approx N_{2k+1} \approx \frac{N_{2k} + N_{2k+1}}{2}$$

スライディングウィンドウによるカイ二乗統計検定を実行すると、通常領域では $p\text{-value} \approx 0$ であるのに対し、オフセット **2000〜2400** の範囲でのみ $p\text{-value}$ が急激に **1.0** 付近へと跳ね上がる。これにより逆アセンブルを行わずとも埋め込み区間を特定できる。

### 7.2. LSB ビットプレーンのスライシング
各ピクセルの最下位ビットのみを二値化して可視化すると、センサー由来の均一なホワイトノイズの中に、データが埋め込まれた400バイトの区間のみが構造的な水平ラインとなって露見する。
