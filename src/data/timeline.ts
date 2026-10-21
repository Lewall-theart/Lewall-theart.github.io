export interface TimelineEntry {
  year: string
  place: string
  role?: string
  category?: string
  detail?: string
}

export const timelineEntries: TimelineEntry[] = [
  {
    year: '2026',
    category: 'CTF',
    place: 'DF26 CTF Finals',
    role: 'Reverse Engineering Specialist',
    detail: 'Full solve chuỗi thử thách multi-stage Windows x64 keygen (adobe_keygen.exe) với các kỹ thuật NTDLL syscall verification, COFF payload decoding và .NET runtime analysis.',
  },
  {
    year: '2026',
    category: 'CTF',
    place: 'PsychCTF 2026',
    role: 'First Blood — Steganography',
    detail: 'Giải mã thành công thử thách Cold Case thông qua phân tích ma trận sai khác kênh màu và khôi phục flag từ alpha channel.',
  },
  {
    year: '2026',
    category: 'CTF',
    place: 'HackForge CTF 2026',
    role: 'Crypto & Web Category Solves',
    detail: 'Hoàn thành các thử thách Basic Encoding Soup, Double Trouble, Escaped Reality và The ROT Side.',
  },
  {
    year: '2026',
    category: 'Research',
    place: 'UpCTF 2026',
    role: 'Top Solver — Cryptography',
    detail: 'Phá vỡ bài toán RSA Small Prime trong thử thách Papi Cris\' Fortune với phương pháp trial division tối ưu dưới 1 giây.',
  },
  {
    year: '2025',
    category: 'Security',
    place: 'Windows Internals & Reverse Engineering Lab',
    role: 'Independent Researcher',
    detail: 'Nghiên cứu cơ chế nạp động PE/COFF, bypass EDR hooks bằng direct syscalls và phân tích kỹ thuật obfuscation mã nguồn .NET.',
  },
  {
    year: '2024',
    category: 'Milestone',
    place: '0xBlog — Personal Security Notes Launched',
    role: 'Creator & Author',
    detail: 'Khởi tạo blog cá nhân lưu trữ các bài writeup kỹ thuật CTF, cẩm nang dịch ngược mã máy và chia sẻ công cụ phân tích.',
  },
]
