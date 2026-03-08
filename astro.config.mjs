import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import mdx from '@astrojs/mdx'
import UnoCSS from '@unocss/astro'

export default defineConfig({
  // 👇 Đổi thành username.github.io nếu dùng user page, hoặc /repo-name/ nếu dùng project page
  site: 'https://lewall-theart.github.io',
  base: '/',

  integrations: [
    vue({ appEntrypoint: '/src/vue-app' }),
    mdx(),
    UnoCSS({ injectReset: true }),
  ],

  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
})
