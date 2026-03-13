import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import UnoCSS from '@unocss/astro'

export default defineConfig({
  site: 'https://lewall-theart.github.io',
  base: '/',
  integrations: [
    vue({ appEntrypoint: '/src/vue-app' }),
    UnoCSS({ injectReset: true }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
})
