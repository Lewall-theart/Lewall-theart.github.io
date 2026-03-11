---
title: "Double Trouble"
description: "Kẻ tấn công đôi khi áp dụng cùng một encoding nhiều lần để tránh bị phát hiện. Đơn giản — nhưng hiệu quả hơn bạn nghĩ."
date: 2025-03-11
category: Crypto
catColor: cyan
difficulty: easy
tags: [Base64, Hex, Encoding, Double-Encoding]
event: "HackForge CTF"
readTime: 5
flag: "HackForge{double_base64_layers}"
featured: false
---

Bài này tên là **Double Trouble** — và đó không phải ngẫu nhiên. Description đã nói thẳng:

> *"Sometimes attackers apply the same encoding multiple times to evade detection. Simple but effective."*

Một lớp Base64 thì công cụ nào cũng nhận ra. Hai lớp? Nhiều scanner tự động sẽ bỏ qua sau lớp đầu tiên vì thấy output vẫn là gibberish, không phải plaintext. Đó là lý do kỹ thuật này tồn tại.

## Ciphertext đề bài

```text
55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d
```

## Nhận dạng ban đầu

Quan sát ciphertext: toàn ký tự `0-9` và `a-f`, độ dài 120 ký tự — **Hex encoding**, không cần bàn cãi.

Sau khi decode hex, output kết thúc bằng `=` — **Base64 padding**. Và sau khi decode Base64 lần một, output *lại* kết thúc bằng `==` — **Base64 padding lần nữa**. Đây là dấu hiệu rõ nhất của double encoding.

## Bước 1 — Hex Decode

120 ký tự hex → 60 bytes. Mỗi 2 ký tự = 1 byte.

```python
ct = "55306447616d4577576e5a6a625752735a544a53646d5258536e4e61566a6c705756684f62453571556d5a6952305931576c684b656d5a525054303d"

step1 = bytes.fromhex(ct).decode()
print(step1)
# U0dGamEwWnZjbWRsZTJSdmRXSnNaVjlpWVhObE5qUmZiR0Y1WlhKemZRPT0=
```

Dấu `=` cuối xác nhận đây là Base64. Nhưng nếu decode ra thì output cũng vẫn còn `==` — tức là **còn một lớp Base64 nữa bên trong**.

## Bước 2 — Base64 Decode (lần 1)

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# SGFja0Zvcmdle2RvdWJsZV9iYXNlNjRfbGF5ZXJzfQ==
```

Output vẫn là một chuỗi Base64 hợp lệ, kết thúc bằng `==`. Chưa xong.

## Bước 3 — Base64 Decode (lần 2)

```python
step3 = base64.b64decode(step2).decode()
print(step3)
# HackForge{double_base64_layers}
```

Flag hiện ra.

## Script hoàn chỉnh

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

## Chuỗi giải mã

```text
55306447...3d                                     ← Hex (120 chars)
        ↓  bytes.fromhex()
U0dGamEw...PT0=                                   ← Base64 layer 1
        ↓  base64.b64decode()
SGFja0Zv...fQ==                                   ← Base64 layer 2
        ↓  base64.b64decode()
HackForge{double_base64_layers}                   ← FLAG 🚩
```

## Tại sao double encoding tồn tại?

Trong thực tế, kẻ tấn công dùng kỹ thuật này để **bypass WAF** (Web Application Firewall) và các tool phát hiện tự động.

Ví dụ: payload SQL injection `' OR 1=1 --`

```
Plaintext : ' OR 1=1 --
Base64×1  : JyBPUiAxPTEgLS0=          ← WAF có thể nhận ra
Base64×2  : SnlCUFVpQXhQVEVnTFMwPQ==  ← WAF thường bỏ qua
```

Tool bảo mật thường chỉ decode một lần. Nếu output vẫn là Base64 gibberish, nhiều scanner đánh dấu là "safe" rồi bỏ qua. Server phía sau decode thêm một lần nữa và thực thi payload.

Đó là lý do **double encoding** — tuy đơn giản — vẫn hiệu quả trong thực tế.

## Nhận dạng nhanh

Dấu hiệu đặc trưng của double Base64:

| Tình huống | Ý nghĩa |
|---|---|
| Decode Base64 → output vẫn là Base64 hợp lệ | → Có ít nhất 2 lớp |
| Output có `=` hoặc `==` nhưng không đọc được | → Chưa đủ bước decode |
| Decode 2 lần vẫn gibberish | → Có thể 3 lớp, hoặc kết hợp encoding khác |

**Quy tắc thực hành:** Luôn decode đến khi output là plaintext đọc được, hoặc cho đến khi không còn encoding nào nhận ra được nữa.

> *"When one layer isn't enough to hide, just add another."*
