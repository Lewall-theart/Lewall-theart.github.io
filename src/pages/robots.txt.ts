import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site }) => {
  const base = site?.href ?? 'https://lewall-theart.github.io'
  const sitemap = new URL('/sitemap.xml', base).href
  const body = `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
