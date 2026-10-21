const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const siteUrl = 'https://lewall-theart.github.io';
const siteName = "Lewall's Blog";
const metaDescription = 'CTF Writeups, Reverse Engineering, Binary Exploitation & Security Research.';
const authorName = 'Lewall';

// 1. Generate public/robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
fs.writeFileSync('public/robots.txt', robotsTxt, 'utf8');

// 2. Read posts
const contentDir = 'content';
const posts = fs.readdirSync(contentDir)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const { data } = matter(fs.readFileSync(path.join(contentDir, f), 'utf8'));
    return {
      slug: f.replace(/\.md$/, ''),
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      tags: data.tags || []
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 3. Generate public/sitemap.xml
const tagSet = new Set();
posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));

const urls = [
  { loc: siteUrl, priority: '1.0', changefreq: 'daily' },
  { loc: `${siteUrl}/about`, priority: '0.8', changefreq: 'monthly' },
  { loc: `${siteUrl}/achievement`, priority: '0.8', changefreq: 'monthly' },
];

posts.forEach(p => {
  urls.push({
    loc: `${siteUrl}/posts/${p.slug}`,
    lastmod: p.date,
    priority: '0.8',
    changefreq: 'monthly'
  });
});

tagSet.forEach(t => {
  urls.push({
    loc: `${siteUrl}/tags/${encodeURIComponent(t)}`,
    priority: '0.6',
    changefreq: 'weekly'
  });
});

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
fs.writeFileSync('public/sitemap.xml', sitemapXml, 'utf8');

// 4. Generate public/feed.xml
const feedItems = posts.map(p => {
  const postUrl = `${siteUrl}/posts/${p.slug}`;
  const pubDate = p.date ? new Date(p.date).toUTCString() : '';
  return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      <description><![CDATA[${p.excerpt || metaDescription}]]></description>
      <author>${authorName}</author>
    </item>`;
}).join('\n');

const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}/</link>
    <description>${metaDescription}</description>
    <language>vi</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${feedItems}
  </channel>
</rss>`;
fs.writeFileSync('public/feed.xml', feedXml, 'utf8');

console.log('Static feeds generated successfully');
