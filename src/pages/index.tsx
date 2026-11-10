import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, type PostListTranslation } from '@/lib/markdown';
import Layout, { type JsonLdObject } from '@/layouts/Layout';
import { siteConfig } from '@site-config';
import TagList from '@/components/TagList';
import OpenSourceStatus from '@/components/OpenSourceStatus';
import type { SearchPost } from '@/components/SearchModal';
import { useLanguage } from '@/context/LanguageContext';

export const POSTS_PER_PAGE = 4;

const homeJsonLd: JsonLdObject[] = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.metaDescription,
    publisher: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.footer.social.githubUrl,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.footer.social.githubUrl,
    sameAs: [siteConfig.footer.social.githubUrl, siteConfig.footer.social.xUrl],
  },
];

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

function Pagination({ currentPage, totalPages }: PaginationProps) {
  const { lang } = useLanguage();
  const prevLabel = lang === 'ja' ? '前へ' : lang === 'en' ? 'Previous Page' : 'Trang trước';
  const nextLabel = lang === 'ja' ? '次へ' : lang === 'en' ? 'Next Page' : 'Trang sau';
  const pageLabel = lang === 'ja' ? 'ページ' : lang === 'en' ? 'Page' : 'Trang';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? '/' : `/page/${currentPage - 1}`}
          className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-900 hover:bg-neutral-900 hover:text-neutral-100 transition dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 font-mono text-xs uppercase tracking-wider"
        >
          {prevLabel}
        </Link>
      )}
      
      <span className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        {pageLabel} {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={`/page/${currentPage + 1}`}
          className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-900 hover:bg-neutral-900 hover:text-neutral-100 transition dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 font-mono text-xs uppercase tracking-wider"
        >
          {nextLabel}
        </Link>
      )}
    </div>
  );
}

interface PostItem {
  slug: string;
  title: string;
  date: string | null;
  excerpt: string | null;
  featured: string | null;
  tags: string[];
  draft: boolean;
  content: string;
  translations?: {
    en?: PostListTranslation;
    ja?: PostListTranslation;
  };
}

export interface HomeProps {
  posts: PostItem[];
  currentPage: number;
  totalPages: number;
  searchPosts: SearchPost[];
}

export default function Home({ posts, currentPage, totalPages, searchPosts }: HomeProps) {
  const { lang } = useLanguage();

  const readMoreLabels = {
    vi: 'Đọc tiếp →',
    en: 'Read more →',
    ja: '続きを読む →',
  };
  const readMore = readMoreLabels[lang] || siteConfig.home.readMoreLabel;

  return (
    <Layout title={siteConfig.home.pageTitle} jsonLd={currentPage === 1 ? homeJsonLd : undefined} searchPosts={searchPosts}>
      <div className="max-w-4xl mx-auto">
        <section className="mb-16 rise-in" style={{ animationDelay: '40ms' }}>
          <div className="inline-flex items-center gap-3 rounded-full border border-neutral-300/70 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/40 px-4 py-1 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            <span className="h-px w-5 bg-neutral-400 dark:bg-neutral-600" />
            {siteConfig.home.badgeText}
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            {siteConfig.home.title}
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl">
            {siteConfig.home.subtitle}
          </p>
          {siteConfig.openSource.enabled && <OpenSourceStatus />}
        </section>

        <section id="posts" className="space-y-10 scroll-mt-24">
          {posts.map((post, index) => {
            const activeTitle = (lang !== 'vi' && post.translations?.[lang]?.title) || post.title;
            const activeExcerpt = (lang !== 'vi' && post.translations?.[lang]?.excerpt) || post.excerpt;

            return (
              <article
                key={post.slug}
                className="group relative overflow-hidden rounded-2xl surface-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rise-in"
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                {post.featured && (
                  <Link
                    href={`/posts/${post.slug}`}
                    className="block relative h-64 w-full overflow-hidden border-b border-neutral-200/70 dark:border-neutral-800"
                  >
                    <Image
                      src={post.featured}
                      alt={activeTitle || siteConfig.home.featuredAlt}
                      fill
                      sizes="(min-width: 1024px) 800px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={index === 0}
                    />
                  </Link>
                )}
                <div className="p-8 sm:p-10">
                  <div className="mb-4 space-y-3">
                    <time className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {post.date
                        ? new Date(post.date).toLocaleDateString(
                            siteConfig.formatting.dateLocale,
                            siteConfig.formatting.dateOptions
                          )
                        : siteConfig.home.noDateLabel}
                    </time>
                    <TagList tags={post.tags} />
                  </div>
                  <Link href={`/posts/${post.slug}`} className="block">
                    <h2 className="text-2xl font-semibold mb-3 text-neutral-900 dark:text-white transition-colors duration-200">
                      {activeTitle}
                    </h2>
                    {activeExcerpt && (
                      <p className="text-neutral-600 dark:text-neutral-300 mb-5">{activeExcerpt}</p>
                    )}
                    <div className="flex items-center">
                      <span className="text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase tracking-widest">
                        {readMore}
                      </span>
                    </div>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const allPosts = getAllPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const posts = allPosts.slice(0, POSTS_PER_PAGE);

  const searchPosts: SearchPost[] = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    tags: post.tags,
  }));

  return {
    props: {
      posts,
      currentPage: 1,
      totalPages,
      searchPosts,
    },
  };
}
