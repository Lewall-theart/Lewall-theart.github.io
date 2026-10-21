import { defineConfig, presetUno, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
    }),
    presetTypography(),
  ],

  theme: {
    fontFamily: {
      mono: ['"JetBrains Mono"', 'monospace'],
      sans: ['"JetBrains Mono"', 'sans-serif'],
      display: ['"Syne"', '"JetBrains Mono"', 'sans-serif'],
    },
    colors: {
      surface: 'var(--card)',
      panel: 'var(--card-2)',
      brandBg: 'var(--bg)',
      brandFg: 'var(--fg)',
      brandBorder: 'var(--border)',
      brandMuted: 'var(--muted)',
    },
  },

  shortcuts: {
    'nav-link-base': 'relative text-xs uppercase tracking-widest font-mono text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200',
    'badge-pill': 'inline-flex items-center gap-3 rounded-full border border-neutral-300/70 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/40 px-4 py-1 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400',
  },
})
