const siteName = "Lewall's Blog"

export const siteConfig = {
  siteUrl: process.env.SITE_URL || 'https://lewall-theart.github.io',
  name: siteName,
  metaDescription: 'CTF Writeups, Reverse Engineering, Binary Exploitation & Security Research.',
  api: {
    helloName: "Lewall",
  },
  author: {
    name: 'Lewall',
  },
  nav: {
    links: [
      {
        label: 'Github',
        href: 'https://github.com/Lewall-theart',
      },
      {
        label: 'About',
        href: '/about',
      },
      {
        label: 'Achievement',
        href: '/achievement',
      },
      {
        label: 'RSS',
        href: '/feed.xml',
      },
    ],
  },
  home: {
    pageTitle: 'Home',
    badgeText: 'Security | Reverse | CTF Research',
    title: `Welcome to ${siteName}`,
    subtitle: 'Something about infosec, reverse engineering & binary analysis!...',
    readMoreLabel: 'Read more',
    noDateLabel: 'No date',
    featuredAlt: 'Featured image',
  },
  pagination: {
    previousLabel: 'Previous Page',
    nextLabel: 'Next Page',
    pageLabel: 'Page',
  },
  post: {
    backToHomeLabel: 'Back to home',
    statsTitle: 'Article stats',
    statsLabels: {
      readTime: 'Read time',
      words: 'Words',
      headings: 'Headings',
      codeBlocks: 'Code blocks',
      images: 'Images',
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
    dateLocale: 'en-EN',
    dateOptions: {
      year: 'numeric' as const,
      month: 'long' as const,
      day: 'numeric' as const,
    },
    numberLocale: 'en-US',
  },
  footer: {
    aboutTitle: `About ${siteName}`,
    aboutText:
      'Ghi chép và chia sẻ kiến thức về CTF, Reverse Engineering, Binary, Cryptography và Web Security.',
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
