# 0xBlog — CTF Writeup Blog

> Dark terminal-aesthetic blog built with **Astro + Vue 3 + UnoCSS**. Zero config to deploy on GitHub Pages.

## ✨ Features

- **Astro** — static site generator, routes, MDX support
- **Vue 3** — interactive islands (search, filters, animations, flag reveal)
- **UnoCSS** — utility CSS with custom design tokens
- **MDX** — write writeups in Markdown + embed Vue components
- **Shiki** — syntax highlighting with `one-dark-pro` theme
- **GitHub Actions** — auto build & deploy on every push to `main`

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/0xblog.git
cd 0xblog
npm install
npm run dev        # http://localhost:4321
```

## 📁 Project Structure

```
0xblog/
├── src/
│   ├── components/
│   │   ├── Navbar.vue          # Sticky navbar with mobile menu
│   │   ├── SearchModal.vue     # Ctrl+K search (keyboard navigable)
│   │   ├── HeroTerminal.vue    # Animated terminal on homepage
│   │   ├── CountUp.vue         # Animated stats counters
│   │   ├── CategoryBars.vue    # Category grid with animated bars
│   │   ├── WriteupFilter.vue   # Filter writeups by category/difficulty
│   │   ├── FlagReveal.vue      # Click-to-reveal flag with particles
│   │   └── SkillBars.vue       # About page skill bars
│   ├── layouts/
│   │   └── Base.astro          # Base layout (navbar, footer, SEO)
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── about.astro         # About page
│   │   └── writeups/
│   │       ├── index.astro     # All writeups listing
│   │       └── [slug].astro    # Individual writeup (dynamic route)
│   ├── content/
│   │   ├── config.ts           # Content collection schema
│   │   └── writeups/
│   │       └── papi-cris.mdx   # Example writeup
│   └── styles/
│       └── global.css          # Global CSS + design tokens
├── public/
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions auto-deploy
├── astro.config.mjs
├── uno.config.ts
└── package.json
```

## ✍️ Adding a New Writeup

**1. Create the MDX file:**

```bash
touch src/content/writeups/my-challenge.mdx
```

**2. Add frontmatter:**

```mdx
---
title: "My Challenge"
description: "Short description for cards and SEO."
date: 2024-04-01
category: Crypto          # Crypto | Web | Pwn | Reverse | Misc | Forensics
catColor: cyan            # cyan | green | orange | red | purple | gold
difficulty: medium        # easy | medium | hard | insane
tags: [RSA, AES]
event: "CTF 2024"         # optional
readTime: 10              # optional, minutes
flag: "flag{example}"     # optional, enables click-to-reveal
featured: false           # set true to feature on homepage
---

Your writeup content here in Markdown...
```

**3. Register in search** — open `src/components/SearchModal.vue` and add to the `writeups` array.

**4. Push to main** — GitHub Actions builds and deploys automatically.

## 🎨 Customization

All colors are CSS variables in `src/styles/global.css`:

```css
:root {
  --cyan:   #00d4ff;   /* primary accent */
  --green:  #7fff6b;   /* success / flag */
  --orange: #ff6b35;   /* warning / tags */
  /* ... */
}
```

Change `--cyan` to match your personal color.

## 🌐 Deploy to GitHub Pages

**Option 1 — GitHub Actions (recommended):**

1. Push code to `main`
2. Go to **Settings → Pages → Source: GitHub Actions**
3. Done — auto-deploys on every push

**Option 2 — Manual:**

```bash
npm run build
# Upload ./dist to your hosting
```

**Set your site URL** in `astro.config.mjs`:

```js
// For username.github.io (user page):
site: 'https://YOUR_USERNAME.github.io'
base: '/'

// For username.github.io/repo-name (project page):
site: 'https://YOUR_USERNAME.github.io'
base: '/repo-name'
```

## 📦 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Astro | ^4.0 | Framework, routing, MDX |
| Vue 3 | ^3.4 | Interactive components |
| UnoCSS | ^0.58 | Utility CSS |
| Motion | ^10.18 | Animations |
| Shiki | (via Astro) | Code highlighting |
