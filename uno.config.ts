import { defineConfig, presetUno, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
  ],

  theme: {
    colors: {
      bg:      '#080c10',
      surface: '#0d1117',
      s2:      '#141b23',
      s3:      '#1c2433',
      border:  '#1e2d3d',
      b2:      '#263547',

      cyan:    '#00d4ff',
      orange:  '#ff6b35',
      green:   '#7fff6b',
      gold:    '#ffd700',
      red:     '#ff4757',
      purple:  '#bd93f9',

      text:    '#c9d1d9',
      dim:     '#6e7681',
      mute:    '#3d4a56',
      bright:  '#e6edf3',
    },
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      mono:    ['"Space Mono"', 'monospace'],
      body:    ['"IBM Plex Mono"', 'monospace'],
    },
  },

  shortcuts: {
    // Tags / badges
    'tag':        'inline-flex items-center gap-1 font-mono text-[10px] tracking-[1.5px] uppercase px-[10px] py-[3px] border',
    'tag-cyan':   'tag text-cyan border-cyan/40 bg-cyan/6',
    'tag-green':  'tag text-green border-green/40 bg-green/6',
    'tag-orange': 'tag text-orange border-orange/40 bg-orange/6',
    'tag-red':    'tag text-red border-red/40 bg-red/6',
    'tag-purple': 'tag text-purple border-purple/40 bg-purple/6',
    'tag-gold':   'tag text-gold border-gold/40 bg-gold/6',

    // Buttons
    'btn':        'font-mono text-[11px] tracking-[2px] uppercase px-7 py-3 border inline-flex items-center gap-2 transition-all duration-200 relative overflow-hidden',
    'btn-primary':'btn border-cyan text-cyan hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
    'btn-ghost':  'btn border-b2 text-dim hover:border-dim hover:text-text',

    // Layout
    'container': 'max-w-[1100px] mx-auto px-10',
    'container-narrow': 'max-w-[780px] mx-auto px-10',

    // Section label
    'section-label': 'flex items-center gap-4 mb-9',
    'section-label-text': 'font-mono text-[10px] tracking-[3px] uppercase text-mute whitespace-nowrap',
    'section-label-line': 'flex-1 h-px bg-border',
  },
})
