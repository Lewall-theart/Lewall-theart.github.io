---
title: "Escaped Reality"
description: "Web apps love encoding special characters — nhưng khi thứ tự bị đảo ngược, mọi thứ trở nên kỳ lạ hơn bạn nghĩ."
date: 2026-03-11
category: Web
catColor: green
difficulty: easy
tags: [ROT13, Base64, URL-Encoding, Encoding]
event: "HackForge CTF"
readTime: 8
flag: "HackForge{url_encoding_escape_artist}"
featured: false
---

Tên challenge đã là một cái hint đầu tiên. **"Escaped Reality"**.Đó là hint: **escaped**, hay nói cách khác, **escaped characters** là trung tâm của bài này.

> *"Web applications love to encode special characters. Sometimes the encoding gets applied in unexpected orders."*

Một câu mô tả rất bình thường — cho đến khi bạn nhận ra từ khóa là **"unexpected orders"**. Thứ tự encoding không phải như bạn mong đợi.

## Ciphertext đề bài

```text
WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR
```

## Nhận dạng ban đầu

Nhìn vào ciphertext: toàn chữ cái và số, không có `=` padding, không có ký tự đặc biệt. Trông rất giống **Base64** — nhưng decode thẳng ra gibberish bytes, không phải text đọc được.

Đây là dấu hiệu cổ điển: **có một lớp khác bên ngoài Base64**. Câu hỏi là lớp gì?

Gợi ý từ tên bài: *e-scaped* → ROT. Và description nhắc đến *"unexpected orders"* → thứ tự bị đảo. Thay vì `Base64 → ROT`, thử **`ROT → Base64`**.

## Bước 1 — ROT13

Áp dụng ROT13 lên toàn bộ ciphertext trước:

```python
import codecs

ct = "WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR"

step1 = codecs.decode(ct, 'rot_13')
print(step1)
# JTQ4JTYxJTYzJTZCJTQ2JTZGJTcyJTY3JTY1JTdCJTc1JTcyJTZCJTVGJTY1...
```

Output bây giờ trông chuẩn Base64 hơn — có cả chữ hoa, thường, số, và quan trọng là **độ dài hợp lệ** cho Base64.

## Bước 2 — Base64 Decode

```python
import base64

step2 = base64.b64decode(step1 + '==').decode('ascii')
print(step2)
# %48%61%63%6B%46%6F%72%67%65%7B%75%72%6C%5F%65%6E%63%6F%64%69%6E%67%5F%65%73%63%61%70%65%5F%61%72%74%69%73%74%7D
```

`%48%61%63%6B...` — đây là **URL percent encoding**. Mỗi `%XX` là một byte ở dạng hex. Và `%48` = `H`, `%61` = `a`, `%63` = `c`, `%6B` = `k`... **HackForge** đang hiện ra.

## Bước 3 — URL Decode

```python
import urllib.parse

flag = urllib.parse.unquote(step2)
print(flag)
# HackForge{url_encoding_escape_artist}
```

## Script hoàn chỉnh

```python
import codecs, base64, urllib.parse

ct = "WGD4WGLkWGLmWGMPWGD2WGMTWGplWGL3WGL1WGqPWGp1WGplWGMQWGITWGL1WGMSWGLmWGMTWGL0WGL5WGMSWGL3WGITWGL1WGpmWGLmWGLkWGpjWGL1WGITWGLkWGplWGp0WGL5WGpmWGp0WGqR"

step1 = codecs.decode(ct, 'rot_13')
step2 = base64.b64decode(step1 + '==').decode('ascii')
step3 = urllib.parse.unquote(step2)

print(f"[ROT13]  → {step1[:40]}...")
print(f"[Base64] → {step2[:40]}...")
print(f"[URL]    → {step3}")
```

Output:

```text
[ROT13]  → JTQ4JTYxJTYzJTZCJTQ2JTZGJTcyJTY3JTY1...
[Base64] → %48%61%63%6B%46%6F%72%67%65%7B%75%72...
[URL]    → HackForge{url_encoding_escape_artist}
```

## Chuỗi giải mã

```text
WGD4WGLk...WGqR                              ← Ciphertext
        ↓  ROT13
JTQ4JTYx...JTdE                              ← Base64 string
        ↓  base64.decode()
%48%61%63%6B%46%6F%72%67%65%7B...%7D         ← URL percent-encoded
        ↓  urllib.parse.unquote()
HackForge{url_encoding_escape_artist}        ← FLAG 🚩
```

## Điểm mấu chốt: "unexpected orders"

Pipeline bình thường trong CTF encoding challenges thường là:

```
plaintext → ROT → Base64 → ciphertext
```

Bài này đảo ngược lại — ROT được áp dụng **sau** Base64 trong quá trình encode, nên khi giải phải đi ngược:

```
ciphertext → ROT13 → Base64 decode → URL decode → flag
```

Đây chính là ý nghĩa của *"unexpected orders"* trong description. Không có công thức cố định — mỗi challenge cần đọc hint và thử các thứ tự khác nhau.

## Tại sao lại decode được bằng ROT13?

ROT13 là **involution** — hàm tự nghịch đảo. Encode và decode đều là cùng một thao tác. Nếu bước cuối khi tạo ciphertext là `ROT13(base64_string)`, thì bước đầu khi giải cũng là `ROT13(ciphertext)` để khôi phục lại `base64_string` gốc.

## Bài học rút ra

### Đọc tên challenge

*"Escaped Reality"* không phải typo — đó là **escaped**, gợi ý thẳng đến escape characters và URL encoding. Trong CTF, tên challenge thường chứa ít nhất một hint về phương pháp giải.

### "Unexpected orders" = đảo pipeline

Khi description nói *"encoding gets applied in unexpected orders"*, đó là cách nói thẳng: hãy thử các thứ tự khác nhau. Nếu `A → B → C` không ra, thử `C → B → A`, hay `B → A → C`.

### Nhận dạng nhanh URL encoding

`%XX` với `XX` là hex digits là dấu hiệu đặc trưng nhất. Các codepoint hay gặp:

| Ký tự | Hex | URL encoded |
|-------|-----|-------------|
| `{`   | 7B  | `%7B` |
| `}`   | 7D  | `%7D` |
| `_`   | 5F  | `%5F` |
| `H`   | 48  | `%48` |
| `a`   | 61  | `%61` |

Khi thấy `%48%61%63%6B` → não bộ phải nhận ra ngay: `H`, `a`, `c`, `k` — **Hack**.

> *"The name of the challenge is always the first clue. Read it carefully."*
