import rss from '@astrojs/rss'
import { publishedWriteups } from '../data/writeups'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const sorted = [...publishedWriteups].sort((a,b) => b.date.getTime() - a.date.getTime())

  return rss({
    title: '0xBlog — CTF Writeups',
    description: 'CTF writeups, crypto breakdowns, and hacking notes.',
    site: context.site?.toString() ?? 'https://lewall-theart.github.io',
    items: sorted.map(w => ({
      title: w.title,
      description: w.description,
      pubDate: w.date,
      link: `/writeups/${w.slug}/`,
      categories: [w.category, ...w.tags],
    })),
    customData: '<language>vi</language>',
  })
}
