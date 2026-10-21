<template>
  <header class="sticky top-0 z-50 transition-all duration-200 surface-bar" :class="{ 'shadow-sm': isScrolled }">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Brand -->
        <a href="/" class="flex items-center space-x-2 no-underline">
          <span class="text-lg sm:text-xl font-mono tracking-widest text-neutral-900 dark:text-white font-semibold">
            {{ siteConfig.name }}
          </span>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center space-x-6">
          <a
            v-for="link in siteConfig.nav.links"
            :key="link.label"
            :href="link.href"
            :target="isExternal(link.href) ? '_blank' : undefined"
            :rel="isExternal(link.href) ? 'noopener noreferrer' : undefined"
            class="nav-link"
            :class="{ active: isActive(link.href) }"
          >
            {{ link.label }}
          </a>

          <!-- Search Trigger -->
          <button
            @click="openSearch"
            aria-label="Open search"
            class="p-2 rounded-lg border border-transparent hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          <!-- Theme Toggle -->
          <ThemeToggle />
        </div>

        <!-- Mobile controls -->
        <div class="flex items-center gap-2 md:hidden">
          <button
            @click="openSearch"
            aria-label="Search"
            class="p-2 text-neutral-600 dark:text-neutral-300"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <ThemeToggle />
          <button
            @click="mobileOpen = !mobileOpen"
            class="p-2 text-neutral-600 dark:text-neutral-300"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileOpen" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Drawer -->
    <div
      v-if="mobileOpen"
      class="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-6 py-4 space-y-3"
    >
      <a
        v-for="link in siteConfig.nav.links"
        :key="link.label"
        :href="link.href"
        :target="isExternal(link.href) ? '_blank' : undefined"
        :rel="isExternal(link.href) ? 'noopener noreferrer' : undefined"
        class="block py-2 text-sm font-mono tracking-widest uppercase text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        @click="mobileOpen = false"
      >
        {{ link.label }}
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { siteConfig } from '../data/site.config'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{ currentPath?: string }>()
const isScrolled = ref(false)
const mobileOpen = ref(false)

function isExternal(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

function isActive(href: string) {
  if (!props.currentPath) return false
  if (href === '/') return props.currentPath === '/'
  return props.currentPath.startsWith(href)
}

function openSearch() {
  window.dispatchEvent(new CustomEvent('open-search'))
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
