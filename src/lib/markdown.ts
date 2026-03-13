import { createMarkdownProcessor } from '@astrojs/markdown-remark'

const processorPromise = createMarkdownProcessor({
  shikiConfig: {
    theme: 'one-dark-pro',
    wrap: true,
  },
})

export function stripFrontmatter(raw: string) {
  return raw.replace(/^---[\s\S]*?---\s*/, '')
}

export async function renderMarkdown(raw: string) {
  const processor = await processorPromise
  const md = stripFrontmatter(raw)
  return processor.render(md)
}
