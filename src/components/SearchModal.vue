<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      @click="close"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <!-- Dimmed overlay -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal panel -->
      <div
        class="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10"
        @click.stop
      >
        <!-- Search input header -->
        <div class="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <svg
            class="h-4 w-4 shrink-0 text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            placeholder="Search writeups, tags, categories…"
            class="flex-1 bg-transparent text-sm font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
            @keydown.down.prevent="navigate(1)"
            @keydown.up.prevent="navigate(-1)"
            @keydown.enter.prevent="openResult"
            @keydown.esc="close"
          />
          <button
            v-if="query"
            @click="query = ''"
            aria-label="Clear search"
            class="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-neutral-300 dark:border-neutral-700 text-neutral-400">
            ESC
          </kbd>
        </div>

        <!-- Search Results List -->
        <div class="max-h-[60vh] overflow-y-auto p-2" ref="resultsEl">
          <template v-if="query.trim().length > 0">
            <a
              v-for="(r, i) in results"
              :key="r.slug"
              :href="`/writeups/${r.slug}`"
              class="block rounded-xl p-3 transition-colors text-left no-underline"
              :class="i === activeIndex ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
              @click="close"
              @mouseenter="activeIndex = i"
            >
              <div class="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span>{{ r.category }}</span>
                <span>·</span>
                <span>{{ r.difficulty }}</span>
              </div>
              <div class="font-semibold text-sm text-neutral-900 dark:text-white mb-1">
                {{ r.title }}
              </div>
              <div class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                {{ r.description }}
              </div>
            </a>
            <div v-if="results.length === 0" class="py-8 text-center text-xs font-mono text-neutral-500">
              No writeups found for "{{ query }}"
            </div>
          </template>

          <template v-else>
            <div class="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              // Recent Writeups
            </div>
            <a
              v-for="r in recentItems"
              :key="r.slug"
              :href="`/writeups/${r.slug}`"
              class="block rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left no-underline"
              @click="close"
            >
              <div class="font-semibold text-sm text-neutral-900 dark:text-white">
                {{ r.title }}
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                {{ r.category }} · {{ r.difficulty }}
              </div>
            </a>
          </template>
        </div>

        <!-- Footer / Shortcuts -->
        <div class="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>Navigate with <kbd class="px-1 border rounded">↑</kbd> <kbd class="px-1 border rounded">↓</kbd></span>
          <span>Select with <kbd class="px-1 border rounded">↵</kbd></span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { publishedWriteups } from '../data/writeups'

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const resultsEl = ref<HTMLElement | null>(null)

const recentItems = computed(() => publishedWriteups.slice(0, 4))

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return publishedWriteups.filter(
    (w) =>
      w.title.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q) ||
      w.tags.some((t) => t.toLowerCase().includes(q))
  )
})

watch(results, () => {
  activeIndex.value = 0
})

function navigate(dir: number) {
  const max = results.value.length - 1
  if (max < 0) return
  activeIndex.value = Math.max(0, Math.min(max, activeIndex.value + dir))
}

function openResult() {
  const r = results.value[activeIndex.value]
  if (r) {
    window.location.href = `/writeups/${r.slug}`
    close()
  }
}

function openModal() {
  open.value = true
  nextTick(() => inputEl.value?.focus())
}

function close() {
  open.value = false
  query.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openModal()
  }
  if (e.key === 'Escape' && open.value) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('open-search', openModal)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('open-search', openModal)
  window.removeEventListener('keydown', handleKeydown)
})
</script>
