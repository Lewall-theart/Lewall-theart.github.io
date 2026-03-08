import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const writeups = await getCollection('writeups', ({data}) => !data.draft)
  const sorted = writeups.sort((a,b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  return rss({
    title: '0xBlog — CTF Writeups',
    description: 'CTF writeups, crypto breakdowns, and hacking notes.',
    site: context.site?.toString() ?? 'https://lewall-theart.github.io',
    items: sorted.map(w => ({
      title: w.data.title,
      description: w.data.description,
      pubDate: w.data.date,
      link: `/writeups/${w.slug}/`,
      categories: [w.data.category, ...w.data.tags],
    })),
    customData: '<language>vi</language>',
  })
}
