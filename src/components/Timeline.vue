<template>
  <section class="mt-10">
    <div v-if="title" class="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
      <span class="h-px w-8 bg-neutral-400 dark:bg-neutral-600" aria-hidden="true"></span>
      <span>{{ title }}</span>
    </div>

    <div class="relative">
      <span
        aria-hidden="true"
        class="absolute left-2 top-0 h-full w-px bg-gradient-to-b from-neutral-400/80 via-neutral-300/50 to-transparent dark:from-neutral-600/90 dark:via-neutral-700/70 dark:to-transparent"
      ></span>

      <ol class="space-y-6 pl-8 list-none m-0 p-0">
        <li
          v-for="(entry, index) in entries"
          :key="`${entry.year}-${entry.place}-${index}`"
          class="relative rise-in"
          :style="{ animationDelay: `${150 + index * 80}ms` }"
        >
          <!-- Milestone dot -->
          <span
            class="absolute left-2 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-neutral-900/80 bg-neutral-100 shadow-sm dark:border-neutral-100/80 dark:bg-neutral-900"
          ></span>

          <!-- Card Content -->
          <div class="surface-card rounded-2xl p-5 sm:p-6">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center rounded-full border border-neutral-900/80 bg-neutral-900 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-100 dark:border-neutral-100/80 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {{ entry.year }}
              </span>
              <span
                v-if="entry.category"
                class="inline-flex items-center rounded-full border border-neutral-300/80 bg-neutral-100/70 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400"
              >
                {{ entry.category }}
              </span>
            </div>

            <h3 class="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              {{ entry.place }}
            </h3>

            <p
              v-if="entry.role"
              class="mt-2 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
            >
              {{ entry.role }}
            </p>

            <p
              v-if="entry.detail"
              class="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
            >
              {{ entry.detail }}
            </p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TimelineEntry } from '../data/timeline'

defineProps<{
  entries: TimelineEntry[]
  title?: string
}>()
</script>
