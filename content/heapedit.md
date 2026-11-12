---
title: Tea-Cash / HeapEdit – Giải mã Cấu trúc Chunk Glibc 2.27 và Duyệt Danh sách Tcache
date: '2026-11-12'
excerpt: >-
  Phân tích chi tiết cơ chế quản lý tcache trong Glibc 2.27 qua thử thách tea-cash (HeapEdit), giải mã lý do khoảng cách giữa các chunk malloc(0x80) liên tiếp là 0x90 (0x80 + 0x10), cơ chế LIFO của free list và khôi phục flag thành công.
featured: /thumbnails/heapedit.jpg
flag: 'academy{ef29b8f2d75bd216bf505de0d02fddef}'
tags:
  - Heap Exploitation
  - Pwn
  - Glibc 2.27
  - Tcache
  - Chunk Layout
  - Python Pwntools
  - CTF
---

> *"Hiểu được cách Glibc bố trí bộ nhớ Heap và quản lý danh sách liên kết đơn tcache là bước nhập môn quan trọng nhất trên con đường chinh phục kỹ thuật khai thác lỗ hổng nhị phân (Binary Exploitation / Pwn). Tên thử thách 'tea-cash' chính là một cách chơi chữ thú vị của tác giả dành cho cơ chế 'tcache'. Khi đã nắm rõ quy luật kích thước chunk và cơ chế LIFO, việc truy vết toàn bộ chuỗi chunk trên bộ nhớ trở nên vô cùng sáng tỏ."*

---

## 1. Đề bài & Định vị Mục tiêu

Thử thách **`tea-cash`** (tên tệp `heapedit`) cung cấp cho chúng ta:
- Mã nguồn C: **`heapedit.c`**
- Thư viện C đính kèm: **`libc.so.6`** (kiểm tra chuỗi phiên bản: `Ubuntu GLIBC 2.27-3ubuntu1.2 stable release version 2.27`)
- Tệp cấu hình biên dịch: **`Makefile.share`** (`gcc -Xlinker -rpath=./ -Wall -m64 -pedantic -no-pie --std=gnu99 -o heapedit heapedit.c`)
- Máy chủ dịch vụ thử thách: `nc xebec.cylabacademy.net 43860`

Mục tiêu của bài toán:
Khi kết nối qua Netcat tới server, chương trình in ra địa chỉ `tcache head` (địa chỉ của chunk đầu tiên `chunks[0]`). Chương trình yêu cầu chúng ta nhập lần lượt địa chỉ của **6 chunk** theo đúng thứ tự duyệt của danh sách liên kết `tcache`. Nếu nhập chính xác cả 6 địa chỉ, server sẽ in ra nội dung flag.

---

## 2. Giải phẫu Mã nguồn `heapedit.c`

Hãy xem xét kỹ từng phân đoạn logic của chương trình:

### 2.1. Thiết lập Cấu hình & Đọc Flag
```c
#define CHUNK_COUNT 6
#define CHUNK_SIZE 0x80           
#define FLAG_FILE "flag.txt"
#define FLAG_OFFSET (sizeof(void *))  // 8 bytes trên kiến trúc 64-bit
```

Chương trình đọc flag từ `flag.txt` vào bộ đệm `flag_buf`.

---

### 2.2. Khởi tạo 6 Chunk trên Heap và Ghi Flag
```c
for (int i = 0; i < CHUNK_COUNT; ++i) {
    chunks[i] = malloc(CHUNK_SIZE);
    if (!chunks[i]) { ... }
    memset(chunks[i], 0, CHUNK_SIZE);
}
// Sao chép flag vào chunk cuối cùng (chunks[5]) tại vị trí cách đầu chunk 8 bytes
memcpy((char*)chunks[CHUNK_COUNT-1] + FLAG_OFFSET, flag_buf, flen + 1);
```

Chương trình cấp phát liên tiếp 6 vùng nhớ bằng `malloc(0x80)`. Flag được đặt tại chunk số 6 (`chunks[5]`), nhưng bắt đầu từ offset `+ 8` (`FLAG_OFFSET`).

---

### 2.3. In con trỏ `head` và Giải phóng Chunk (Free)
```c
void *head = chunks[0]; 
printf("tcache head (start of free list) -> %p\n", head);

// Giải phóng ngược từ chunks[5] về chunks[0]
for (int i = CHUNK_COUNT - 1; i >= 0; --i) {
    free(chunks[i]);
}
```

Chương trình in ra địa chỉ `head = chunks[0]`. Ngay sau đó, nó gọi `free()` lùi dần từ `chunks[5]` về `chunks[0]`.

---

### 2.4. Vòng lặp Kiểm tra Duyệt Danh sách (Traversal Check)
```c
void *expected = head;
for (int i = 0; i < CHUNK_COUNT; ++i) {
    void *user_addr = NULL;
    printf("Chunk %d address: ", i+1);
    if (scanf("%p", &user_addr) != 1) return 1;

    // Địa chỉ nhập vào phải khớp chính xác với expected
    if (user_addr != expected) {
        fprintf(stderr, "Wrong address. Got %p. Exiting.\n", user_addr);
        return 1;
    }

    // Đọc con trỏ next (8 bytes đầu tiên của chunk vừa nhập)
    void *next = NULL;
    memcpy(&next, user_addr, sizeof(void *)); 

    if (next != NULL && !is_known_chunk(next, chunks, CHUNK_COUNT)) {
        fprintf(stderr, "Detected invalid next pointer value %p\n", next);
        return 1;
    }

    // Cập nhật expected bằng con trỏ next để kiểm tra vòng lặp tiếp theo
    expected = next;
}

char *flag_loc = (char*)chunks[CHUNK_COUNT-1] + FLAG_OFFSET;
printf("Correct traversal! Flag: %s\n", flag_loc);
```

Quy tắc duyệt:
- Bắt đầu với `expected = head` (`chunks[0]`).
- Người dùng nhập địa chỉ chunk hiện tại.
- Chương trình lấy 8 byte đầu tiên tại địa chỉ đó coi là con trỏ `next`.
- Vòng lặp tiếp theo bắt buộc người dùng phải nhập chính xác giá trị `next` đó.
- Lặp lại đủ 6 lần, cờ sẽ được hiển thị.

---

## 3. Bản chất Kỹ thuật: Cấu trúc Heap Chunk và Cơ chế Tcache trong Glibc 2.27

Để giải quyết bài toán, ta cần trả lời 3 câu hỏi cốt lõi:
1. Tại sao khoảng cách giữa các chunk liên tiếp lại là **`0x80 + 0x10 = 0x90`**?
2. Tại sao sau khi `free`, thứ tự liên kết lại đi từ `chunks[0] -> chunks[1] -> ... -> chunks[5]`?
3. Tại sao flag lại được lưu ở `FLAG_OFFSET` (+8) thay vì ngay đầu chunk?

---

### 3.1. Cấu trúc Chunk của Glibc trên kiến trúc 64-bit

Trong kiến trúc x86-64, mỗi vùng nhớ được cấp phát bởi `malloc` đều có một **Chunk Header** kích thước 16 bytes (`0x10`):

```
+--------------------------------+--------------------------------+
|          prev_size             |             size               |
|          (8 bytes)             |     (8 bytes, kèm cờ A|M|P)    |
+--------------------------------+--------------------------------+ <-- Con trỏ malloc() trả về
|                                                                 |
|                    User Payload (Dữ liệu người dùng)           |
|                         (kích thước 0x80)                       |
|                                                                 |
+-----------------------------------------------------------------+
```

Khi chương trình gọi `malloc(0x80)`:
- Kích thước người dùng yêu cầu: `0x80` (128 bytes).
- Kích thước Chunk Header: `0x10` (16 bytes).
- Tổng kích thước thực tế của chunk trên heap:
  $$\text{Chunk Size} = \text{CHUNK\_SIZE} + \text{CHUNK\_HEADER} = 0x80 + 0x10 = \mathbf{0x90 \text{ bytes}}$$

Do `0x90` đã chia hết cho 16 byte (chuẩn căn lề 16-byte alignment của x86-64) và cờ `PREV_INUSE = 1`, giá trị ghi trong trường `size` của chunk sẽ là `0x91`.

Bởi vì 6 chunk được cấp phát liên tiếp nhau trong vòng lặp `for (int i = 0; i < 6; ++i)` mà không có bất kỳ lệnh cấp phát nào xen giữa, các chunk nằm liền kề nhau trên Heap theo quy luật cấp số cộng với công sai **`0x90`**:

$$\text{chunks}[0] = \text{base}$$
$$\text{chunks}[1] = \text{chunks}[0] + 0x90$$
$$\text{chunks}[2] = \text{chunks}[1] + 0x90 = \text{chunks}[0] + 0x90 \times 2$$
$$\text{chunks}[3] = \text{chunks}[2] + 0x90 = \text{chunks}[0] + 0x90 \times 3$$
$$\text{chunks}[4] = \text{chunks}[3] + 0x90 = \text{chunks}[0] + 0x90 \times 4$$
$$\text{chunks}[5] = \text{chunks}[4] + 0x90 = \text{chunks}[0] + 0x90 \times 5$$

> [!TIP]
> **Quy luật Heap Layout:** Công thức lấy `head + 0x80 + 0x10` liên tiếp chính là `head + 0x90`. `0x80` là kích thước dữ liệu người dùng yêu cầu (`CHUNK_SIZE`), còn `0x10` là phần metadata quản lý chunk của Glibc.

---

### 3.2. Cơ chế LIFO của Tcache Free List

Glibc 2.27 sử dụng cơ chế **tcache (Thread Local Cache)** để tăng tốc độ phân bổ bộ nhớ. Các chunk có kích thước $\le 0x410$ khi được `free()` sẽ được đưa vào các bin tcache tương ứng (mỗi bin là một danh sách liên kết đơn hoạt động theo cơ chế **LIFO - Last In, First Out**).

Mỗi phần tử trong tcache được định nghĩa như sau:
```c
typedef struct tcache_entry {
    struct tcache_entry *next;
} tcache_entry;
```
Con trỏ `next` này được ghi đè trực tiếp vào **8 byte đầu tiên của vùng User Data** của chunk vừa bị giải phóng. Đặc biệt, trong Glibc 2.27, con trỏ này lưu trữ địa chỉ thô (raw pointer) hoàn toàn không bị mã hóa (Safe Linking chỉ bắt đầu xuất hiện từ Glibc 2.32).

Hãy theo dõi trạng thái của tcache bin `0x90` khi vòng lặp `free` chạy từ `chunks[5]` về `chunks[0]`:

1. **Bước 1:** `free(chunks[5])`
   - Danh sách tcache: `[chunks[5]] -> NULL`
   - Tại `chunks[5]`: 8 byte đầu tiên lưu `next = NULL`.
2. **Bước 2:** `free(chunks[4])`
   - Danh sách tcache: `[chunks[4]] -> [chunks[5]] -> NULL`
   - Tại `chunks[4]`: 8 byte đầu tiên lưu `next = chunks[5]`.
3. **Bước 3:** `free(chunks[3])`
   - Danh sách tcache: `[chunks[3]] -> [chunks[4]] -> [chunks[5]] -> NULL`
   - Tại `chunks[3]`: 8 byte đầu tiên lưu `next = chunks[4]`.
4. **Bước 4:** `free(chunks[2])`
   - Danh sách tcache: `[chunks[2]] -> [chunks[3]] -> [chunks[4]] -> [chunks[5]] -> NULL`
   - Tại `chunks[2]`: 8 byte đầu tiên lưu `next = chunks[3]`.
5. **Bước 5:** `free(chunks[1])`
   - Danh sách tcache: `[chunks[1]] -> [chunks[2]] -> [chunks[3]] -> [chunks[4]] -> [chunks[5]] -> NULL`
   - Tại `chunks[1]`: 8 byte đầu tiên lưu `next = chunks[2]`.
6. **Bước 6:** `free(chunks[0])` (Chunk cuối cùng được giải phóng)
   - Đỉnh của danh sách tcache lúc này là: `chunks[0]`.
   - Danh sách tcache hoàn chỉnh:
     $$\mathbf{chunks[0]} \longrightarrow \mathbf{chunks[1]} \longrightarrow \mathbf{chunks[2]} \longrightarrow \mathbf{chunks[3]} \longrightarrow \mathbf{chunks[4]} \longrightarrow \mathbf{chunks[5]} \longrightarrow \mathbf{NULL}$$

Nhờ thao tác giải phóng theo chiều nghịch (`5 -> 0`), cấu trúc LIFO của tcache đã tự động đảo ngược danh sách và xếp các chunk theo chiều thuận (`0 -> 1 -> 2 -> 3 -> 4 -> 5`)!

---

### 3.3. Bí mật của `FLAG_OFFSET` (+8)

Quan sát lệnh ghi flag:
```c
memcpy((char*)chunks[CHUNK_COUNT-1] + FLAG_OFFSET, flag_buf, flen + 1);
```
- Khi `chunks[5]` bị đưa vào tcache, 8 byte đầu tiên của nó (`chunks[5] + 0` đến `chunks[5] + 7`) bị ghi đè bởi giá trị con trỏ `next = NULL` (`0x0000000000000000`).
- Nếu cờ được đặt ngay tại `chunks[5] + 0`, 8 ký tự đầu tiên của flag sẽ bị phá hủy!
- Bằng cách dịch chuyển flag đi đúng `sizeof(void *) = 8 bytes`, tác giả đề bài đã đảm bảo dữ liệu cờ vẫn nguyên vẹn ngay cả sau khi chunk đã bị giải phóng vào tcache.

---

## 4. Thực thi Thực tế & Khôi phục Flag

Khi kết nối với server thực tế qua Netcat:
```bash
Touya-academy@webshell:~/tea-cash$ nc xebec.cylabacademy.net 43860
```

Server trả về địa chỉ khởi đầu của danh sách tcache:
```text
tcache head (start of free list) -> 0x32edd490
```

Áp dụng quy tắc cộng liên tiếp `+ 0x90` (`+ 0x80 + 0x10`):

| Thứ tự | Chunk Index | Công thức cộng dồn | Địa chỉ Hex tương ứng |
| :---: | :---: | :--- | :---: |
| **1** | `chunks[0]` | `0x32edd490` | `0x32edd490` |
| **2** | `chunks[1]` | `0x32edd490 + 0x90` | `0x32EDD520` |
| **3** | `chunks[2]` | `0x32EDD520 + 0x90` | `0x32EDD5B0` |
| **4** | `chunks[3]` | `0x32EDD5B0 + 0x90` | `0x32EDD640` |
| **5** | `chunks[4]` | `0x32EDD640 + 0x90` | `0x32EDD6D0` |
| **6** | `chunks[5]` | `0x32EDD6D0 + 0x90` | `0x32EDD760` |

Nhập tuần tự 6 địa chỉ này vào terminal:
```text
Touya-academy@webshell:~/tea-cash$ nc xebec.cylabacademy.net 43860
tcache head (start of free list) -> 0x32edd490
Chunk 1 address: 0x32edd490
Chunk 2 address: 0x32EDD520
Chunk 3 address: 0x32EDD5B0
Chunk 4 address: 0x32EDD640
Chunk 5 address: 0x32EDD6D0
Chunk 6 address: 0x32EDD760
Correct traversal! Flag: academy{ef29b8f2d75bd216bf505de0d02fddef}
```

Flag thu được: **`academy{ef29b8f2d75bd216bf505de0d02fddef}`**.

---

### Script Khai thác Tự động bằng Python (Pwntools)

```python
#!/usr/bin/env python3
"""
solve.py — Exploit script for tea-cash / heapedit
Author  : Lewall
"""

from pwn import *
import re

# Cấu hình bước nhảy giữa 2 chunk liên tiếp
CHUNK_SIZE = 0x80
HEADER_SIZE = 0x10
STRIDE = CHUNK_SIZE + HEADER_SIZE  # 0x90 bytes
CHUNK_COUNT = 6

HOST = "xebec.cylabacademy.net"
PORT = 43860

def solve():
    # 1. Kết nối tới server thử thách
    io = remote(HOST, PORT)

    # 2. Đọc địa chỉ tcache head từ banner
    output = io.recvline().decode()
    log.info(f"Server response: {output.strip()}")

    match = re.search(r"0x[0-9a-fA-F]+", output)
    if not match:
        log.error("Không tìm thấy địa chỉ tcache head!")
        return

    head_addr = int(match.group(0), 16)
    log.success(f"Tcache Head: {hex(head_addr)}")

    # 3. Tính toán trước danh sách 6 địa chỉ
    chunks = [head_addr + (i * STRIDE) for i in range(CHUNK_COUNT)]

    # 4. Gửi lần lượt từng địa chỉ cho server
    for idx, addr in enumerate(chunks, 1):
        io.recvuntil(f"Chunk {idx} address: ".encode())
        addr_str = hex(addr)
        log.info(f"Gửi Chunk {idx}: {addr_str}")
        io.sendline(addr_str.encode())

    # 5. Nhận và hiển thị Flag
    result = io.recvall().decode()
    log.success(f"Kết quả nhận được:\n{result}")

if __name__ == "__main__":
    solve()
```

---

## 5. Đúc kết Bài học

1. **Hiểu rõ Heap Stride:** Kích thước thật của một chunk trong Glibc luôn bao gồm cả **User Payload** và **Chunk Header** (16 bytes trên 64-bit). Cấp phát `malloc(0x80)` luôn tốn `0x90` bytes trên Heap.
2. **Nắm vững cơ chế Tcache:** Tcache trong Glibc hoạt động theo nguyên lý LIFO (Last-In, First-Out). Nắm được chiều `free()` sẽ giúp điều tra viên và lập trình viên dễ dàng suy luận ra trật tự liên kết của danh sách free chunks.
3. **Ý thức về Vùng đệm Metadata:** Khi một chunk bị giải phóng, các byte đầu tiên của User Data sẽ được Glibc tái sử dụng làm con trỏ quản lý danh sách liên kết (`next`).
