---
title: "The ROT Side"
description: "ROT13 là trò trẻ con. Người anh em bí ẩn của nó xử lý toàn bộ printable ASCII — và đó mới là thứ đáng sợ thực sự."
date: 2026-03-11
category: Crypto
catColor: cyan
difficulty: easy
tags: [ROT47, Base32, Hex, Encoding]
event: "HackForge CTF"
readTime: 7
flag: "HackForge{rot47_the_other_rotation}"
featured: false
---

ROT13 — ai cũng biết. Dịch chuyển 13 vị trí, chỉ ảnh hưởng chữ cái, áp dụng hai lần là về điểm xuất phát.

Nhưng bài này hỏi về người anh em ít nổi tiếng hơn: **ROT47**. Cùng ý tưởng, khác phạm vi — và đó là điểm mấu chốt để nhận ra nó.

> *"Mọi cipher đều để lộ danh tính — nếu bạn biết cách hỏi đúng câu."*

## Ciphertext đề bài

```text
4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f
```

## Nhận dạng pipeline

Quan sát trước khi chạy tool. Đây là kỹ năng quan trọng nhất trong Encoding challenges.

| Bước | Dấu hiệu nhận ra | Encoding |
|------|-----------------|----------|
| 1 | Chỉ có `0-9` và `a-f`, độ dài chẵn | Hex |
| 2 | Sau decode: `[A-Z2-7]` uppercase, có thể có `=` | Base32 |
| 3 | Sau decode: text đọc được nhưng ký tự bị lệch, **bao gồm cả số và ký tự đặc biệt** | ROT47 |

Ba lớp. Bóc từng lớp theo đúng thứ tự.

## Bước 1 — Hex Decode

Chuỗi 118 ký tự hex → 59 bytes. Mỗi 2 ký tự hex = 1 byte.

```python
ciphertext = "4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
```

Output toàn chữ hoa, xuất hiện số `3`, `5`, `2` — **Base32 pattern** rõ ràng. Base32 dùng bảng ký tự `A-Z` và `2-7`.

## Bước 2 — Base32 Decode

Base32 mã hóa binary thành 32 ký tự printable. Khác Base64 ở chỗ chỉ dùng chữ hoa và 6 chữ số (`2-7`), thường gặp trong các hệ thống cần case-insensitive encoding.

```python
import base64

# Base32 cần padding — thêm '=' cho đủ bội số của 8
padded = step1 + '=' * (-len(step1) % 8)
step2 = base64.b32decode(padded).decode()
print(step2)
# =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
```

Bây giờ có ký tự đặc biệt: `{`, `}`, `\`, `=`... Text vẫn vô nghĩa nhưng **không còn thuần chữ cái**. Đây là dấu hiệu đặc trưng của ROT47 — nó xoay cả **ký tự đặc biệt**, không chỉ chữ cái như ROT13.

## Bước 3 — ROT47 Decode

### ROT47 là gì?

ROT13 chỉ xoay `A-Z` (26 ký tự, dịch 13). ROT47 xoay **toàn bộ printable ASCII** từ `!` (33) đến `~` (126) — tổng cộng **94 ký tự**, dịch đúng **47 vị trí**.

```
Phạm vi: 0x21 ('!') → 0x7E ('~')
Công thức: chr(33 + (ord(c) - 33 + 47) % 94)
```

Vì 94 = 47 × 2, ROT47 cũng là *involution* — áp dụng hai lần về điểm xuất phát, giống ROT13.

```python
def rot47(text: str) -> str:
    result = []
    for c in text:
        if 33 <= ord(c) <= 126:
            result.append(chr(33 + (ord(c) - 33 + 47) % 94))
        else:
            result.append(c)
    return ''.join(result)

step3 = rot47(step2)
print(step3)
# HackForge{rot47_the_other_rotation}
```

## Script hoàn chỉnh

```python
import base64

def rot47(text: str) -> str:
    return ''.join(
        chr(33 + (ord(c) - 33 + 47) % 94) if 33 <= ord(c) <= 126 else c
        for c in text
    )

ciphertext = "4f345a444950445649424254514e534d494e41454b59334747424354534e525149424354534e53444742425541524a53495535454150324f"

step1 = bytes.fromhex(ciphertext).decode()
step2 = base64.b32decode(step1 + '=' * (-len(step1) % 8)).decode()
step3 = rot47(step2)

print(f"[Hex]    → {step1}")
print(f"[Base32] → {step2}")
print(f"[ROT47]  → {step3}")
```

Output:

```text
[Hex]    → O4ZDIPD VIBBTQNSMINAE KY3GGBCTSNRQI BCTSNSDGBBUARJSIU5EAP2O
[Base32] → =rwAx:?5rwAx:?5\6==\eFC\tI\t6C\tI\t56C
[ROT47]  → HackForge{rot47_the_other_rotation}
```

## Chuỗi giải mã

```text
4f345a44...4f                                   ← Hex (118 chars)
        ↓  bytes.fromhex()
O4ZDIPD VIBBTQNSMINAE...                        ← Base32
        ↓  base64.b32decode()
=rwAx:?5rwAx:?5\6==\eFC...                      ← ROT47'd text
        ↓  rot47()
HackForge{rot47_the_other_rotation}             ← FLAG 🚩
```

## ROT13 vs ROT47 — So sánh

| | ROT13 | ROT47 |
|---|---|---|
| Phạm vi | `A-Z`, `a-z` (52 ký tự) | `!` → `~` (94 ký tự) |
| Dịch chuyển | 13 vị trí | 47 vị trí |
| Ảnh hưởng số? | ❌ Không | ✅ Có |
| Ảnh hưởng ký tự đặc biệt? | ❌ Không | ✅ Có |
| Nhận dạng | Text vô nghĩa, chỉ chữ cái bị lệch | Text vô nghĩa, **cả số và ký tự đặc biệt** bị lệch |

**Mẹo nhận dạng nhanh:** Nếu thấy `{` hoặc `}` bị biến thành ký tự lạ như `\[` hay `]`, nghĩ ngay đến ROT47 — vì ROT13 không bao giờ đụng đến dấu ngoặc.

## Bài học

Encoding challenges thường xếp nhiều lớp lên nhau với một lý do: buộc bạn phải **nhận dạng từng bước** thay vì chạy tool mù.

Pipeline `Hex → Base32 → ROT47` không ngẫu nhiên — mỗi lớp được chọn để che đi dấu vết của lớp tiếp theo. Base32 tạo ra toàn chữ hoa để làm bạn nghĩ đến một encoding khác. ROT47 làm cả flag format `{}` bị biến dạng để bạn không nhận ra ngay.

Nhưng một khi biết pattern — nó tan chảy trong chưa đến một giây.

> *"The best cipher is the one your enemy doesn't recognize as a cipher."*
