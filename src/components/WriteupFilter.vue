<template>
  <div>
    <!-- Filters Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="f in catFilters"
          :key="f"
          class="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-colors"
          :class="
            activeFilter === f
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
              : 'border border-neutral-300/70 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500'
          "
          @click="activeFilter = f"
        >
          {{ f }}
        </button>

        <div class="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 hidden sm:block"></div>

        <button
          v-for="d in diffFilters"
          :key="d"
          class="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-colors"
          :class="
            activeDiff === d
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
              : 'border border-neutral-300/70 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500'
          "
          @click="activeDiff = d"
        >
          {{ d }}
        </button>
      </div>

      <div class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
        {{ filtered.length }} writeup{{ filtered.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article
        v-for="w in filtered"
        :key="w.slug"
        class="group surface-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="inline-flex items-center rounded-full border border-neutral-900/80 bg-neutral-900 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-neutral-100 dark:border-neutral-100/80 dark:bg-neutral-100 dark:text-neutral-900">
              {{ w.category }}
            </span>
            <div class="flex items-center gap-2">
              <div :class="`diff diff-${w.difficulty}`">
                <div class="diff-dot"></div><div class="diff-dot"></div><div class="diff-dot"></div>
              </div>
              <time class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                {{ fmt(w.date) }}
              </time>
            </div>
          </div>

          <a :href="`/writeups/${w.slug}`" class="block no-underline">
            <h2 class="text-xl font-semibold mb-2.5 text-neutral-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {{ w.title }}
            </h2>
            <p class="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-4 line-clamp-3">
              {{ w.description }}
            </p>
          </a>
        </div>

        <div class="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between mt-auto">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="t in w.tags.slice(0, 2)"
              :key="t"
              class="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800"
            >
              #{{ t }}
            </span>
          </div>

          <a
            :href="`/writeups/${w.slug}`"
            class="text-xs font-mono uppercase tracking-wider text-neutral-800 dark:text-neutral-200 hover:underline"
          >
            Read more →
          </a>
        </div>
      </article>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="py-16 text-center">
      <div class="font-mono text-3xl mb-2 text-neutral-400">∅</div>
      <p class="font-mono text-sm text-neutral-500">No writeups match the selected filters.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface WriteupItem {
  slug: string
  title: string
  description: string
  category: string
  catColor: string
  difficulty: string
  tags: string[]
  date: string
  event?: string
  readTime?: number
}

const props = defineProps<{ items: WriteupItem[] }>()

const activeFilter = ref('All')
const activeDiff = ref('All')

const catFilters = computed(() => ['All', ...new Set(props.items.map((i) => i.category))])
const diffFilters = ['All', 'easy', 'medium', 'hard']

const filtered = computed(() =>
  props.items.filter((w) => {
    const catOk = activeFilter.value === 'All' || w.category === activeFilter.value
    const diffOk = activeDiff.value === 'All' || w.difficulty === activeDiff.value
    return catOk && diffOk
  })
)

function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
