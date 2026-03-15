import type { APIRoute } from 'astro'
import { publishedWriteups } from '../data/writeups'

const toUrl = (path: string, site: URL) => new URL(path, site).href

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://lewall-theart.github.io')
  const now = new Date().toISOString()
  const tagSet = new Set(
    publishedWriteups.flatMap(w => w.tags.map(t => t.toLowerCase()))
  )

  const urls = [
    { loc: toUrl('/', base), lastmod: now, changefreq: 'weekly', priority: 1.0 },
    { loc: toUrl('/writeups', base), lastmod: now, changefreq: 'weekly', priority: 0.9 },
    { loc: toUrl('/tags', base), lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { loc: toUrl('/about', base), lastmod: now, changefreq: 'yearly', priority: 0.4 },
    ...publishedWriteups.map(w => ({
      loc: toUrl(`/writeups/${w.slug}`, base),
      lastmod: w.date.toISOString(),
      changefreq: 'yearly',
      priority: 0.7,
    })),
    ...[...tagSet].map(tag => ({
      loc: toUrl(`/tags/${tag}`, base),
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.5,
    })),
  ]

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        u =>
          `  <url>\n` +
          `    <loc>${u.loc}</loc>\n` +
          `    <lastmod>${u.lastmod}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
