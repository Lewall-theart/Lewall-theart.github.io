const siteName = "Lewall's Blog"

export const siteConfig = {
  siteUrl: 'https://lewall-theart.github.io',
  name: siteName,
  metaDescription: 'CTF Writeups, Reverse Engineering, Binary Exploitation & Security Research.',
  author: {
    name: 'Lewall',
  },
  nav: {
    links: [
      {
        label: 'Writeups',
        href: '/writeups',
      },
      {
        label: 'Achievement',
        href: '/achievement',
      },
      {
        label: 'Tags',
        href: '/tags',
      },
      {
        label: 'About',
        href: '/about',
      },
      {
        label: 'Github',
        href: 'https://github.com/Lewall-theart',
      },
      {
        label: 'RSS',
        href: '/rss.xml',
      },
    ],
  },
  home: {
    pageTitle: 'Home',
    badgeText: 'Security | Reverse | CTF Research',
    title: `Welcome to ${siteName}`,
    subtitle: 'Break. Analyze. Document. — Khám phá thế giới Reverse Engineering, CTF challenges và kiến trúc bảo mật hệ thống.',
    readMoreLabel: 'Read more →',
    noDateLabel: 'No date',
    featuredAlt: 'Featured image',
  },
  pagination: {
    previousLabel: 'Previous Page',
    nextLabel: 'Next Page',
    pageLabel: 'Page',
  },
  post: {
    backToHomeLabel: 'Back to writeups',
    statsTitle: 'Article stats',
    statsLabels: {
      readTime: 'Read time',
      words: 'Words',
      headings: 'Headings',
      codeBlocks: 'Code blocks',
      minutes: 'min',
    },
    copyButtonLabel: 'Copy',
    copyButtonCopiedLabel: 'Copied!',
    copyErrorLabel: 'Failed to copy',
  },
  toc: {
    title: 'Contents',
  },
  page: {
    lastUpdatedLabel: 'Last updated:',
    lastUpdatedLocale: 'vi-VN',
  },
  formatting: {
    dateLocale: 'vi-VN',
    dateOptions: {
      year: 'numeric' as const,
      month: 'short' as const,
      day: 'numeric' as const,
    },
    numberLocale: 'en-US',
  },
  footer: {
    aboutTitle: `About ${siteName}`,
    aboutText:
      'Ghi lại hành trình bóc tách mã độc, giải mã các thử thách CTF, phân tích Windows Internals và chia sẻ kiến thức bảo mật.',
    connectTitle: 'Connect',
    social: {
      githubUrl: 'https://github.com/Lewall-theart',
      xUrl: 'https://x.com',
    },
  },
  openSource: {
    enabled: true,
    owner: 'Lewall-theart',
    repo: 'Lewall-theart.github.io',
    branch: 'main',
    repoUrl: 'https://github.com/Lewall-theart/Lewall-theart.github.io',
    labels: {
      summaryTitle: 'Open-source',
      statusLabel: 'Status',
      upToDate: 'Up to date',
      outdated: 'Outdated',
      unknown: 'Status unknown',
      checking: 'Checking updates',
    },
  },
}
