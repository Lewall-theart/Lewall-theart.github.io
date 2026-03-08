<template>
  <nav
    class="navbar"
    :class="{ 'navbar--scrolled': scrolled }"
  >
    <div class="container navbar__inner">
      <!-- Logo -->
      <a href="/" class="navbar__logo">
        <div class="navbar__logo-box">
          <span>0x</span>
        </div>
        <span class="navbar__logo-text">Blog</span>
      </a>

      <!-- Desktop nav -->
      <ul class="navbar__links">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="navbar__link"
            :class="{ 'navbar__link--active': isActive(link.href) }"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>

      <!-- Right: search + hamburger -->
      <div class="navbar__right">
        <button class="navbar__search-btn" @click="openSearch">
          <span>⌕ Search</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button class="navbar__hamburger" @click="menuOpen = !menuOpen" :class="{ open: menuOpen }">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="mobile-menu">
      <div v-if="menuOpen" class="navbar__mobile">
        <a v-for="link in links" :key="link.href"
           :href="link.href"
           class="navbar__mobile-link"
           :class="{ 'navbar__mobile-link--active': isActive(link.href) }"
           @click="menuOpen = false"
        >
          {{ link.label }}
        </a>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ currentPath: string }>()

const scrolled = ref(false)
const menuOpen = ref(false)

const links = [
  { href: '/',           label: 'Home' },
  { href: '/writeups',   label: 'Writeups' },
  { href: '/categories', label: 'Categories' },
  { href: '/about',      label: 'About' },
]

function isActive(href: string) {
  if (href === '/') return props.currentPath === '/'
  return props.currentPath.startsWith(href)
}

function openSearch() {
  window.dispatchEvent(new CustomEvent('open-search'))
}

function onScroll() {
  scrolled.value = window.scrollY > 10
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  z-index: 100;
  background: rgba(8,12,16,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s, background 0.3s;
}
.navbar--scrolled {
  background: rgba(8,12,16,0.92);
  border-color: var(--border);
}
.navbar__inner {
  display: flex; align-items: center; justify-content: space-between; height: 100%;
}
.navbar__logo {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px;
  color: var(--bright); letter-spacing: -0.5px; transition: color 0.2s;
}
.navbar__logo:hover { color: var(--cyan); }
.navbar__logo-box {
  width: 32px; height: 32px; border: 1px solid var(--cyan);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 12px; color: var(--cyan);
  background: rgba(0,212,255,0.06); position: relative;
}
.navbar__logo-text { color: var(--bright); }
.navbar__links {
  display: flex; align-items: center; gap: 4px; list-style: none;
}
.navbar__link {
  font-family: 'Space Mono', monospace; font-size: 11px;
  letter-spacing: 1px; text-transform: uppercase;
  color: var(--dim); padding: 6px 14px;
  border: 1px solid transparent;
  transition: all 0.2s; position: relative;
}
.navbar__link:hover,
.navbar__link--active {
  color: var(--cyan);
  border-color: rgba(0,212,255,0.25);
  background: rgba(0,212,255,0.06);
}
.navbar__link--active::after {
  content: '';
  position: absolute; bottom: -1px; left: 0; right: 0;
  height: 1px; background: var(--cyan);
}
.navbar__right { display: flex; align-items: center; gap: 12px; }
.navbar__search-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border);
  padding: 6px 14px; font-family: 'Space Mono', monospace;
  font-size: 11px; color: var(--dim); cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.navbar__search-btn:hover { border-color: var(--cyan); color: var(--text); }
.navbar__search-btn kbd {
  background: var(--s2); border: 1px solid var(--b2);
  padding: 1px 5px; font-size: 10px; color: var(--mute);
}
.navbar__hamburger {
  display: none; flex-direction: column; gap: 5px;
  padding: 8px; background: none; border: none; cursor: pointer;
}
.navbar__hamburger span {
  display: block; width: 22px; height: 2px;
  background: var(--dim); transition: all 0.3s;
}
.navbar__hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
.navbar__hamburger.open span:nth-child(2) { opacity: 0; }
.navbar__hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }

.navbar__mobile {
  position: fixed; top: 60px; left: 0; right: 0;
  background: rgba(8,12,16,0.97); border-bottom: 1px solid var(--border);
  padding: 16px; display: flex; flex-direction: column; gap: 4px;
}
.navbar__mobile-link {
  font-family: 'Space Mono', monospace; font-size: 13px;
  padding: 10px 16px; color: var(--dim); border: 1px solid transparent;
  transition: all 0.2s;
}
.navbar__mobile-link:hover,
.navbar__mobile-link--active { color: var(--cyan); border-color: rgba(0,212,255,0.2); background: rgba(0,212,255,0.06); }

/* Mobile menu transition */
.mobile-menu-enter-active,
.mobile-menu-leave-active { transition: opacity 0.2s, transform 0.2s; }
.mobile-menu-enter-from,
.mobile-menu-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 768px) {
  .navbar__links, .navbar__search-btn { display: none; }
  .navbar__hamburger { display: flex; }
}
</style>
