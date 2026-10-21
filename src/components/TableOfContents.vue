<template>
  <nav v-if="headings && headings.length > 0" class="hidden xl:block sticky top-24 ml-8 w-72 shrink-0 max-h-[calc(100vh-8rem)] overflow-y-auto toc-scrollbar">
    <div class="surface-panel rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
      <h3 class="text-xs font-mono uppercase tracking-widest mb-4 text-neutral-500 dark:text-neutral-400 font-semibold">
        CONTENTS
      </h3>
      <ul class="space-y-1 text-xs leading-snug list-disc list-outside pl-4 marker:text-neutral-400 dark:marker:text-neutral-500 m-0">
        <li
          v-for="h in headings"
          :key="h.id"
          :style="{ marginLeft: `${Math.max(0, (h.depth - 2) * 0.9)}rem` }"
          class="transition-colors duration-150"
        >
          <a
            :href="`#${h.id}`"
            class="block py-0.5 transition-colors duration-150 no-underline font-mono"
            :class="
              activeId === h.id
                ? 'text-neutral-900 font-bold dark:text-white'
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

interface HeadingItem {
  id: string
  text: string
  depth: number
}

const props = defineProps<{ headings: HeadingItem[] }>()
const activeId = ref(props.headings[0]?.id || '')

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!props.headings.length) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-80px 0% -70% 0%',
      threshold: 0.1,
    }
  )

  props.headings.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer?.observe(el)
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
