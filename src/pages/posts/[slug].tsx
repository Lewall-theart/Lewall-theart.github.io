import { getAllPosts, getPostBySlug } from '@/lib/markdown'
import Layout, { type JsonLdObject } from '@/layouts/Layout'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import TableOfContents from '@/components/TableOfContents'
import TagList from '@/components/TagList'
import FlagReveal from '@/components/FlagReveal'
import { siteConfig } from '@site-config'
import type { TocItem } from '@/types/toc'
import { useLanguage } from '@/context/LanguageContext'

interface RelatedPost {
  slug: string
  title: string | null
  excerpt: string | null
  tags: string[]
}

interface PostTranslationData {
  title: string
  excerpt: string | null
  html: string
  headings: TocItem[]
  stats: {
    wordCount: number
    readingTimeMinutes: number
    headingCount: number
    codeBlockCount: number
    imageCount: number
  }
}

interface PostProps {
  post: {
    slug: string
    title: string
    date: string | null
    excerpt: string | null
    featured: string | null
    tags: string[]
    html: string
    flag?: string | null
    headings: TocItem[]
    stats: {
      wordCount: number
      readingTimeMinutes: number
      headingCount: number
      codeBlockCount: number
      imageCount: number
    }
    availableLanguages?: ('vi' | 'en' | 'ja')[]
    translations?: {
      en?: PostTranslationData
      ja?: PostTranslationData
    }
  }
  relatedPosts: RelatedPost[]
}

function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        aria-label="Share on Twitter/X"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        aria-label="Copy link"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}

const parseDateValue = (value: string): Date | null => {
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const parsed = new Date(
      Number.parseInt(year, 10),
      Number.parseInt(month, 10) - 1,
      Number.parseInt(day, 10)
    )
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDate = (
  dateValue: string | null,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string | null => {
  if (!dateValue) return null
  const parsed = parseDateValue(dateValue)
  if (!parsed) return dateValue

  try {
    return new Intl.DateTimeFormat(locale, options).format(parsed)
  } catch (err) {
    console.error('Failed to format date:', err)
    return dateValue
  }
}

const toAbsoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  return new URL(pathOrUrl, siteConfig.siteUrl).toString()
}

function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group block p-4 rounded-xl surface-panel border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function Post({ post, relatedPosts }: PostProps) {
  const { lang, setLang } = useLanguage()
  const availableLangs = useMemo(() => post.availableLanguages || ['vi'], [post.availableLanguages])
  const contentRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  // Use global language if available for this post, else fallback to 'vi'
  const currentLang = availableLangs.includes(lang) ? lang : 'vi'

  const handleLangChange = (newLang: 'vi' | 'en' | 'ja') => {
    setLang(newLang)
  }

  // Active translation
  const activeData = (currentLang !== 'vi' && post.translations?.[currentLang])
    ? post.translations[currentLang]!
    : post

  const activeTitle = activeData.title
  const activeExcerpt = activeData.excerpt
  const activeContent = activeData.html
  const activeHeadings = activeData.headings
  const activeStats = activeData.stats

  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const scrolled = Math.max(0, -top)
      const total = Math.max(1, height - windowHeight)
      setProgress(Math.min(100, Math.round((scrolled / total) * 100)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const formattedDate = formatDate(
    post.date,
    siteConfig.formatting.dateLocale,
    siteConfig.formatting.dateOptions
  )

  const copyToClipboard = async (text: string, buttonElement: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(text)
      buttonElement.textContent = siteConfig.post.copyButtonCopiedLabel
      setTimeout(() => {
        buttonElement.textContent = siteConfig.post.copyButtonLabel
      }, 2000)
    } catch (err) {
      console.error(`${siteConfig.post.copyErrorLabel}:`, err)
      buttonElement.textContent = siteConfig.post.copyErrorLabel
      setTimeout(() => {
        buttonElement.textContent = siteConfig.post.copyButtonLabel
      }, 2000)
    }
  }

  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const codeBlocks = container.querySelectorAll('pre')
    codeBlocks.forEach((pre) => {
      pre.classList.add('group', 'relative')
      pre.querySelectorAll('.language-badge').forEach((badge) => badge.remove())
  
      if (!pre.querySelector('.copy-button')) {
        const copyButton = document.createElement('button')
        copyButton.textContent = siteConfig.post.copyButtonLabel
        copyButton.className = 'copy-button'
        copyButton.setAttribute('data-copy-button', 'true')
        const codeElement = pre.querySelector('code')
        const code = codeElement?.textContent || pre.textContent || ''
        copyButton.addEventListener('click', () => copyToClipboard(code, copyButton))
        pre.appendChild(copyButton)
      }
    })
  
    return () => {
      const scopedButtons = container.querySelectorAll<HTMLButtonElement>('[data-copy-button="true"]')
      scopedButtons.forEach(button => button.remove())
    }
  }, [activeContent])

  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const mermaidNodes = container.querySelectorAll('.mermaid:not([data-processed="true"])')
    if (mermaidNodes.length > 0) {
      import('mermaid').then(({ default: mermaid }) => {
        const isDark = document.documentElement.classList.contains('dark')
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
        })
        mermaid.run({ nodes: Array.from(mermaidNodes) as HTMLElement[] })
      })
    }
  }, [activeContent])

  const publishedTime = post.date ? new Date(post.date).toISOString() : undefined

  const articleJsonLd: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: activeTitle,
    description: activeExcerpt || siteConfig.metaDescription,
    url: toAbsoluteUrl(`/posts/${post.slug}`),
    datePublished: publishedTime || '',
    dateModified: publishedTime || '',
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/logo-light.svg'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toAbsoluteUrl(`/posts/${post.slug}`),
    },
    keywords: post.tags.join(', '),
  }

  return (
    <Layout
      title={activeTitle}
      description={activeExcerpt || undefined}
      image={post.featured || undefined}
      canonicalUrl={`/posts/${post.slug}`}
      type="article"
      publishedTime={publishedTime}
      jsonLd={articleJsonLd}
    >
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 z-50 transition-all duration-75"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main content */}
          <div className="flex-1 max-w-4xl min-w-0">
            <div className="mb-12">
              <Link href="/" className="text-xs font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-900 mb-8 inline-block dark:text-neutral-400 dark:hover:text-white">
                {currentLang === 'ja' ? '← ホームに戻る' : currentLang === 'en' ? '← Back to home' : '← Trang chủ'}
              </Link>
              <nav aria-label="Breadcrumb">
                <ol className="text-xs font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-4">
                  <li><Link href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">{currentLang === 'ja' ? 'ホーム' : currentLang === 'en' ? 'Home' : 'Trang chủ'}</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="truncate">{activeTitle}</li>
                </ol>
              </nav>

              {/* Language Switcher Bar */}
              {availableLangs.length > 1 && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Language:
                  </span>
                  <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-1 bg-neutral-100/70 dark:bg-neutral-900/60 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => handleLangChange('vi')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        currentLang === 'vi'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      🇻🇳 Tiếng Việt
                    </button>
                    {availableLangs.includes('en') && (
                      <button
                        type="button"
                        onClick={() => handleLangChange('en')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          currentLang === 'en'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                    )}
                    {availableLangs.includes('ja') && (
                      <button
                        type="button"
                        onClick={() => handleLangChange('ja')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          currentLang === 'ja'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        🇯🇵 日本語
                      </button>
                    )}
                  </div>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-neutral-900 dark:text-white">{activeTitle}</h1>
              {formattedDate ? (
                <time className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  {formattedDate}
                </time>
              ) : null}
              <TagList tags={post.tags} className="mt-3" />
              <ShareButtons url={toAbsoluteUrl(`/posts/${post.slug}`)} title={activeTitle} />
            </div>

            <section className="mb-8">
              <div className="surface-panel rounded-xl p-5">
                <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                  {currentLang === 'ja' ? '記事統計' : currentLang === 'en' ? 'Article stats' : 'Thống kê bài viết'}
                </h2>
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {currentLang === 'ja' ? '読了時間' : currentLang === 'en' ? 'Read time' : 'Thời gian đọc'}
                    </dt>
                    <dd className="mt-2 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                      {activeStats.readingTimeMinutes} {currentLang === 'ja' ? '分' : 'min'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {currentLang === 'ja' ? '文字数' : currentLang === 'en' ? 'Words' : 'Số từ'}
                    </dt>
                    <dd className="mt-2 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                      {activeStats.wordCount.toLocaleString(siteConfig.formatting.numberLocale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {currentLang === 'ja' ? '見出し' : currentLang === 'en' ? 'Headings' : 'Mục tiêu đề'}
                    </dt>
                    <dd className="mt-2 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                      {activeStats.headingCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {currentLang === 'ja' ? 'コードブロック' : currentLang === 'en' ? 'Code blocks' : 'Khối mã'}
                    </dt>
                    <dd className="mt-2 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                      {activeStats.codeBlockCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {currentLang === 'ja' ? '画像' : currentLang === 'en' ? 'Images' : 'Hình ảnh'}
                    </dt>
                    <dd className="mt-2 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                      {activeStats.imageCount}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="prose mx-auto surface-panel rounded-xl p-6 dark:prose-invert text-neutral-900 dark:text-neutral-100">
              <div ref={contentRef} dangerouslySetInnerHTML={{ __html: activeContent }} />
            </div>
            {post.flag && <FlagReveal flag={post.flag} />}

            <RelatedPosts posts={relatedPosts} />
          </div>

          {/* Table of Contents */}
          <TableOfContents headings={activeHeadings} />
        </div>
      </article>
    </Layout>
  )
}

export async function getStaticPaths() {
  const posts = getAllPosts()
  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug }
    })),
    fallback: false
  }
}

export async function getStaticProps({
  params
}: {
  params: { slug: string }
}) {
  const post = getPostBySlug(params.slug)
  if (!post) {
    return {
      notFound: true
    }
  }

  const allPosts = getAllPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== params.slug)
    .map((p) => ({
      slug: p.slug,
      title: p.title || null,
      excerpt: p.excerpt || null,
      tags: p.tags,
      score: p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...p }) => p)

  return {
    props: { post, relatedPosts },
  }
}
