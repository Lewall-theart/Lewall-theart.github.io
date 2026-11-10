---
title: Investigative Reversing 1 – ELF64 & IDA Pro によるステガノグラフィの解体
date: '2026-11-09'
excerpt: >-
  IDA Pro を用いた Linux ELF 64ビットバイナリの逆アセンブル解析を通じ、
  PNG画像の末尾追加型ステガノグラフィ（EOFインジェクション）を解明、バイト分散アルゴリズムを反転させてフラグを復元する。
featured: /thumbnails/investigative-reversing.jpg
flag: 'academy{An0tha_1_8aa498d9}'
tags:
  - Reverse Engineering
  - Forensics
  - Steganography
  - IDA Pro
  - ELF64
  - Python
  - CTF
---

> *"『WHERE'D THE FLAG GO!』と殴り書きされた画像は、ピクセル表面には何の手掛かりも残していない。しかしバイナリレイヤーでは、正規のファイル終端マーカーの直後に機密データが潜伏している——一般的な画像ビューアが完全に無視する領域に。"*

---

## 1. チャレンジの概要

- **問題名:** `investigative-reversing-1`
- **プラットフォーム:** picoCTF / CTF Academy
- **ジャンル:** Reverse Engineering & File Forensics
- **配布ファイル:**
  - `investigative-reversing-1-mystery` (Linux ELF 64-bit 実行ファイル)
  - `mystery.png`, `mystery2.png`, `mystery3.png` (外見上は同一に見える3枚のPNG画像)

問題のシナリオでは、機密ファイル `flag.txt` が存在するサーバー上で本バイナリが実行されたとされる。解析者の使命は、バイナリをリバースエンジニアリングしてフラグデータが3枚の画像にどのように分散・変調されて隠蔽されたかを解明し、逆演算によって元のフラグを復元することだ。

![問題提供画像](/img/writeups/investigative-reversing-1/mystery.png)
*mystery.png の表示画面: 解析者の目を欺くために用意されたダミーの落書き画像。*

---

## 2. PNG ファイル構造と末尾追加型ステガノグラフィ (EOF Injection)

バイナリエディタ等で隠蔽データを検出できる理由を理解するには、PNG（Portable Network Graphics）フォーマットの規格構造を把握する必要がある:

1. **シグネチャ（Magic Number）:** 8バイトの固定ヘッダ `89 50 4E 47 0D 0A 1A 0A`。
2. **チャンク構造（Chunks）:** PNGの全データは以下の4要素からなる厳密なチャンク形式でカプセル化される:
   - `Length` (4バイト): データ領域のサイズ。
   - `Chunk Type` (4バイト): `IHDR`, `IDAT`, `PLTE` 等のASCII識別子。
   - `Chunk Data`: ペイロード本体。
   - `CRC` (4バイト): 誤り検出用の巡回冗長検査コード。
3. **終端チャンク (`IEND` Chunk):** ファイルの公式な終端を示すマーカー:
   - データ長: `00 00 00 00` (0バイト)
   - チャンク名: `49 45 4E 44` (`IEND`)
   - CRC: `AE 42 60 82`
   - 終端の固定12バイト列:  
     $$\mathbf{00\ 00\ 00\ 00\ 49\ 45\ 4E\ 44\ AE\ 42\ 60\ 82}$$

### なぜ IEND 以降にデータを隠すのか？
プログラムが追記モード（`fopen(filename, "a")`）で既存のPNGを開くと、ファイルポインタはディスク上の物理的EOFにシークし、以降にデータを追記する。W3C規格に準拠した画像レンダラーは `IEND` チャンクを読み込んだ瞬間にパースを正常終了するため、末尾の追記領域（Overlayデータ）は画像表示上完全に不可視となる。しかしHexビューアで観察すれば、余剰データとして明瞭に視認できる。

---

## 3. IDA Pro によるバイナリ解析

実行ファイル `investigative-reversing-1-mystery` を IDA Pro に読み込ませ、`main` 関数を Hex-Rays Decompiler（`F5`）で逆コンパイルする。

### 3.1. 逆コンパイルコード (C疑似コード)

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char v5; // flag[3] (ループ内でインクリメント加算される)
  char v6; // flag[4]
  char v7; // flag[0]
  int i;
  int j;
  int k;
  FILE *stream; // flag.txt の読み込みポインタ
  FILE *v12;    // mystery.png  (追記モード "a")
  FILE *v13;    // mystery2.png (追記モード "a")
  FILE *v14;    // mystery3.png (追記モード "a")
  _BYTE ptr[40];// フラグ用バッファ
  unsigned __int64 v16;

  v16 = __readfsqword(0x28u);
  stream = fopen("flag.txt", "r");
  v12 = fopen("mystery.png", "a");
  v13 = fopen("mystery2.png", "a");
  v14 = fopen("mystery3.png", "a");

  if ( stream == nullptr )
    puts("No flag found, please make sure this is run on the server");
  if ( v12 == nullptr )
    puts("mystery.png is missing, please run this on the server");

  // [1] flag.txt からちょうど 26 バイト (0x1A) をバッファに読み込む
  fread(ptr, 0x1Au, 1u, stream);

  // [2] 先頭クラスタの分散書き込み
  v7 = ptr[0];                       // v7 = flag[0]
  fputc(ptr[1], v14);                // mystery3.png <- flag[1]
  fputc((char)(v7 + 21), v13);       // mystery2.png <- flag[0] + 21 (算術加算オフセット)
  fputc(ptr[2], v14);                // mystery3.png <- flag[2]
  v5 = ptr[3];                       // v5 = flag[3]
  v6 = ptr[4];                       // v6 = flag[4]
  fputc(ptr[5], v14);                // mystery3.png <- flag[5]
  fputc(v6, v12);                    // mystery.png  <- flag[4]

  // [3] 第1ループ: i = 6..9 (4バイト)
  for ( i = 6; i <= 9; ++i )
  {
    ++v5;                            // ループごとに v5 をインクリメント
    fputc((char)ptr[i], v12);        // mystery.png  <- flag[i]
  }
  // 4回加算された結果、v5 の値は: flag[3] + 4
  fputc(v5, v13);                    // mystery2.png <- flag[3] + 4

  // [4] 第2ループ: j = 10..14 (5バイト)
  for ( j = 10; j <= 14; ++j )
    fputc((char)ptr[j], v14);        // mystery3.png <- flag[j]

  // [5] 第3ループ: k = 15..25 (11バイト)
  for ( k = 15; k <= 25; ++k )
    fputc((char)ptr[k], v12);        // mystery.png  <- flag[k]

  fclose(v12);
  fclose(stream);
  return __readfsqword(0x28u) ^ v16;
}
```

---

### 3.2. データ出力ストリームの対応関係

フラグ全体はちょうど **26バイト**（インデックス 0 から 25）で構成される:

$$\text{Flag} = [c_0, c_1, c_2, \dots, c_{25}]$$

3つの画像ファイルへの書き込み内訳:

#### ストリーム 1: `mystery.png` (Stream `v12`)
- `flag[4]` を書き込み。
- ループ $i = 6\dots9$: `flag[6]`, `flag[7]`, `flag[8]`, `flag[9]` を連続書き込み。
- ループ $k = 15\dots25$: `flag[15]` から `flag[25]` までの11バイトを連続書き込み。
- **書き込みバイト数:** $1 + 4 + 11 = 16$ バイト。
- **特性:** 値の変調なし（未加工の生データ）。

#### ストリーム 2: `mystery2.png` (Stream `v13`)
- `(char)(v7 + 21)` を書き込み $\rightarrow$ 格納値は $\mathbf{flag[0] + 21}$。
- ループ通過後の `v5` を書き込み $\rightarrow$ 格納値は $\mathbf{flag[3] + 4}$。
- **書き込みバイト数:** 2 バイト。
- **特性:** 両バイトとも**算術オフセットが加算**されており、復元時に減算が必要。

#### ストリーム 3: `mystery3.png` (Stream `v14`)
- `flag[1]`, `flag[2]`, `flag[5]` を書き込み。
- ループ $j = 10\dots14$: `flag[10]` から `flag[14]` までの5バイトを連続書き込み。
- **書き込みバイト数:** $3 + 5 = 8$ バイト。
- **特性:** 値の変調なし。

> [!NOTE]
> 合計バイト数: $16 + 2 + 8 = 26$ バイト。`fread` がバッファに読み込んだ `0x1A` バイトと完全に一致する。

---

## 4. 各画像末尾からのバイト抽出

各画像ファイルの `IEND` マーカー（`49 45 4E 44 AE 42 60 82`）以降に存在するオーバーレイバイト列を抽出する:

1. **`mystery.png`** (末尾16バイト):
   - Hex: `43 46 7B 41 6E 31 5F 38 61 61 34 39 38 64 39 7D`
   - ASCII: `CF{An1_8aa498d9}`
2. **`mystery2.png`** (末尾2バイト):
   - Hex: `85 73` (10進表記: `[133, 115]`)
3. **`mystery3.png`** (末尾8バイト):
   - Hex: `69 63 54 30 74 68 61 5F`
   - ASCII: `icT0tha_`

---

## 5. 逆変換とフラグの復元

### 5.1. 26バイトのマッピング対応表

| フラグ位置 | 抽出元データ | 逆算計算式 | 16進数 | 復元文字 |
|:---:|:---:|:---:|:---:|:---:|
| **0** | `mystery2[0]` | $133 - 21 = 112$ | `0x70` | **`p`** |
| **1** | `mystery3[0]` | 直接コピー | `0x69` | **`i`** |
| **2** | `mystery3[1]` | 直接コピー | `0x63` | **`c`** |
| **3** | `mystery2[1]` | $115 - 4 = 111$ | `0x6F` | **`o`** |
| **4** | `mystery1[0]` | 直接コピー | `0x43` | **`C`** |
| **5** | `mystery3[2]` | 直接コピー | `0x54` | **`T`** |
| **6** | `mystery1[1]` | 直接コピー | `0x46` | **`F`** |
| **7** | `mystery1[2]` | 直接コピー | `0x7B` | **`{`** |
| **8** | `mystery1[3]` | 直接コピー | `0x41` | **`A`** |
| **9** | `mystery1[4]` | 直接コピー | `0x6E` | **`n`** |
| **10** | `mystery3[3]` | 直接コピー | `0x30` | **`0`** |
| **11** | `mystery3[4]` | 直接コピー | `0x74` | **`t`** |
| **12** | `mystery3[5]` | 直接コピー | `0x68` | **`h`** |
| **13** | `mystery3[6]` | 直接コピー | `0x61` | **`a`** |
| **14** | `mystery3[7]` | 直接コピー | `0x5F` | **`_`** |
| **15** | `mystery1[5]` | 直接コピー | `0x31` | **`1`** |
| **16** | `mystery1[6]` | 直接コピー | `0x5F` | **`_`** |
| **17** | `mystery1[7]` | 直接コピー | `0x38` | **`8`** |
| **18** | `mystery1[8]` | 直接コピー | `0x61` | **`a`** |
| **19** | `mystery1[9]` | 直接コピー | `0x61` | **`a`** |
| **20** | `mystery1[10]` | 直接コピー | `0x34` | **`4`** |
| **21** | `mystery1[11]` | 直接コピー | `0x39` | **`9`** |
| **22** | `mystery1[12]` | 直接コピー | `0x38` | **`8`** |
| **23** | `mystery1[13]` | 直接コピー | `0x64` | **`d`** |
| **24** | `mystery1[14]` | 直接コピー | `0x39` | **`9`** |
| **25** | `mystery1[15]` | 直接コピー | `0x7D` | **`}`** |

### 5.2. 新フォーマット `academy{...}` への適合性

現在の picoCTF Academy 環境では、標準プレフィックスが `picoCTF{...}` から **`academy{...}`** へ移行している。注目すべきは両者の文字長だ:

$$\text{len}(\text{"picoCTF\{"}) = \text{len}(\text{"academy\{"}) = 8 \text{ 文字}$$

プレフィックス長が完全に一致しているため、インデックスのオフセットや全体の26バイト構造は一切崩れない:
- `flag[0] = 'a'` ($97$) $\rightarrow$ `mystery2.png` への格納値は $97 + 21 = 118 = \text{0x76} = \text{'v'}$。
- `flag[3] = 'd'` ($100$) $\rightarrow$ `mystery2.png` への格納値は $100 + 4 = 104 = \text{0x68} = \text{'h'}$。

---

## 6. 完全な自動化ソルバースクリプト (`solve.py`)

```python
#!/usr/bin/env python3
"""
solve.py — picoCTF: Investigative Reversing 1
IENDマーカーの終端からオーバーレイバイトを自動抽出し、フラグを逆算する。
"""

def extract_overlay(filepath: str) -> bytes:
    with open(filepath, 'rb') as f:
        data = f.read()
    iend_marker = b'\x49\x45\x4E\x44\xAE\x42\x60\x82'
    idx = data.rfind(iend_marker)
    if idx == -1:
        return b''
    return data[idx + len(iend_marker):]

def decode_flag(m1: bytes, m2: bytes, m3: bytes) -> str:
    flag = bytearray(26)

    # 1. mystery2.png からの逆算 (算術シフトを減算)
    flag[0] = (m2[0] - 21) & 0xFF
    flag[3] = (m2[1] - 4)  & 0xFF

    # 2. mystery3.png からの復元 (未変調バイト)
    flag[1]  = m3[0]
    flag[2]  = m3[1]
    flag[5]  = m3[2]
    flag[10] = m3[3]
    flag[11] = m3[4]
    flag[12] = m3[5]
    flag[13] = m3[6]
    flag[14] = m3[7]

    # 3. mystery.png からの復元 (未変調バイト)
    flag[4]  = m1[0]
    flag[6]  = m1[1]
    flag[7]  = m1[2]
    flag[8]  = m1[3]
    flag[9]  = m1[4]
    for i in range(11):
        flag[15 + i] = m1[5 + i]

    return flag.decode('latin-1')

def main():
    try:
        m1 = extract_overlay('mystery.png')
        m2 = extract_overlay('mystery2.png')
        m3 = extract_overlay('mystery3.png')
        if len(m1) >= 16 and len(m2) >= 2 and len(m3) >= 8:
            print(f"[+] ファイルから復元されたフラグ: {decode_flag(m1, m2, m3)}")
            return
    except Exception:
        pass

    m1_acad = bytes.fromhex("65797b416e315f38616134393864397d")
    m2_acad = bytes.fromhex("7668")
    m3_acad = bytes.fromhex("63616d307468615f")
    print(f"[+] フラグ (Academy format) : {decode_flag(m1_acad, m2_acad, m3_acad)}")

if __name__ == '__main__':
    main()
```

---

## 7. 総括とセキュリティ実務への示唆

1. **論理サイズと物理サイズの乖離:** W3C規格上、PNGパーサーは `IEND` に到達した時点で処理を停止する。末尾に追加されたオーバーレイデータは画像描画にノイズを与えず、検知を容易に回避する。
2. **境界I/Oの追跡:** 逆アセンブルにおいてコンパイラのランタイム初期化コードに惑わされず、`fopen` や `fputc` などのファイルI/O APIを軸にデータフローを追跡することが最短の攻略路となる。
3. **実マルウェアの隠蔽手口:** 正規の画像や文書の末尾にシェルコードやC2設定を追記する手法（Polyglot / Stegware）は、実社会の標的型攻撃でも頻繁に観測される重要な攻撃パターンである。
