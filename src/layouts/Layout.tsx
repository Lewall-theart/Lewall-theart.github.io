import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { siteConfig } from '@site-config'
import SearchModal, { type SearchPost } from '@/components/SearchModal'

export type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue }
export type JsonLdObject = { [key: string]: JsonLdValue }

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  image?: string
  canonicalUrl?: string
  type?: 'website' | 'article'
  publishedTime?: string
  jsonLd?: JsonLdObject | JsonLdObject[]
  searchPosts?: SearchPost[]
}

const serializeJsonLd = (item: JsonLdObject) => JSON.stringify(item).replace(/</g, '\\u003c')

const toAbsoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  return new URL(pathOrUrl, siteConfig.siteUrl).toString()
}

export default function Layout({
  children,
  title = 'Blog',
  description,
  image,
  canonicalUrl,
  type = 'website',
  publishedTime,
  jsonLd,
  searchPosts = [],
}: LayoutProps) {
  const [isDark, setIsDark] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isExternalLink = (href: string) =>
    href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')

  // Sync React state from the DOM class set by _document.tsx's inline script.
  // Do NOT manipulate classList here — _document.tsx already did it before first paint.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const currentYear = new Date().getFullYear()
  const themeUrl = 'https://github.com/sondt99/Tech-Blog'
  const authorName = siteConfig.author.name
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  const metaDescription = description || siteConfig.metaDescription
  const pageTitle = `${title} - ${siteConfig.name}`
  const canonical = canonicalUrl ? toAbsoluteUrl(canonicalUrl) : undefined
  const ogImage = image ? toAbsoluteUrl(image) : undefined

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 text-neutral-900 dark:text-white">
      <div className="flex-grow">
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={metaDescription} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* Open Graph */}
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:type" content={type} />
          <meta property="og:site_name" content={siteConfig.name} />
          {canonical && <meta property="og:url" content={canonical} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
          {type === 'article' && publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}

          {/* Twitter Card */}
          <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={metaDescription} />
          {ogImage && <meta name="twitter:image" content={ogImage} />}

          {/* Canonical */}
          {canonical && <link rel="canonical" href={canonical} />}

          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
          <link rel="alternate" type="application/rss+xml" title={`${siteConfig.name} RSS Feed`} href="/feed.xml" />

          {jsonLdItems.map((item, index) => (
            <script
              key={`json-ld-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
            />
          ))}
        </Head>

        <header className={`sticky top-0 z-50 transition-all duration-200 surface-bar ${isScrolled ? 'shadow-sm' : ''}`}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center space-x-2 group py-1" title={siteConfig.name}>
                <img
                  src="/logo-dark.svg"
                  alt={siteConfig.name}
                  className="h-8 sm:h-9 w-auto hidden dark:block transition-transform duration-200 group-hover:scale-105"
                />
                <img
                  src="/logo-light.svg"
                  alt={siteConfig.name}
                  className="h-8 sm:h-9 w-auto block dark:hidden transition-transform duration-200 group-hover:scale-105"
                />
              </Link>

              <div className="flex items-center space-x-6">
                {siteConfig.nav.links.map((link) =>
                  isExternalLink(link.href) ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} href={link.href} className="nav-link">
                      {link.label}
                    </Link>
                  )
                )}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Open search"
                  className="p-2 rounded-md border border-transparent hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
                <button
                  onClick={toggleDarkMode}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="p-2 rounded-md border border-transparent hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition-colors"
                >
                  {isDark ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12.5A8.5 8.5 0 0 1 11.5 3.1a7 7 0 1 0 9.5 9.4z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </nav>
        </header>

        <SearchModal
          posts={searchPosts}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {children}
        </main>
      </div>

      <footer className="surface-footer">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-3">
              <h3 className="text-xl font-semibold mb-3">{siteConfig.footer.aboutTitle}</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                {siteConfig.footer.aboutText}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">{siteConfig.footer.connectTitle}</h3>
              <div className="flex space-x-4 text-neutral-700 dark:text-neutral-300">
                <a href={siteConfig.footer.social.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                {Boolean(siteConfig.footer.social.linkedinUrl) && (
                  <a href={siteConfig.footer.social.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
                {Boolean(siteConfig.footer.social.xUrl) && (
                  <a href={siteConfig.footer.social.xUrl} target="_blank" rel="noopener noreferrer" className="social-link" title="X">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-200/70 dark:border-neutral-800 text-center text-neutral-500 dark:text-neutral-400">
            <div className="flex flex-col items-center gap-1">
              <a
                href={themeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-neutral-400/70 underline-offset-4 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Theme by sondt
              </a>
              <div>content by © {authorName} {currentYear}</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
