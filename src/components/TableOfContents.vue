<template>
  <nav v-if="headings && headings.length > 0" class="sticky top-24 w-full max-h-[calc(100vh-8rem)] overflow-y-auto">
    <div class="surface-panel rounded-2xl p-6">
      <h3 class="text-xs font-mono uppercase tracking-widest mb-4 text-neutral-500 dark:text-neutral-400">
        {{ siteConfig.toc.title }}
      </h3>
      <ul class="space-y-1.5 text-xs leading-relaxed list-none p-0 m-0">
        <li
          v-for="h in headings"
          :key="h.id"
          :style="{ paddingLeft: `${Math.max(0, (h.depth - 2) * 12)}px` }"
        >
          <a
            :href="`#${h.id}`"
            class="block py-1 transition-colors duration-200 no-underline font-mono"
            :class="
              activeId === h.id
                ? 'text-neutral-900 font-semibold dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            "
            @click.prevent="scrollTo(h.id)"
          >
            {{ h.text }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { siteConfig } from '../data/site.config'

interface HeadingItem {
  id: string
  text: string
  depth: number
}

const props = defineProps<{ headings: HeadingItem[] }>()
const activeId = ref('')

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function onScroll() {
  let current = ''
  for (const h of props.headings) {
    const el = document.getElementById(h.id)
    if (el && el.getBoundingClientRect().top <= 120) {
      current = h.id
    }
  }
  activeId.value = current
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
