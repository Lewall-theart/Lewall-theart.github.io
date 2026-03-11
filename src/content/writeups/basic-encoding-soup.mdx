---
title: "Basic Encoding Soup"
description: "Ba lớp mặt nạ xếp chồng nhau — Hex, Base64, ROT13. Không cần toán học, chỉ cần đôi mắt biết nhìn."
date: 2026-03-10
category: Crypto
catColor: cyan
difficulty: easy
tags: [Hex, Base64, ROT13, Encoding]
event: "HackForge CTF"
readTime: 6
flag: "HackForely{hex_b64_rot13_classic}"
featured: false
---

Bài này không có gì phức tạp về mặt toán học. Không có RSA, không có AES, không có elliptic curve. Chỉ là **ba lớp mặt nạ xếp chồng lên nhau** — và nhiệm vụ của bạn là bóc từng lớp theo đúng thứ tự.

Người ra đề đang kiểm tra một kỹ năng rất cơ bản nhưng cực kỳ quan trọng: nhận dạng encoding bằng mắt thường. Một hacker không cần chạy tool mới biết mình đang nhìn vào cái gì.

> *"Mọi bí mật đều để lộ dấu vết — nếu bạn biết mình đang tìm gì."*

## Ciphertext đề bài

```text
5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d
```

## Nhận dạng ban đầu

Trước khi viết bất kỳ dòng code nào, hãy **quan sát**. Đây là thứ phân biệt người chơi CTF giỏi với người chỉ biết dùng CyberChef mà không hiểu mình đang làm gì.

| Dấu hiệu quan sát được | Ý nghĩa |
|---|---|
| Chỉ có ký tự `0–9` và `a–f` | → Hex encoding |
| Sau decode hex, chuỗi kết thúc bằng `=` | → Base64 padding |
| Sau decode Base64, có `{}` nhưng text vô nghĩa | → ROT13 hoặc Caesar |

Ba manh mối, ba bước. Thẳng tiến.

## Bước 1 — Hex Decode

Hex là cách biểu diễn bytes dưới dạng cặp ký tự hexadecimal. Mỗi 2 ký tự = 1 byte. Chuỗi dài 88 ký tự → 44 bytes.

```python
ciphertext = "5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d"

step1 = bytes.fromhex(ciphertext).decode()
print(step1)
# VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
```

Dấu `=` cuối chuỗi không phải ngẫu nhiên. Đó là **Base64 padding** — tín hiệu rõ ràng nhất bạn có thể nhận được.

## Bước 2 — Base64 Decode

Base64 mã hóa binary data thành ASCII bằng bảng 64 ký tự. Padding `=` xuất hiện khi độ dài input không chia hết cho 3 bytes.

```python
import base64

step2 = base64.b64decode(step1).decode()
print(step2)
# UnpxSbetry{urk_o64_ebgMT3_pynffvph}
```

Bây giờ thú vị rồi. Dấu `{}` hiện ra — đây **chắc chắn là flag format**. Nhưng nội dung vẫn là gibberish. Nhìn kỹ phần trước dấu ngoặc: `UnpxSbetry`...

Não bộ nhận ra không? `U→H`, `n→a`, `p→c`, `x→k`... Đây là **ROT13**. Không cần tool, không cần brute force — chỉ cần kinh nghiệm đọc pattern.

## Bước 3 — ROT13 Decode

ROT13 là cipher Caesar đặc biệt: dịch chuyển mỗi chữ cái đúng **13 vị trí**. Vì bảng chữ cái tiếng Anh có 26 chữ, ROT13 là *involution* — áp dụng hai lần là về điểm xuất phát. Số và ký tự đặc biệt không bị ảnh hưởng.

```python
import codecs

step3 = codecs.decode(step2, 'rot_13')
print(step3)
# HackForely{hex_b64_rot13_classic}
```

## Script hoàn chỉnh

```python
import codecs, base64

ciphertext = "5657357765464e695a58527965335679613139764e6a52665a574a6e4d544e6663486c755a6d5a326348303d"

step1 = bytes.fromhex(ciphertext).decode()
step2 = base64.b64decode(step1).decode()
step3 = codecs.decode(step2, 'rot_13')

print(f"[Hex]    → {step1}")
print(f"[Base64] → {step2}")
print(f"[ROT13]  → {step3}")
```

Output:
```text
[Hex]    → VW5weFNiZXRye3Vya19vNjRfZWJnMTNfcHluZmZ2cH0=
[Base64] → UnpxSbetry{urk_o64_ebgMT3_pynffvph}
[ROT13]  → HackForely{hex_b64_rot13_classic}
```

## Chuỗi giải mã

```text
5657357765464e69...3d        ← Hex
        ↓  bytes.fromhex()
VW5weFNiZXRye3Vya19v...cH0=  ← Base64
        ↓  base64.b64decode()
UnpxSbetry{urk_o64_ebgMT3_pynffvph}  ← ROT13
        ↓  codecs.decode('rot_13')
HackForely{hex_b64_rot13_classic}    ← FLAG 🚩
```

## Bài học rút ra

### Encoding ≠ Encryption

Đây là điểm mấu chốt mà nhiều người mới chơi CTF hay nhầm lẫn.

**Encoding** — Hex, Base64, ROT13 — không có key, không có bảo mật. Mục đích là *biểu diễn* hoặc *truyền tải* dữ liệu, không phải bảo vệ nó.

**Encryption** — AES, RSA, ChaCha20 — có key, có toán học, có bảo mật thực sự.

Dùng Base64 để "bảo mật" dữ liệu cũng giống như khóa cửa nhưng để chìa khóa dưới tấm thảm.

### Nhận dạng nhanh = Lợi thế lớn

Trong CTF, thời gian là điểm số. Các pattern cần nhớ thuộc lòng:

| Pattern | Encoding |
|---|---|
| `[0-9a-f]+`, độ dài chẵn | Hex |
| `[A-Za-z0-9+/]+=*` | Base64 |
| Text đọc được nhưng vô nghĩa, chỉ toàn chữ cái | ROT / Caesar |
| `%XX` xen kẽ | URL encoding |
| `\u0041\u0042...` | Unicode escape |

> *"Security through obscurity is not security — it's just a locked door with the key under the mat."*
