---
title: Investigative Reversing 4 – Bóc tách Interleaved LSB Đa tệp và Bẫy Đảo ngược Thứ tự
date: '2026-11-10'
excerpt: >-
  Phân tích chuyên sâu chiến thuật giấu tin phân mảnh đa tệp (Multi-file Sharding) kết hợp điều chế nhịp chu kỳ 12-byte (12-byte Cadence Modulation) và bẫy đảo ngược thứ tự thực thi trong chuỗi thử thách Investigative Reversing 4, dịch ngược mã máy x86-64 với IDA Pro và xây dựng công cụ khôi phục toàn vẹn 50 ký tự flag.
featured: /thumbnails/investigative-reversing.jpg
flag: 'academy{N1c3_R3ver51ng_5k1115_0000000000032104f2f}'
tags:
  - Reverse Engineering
  - Forensics
  - Steganography
  - IDA Pro
  - Bitwise Operations
  - BMP Format
  - Multi-file Sharding
  - Python
  - CTF
---

> *"Trong các chiến dịch tấn công có chủ đích (APT), kẻ tấn công hiếm khi cất giấu toàn bộ bức tranh nguy hại vào một tệp tin duy nhất. Việc phân mảnh dữ liệu (Data Sharding) trên nhiều vật mang vô hại, kết hợp với các quy luật điều chế nhịp bất đối xứng và thứ tự thực thi nghịch đảo, là bức tường phòng thủ tâm lý hữu hiệu nhất nhằm đánh lừa các hệ thống phân tích tự động lẫn những nhà điều tra thiếu kiên nhẫn."*

---

## 1. Khởi tạo Điều tra & Định danh Mẫu vật (Artifact Triage & Multi-file Profiling)

Bước sang phần 4 của chuỗi thử thách điều tra số (`investigative-reversing-4`), hiện trường số không còn giới hạn ở một tệp đa phương tiện đơn lẻ mà mở rộng thành một hệ sinh thái gồm **6 mẫu vật nhị phân**:

1. **Tệp thực thi nhị phân:** `investigative-reversing-4-mystery` (ELF 64-bit).
2. **Tập hợp 5 tệp ảnh đích:** `Item01_cp.bmp`, `Item02_cp.bmp`, `Item03_cp.bmp`, `Item04_cp.bmp`, `Item05_cp.bmp`.

Bảng thông số kỹ thuật các mẫu vật thu thập tại hiện trường:

| Thuộc tính | Tệp thực thi (`mystery`) | Nhóm 5 tệp ảnh đích (`Item01_cp` $\to$ `Item05_cp.bmp`) |
| :--- | :--- | :--- |
| **Định dạng file** | ELF 64-bit LSB pie executable, x86-64 | PC bitmap, Windows 3.x format (Indexed 8 bpp) |
| **Kích thước** | 13,104 bytes | 1,507,414 bytes mỗi tệp (~1.43 MB) |
| **Độ phân giải** | N/A | 1765 × 852 pixels, 8 bpp (Palette 256 màu) |
| **Trọng tải giấu tin** | Điều khiển quy trình phân mảnh | 10 ký tự flag / tệp (tổng cộng 50 ký tự) |

**Mã băm toàn vẹn (SHA-256):**
- `investigative-reversing-4-mystery`: `c3b615b1ca6b9aa9aabe0858a839cfd8b301c192c4e43ba4395df18da0b81355`
- `Item01_cp.bmp`: `3c3f2116a9fbf1e62aac313635fbc9391d4167d1dafa1d0fe63d7483f251580c`
- `Item02_cp.bmp`: `38ef3ea5faa7bd9bf16ebc506da82904a875e0bd3ce86aabe3b0af872cda9cca`
- `Item03_cp.bmp`: `605663a49af3749ab002b5760da87a53feedaf55e86fa02112c39b66d0eda57e`
- `Item04_cp.bmp`: `f5eb5ebabfa031c4827b3f9e867cbcffc439a8e97a4f9ac3e8a6e130e4a88302`
- `Item05_cp.bmp`: `7094381c0412f2fc950837645211d7d2d8b761ef605903c1a0ac5c36099b8e30`

![Hình ảnh mẫu vật Item05_cp.bmp](/img/writeups/investigative-reversing-4/item05.png)
*Hình ảnh hiển thị của Item05_cp.bmp: Mắt thường hoàn toàn không thể phát hiện bất kỳ dị thường hiển thị nào.*

---

## 2. Kiến trúc Giấu tin Đa Tệp & Bẫy Đảo ngược Thứ tự (Multi-File Sharding & Reverse Execution Order)

So sánh với các thử thách trước đó, `investigative-reversing-4` đánh dấu bước nhảy vọt về độ phức tạp chiến thuật:

```
+----------------------------------------------------------------------------------------------------+
| Cấp độ 1 (Part 1): EOF Overlay Steganography                                                       |
| [PNG File Content] ---> [Nối trực tiếp 26 bytes flag vào sau tệp]                                  |
+----------------------------------------------------------------------------------------------------+
| Cấp độ 2 (Part 2): Continuous LSB + Arithmetic Shift (-5)                                          |
| [2000B Header] ---> [400B LSB tuần tự: 50 ký tự × 8 bit nhúng liên tục]                            |
+----------------------------------------------------------------------------------------------------+
| Cấp độ 3 (Part 3): Interleaved LSB (Single File) + Framing Error                                    |
| [723B Header]  ---> [Chu kỳ 9B: 8B Payload LSB + 1B Dummy Byte] × 50 ký tự                         |
+----------------------------------------------------------------------------------------------------+
| Cấp độ 4 (Part 4): Multi-file Sharding + Reverse Processing Order + 12-Byte Stride                 |
| Flag (50B) ---> Chia đều thành 5 mảnh (10B/mảnh)                                                    |
| Thứ tự nhúng: Item05 (Ch 0..9) -> Item04 (Ch 10..19) -> Item03 (Ch 20..29) -> Item02 -> Item01   |
| Quy luật tệp : [2019B Header] ---> [Chu kỳ 12B: 8B Payload LSB + 4B Dummy Bytes] × 10 ký tự        |
+----------------------------------------------------------------------------------------------------+
```

### Bẫy Phản trực giác số 1: Thứ tự xử lý tệp nghịch đảo
Khi đối mặt với danh sách tệp `Item01_cp.bmp` đến `Item05_cp.bmp`, phản xạ tự nhiên của lập trình viên là xử lý theo thứ tự chữ cái hoặc tăng dần theo chỉ số số học ($1 \to 5$). Tuy nhiên, trong mã nguồn nhị phân:

$$\text{Processing Sequence: } \mathbf{Item05\_cp.bmp} \longrightarrow \mathbf{Item04\_cp.bmp} \longrightarrow \mathbf{Item03\_cp.bmp} \longrightarrow \mathbf{Item02\_cp.bmp} \longrightarrow \mathbf{Item01\_cp.bmp}$$

Nếu giải mã theo thứ tự $1 \to 5$, ta sẽ thu được một chuỗi ký tự bị đảo ngược từng khối 10 ký tự:
$$\text{Reversed Blocks: } \underbrace{\text{032104f2f\}}}_{\text{Item01}} \ \underbrace{\text{0000000000}}_{\text{Item02}} \ \underbrace{\text{ng\_5k1115\_}}_{\text{Item03}} \ \underbrace{\text{c3\_R3ver51}}_{\text{Item04}} \ \underbrace{\text{academy\{N1}}_{\text{Item05}}$$

---

## 3. Dịch Ngược Nhị Phân với IDA Pro (Disassembly & Decompilation)

Nạp tệp `investigative-reversing-4-mystery` vào IDA Pro để khảo sát luồng thực thi tổng thể.

### 3.1. Phân tích Hàm `main`
```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  __int64 v3; 
  int v5; 
  char v6; 
  int v7; 
  FILE *stream; 

  flag = &v6;
  v5 = 0;
  flag_index = (__int64)&v5;

  stream = fopen("flag.txt", "ra");
  if ( stream == nullptr )
    puts("No flag found, please make sure this is run on the server");

  v7 = fread(flag, 0x32u, 1u, stream); // Đọc đúng 50 bytes (0x32 = 50)
  if ( v7 <= 0 )
  {
    puts("Invalid Flag");
    exit(0);
  }
  fclose(stream);

  encodeAll(v3);
  return 0;
}
```

- `flag` lưu trữ con trỏ trỏ đến bộ đệm chứa 50 ký tự flag.
- `flag_index` là một biến con trỏ toàn cục khởi tạo bằng 0 (`v5 = 0`), dùng để theo dõi vị trí ký tự đang được nhúng qua các tệp.
- Hàm gọi trực tiếp `encodeAll()`.

---

### 3.2. Bóc tách Hàm Điều phối `encodeAll`

Đây chính là nơi bộc lộ bẫy đảo ngược thứ tự tệp:

```c
__int64 encodeAll()
{
  __int64 result; 
  _QWORD v1[2]; 
  int v2; 
  _DWORD v3[7]; 
  char i; 

  strcpy((char *)v3, "Item01_cp.bmp"); // Tên file đích mẫu
  HIWORD(v3[3]) = 0;
  v3[4] = 0;

  result = 0x622E31306D657449LL;       // Chuỗi "Item01.b" dạng Little-Endian
  v1[0] = 0x622E31306D657449LL;
  v1[1] = 28781;                       // "mp\0"
  v2 = 0;

  // VÒNG LẶP NGHỊCH ĐẢO: i chạy từ 53 ('5') giảm dần về 49 ('1')
  for ( i = 53; i > 48; --i )
  {
    BYTE5(v1[0]) = i;                  // Sửa ký tự thứ 5 của tên tệp gốc: 'Item0' + i + '.bmp'
    BYTE1(v3[1]) = i;                  // Sửa ký tự thứ 5 của tên tệp đích: 'Item0' + i + '_cp.bmp'
    encodeDataInFile((const char *)v1, (const char *)v3);
    result = (unsigned int)(unsigned __int8)i - 1;
  }
  return result;
}
```

> [!IMPORTANT]
> **Giải phẫu mã máy Assembly tại `encodeAll`:**
> ```x86asm
> .text:0000000000000A6B  mov     byte ptr [rbp+i], 35h   ; Khởi tạo i = 0x35 (ASCII '5')
> .text:0000000000000A6F  jmp     short loc_0A90
> ...
> .text:0000000000000A90  cmp     byte ptr [rbp+i], 30h   ; So sánh i với 0x30 (ASCII '0')
> .text:0000000000000A94  jg      short loc_0A71          ; Nếu i > '0' (tức i >= '1'), tiếp tục lặp
> ```
> Thứ tự các lời gọi `encodeDataInFile`:
> 1. `i = 53` (`'5'`): `encodeDataInFile("Item05.bmp", "Item05_cp.bmp")` $\to$ Nhúng `flag[0..9]`
> 2. `i = 52` (`'4'`): `encodeDataInFile("Item04.bmp", "Item04_cp.bmp")` $\to$ Nhúng `flag[10..19]`
> 3. `i = 51` (`'3'`): `encodeDataInFile("Item03.bmp", "Item03_cp.bmp")` $\to$ Nhúng `flag[20..29]`
> 4. `i = 50` (`'2'`): `encodeDataInFile("Item02.bmp", "Item02_cp.bmp")` $\to$ Nhúng `flag[30..39]`
> 5. `i = 49` (`'1'`): `encodeDataInFile("Item01.bmp", "Item01_cp.bmp")` $\to$ Nhúng `flag[40..49]`

---

### 3.3. Thuật toán Nhúng trong `encodeDataInFile`

```c
int __fastcall encodeDataInFile(const char *input_path, const char *output_path)
{
  char ptr; 
  char v5; 
  int v6; 
  FILE *v7; 
  FILE *stream; 
  int k, j, i, v12; 

  stream = fopen(input_path, "ra");
  v7 = fopen(output_path, "a");

  if ( stream == nullptr )
  {
    puts("No output found, please run this on the server");
    exit(0);
  }

  v12 = fread(&ptr, 1u, 1u, stream);

  // [Phase 1] Bỏ qua 2019 byte đầu tiên (Header Offset)
  v6 = 2019; // 0x7E3
  for ( i = 0; i < v6; ++i )
  {
    fputc(ptr, v7);
    v12 = fread(&ptr, 1u, 1u, stream);
  }

  // [Phase 2] Nhúng dữ liệu: j lặp 50 lần (từ 0 đến 49)
  for ( j = 0; j <= 49; ++j )
  {
    if ( j % 5 != 0 )
    {
      // j không chia hết cho 5: Ghi nguyên vẹn 1 byte đệm (Dummy Byte)
      fputc(ptr, v7);
      fread(&ptr, 1u, 1u, stream);
    }
    else
    {
      // j chia hết cho 5: Nhúng 8 bit của ký tự hiện tại (*flag_index)
      for ( k = 0; k <= 7; ++k )
      {
        v5 = codedChar(k, *((_BYTE *)flag + *(int *)flag_index), ptr);
        fputc(v5, v7);
        fread(&ptr, 1u, 1u, stream);
      }
      ++*(_DWORD *)flag_index; // Chuyển sang ký tự flag tiếp theo
    }
  }

  // [Phase 3] Sao chép phần còn lại của ảnh
  while ( v12 == 1 )
  {
    fputc(ptr, v7);
    v12 = fread(&ptr, 1u, 1u, stream);
  }

  fclose(v7);
  return fclose(stream);
}
```

### 3.4. Hàm `codedChar` và Kỹ thuật Tối ưu Phép Chia 5 trong Assembly

Hàm `codedChar` duy trì nguyên vẹn bản chất nhúng LSB Little-Endian:
```c
__int64 __fastcall codedChar(int k, char char_byte, char pixel_byte)
{
  char v4; 
  v4 = char_byte;
  if ( k != 0 )
    v4 = char_byte >> k;
  return v4 & 1 | pixel_byte & 0xFEu;
}
```

Biểu thức biến đổi bit:
$$B_{\text{out}} = (C \gg k \ \& \ 1) \ | \ (B_{\text{in}} \ \& \ \text{0xFE})$$

Trong đó:
- $C$: Ký tự flag gốc (mã ASCII nguyên bản, không biến đổi số học).
- $k$: Trọng số bit từ $0$ đến $7$ (Little-Endian: bit LSB đi trước, MSB đi sau).
- $B_{\text{in}}$: Byte điểm ảnh gốc.
- $B_{\text{out}}$: Byte điểm ảnh sau khi nhúng bit.

#### Phân tích tối ưu hóa phép chia `j % 5` trong Assembly:
Trong kiến trúc x86-64, phép chia số nguyên (chỉ thị `idiv`) rất tốn chu kỳ xung nhịp. Trình biên dịch GCC đã áp dụng kỹ thuật nhân với nghịch đảo modul (Reciprocal Multiplication with Magic Number `0x66666667`):

```x86asm
.text:0000000000000867  mov     eax, [rbp+j]
.text:000000000000086A  movsxd  rdx, eax
.text:000000000000086D  imul    rdx, 66666667h          ; Nhân với Magic Constant
.text:0000000000000874  shr     rdx, 20h
.text:0000000000000878  sar     edx, 1                  ; edx = j / 5
.text:000000000000087A  mov     ecx, eax
.text:000000000000087C  sar     ecx, 1Fh
.text:000000000000087F  sub     edx, ecx
.text:0000000000000881  mov     ecx, edx
.text:0000000000000883  shl     ecx, 2
.text:0000000000000886  add     ecx, edx                ; ecx = (j / 5) * 5
.text:0000000000000888  sub     eax, ecx                ; eax = j - ((j / 5) * 5) = j % 5
.text:000000000000088A  test    eax, eax
.text:000000000000088C  jnz     loc_0918                ; Nếu j % 5 != 0 -> Nhánh chép Dummy Byte
```

---

## 4. Bản chất Kỹ thuật: Điều chế Chu kỳ Khối 12 Byte (12-Byte Stride Modulation)

Hãy phân tích kỹ diễn tiến của vòng lặp `for (j = 0; j <= 49; ++j)` trong một tệp ảnh:

| Giá trị $j$ | Điều kiện ($j \pmod 5$) | Hành động của chương trình | Số byte ghi vào tệp |
| :---: | :---: | :--- | :---: |
| **0** | $0 \pmod 5 == 0$ | Nhúng 8 bit của ký tự `flag_index` | **8 bytes** |
| **1** | $1 \pmod 5 \ne 0$ | Copy byte gốc (Dummy Byte 1) | **1 byte** |
| **2** | $2 \pmod 5 \ne 0$ | Copy byte gốc (Dummy Byte 2) | **1 byte** |
| **3** | $3 \pmod 5 \ne 0$ | Copy byte gốc (Dummy Byte 3) | **1 byte** |
| **4** | $4 \pmod 5 \ne 0$ | Copy byte gốc (Dummy Byte 4) | **1 byte** |
| **5** | $5 \pmod 5 == 0$ | Nhúng 8 bit của ký tự tiếp theo (`flag_index + 1`) | **8 bytes** |
| **...** | ... | ... | ... |

Quy luật xuất hiện rõ ràng:
- Cứ mỗi chu kỳ 5 bước lặp của $j$ ($j = 5m + \{0, 1, 2, 3, 4\}$):
  - Bước $5m$: Nhúng **8 bytes** chứa 8 bit LSB của một ký tự flag.
  - Các bước $5m + 1, 5m + 2, 5m + 3, 5m + 4$: Chép liên tiếp **4 dummy bytes** gốc không đổi.
- Do đó, bước nhảy tổng thể (Stride) để mã hóa hoàn chỉnh 1 ký tự flag là:
  $$\text{Stride} = 8 \text{ bytes (LSB Payload)} + 4 \text{ bytes (Dummy Padding)} = \mathbf{12 \text{ bytes / char}}$$

Mô hình phân bổ dữ liệu trên dòng byte:

```
+---------------+---------------+---------------+---------------+---------------+
| 8B LSB Data   | 4B Dummy Byte | 8B LSB Data   | 4B Dummy Byte | 8B LSB Data   |
| (Ký tự m)     | (Padding)     | (Ký tự m+1)   | (Padding)     | (Ký tự m+2)   |
+---------------+---------------+---------------+---------------+---------------+
|<------- 12 Bytes ------------>|<------- 12 Bytes ------------>|
```

Tổng số ký tự được nhúng trong 1 tệp ảnh:
$$\frac{50 \text{ (values of } j \text{)}}{5} = \mathbf{10 \text{ chars / file}}$$

Tổng số byte bị điều chế trong mỗi tệp ảnh:
$$\text{Modulated Region} = 10 \times 12 = \mathbf{120 \text{ bytes}}$$

Tọa độ nhúng trên tệp: Bắt đầu từ offset **`2019`** (`0x07E3`) đến **`2138`** (`0x085A`).

---

## 5. Hướng Dẫn Chi Tiết Từng Bước Bóc Tách Dữ Liệu Thực Tế (Step-by-Step Manual Extraction)

### 5.1. Mẹo Nhận Diện Bit Nhanh trên Hex Editor (Hex Parity Shortcut)
Khi xem xét dữ liệu điểm ảnh dưới dạng Hexadecimal, ta không nhất thiết phải đổi từng byte sang nhị phân để lấy bit LSB:
- Bit cuối cùng (LSB) của một byte quyết định tính chẵn/lẻ của số đó.
- Trong hệ thập lục phân:
  - Nếu ký tự cuối là **chẵn** (`0, 2, 4, 6, 8, A, C, E`) $\longrightarrow \mathbf{\text{LSB} = 0}$.
  - Nếu ký tự cuối là **lẻ** (`1, 3, 5, 7, 9, B, D, F`) $\longrightarrow \mathbf{\text{LSB} = 1}$.

Ví dụ:
- `0xE9` (kết thúc bằng `9`, lẻ) $\rightarrow \text{LSB} = \mathbf{1}$.
- `0xE8` (kết thúc bằng `8`, chẵn) $\rightarrow \text{LSB} = \mathbf{0}$.
- `0x4E` (kết thúc bằng `E`, chẵn) $\rightarrow \text{LSB} = \mathbf{0}$.
- `0x4F` (kết thúc bằng `F`, lẻ) $\rightarrow \text{LSB} = \mathbf{1}$.

Quy tắc này giúp nhà điều tra có thể "đọc trực tiếp" luồng bit trên Hex Editor với tốc độ cực nhanh mà không cần công cụ hỗ trợ.

---

### 5.2. Phẫu thuật Vi mô 24 Byte Đầu Tiên trên `Item05_cp.bmp`
Mở `Item05_cp.bmp` trên Hex Editor, điều hướng tới offset **`2019`** (`0x07E3`):

```
Offset          Hex Representation                                   ASCII
000007E3        E9 E8 E8 E8 E8 E9 E9 E8 [E8 E8 E8 E8]               ..........
000007EF        E9 E9 E8 E8 E8 E9 E9 E8 [E8 E8 E8 E8]               ..........
```

#### Phân tích Khối 1 (`0x07E3` - `0x07EE`): Ký tự thứ 0
1. **8 byte LSB Payload (`0x07E3` - `0x07EA`):** `E9 E8 E8 E8 E8 E9 E9 E8`
   - Parity từng byte:
     - Byte 0: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^0 = 1$)
     - Byte 1: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 2: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 3: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 4: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 5: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^5 = 32$)
     - Byte 6: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^6 = 64$)
     - Byte 7: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
   - Tổng giá trị: $\text{Value} = 1 + 32 + 64 = \mathbf{97} \ (\text{0x61}) \longrightarrow \mathbf{\text{'a'}}$
2. **4 byte Dummy Padding (`0x07EB` - `0x07EE`):** `E8 E8 E8 E8` $\rightarrow$ **Bỏ qua**.

#### Phân tích Khối 2 (`0x07EF` - `0x07FA`): Ký tự thứ 1
1. **8 byte LSB Payload (`0x07EF` - `0x07F6`):** `E9 E9 E8 E8 E8 E9 E9 E8`
   - Parity từng byte:
     - Byte 0: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^0 = 1$)
     - Byte 1: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^1 = 2$)
     - Byte 2: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 3: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 4: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
     - Byte 5: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^5 = 32$)
     - Byte 6: `0xE9` (lẻ) $\rightarrow \mathbf{1}$ ($2^6 = 64$)
     - Byte 7: `0xE8` (chẵn) $\rightarrow \mathbf{0}$
   - Tổng giá trị: $\text{Value} = 1 + 2 + 32 + 64 = \mathbf{99} \ (\text{0x63}) \longrightarrow \mathbf{\text{'c'}}$
2. **4 byte Dummy Padding (`0x07F7` - `0x07FA`):** `E8 E8 E8 E8` $\rightarrow$ **Bỏ qua**.

---

### 5.3. Bảng Ma trận Đối chiếu 10 Ký tự trên `Item05_cp.bmp`

Trích xuất toàn bộ 10 ký tự chứa trong tệp `Item05_cp.bmp`:

| Ký tự (#) | Dải Offset Payload | 8 Byte Dữ liệu Hex | Mảng Bit LSB ($k=0..7$) | ASCII Val | Ký tự | Dải Offset Dummy (4B) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `0x07E3 - 0x07EA` | `E9 E8 E8 E8 E8 E9 E9 E8` | `[1, 0, 0, 0, 0, 1, 1, 0]` | `97` | **`a`** | `0x07EB - 0x07EE` |
| **1** | `0x07EF - 0x07F6` | `E9 E9 E8 E8 E8 E9 E9 E8` | `[1, 1, 0, 0, 0, 1, 1, 0]` | `99` | **`c`** | `0x07F7 - 0x07FA` |
| **2** | `0x07FB - 0x0802` | `E9 E8 E8 E8 E8 E9 E9 4E` | `[1, 0, 0, 0, 0, 1, 1, 0]` | `97` | **`a`** | `0x0803 - 0x0806` |
| **3** | `0x0807 - 0x080E` | `E8 E8 E9 E8 E8 E9 E9 E8` | `[0, 0, 1, 0, 0, 1, 1, 0]` | `100` | **`d`** | `0x080F - 0x0812` |
| **4** | `0x0813 - 0x081A` | `E9 E8 E9 E8 E8 E9 E9 E8` | `[1, 0, 1, 0, 0, 1, 1, 0]` | `101` | **`e`** | `0x081B - 0x081E` |
| **5** | `0x081F - 0x0826` | `E9 E8 E9 E9 E8 E9 E9 E8` | `[1, 0, 1, 1, 0, 1, 1, 0]` | `109` | **`m`** | `0x0827 - 0x082A` |
| **6** | `0x082B - 0x0832` | `E9 E8 E8 E9 E9 E9 E9 E8` | `[1, 0, 0, 1, 1, 1, 1, 0]` | `121` | **`y`** | `0x0833 - 0x0836` |
| **7** | `0x0837 - 0x083E` | `E9 E9 E8 E9 E9 E9 E9 E8` | `[1, 1, 0, 1, 1, 1, 1, 0]` | `123` | **`{`** | `0x083F - 0x0842` |
| **8** | `0x0843 - 0x084A` | `E8 E9 E9 E9 E8 E8 E9 E8` | `[0, 1, 1, 1, 0, 0, 1, 0]` | `78` | **`N`** | `0x084B - 0x084E` |
| **9** | `0x084F - 0x0856` | `E9 E8 E8 E8 E9 E9 E8 E8` | `[1, 0, 0, 0, 1, 1, 0, 0]` | `49` | **`1`** | `0x0857 - 0x085A` |

Kết quả 10 ký tự đầu tiên: **`academy{N1`**.

---

### 5.4. Ghép Nối 5 Mảnh Flag Hoàn Chỉnh

Lặp lại quy trình trích xuất trên toàn bộ 5 tệp theo đúng thứ tự nhúng nghịch đảo:

| Thứ tự nạp | Tệp ảnh nguồn | Dải chỉ số flag | Chuỗi ký tự trích xuất |
| :---: | :--- | :---: | :--- |
| **1** | `Item05_cp.bmp` | $0 \to 9$ | `academy{N1` |
| **2** | `Item04_cp.bmp` | $10 \to 19$ | `c3_R3ver51` |
| **3** | `Item03_cp.bmp` | $20 \to 29$ | `ng_5k1115_` |
| **4** | `Item02_cp.bmp` | $30 \to 39$ | `0000000000` |
| **5** | `Item01_cp.bmp` | $40 \to 49$ | `032104f2f}` |

Ghép nối tuần tự các mảnh:
$$\text{Flag} = \text{"academy\{N1"} + \text{"c3\_R3ver51"} + \text{"ng\_5k1115\_"} + \text{"0000000000"} + \text{"032104f2f\}"}$$

$$\mathbf{\text{Flag = academy\{N1c3\_R3ver51ng\_5k1115\_0000000000032104f2f\}}}$$

---

## 6. Xây dựng Công cụ Khôi phục Tự động (`solve4.py`)

Dưới đây là mã nguồn Python chuyên nghiệp, tự động hóa toàn bộ quy trình kiểm tra dung lượng tệp, tính toán bước nhảy và tái tạo chuỗi flag:

```python
#!/usr/bin/env python3
"""
=============================================================================
  Chương trình: solve4.py
  Mục tiêu    : Khôi phục Flag trong thử thách Investigative Reversing 4
  Tác giả     : Lewall (Security Research & DFIR Writeup)
  Kỹ thuật    : Reverse Processing Order + 12-Byte Stride LSB Extraction
=============================================================================
"""

import os
import sys
from typing import List

HEADER_OFFSET = 2019       # Offset bỏ qua dữ liệu đầu tệp BMP (0x07E3)
CHARS_PER_FILE = 10        # Mỗi tệp chứa đúng 10 ký tự flag
PAYLOAD_BYTES = 8          # 8 bytes nhúng 8 bit LSB
DUMMY_BYTES = 4            # 4 dummy bytes đệm xen kẽ
STRIDE = PAYLOAD_BYTES + DUMMY_BYTES  # 12 bytes cho mỗi ký tự

# THỨ TỰ BẮT BUỘC: Item05 -> Item04 -> Item03 -> Item02 -> Item01
TARGET_FILES = [
    "Item05_cp.bmp",
    "Item04_cp.bmp",
    "Item03_cp.bmp",
    "Item02_cp.bmp",
    "Item01_cp.bmp"
]

def extract_fragment(file_path: str) -> str:
    """Trích xuất 10 ký tự flag từ một tệp BMP duy nhất dựa trên bước nhảy 12-byte."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"[-] Không tìm thấy tệp: {file_path}")

    file_size = os.path.getsize(file_path)
    min_required = HEADER_OFFSET + (CHARS_PER_FILE * STRIDE)
    if file_size < min_required:
        raise ValueError(f"[-] Tệp {file_path} không đủ dung lượng ({file_size} < {min_required}).")

    extracted_chars: List[str] = []

    with open(file_path, "rb") as f:
        # Nhảy đến offset bắt đầu chứa dữ liệu giấu tin
        f.seek(HEADER_OFFSET)

        for _ in range(CHARS_PER_FILE):
            # 1. Đọc 8 byte mang thông tin LSB
            data_bytes = f.read(PAYLOAD_BYTES)
            if len(data_bytes) < PAYLOAD_BYTES:
                break
            
            # Lấy bit LSB của từng byte
            bits = [b & 1 for b in data_bytes]
            
            # Tái tạo giá trị byte ASCII theo chuẩn Little-Endian
            char_val = sum(bit << idx for idx, bit in enumerate(bits))
            extracted_chars.append(chr(char_val))

            # 2. Bỏ qua 4 dummy bytes đệm
            f.seek(DUMMY_BYTES, os.SEEK_CUR)

    return "".join(extracted_chars)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else "."
    
    print("[*] Bắt đầu tiến trình khôi phục Investigative Reversing 4...")
    print(f"[*] Offset bắt đầu      : {HEADER_OFFSET} bytes (0x{HEADER_OFFSET:04X})")
    print(f"[*] Cấu trúc nhịp       : {PAYLOAD_BYTES} bytes payload + {DUMMY_BYTES} bytes dummy = {STRIDE} bytes/ký tự")
    print("-" * 65)

    full_flag = ""
    for idx, fname in enumerate(TARGET_FILES, 1):
        fpath = os.path.join(base_dir, fname)
        try:
            fragment = extract_fragment(fpath)
            print(f"[{idx}/5] {fname:<15} -> '{fragment}'")
            full_flag += fragment
        except Exception as e:
            print(f"[!] Lỗi khi xử lý {fname}: {e}", file=sys.stderr)
            sys.exit(1)

    print("-" * 65)
    print(f"[+] TỔNG KẾT FLAG THÀNH CÔNG: {full_flag}")
    print(f"[+] Tổng số ký tự          : {len(full_flag)} bytes")
    print("=" * 65)

if __name__ == "__main__":
    main()
```

### Kết quả Thực thi Script:
```text
[*] Bắt đầu tiến trình khôi phục Investigative Reversing 4...
[*] Offset bắt đầu      : 2019 bytes (0x07E3)
[*] Cấu trúc nhịp       : 8 bytes payload + 4 bytes dummy = 12 bytes/ký tự
-----------------------------------------------------------------
[1/5] Item05_cp.bmp   -> 'academy{N1'
[2/5] Item04_cp.bmp   -> 'c3_R3ver51'
[3/5] Item03_cp.bmp   -> 'ng_5k1115_'
[4/5] Item02_cp.bmp   -> '0000000000'
[5/5] Item01_cp.bmp   -> '032104f2f}'
-----------------------------------------------------------------
[+] TỔNG KẾT FLAG THÀNH CÔNG: academy{N1c3_R3ver51ng_5k1115_0000000000032104f2f}
[+] Tổng số ký tự          : 50 bytes
=================================================================
```

---

## 7. Dấu vết Điều tra (Forensic Artifacts) & Kỹ thuật Phát hiện (Steganalysis)

### 7.1. Đối sánh Tương quan Đa Tệp (Cross-file Correlation Analysis)
Trong điều tra số thực chiến, khi phân tích một thư mục chứa nhiều tệp hình ảnh có cùng định dạng và kích thước, việc kiểm tra tương quan sai khác giữa các tệp là cực kỳ quan trọng:
- So sánh kích thước vật lý của cả 5 tệp: Đều là `1,507,414` bytes.
- Khi sử dụng công cụ phân tích diff nhị phân (ví dụ: `vbindiff` hoặc script so sánh byte-by-byte giữa `Item01_cp.bmp` và `Item02_cp.bmp`), ta nhận thấy:
  - 2019 byte đầu tiên hoàn toàn khớp nhau (vùng header chuẩn và bảng màu palette).
  - Vùng dữ liệu từ `0x07E3` đến `0x085A` (120 bytes) thể hiện các biến động bit phân kỳ.
  - Sau offset `0x085A`, các byte dữ liệu lại trở về trạng thái đặc trưng của từng ảnh gốc.

### 7.2. Tương quan với Các Kỹ thuật Phân tán Payload của Mã Độc Nâng Cao (APT)
Thử thách `investigative-reversing-4` mô phỏng trực tiếp kỹ thuật **Distributed Payload Staging**:
- **Tránh phát hiện ngưỡng (Threshold Evasion):** Nếu toàn bộ payload 50 ký tự được giấu vào 1 tệp duy nhất, mật độ biến đổi bit trong một vùng hẹp có thể kích hoạt các cảnh báo heuristic của hệ thống EDR / Antivirus. Bằng cách phân tán payload thành 5 mảnh siêu nhỏ (mỗi mảnh chỉ 120 bytes biến đổi trên tệp 1.5MB), tỷ lệ thay đổi trên toàn tệp là:
  $$\frac{120}{1,507,414} \approx 0.00796\%$$
  Tỷ lệ này nằm sâu dưới ngưỡng phát hiện của hầu hết các giải pháp phân tích Steganography dựa trên thống kê thông thường.
- **Phụ thuộc Thứ tự (Execution Chain Dependency):** Tương tự như mã độc Stager chỉ kích hoạt payload khi thu thập đủ tất cả các thành phần theo đúng thứ tự giải mã, việc thiếu hụt một trong các tệp hoặc sắp xếp sai trật tự giải mã sẽ khiến dữ liệu tái tạo trở nên vô nghĩa.

---

## 8. Đúc kết Toàn Bộ Series "Investigative Reversing" (The Master Synthesis)

Trải qua trọn vẹn 4 thử thách của series, chúng ta đã chứng kiến lộ trình tiến hóa hoàn chỉnh của kỹ thuật giấu tin và dịch ngược:

```
+--------------------------------------------------------------------------------------------------+
|                            TIẾN TRÌNH TIẾN HÓA KỸ THUẬT GIẤU TIN                                 |
+--------------------------------------------------------------------------------------------------+
| Part 1 (EOF Overlay):                                                                            |
| - Vector  : Đính kèm dữ liệu ngoài cấu trúc logic IEND trong tệp PNG.                            |
| - DFIR    : Đối soát File Size thực tế vs Chunk Structure logic.                                 |
+--------------------------------------------------------------------------------------------------+
| Part 2 (Sequential LSB + Arithmetic Obfuscation):                                                |
| - Vector  : Thay thế LSB liên tục trong tệp BMP, mã hóa dữ liệu với c - 5.                       |
| - DFIR    : Phát hiện qua phân tích Chi-Square (Pairs of Values), đảo ngược phép trừ số học.    |
+--------------------------------------------------------------------------------------------------+
| Part 3 (Interleaved LSB + Bit Framing Error):                                                    |
| - Vector  : Chèn xen kẽ 1 Dummy Byte sau mỗi 8 LSB bytes trong tệp BMP.                          |
| - DFIR    : Vượt bẫy mất đồng bộ khung bit (Bit Slip), xác định chu kỳ bước nhảy 9 bytes.       |
+--------------------------------------------------------------------------------------------------+
| Part 4 (Multi-file Sharding + Reverse Order + 12-Byte Stride):                                   |
| - Vector  : Phân mảnh payload trên 5 tệp BMP, nhịp chu kỳ 12 bytes (8B LSB + 4B Dummy),        |
|             thứ tự thực thi đảo ngược (Item05 -> Item01).                                        |
| - DFIR    : Phân tích đồ thị luồng thực thi IDA Pro, mô hình hóa Stride và ghép nối đa tệp.     |
+--------------------------------------------------------------------------------------------------+
```

Series bài viết này là minh chứng rõ nét cho thấy: **Trong dịch ngược mã máy và điều tra số, không có công cụ tự động nào có thể thay thế được việc đọc hiểu thấu đáo mã máy Assembly và kiên nhẫn bóc tách từng bit dữ liệu.**
