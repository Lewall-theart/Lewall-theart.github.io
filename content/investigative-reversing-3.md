---
title: Investigative Reversing 3 – Vượt bẫy Mất đồng bộ Khung bit trong Interleaved LSB Steganography
date: '2026-11-10'
excerpt: >-
  Khám phá kỹ thuật giấu tin LSB Steganography xen kẽ (Interleaved LSB) kết hợp cơ chế gây mất đồng bộ khung bit (Framing Error) trong tệp ảnh BMP, dịch ngược mã máy ELF64 với IDA Pro và xây dựng công cụ trích xuất flag tự động bằng Python.
featured: /thumbnails/investigative-reversing.jpg
flag: 'academy{4n0th3r_L5b_pr0bl3m_0000000000000e77bbbaa}'
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

> *"Khi kỹ thuật giấu tin tuần tự (Sequential Steganography) đã trở nên quá dễ bị phát hiện bởi các công cụ tự động, kẻ tấn công bắt đầu điều chế nhịp truyền (Cadence Modulation) và phân tán dữ liệu theo chu kỳ không đều. Một byte nhiễu chèn xen kẽ tưởng chừng vô nghĩa lại có thể trở thành đòn chí mạng gây mất đồng bộ toàn bộ luồng bit đối với những ai chỉ biết giải mã một cách máy móc."*

---

## 1. Khởi tạo Điều tra & Định danh Mẫu vật (Artifact Triage & Profiling)

Tiếp nối chuỗi thử thách điều tra số, ở phần 3 (`investigative-reversing-3`), chúng ta tiếp nhận hai mẫu vật nhị phân:

1. **Tệp thực thi nhị phân:** `mystery`
2. **Tệp đa phương tiện:** `encoded.bmp`

Bảng định danh mẫu vật nhị phân thu thập tại hiện trường:

| Thuộc tính | Tệp thực thi (`mystery`) | Tệp đa phương tiện (`encoded.bmp`) |
| :--- | :--- | :--- |
| **Định dạng file** | ELF 64-bit LSB pie executable, x86-64 | PC bitmap, Windows 3.x format |
| **Kích thước** | 16,784 bytes | 1,507,414 bytes (1.43 MB) |
| **Độ phân giải** | N/A | 1765 × 852 pixels, 24 bpp (RGB) |
| **SHA-256 Hash** | `ecf5a037189e0f750d85248738d07060093f9176b905564d336b8508fa69a0f1` | `457861d20cf903b7941bba7fe932462242d94ba956776e70c4778dfcfc63b27a` |

![Ảnh chứa dữ liệu ẩn](/img/writeups/investigative-reversing-3/encoded.png)
*Hình ảnh hiển thị của encoded.bmp: Dữ liệu raster vẫn bảo toàn độ nguyên vẹn thị giác, không có sai lệch màu có thể phân biệt.*

---

## 2. Sự Tiến Hóa Vector Giấu Tin: Từ Tuần Tự Sang Xen Kẽ (Interleaved)

Để đánh giá đúng mức độ tinh vi của thử thách này, ta cần nhìn lại sự phát triển qua 3 cấp độ:

```
+-----------------------------------------------------------------------------------+
| Cấp độ 1 (Investigative Reversing 1): EOF Overlay Steganography                  |
| [PNG Header + IDAT + IEND] ---> [Nối trực tiếp 26 bytes flag vào sau tệp]        |
+-----------------------------------------------------------------------------------+
| Cấp độ 2 (Investigative Reversing 2): Continuous LSB + Arithmetic Shift (-5)      |
| [2000B Header] ---> [400B LSB liên tục: 50 ký tự × 8 bit nhúng tuần tự]          |
+-----------------------------------------------------------------------------------+
| Cấp độ 3 (Investigative Reversing 3): Interleaved LSB + Bit Desynchronization     |
| [723B Header] ---> [8B Bit Dữ Liệu] [1B Dummy] [8B Bit Dữ Liệu] [1B Dummy] ...   |
+-----------------------------------------------------------------------------------+
```

Ở bài 3, người ra đề đã áp dụng hai thay đổi chiến thuật:
1. **Thay đổi vị trí bắt đầu (Header Offset):** Dịch chuyển từ `2000` (`0x7D0`) về **`723`** (`0x2D3`).
2. **Loại bỏ biến đổi số học:** Không còn phép trừ 5 (`- 5`), ký tự flag được lưu trữ trực tiếp dưới dạng mã ASCII gốc.
3. **Kỹ thuật xen kẽ nhịp truyền (Interleaving Pattern):** Sau mỗi 8 byte mang tin, chương trình cố tình chép nguyên vẹn **1 byte gốc** mà không giấu bit nào vào đó.

---

## 3. Dịch Ngược Nhị Phân với IDA Pro (Disassembly & Decompilation)

Nạp tệp thực thi vào IDA Pro, phân tích đồ thị luồng điều khiển (Control Flow Graph) của hàm `main`.

### 3.1. Mã giả C Decompiled (`main`)

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char ptr; 
  char v5; 
  int v6; 
  int i, j, k; 
  int v10, v11, v12; 
  FILE *v13;    // stream flag.txt
  FILE *stream; // stream original.bmp
  FILE *v15;    // stream encoded.bmp (chế độ append "a")
  _BYTE v16[56];// Buffer chứa 50 ký tự flag
  unsigned __int64 v17;

  v17 = __readfsqword(0x28u);
  v10 = 0;
  v13 = fopen("flag.txt", "r");
  stream = fopen("original.bmp", "r");
  v15 = fopen("encoded.bmp", "a");

  if ( v13 == nullptr )
    puts("No flag found, please make sure this is run on the server");
  if ( stream == nullptr )
    puts("No output found, please run this on the server");

  v6 = fread(&ptr, 1u, 1u, stream);

  // [Phase 1] Sao chép nguyên trạng 723 byte đầu tiên (0x2D3)
  v11 = 723;
  for ( i = 0; i < v11; ++i )
  {
    fputc(ptr, v15);
    v6 = fread(&ptr, 1u, 1u, stream);
  }

  // [Phase 2] Đọc flag: đúng 50 ký tự (0x32)
  v12 = fread(v16, 0x32u, 1u, v13);
  if ( v12 <= 0 )
  {
    puts("Invalid Flag");
    exit(0);
  }

  // [Phase 3] Vòng lặp nhúng dữ liệu xen kẽ: j chạy từ 0 đến 99 (100 lần lặp)
  for ( j = 0; j <= 99; ++j )
  {
    if ( (j & 1) != 0 )   // Kiểm tra nếu j LẺ (1, 3, 5, ..., 99)
    {
      // Nhánh Lẻ: Copy 1 byte ảnh gốc sang ảnh đích, KHÔNG nhúng bit
      fputc(ptr, v15);
      fread(&ptr, 1u, 1u, stream);
    }
    else                  // Kiểm tra nếu j CHẴN (0, 2, 4, ..., 98)
    {
      // Nhánh Chẵn: j / 2 duyệt lần lượt qua các ký tự v16[0] đến v16[49]
      for ( k = 0; k <= 7; ++k )
      {
        v5 = codedChar(k, v16[j / 2], ptr); // Lưu ý: v16[j / 2] trực tiếp, không có "- 5"
        fputc(v5, v15);
        fread(&ptr, 1u, 1u, stream);
      }
    }
  }

  // [Phase 4] Sao chép toàn bộ pixel còn lại
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
> **Thao tác trong IDA Pro:** Tại dòng `v11 = 723;`, nếu màn hình đang hiển thị `0x2D3`, chỉ cần đặt con trỏ tại hằng số đó và nhấn phím **`H`** để đổi sang cơ số 10 (`723`). Tương tự, `0x32u` đổi thành `50`.

### 3.2. Bóc tách Assembly x86_64: Nhánh Rẽ Điều Kiện `j & 1`
Tại địa chỉ `0x1331` trong hàm `main`, trình biên dịch GCC tối ưu hóa phép kiểm tra số lẻ bằng chỉ thị `and eax, 1`:

```x86asm
.text:0000000000001331  mov     eax, [rbp+var_6C]       ; eax = j
.text:0000000000001334  and     eax, 1                  ; Kiểm tra bit 0 của j (j & 1)
.text:0000000000001337  test    eax, eax
.text:0000000000001339  jnz     short loc_13AB          ; Nếu j LẺ -> Nhảy đến loc_13AB (Dummy byte)
; --- NHÁNH CHẴN (j & 1 == 0): Nhúng 8 bit của flag[j / 2] ---
.text:000000000000134E  mov     ecx, eax
.text:0000000000001350  shr     ecx, 1Fh
.text:0000000000001353  add     eax, ecx
.text:0000000000001355  sar     eax, 1                  ; eax = j / 2
.text:0000000000001359  movzx   eax, [rbp+rax+var_40]   ; Lấy ký tự flag[j / 2]
.text:0000000000001368  call    codedChar               ; Nhúng bit vào pixel byte
...
; --- NHÁNH LẺ (j & 1 != 0): Copy byte nguyên bản ---
.text:00000000000013AB  loc_13AB:
.text:00000000000013AB  movzx   eax, [rbp+ptr]
.text:00000000000013AF  movsx   eax, al
.text:00000000000013B2  mov     rdx, [rbp+var_48]
.text:00000000000013B6  mov     rsi, rdx                ; stream encoded.bmp
.text:00000000000013B9  mov     edi, eax                ; c = ptr
.text:00000000000013BB  call    .fputc                  ; Ghi trực tiếp, không qua codedChar
```

Hàm `codedChar` hoàn toàn giống bài 2:
$$B_{\text{out}} = (C \gg k \ \& \ 1) \ | \ (B_{\text{in}} \ \& \ \text{0xFE})$$
Điểm khác biệt then chốt là biến truyền vào hàm `codedChar` là **`v16[j / 2]`** thay vì `v16[j] - 5`.

---

## 4. Bản Chất của "Bẫy Mất Đồng Bộ Khung Bit" (Bit Desynchronization & Framing Error)

Tại sao một byte đệm đơn giản lại có thể đánh bại các công cụ trích xuất LSB tự động thông thường?

### Hiện tượng Trượt Bit (Bit Slip)
Giả sử chuyên gia điều tra không đọc kỹ nhánh rẽ `if (j & 1 != 0)` và áp dụng script trích xuất liên tục 400 bytes LSB như bài 2:

```
Thực tế trong ảnh:
[b0 b1 b2 b3 b4 b5 b6 b7] [DUMMY] [b0 b1 b2 b3 b4 b5 b6 b7] [DUMMY] ...
|<----- Char 0 (8B) ---->|  (1B)  |<----- Char 1 (8B) ---->|  (1B)

Nếu đọc liên tục 8 byte / ký tự:
- Ký tự 0: Đọc byte 0..7  -> [b0 b1 b2 b3 b4 b5 b6 b7]            => GIẢI MÃ ĐÚNG ('a')
- Ký tự 1: Đọc byte 8..15 -> [DUMMY b0 b1 b2 b3 b4 b5 b6]         => SAI HOÀN TOÀN!
- Ký tự 2: Đọc byte 16..23-> [b7 DUMMY b0 b1 b2 b3 b4 b5]         => SAI HOÀN TOÀN!
```

Do byte thứ 8 là `DUMMY`, việc đọc tuần tự khiến bit của `DUMMY` bị đẩy vào vị trí bit 0 của Ký tự 1, làm toàn bộ 7 bit tiếp theo của Ký tự 1 bị dịch sang trái 1 vị trí và mất bit cuối cùng. Đây là hiện tượng kinh điển trong truyền thông số mang tên **Framing Error (Lỗi khung truyền)**.

### Mô hình Chu kỳ Khối 9 Byte
Để giải mã thành công, ta phải mô hình hóa dữ liệu theo chu kỳ bước nhảy (Stride):
$$\text{Stride} = 8 \text{ bytes (LSB Payload)} + 1 \text{ byte (Dummy Padding)} = \mathbf{9 \text{ bytes}}$$

Tổng số byte cần đọc cho 50 ký tự:
$$\text{Total Payload} = 50 \times 9 = \mathbf{450 \text{ bytes}}$$

---

## 5. Hướng Dẫn Chi Tiết Từng Bước Bóc Tách Dữ Liệu Thực Tế (Step-by-Step Manual Extraction)

### 5.1. Bước 1: Định vị Offset Bắt Đầu trên Hex Editor
- Mở tệp `encoded.bmp` bằng Hex Editor.
- Nhảy thẳng đến offset:
  $$723_{10} = \mathbf{0x2D3}_{16}$$
- Vùng dữ liệu giấu tin trải dài từ offset **`0x02D3`** đến **`0x0494`** ($723 + 450 - 1 = 1172_{10} = \text{0x494}_{16}$).

### 5.2. Bước 2: Phẫu thuật Vi mô 2 Chu kỳ Đầu Tiên ($2 \times 9 = 18$ bytes)

Trích xuất 18 byte thô bắt đầu từ `0x02D3`:

```
Offset          Hex View                                             ASCII
000002D3        81 E0 00 80 A0 01 01 80 [A0] 21 01 80 A0 40 01 81 A0 [60]  ..........!....@...
```

#### Phân tích Chu kỳ 1 ($j = 0 \to 1$): Ký tự thứ 0
- **8 byte dữ liệu (`0x02D3` - `0x02DA`):** `81 E0 00 80 A0 01 01 80`
  - LSB của từng byte ($k = 0 \dots 7$):
    - `0x81 & 1` = **1** ($2^0 = 1$)
    - `0xE0 & 1` = **0**
    - `0x00 & 1` = **0**
    - `0x80 & 1` = **0**
    - `0xA0 & 1` = **0**
    - `0x01 & 1` = **1** ($2^5 = 32$)
    - `0x01 & 1` = **1** ($2^6 = 64$)
    - `0x80 & 1` = **0**
  - Tái tạo: $\text{Val} = 1 + 32 + 64 = \mathbf{97} \ \longrightarrow \ \mathbf{\text{'a'}}$
- **1 byte đệm (`0x02DB`):** `A0` $\rightarrow$ **Bỏ qua**.

#### Phân tích Chu kỳ 2 ($j = 2 \to 3$): Ký tự thứ 1
- **8 byte dữ liệu (`0x02DC` - `0x02E3`):** `21 01 80 A0 40 01 81 A0`
  - LSB của từng byte:
    - `0x21 & 1` = **1** ($2^0 = 1$)
    - `0x01 & 1` = **1** ($2^1 = 2$)
    - `0x80 & 1` = **0**
    - `0xA0 & 1` = **0**
    - `0x40 & 1` = **0**
    - `0x01 & 1` = **1** ($2^5 = 32$)
    - `0x81 & 1` = **1** ($2^6 = 64$)
    - `0xA0 & 1` = **0**
  - Tái tạo: $\text{Val} = 1 + 2 + 32 + 64 = \mathbf{99} \ \longrightarrow \ \mathbf{\text{'c'}}$
- **1 byte đệm (`0x02E4`):** `60` $\rightarrow$ **Bỏ qua**.

### 5.3. Bảng Ma trận Đối chiếu 5 Ký tự Tiền tố (`acade`)

| Chỉ số ($j/2$) | Chu kỳ Hex Offset | 8 Byte Hex Dữ liệu | Mảng LSB ($k=0..7$) | Val ASCII | Ký tự giải mã | Byte Đệm (Offset / Hex) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `0x02D3 - 0x02DA` | `81 E0 00 80 A0 01 01 80` | `[1, 0, 0, 0, 0, 1, 1, 0]` | `97` (`0x61`) | **`a`** | `0x02DB` (`A0`) |
| **1** | `0x02DC - 0x02E3` | `21 01 80 A0 40 01 81 A0` | `[1, 1, 0, 0, 0, 1, 1, 0]` | `99` (`0x63`) | **`c`** | `0x02E4` (`60`) |
| **2** | `0x02E5 - 0x02EC` | `01 80 A0 80 00 81 A1 A0` | `[1, 0, 0, 0, 0, 1, 1, 0]` | `97` (`0x61`) | **`a`** | `0x02ED` (`00`) |
| **3** | `0x02EE - 0x02F5` | `80 A0 C1 00 80 A1 E1 00` | `[0, 0, 1, 0, 0, 1, 1, 0]` | `100` (`0x64`) | **`d`** | `0x02F6` (`80`) |
| **4** | `0x02F7 - 0x02FE` | `C1 00 01 80 C0 21 01 80` | `[1, 0, 1, 0, 0, 1, 1, 0]` | `101` (`0x65`) | **`e`** | `0x02FF` (`C0`) |

---

## 6. Xây dựng Công cụ Khôi phục Tự động (`solve.py`)

### 6.1. Hai Trường Phái Triển Khai Solver

#### Cách 1: Mô phỏng 1:1 Máy Trạng Thái C (Direct C Logic Mirroring)
Mô phỏng chính xác cấu trúc vòng lặp 100 bước và kiểm tra bit `j & 1`:

```python
def solve_state_machine(filename: str) -> str:
    flag = ""
    with open(filename, "rb") as f:
        f.seek(723)
        for j in range(100):
            if (j & 1) != 0:
                f.read(1)  # Bỏ qua dummy byte
            else:
                chunk = f.read(8)
                bits = [b & 1 for b in chunk]
                char_val = sum(bit << idx for idx, bit in enumerate(bits))
                flag += chr(char_val)
    return flag
```

#### Cách 2: Bóc tách Chu kỳ Khối 9 Byte (Stride-based Parsing - Tối ưu)
Tận dụng tính chu kỳ của dữ liệu, mỗi ký tự xử lý đúng 9 byte:

```python
#!/usr/bin/env python3
"""
solve.py — Investigative Reversing 3 Solver
Tác giả: Lewall (Security Research & DFIR Writeup)
Mục tiêu: Vượt bẫy Interleaved Dummy Bytes và trích xuất flag từ tệp BMP.
"""

import os
import sys

def solve(filename: str, flag_len: int = 50, header_offset: int = 723) -> str:
    if not os.path.exists(filename):
        raise FileNotFoundError(f"[-] Không tìm thấy tệp mục tiêu: {filename}")

    stride = 9  # 8 bytes payload + 1 byte dummy
    total_required = header_offset + (flag_len * stride)
    file_size = os.path.getsize(filename)

    if file_size < total_required:
        raise ValueError(f"[-] Dung lượng tệp quá nhỏ ({file_size} bytes).")

    print(f"[*] Đang nạp tệp: {filename} ({file_size:,} bytes)")
    print(f"[*] Offset bắt đầu : {header_offset} bytes (0x{header_offset:04X})")
    print(f"[*] Bước nhảy (Stride) : {stride} bytes/ký tự (8 payload + 1 dummy)")

    flag_chars = []
    with open(filename, "rb") as f:
        f.seek(header_offset)
        for idx in range(flag_len):
            # 1. Đọc 8 byte dữ liệu LSB
            data_bytes = f.read(8)
            lsb_bits = [b & 1 for b in data_bytes]
            
            # 2. Ghép bit Little-Endian
            val = sum(bit << i for i, bit in enumerate(lsb_bits))
            flag_chars.append(chr(val))
            
            # 3. Bỏ qua 1 byte đệm
            f.seek(1, os.SEEK_CUR)

    flag = "".join(flag_chars)
    return flag

if __name__ == "__main__":
    target = "encoded.bmp"
    try:
        flag = solve(target)
        print("\n" + "=" * 65)
        print(f"[+] FLAG THÀNH CÔNG: {flag}")
        print(f"[+] Độ dài Flag    : {len(flag)} ký tự")
        print("=" * 65)
    except Exception as e:
        print(f"[!] Lỗi: {e}", file=sys.stderr)
        sys.exit(1)
```

### 6.2. Kết quả Thực thi
```text
[*] Đang nạp tệp: encoded.bmp (1,507,414 bytes)
[*] Offset bắt đầu : 723 bytes (0x02D3)
[*] Bước nhảy (Stride) : 9 bytes/ký tự (8 payload + 1 dummy)

=================================================================
[+] FLAG THÀNH CÔNG: academy{4n0th3r_L5b_pr0bl3m_0000000000000e77bbbaa}
[+] Độ dài Flag    : 50 ký tự
=================================================================
```

---

## 7. Dấu vết Điều tra (Forensic Artifacts) & Kỹ thuật Phát hiện (Steganalysis)

### 7.1. Tác động của Byte Đệm lên Phân tích Tần suất ($\chi^2$ Test)
Ở bài 2, toàn bộ $400$ bytes liên tục đều bị ép LSB theo dữ liệu nhúng, tạo ra một "khối bằng phẳng" (flattened block) bất thường trên biểu đồ kiểm định Chi-Square ($\chi^2$).

Sang bài 3, việc giữ nguyên 1 byte gốc cứ sau mỗi 8 byte đã tạo ra một hiện tượng thú vị trong điều tra số:
- Byte đệm mang giá trị phân phối tự nhiên của bức ảnh, đóng vai trò như các "chốt neo" (anchors) làm giảm nhẹ độ lệch tiệm cận của kiểm định $\chi^2$.
- Tuy nhiên, vì tỷ lệ nhúng vẫn là $\frac{8}{9} \approx 88.9\%$, các công cụ kiểm tra tính ngẫu nhiên như NIST SP 800-22 hay Sample Pairs Analysis (SPA) vẫn dễ dàng phát hiện vùng mật độ entropy cao bất thường kéo dài 450 bytes từ offset `0x2D3`.

### 7.2. Kỹ thuật Rải rác Bit Không Đều trong Mã Độc Nâng Cao (APTs)
Kỹ thuật chèn byte đệm cố định như trong thử thách này là tiền đề của kỹ thuật **Non-consecutive Pseudo-Random Bit Scattering** mà các dòng mã độc APT sử dụng:
- Thay vì chèn cố định cứ sau 8 byte có 1 byte đệm, mã độc sử dụng một bộ sinh số giả ngẫu nhiên (PRNG) với seed bí mật (ví dụ: băm từ khóa phiên) để xác định vị trí pixel tiếp theo sẽ nhúng bit.
- Khi không có seed, điều tra viên không thể xác định được chu kỳ bước nhảy, biến việc trích xuất payload thành một bài toán tìm kiếm tổ hợp cực kỳ nan giải.

### 7.3. Đúc Kết Toàn Diện Series "Investigative Reversing"
Qua 3 phần của chuỗi bài toán:
1. **Phần 1 (PNG EOF Overlay):** Giấu tin ngoài cấu trúc hiển thị $\rightarrow$ Phát hiện qua đối soát kích thước vật lý vs kích thước logic của chunk `IEND`.
2. **Phần 2 (BMP Sequential LSB + Arithmetic Shift):** Giấu tin vào tầng bit thấp nhất kèm phép toán dời dịch $\rightarrow$ Phát hiện qua kiểm định phân bố cặp giá trị $\chi^2$ (Pairs of Values).
3. **Phần 3 (BMP Interleaved LSB):** Giấu tin xen kẽ phá vỡ đồng bộ khung bit $\rightarrow$ Đòi hỏi điều tra viên phải phân tích kỹ lưỡng các nhánh rẽ nhị phân (`j & 1`) để dựng lại đúng chu kỳ bước nhảy (Stride).
