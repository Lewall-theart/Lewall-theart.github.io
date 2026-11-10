---
title: Secure Password Database – Phân tích Lỗ hổng Heartbleed trên Heap và Thuật toán băm djb2
date: '2026-11-10'
excerpt: >-
  Hướng dẫn từng bước dịch ngược tệp nhị phân ELF 64-bit system.out trong IDA Pro: nhận diện phép giải mã XOR 0xAA, bóc tách thuật toán băm djb2, và khai thác lỗ hổng rò rỉ bộ nhớ Heap kiểu Heartbleed để giải mã flag.
featured: /thumbnails/investigative-reversing.jpg
flag: 'picoCTF{...}'
tags:
  - Reverse Engineering
  - Binary Exploitation
  - IDA Pro
  - Heartbleed
  - Heap Out-of-Bounds Read
  - djb2
  - CTF
---

> *"Lỗ hổng Heartbleed (CVE-2014-0160) từng làm rung chuyển cả thế giới an ninh mạng vì một sai lầm ngớ ngẩn: tin tưởng độ dài gói tin do người dùng khai báo mà không kiểm tra kích thước thực tế của dữ liệu. Trong thử thách này, chúng ta sẽ thấy cơ chế đó được tái hiện sinh động qua một chương trình quản lý mật khẩu nhị phân."*

---

## 1. Đề bài & Định vị Mục tiêu

Chúng ta được cung cấp một tệp thực thi duy nhất: **`system.out`** (khi dịch ngược sẽ thấy tên tệp nguồn gốc là `heartbleed.c`).

Kiểm tra thông số kỹ thuật tệp:
- **Định dạng:** ELF 64-bit LSB pie executable, x86-64
- **Kích thước:** 16,768 bytes
- **Mục tiêu:** Chương trình yêu cầu người dùng nhập một mã hash hợp lệ để xác thực tài khoản. Nếu nhập đúng giá trị mà hàm `make_secret()` mong đợi, chương trình sẽ mở tệp `flag.txt` và in ra cờ.

---

## 2. Bước 1: Mở tệp trong IDA Pro và Phân tích luồng `main`

Mở file `system.out` trong IDA Pro và chuyển tới hàm **`main`** (nhấn phím **`F5`** để xem mã giả C):

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char *dest;
  int user_len;
  char *endptr;
  unsigned __int64 user_hash;
  __int64 secret_hash;
  FILE *stream;
  _BYTE secret_buf[13];
  char len_str[32];
  char input_pass[64];
  char flag_buf[104];

  // 1. Cấp phát 90 byte trên vùng nhớ Heap
  dest = (char *)calloc(90u, 1u);

  // 2. Ghi chuỗi bí mật (12 byte) vào Heap bắt đầu từ offset +60
  for ( int i = 0; i <= 12; ++i )
    dest[i + 60] = obf_bytes[i] ^ 0xAA;

  // 3. Người dùng nhập mật khẩu
  puts("Please set a password for your account:");
  if ( fgets(input_pass, 50, stdin) != nullptr )
  {
    strcpy(dest, input_pass); // Mật khẩu nằm ở dest (offset +0)

    // 4. Chương trình hỏi độ dài mật khẩu
    puts("How many bytes in length is your password?");
    if ( fgets(len_str, 20, stdin) != nullptr )
    {
      user_len = atoi(len_str);
      printf("You entered: %d\n", user_len);
      puts("Your successfully stored password:");

      // In ra user_len bytes từ mảng dest
      for ( int j = 0; user_len >= j && j <= 89; ++j )
        printf("%d ", dest[j]);
      putchar('\n');
    }
  }

  // 5. Yêu cầu nhập mã hash để xác thực
  puts("Enter your hash to access your account!");
  if ( fgets(input_pass, 50, stdin) != nullptr )
  {
    user_hash = strtoul(input_pass, &endptr, 10);
    secret_hash = make_secret(secret_buf);

    // So sánh hash người dùng nhập với secret_hash
    if ( secret_hash == user_hash )
    {
      stream = fopen("flag.txt", "r");
      if ( fgets(flag_buf, 100, stream) != nullptr )
        printf("%s", flag_buf);
      fclose(stream);
    }
  }
  free(dest);
  return 0;
}
```

Nhìn vào bức tranh tổng thể, cấu trúc vùng nhớ Heap của con trỏ `dest` được bố trí như sau:
```
+--------------------------+--------------------+-------------------------+
| dest[0 .. 49]            | dest[50 .. 59]     | dest[60 .. 72]          |
| Mật khẩu bạn nhập vào    | Vùng đệm 0x00      | Chuỗi bí mật (SECRET)   |
+--------------------------+--------------------+-------------------------+
```

---

## 3. Bước 2: Làm sao biết mỗi byte được giải mã bằng phép toán XOR với `0xAA`?

Đây là câu hỏi cốt lõi mà bất kỳ ai mới làm quen với dịch ngược đều thắc mắc: **Làm thế nào để nhận biết phép toán và khóa giải mã trong IDA?**

Có **hai cách** để bạn nhận biết điều này:

### Cách 1: Xem ở cửa sổ Mã Giả Decompiler (Phím `F5`)
Nhấp đúp chuột vào hàm `make_secret`:

```c
__int64 __fastcall make_secret(_BYTE *buffer)
{
  __int64 i;

  for ( i = 0; obf_bytes[i] != 0; ++i )
    buffer[i] = obf_bytes[i] ^ 0xAA;
  buffer[12] = 0;
  return hash(buffer);
}
```

- Trong ngôn ngữ C, ký hiệu **`^`** là **toán tử Bitwise XOR** (phép Tuyển loại trừ từng bit).
- Con số **`0xAA`** hiển thị ngay bên cạnh chính là giá trị khóa XOR (Hexadecimal).
- Tương tự, ngay trong hàm `main` ở dòng ghi dữ liệu vào heap, bạn cũng thấy:
  `dest[i + 60] = obf_bytes[i] ^ 0xAA;`

---

### Cách 2: Xem ở cửa sổ Hợp ngữ Assembly (Phím `Space` / Text View)
Nếu bạn phân tích ở cấp độ mã máy, hãy nhìn vào hàm `make_secret` tại địa chỉ **`0x1386`**:

```x86asm
.text:0000000000001386  movzx   eax, byte ptr [rax]    ; Đọc 1 byte từ obf_bytes[i] vào eax
.text:0000000000001389  xor     eax, 0FFFFFFAAh        ; LỆNH XOR CỦA CPU Ở ĐÂY!
.text:000000000000138C  mov     ecx, eax
.text:000000000000138E  mov     rdx, [rbp+var_18]
.text:0000000000001392  mov     rax, [rbp+var_8]
.text:0000000000001396  add     rax, rdx
.text:0000000000001399  mov     edx, ecx
.text:000000000000139B  mov     [rax], dl              ; Ghi byte kết quả (dl) vào buffer[i]
```

- Lệnh **`xor eax, 0FFFFFFAAh`** là chỉ thị hợp ngữ x86-64 thực hiện phép toán XOR giữa thanh ghi `eax` và hằng số `0xFFFFFFAA`.
- Khi ghi kết quả vào bộ nhớ, lệnh `mov [rax], dl` chỉ lấy thanh ghi 8-bit thấp nhất (`dl`, tương đương với `al`).
- Vì `0xFFFFFFAA & 0xFF = 0xAA`, phép toán trên 1 byte dữ liệu chính xác là:
  $$\text{Result Byte} = \text{obf\_bytes}[i] \oplus \text{0xAA}$$

---

### Cách 3: Trích xuất mảng dữ liệu `obf_bytes`
Trong IDA Pro, nhấp đúp vào chữ **`obf_bytes`** ở bất kỳ hàm nào. IDA sẽ chuyển ngay đến phân vùng dữ liệu `.rodata` tại địa chỉ **`0x2008`**:

```
.rodata:0000000000002008 obf_bytes db 0C3h, 0FFh, 0C8h, 0C2h, 92h, 9Bh, 8Bh, 0C0h, 80h, 0C2h, 0C4h, 8Bh, 0
```

12 byte dữ liệu gốc là:
`0xC3, 0xFF, 0xC8, 0xC2, 0x92, 0x9B, 0x8B, 0xC0, 0x80, 0xC2, 0xC4, 0x8B`

Thực hiện XOR từng byte với `0xAA`:
- `0xC3 ^ 0xAA = 0x69` $\longrightarrow$ Ký tự ASCII: **`i`** (mã 105)
- `0xFF ^ 0xAA = 0x55` $\longrightarrow$ Ký tự ASCII: **`U`** (mã 85)
- `0xC8 ^ 0xAA = 0x62` $\longrightarrow$ Ký tự ASCII: **`b`** (mã 98)
- `0xC2 ^ 0xAA = 0x68` $\longrightarrow$ Ký tự ASCII: **`h`** (mã 104)
- `0x92 ^ 0xAA = 0x38` $\longrightarrow$ Ký tự ASCII: **`8`** (mã 56)
- `0x9B ^ 0xAA = 0x31` $\longrightarrow$ Ký tự ASCII: **`1`** (mã 49)
- `0x8B ^ 0xAA = 0x21` $\longrightarrow$ Ký tự ASCII: **`!`** (mã 33)
- `0xC0 ^ 0xAA = 0x6A` $\longrightarrow$ Ký tự ASCII: **`j`** (mã 106)
- `0x80 ^ 0xAA = 0x2A` $\longrightarrow$ Ký tự ASCII: **`*`** (mã 42)
- `0xC2 ^ 0xAA = 0x68` $\longrightarrow$ Ký tự ASCII: **`h`** (mã 104)
- `0xC4 ^ 0xAA = 0x6E` $\longrightarrow$ Ký tự ASCII: **`n`** (mã 110)
- `0x8B ^ 0xAA = 0x21` $\longrightarrow$ Ký tự ASCII: **`!`** (mã 33)

Chuỗi ký tự bí mật được khôi phục nguyên vẹn là: **`"iUbh81!j*hn!"`**.

---

## 4. Bước 3: Phân tích thuật toán băm trong hàm `hash` (Thuật toán `djb2`)

Sau khi giải mã chuỗi bí mật, hàm `make_secret` gọi `hash(buffer)`:

```c
__int64 __fastcall hash(_BYTE *str)
{
  _BYTE *v1;
  __int64 h;

  for ( h = 5381; ; h = 33 * h + (unsigned __int8)*v1 )
  {
    v1 = str++;
    if ( *v1 == 0 )
      break;
  }
  return h;
}
```

Kiểm tra mã Assembly của hàm tại địa chỉ `0x1315`:
```x86asm
mov     [rbp+var_8], 1505h    ; 0x1505 = 5381 (Giá trị khởi tạo ban đầu)
...
shl     rax, 5                 ; rax = h << 5 = h * 32
add     rdx, rax               ; rdx = h * 32 + h = 33 * h
add     rax, rdx               ; cộng thêm ký tự c tiếp theo
```

Đây chính là thuật toán băm chuỗi kinh điển **`djb2`** của tác giả Daniel J. Bernstein:
$$h_0 = 5381$$
$$h_i = (h_{i-1} \times 33) + c_i$$

Áp dụng thuật toán này với chuỗi `"iUbh81!j*hn!"` bằng một script Python 3 dòng:

```python
h = 5381
for c in b"iUbh81!j*hn!":
    h = ((h * 33) + c) & 0xFFFFFFFFFFFFFFFF

print("Target Hash:", h)
# Kết quả in ra: 15237662580160011234
```

Giá trị Hash kỳ vọng của chương trình là: **`15237662580160011234`**.

---

## 5. Bước 4: Khai thác Lỗ hổng Heartbleed trên Heap (Góc nhìn Động)

Nếu bạn không muốn phân tích tĩnh toàn bộ mã máy mà muốn tương tác trực tiếp với chương trình, lỗ hổng **Out-of-Bounds Read** trong `main` sẽ giúp bạn lấy chuỗi bí mật:

1. Bạn nhập mật khẩu ngắn, ví dụ: `admin` (5 ký tự). Mật khẩu này được đặt tại `dest[0..4]`.
2. Khi chương trình hỏi: *"How many bytes in length is your password?"*
   - Bạn khai báo gian lận một con số lớn: **`75`** (hoặc `80`).
3. Vòng lặp in dữ liệu:
   ```c
   for ( j = 0; user_len >= j && j <= 89; ++j )
     printf("%d ", dest[j]);
   ```
   Do chương trình tin tưởng `user_len` mà không kiểm tra độ dài thực tế của `input_pass`, nó sẽ in liên tục 75 byte trên Heap!
4. Kết quả trên màn hình sẽ xuất hiện một dãy số thập phân:
   ```text
   97 100 109 105 110 0 0 ... [vùng đệm 0] ... 105 85 98 104 56 49 33 106 42 104 110 33
   ```
   Các byte từ vị trí 60 đến 71:
   `105 85 98 104 56 49 33 106 42 104 110 33` đổi sang mã ASCII chính là chuỗi: `"iUbh81!j*hn!"`!

---

## 6. Bước 5: Hai Cách Hoàn Thành Thử Thách & Lấy Flag

### Cách 1: Static Bypass (Đơn giản & Nhanh nhất)
Vì giá trị hash của chuỗi tĩnh là hằng số cố định, bạn có thể nhập trực tiếp khi kết nối với server:

```text
$ nc <challenge-server> <port>
Please set a password for your account:
hello
How many bytes in length is your password?
5
You entered: 5
Your successfully stored password:
104 101 108 108 111 
Enter your hash to access your account!
15237662580160011234
```

Chương trình so sánh `secret_hash == user_hash` thành công và in cờ ra màn hình:
```text
picoCTF{...}
```

---

### Cách 2: Tự động hóa bằng Python Script (Pwntools)

```python
#!/usr/bin/env python3
from pwn import *

# 1. Tính toán trước giá trị Hash djb2
SECRET = b"iUbh81!j*hn!"
def djb2(s: bytes) -> int:
    h = 5381
    for c in s:
        h = ((h * 33) + c) & 0xFFFFFFFFFFFFFFFF
    return h

target_hash = djb2(SECRET)
log.info(f"Target Hash Calculated: {target_hash}")

# 2. Kết nối tới tiến trình cục bộ hoặc server
# io = remote("candy-mountain.picoctf.net", 12345)
io = process("./system.out")

# 3. Gửi password và độ dài bất kỳ
io.recvuntil(b"Please set a password for your account:")
io.sendline(b"pass")

io.recvuntil(b"How many bytes in length is your password?")
io.sendline(b"4")

# 4. Gửi mã hash đã tính toán để mở Flag
io.recvuntil(b"Enter your hash to access your account!")
io.sendline(str(target_hash).encode())

# 5. Nhận kết quả Flag
flag = io.recvall().decode()
log.success(f"Flag: {flag.strip()}")
```

---

## 7. Đúc kết Bài học An toàn Thông tin

1. **Nguyên tắc "Never Trust User Input":** Độ dài của dữ liệu (`user_len`) phải luôn luôn được đo đạc bởi chính hệ thống (thông qua `strlen()` hoặc giá trị trả về của `fread()`), tuyệt đối không để người dùng tự do chỉ định.
2. **Quản lý Vùng nhớ Độc lập:** Không nên lưu trữ dữ liệu nhạy cảm (Secret token, API key, Master hash) trên cùng một phân đoạn bộ nhớ heap liền kề với vùng dữ liệu do người dùng kiểm soát.
3. **Phân tích Tĩnh (Static Analysis) với IDA Pro:** Các kỹ thuật che giấu chuỗi đơn giản như XOR một byte (`^ 0xAA`) rất dễ bị phát hiện thông qua các lệnh `xor reg, imm` trong cửa sổ Hợp ngữ hoặc toán tử `^` trên mã giả Hex-Rays.
