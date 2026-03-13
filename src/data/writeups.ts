export type Writeup = {
  slug: string
  title: string
  description: string
  date: Date
  category: string
  catColor: 'cyan' | 'green' | 'orange' | 'red' | 'purple' | 'gold'
  difficulty: 'easy' | 'medium' | 'hard' | 'insane'
  tags: string[]
  event?: string
  readTime?: number
  flag?: string
  featured?: boolean
  draft?: boolean
}

export const writeups: Writeup[] = [
  {
    slug: 'basic-encoding-soup',
    title: 'Basic Encoding Soup',
    description: 'Ba lớp mặt nạ xếp chồng nhau — Hex, Base64, ROT13. Không cần toán học, chỉ cần đôi mắt biết nhìn.',
    date: new Date('2026-03-10'),
    category: 'Crypto',
    catColor: 'cyan',
    difficulty: 'easy',
    tags: ['Hex', 'Base64', 'ROT13', 'Encoding'],
    event: 'HackForge CTF',
    readTime: 6,
    flag: 'HackForely{hex_b64_rot13_classic}',
    featured: false,
  },
  {
    slug: 'double-trouble',
    title: 'Double Trouble',
    description: 'Kẻ tấn công đôi khi áp dụng cùng một encoding nhiều lần để tránh bị phát hiện. Đơn giản — nhưng hiệu quả hơn bạn nghĩ.',
    date: new Date('2025-03-11'),
    category: 'Crypto',
    catColor: 'cyan',
    difficulty: 'easy',
    tags: ['Base64', 'Hex', 'Encoding', 'Double-Encoding'],
    event: 'HackForge CTF',
    readTime: 5,
    flag: 'HackForge{double_base64_layers}',
    featured: false,
  },
  {
    slug: 'Escaped-reality',
    title: 'Escaped Reality',
    description: 'Web apps love encoding special characters — nhưng khi thứ tự bị đảo ngược, mọi thứ trở nên kỳ lạ hơn bạn nghĩ.',
    date: new Date('2026-03-11'),
    category: 'Web',
    catColor: 'green',
    difficulty: 'easy',
    tags: ['ROT13', 'Base64', 'URL-Encoding', 'Encoding'],
    event: 'HackForge CTF',
    readTime: 8,
    flag: 'HackForge{url_encoding_escape_artist}',
    featured: false,
  },
  {
    slug: 'papi-cris',
    title: "Papi Cris' Fortune",
    description: 'RSA với số nguyên tố nhỏ ẩn trong câu chuyện gia đình. Trial division phá vỡ toàn bộ trong dưới một giây.',
    date: new Date('2026-03-08'),
    category: 'Crypto',
    catColor: 'cyan',
    difficulty: 'medium',
    tags: ['RSA', 'Small Prime', 'Trial Division'],
    event: 'UpCTF 2026',
    readTime: 8,
    flag: 'S3cr3t_to_p4pis_f0rtune',
    featured: true,
  },
  {
    slug: 'the-rot-side',
    title: 'The ROT Side',
    description: 'ROT13 là trò trẻ con. Người anh em bí ẩn của nó xử lý toàn bộ printable ASCII — và đó mới là thứ đáng sợ thực sự.',
    date: new Date('2026-03-11'),
    category: 'Crypto',
    catColor: 'cyan',
    difficulty: 'easy',
    tags: ['ROT47', 'Base32', 'Hex', 'Encoding'],
    event: 'HackForge CTF',
    readTime: 7,
    flag: 'HackForge{rot47_the_other_rotation}',
    featured: false,
  },
  {
    slug: 'new-writeup',
    title: 'New Writeup',
    description: 'Bản nháp bài viết mới. Cập nhật nội dung và metadata trước khi publish.',
    date: new Date('2026-03-13'),
    category: 'Crypto',
    catColor: 'cyan',
    difficulty: 'easy',
    tags: ['Draft'],
    event: 'Draft',
    readTime: 5,
    flag: 'flag_here',
    featured: false,
    draft: true,
  },
]

export const publishedWriteups = writeups.filter(w => !w.draft)

export const sortedWriteups = [...publishedWriteups].sort((a, b) => b.date.getTime() - a.date.getTime())

export function getPrevNext(slug: string) {
  const idx = sortedWriteups.findIndex(w => w.slug === slug)
  return {
    prev: idx >= 0 ? sortedWriteups[idx + 1] : undefined,
    next: idx >= 0 ? sortedWriteups[idx - 1] : undefined,
  }
}

export function getWriteup(slug: string) {
  return writeups.find(w => w.slug === slug)
}
