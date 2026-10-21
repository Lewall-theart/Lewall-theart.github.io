<template>
  <div class="anime-hero-container">
    <div class="badge-row opacity-0" ref="badgeRef">
      <div class="inline-flex items-center gap-3 rounded-full border border-neutral-300/70 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900/40 px-4 py-1 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        <span class="h-px w-5 bg-neutral-400 dark:bg-neutral-600"></span>
        <span>{{ badge }}</span>
      </div>
    </div>

    <h1 class="hero-title mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 dark:text-white" ref="titleRef">
      <span v-for="(char, idx) in titleChars" :key="idx" class="char-span inline-block">{{ char === ' ' ? '\u00A0' : char }}</span>
    </h1>

    <p class="hero-sub mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl opacity-0" ref="subRef">
      {{ subtitle }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { animate, stagger } from 'animejs'

const props = withDefaults(
  defineProps<{
    badge?: string
    title?: string
    subtitle?: string
  }>(),
  {
    badge: 'Security | Reverse | CTF Research',
    title: "Welcome to Lewall's Blog",
    subtitle:
      'Break. Analyze. Document. — Khám phá thế giới Reverse Engineering, CTF challenges và kiến trúc bảo mật hệ thống.',
  }
)

const badgeRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const subRef = ref<HTMLElement | null>(null)

const titleChars = computed(() => props.title.split(''))

onMounted(() => {
  // 1. Badge entrance
  if (badgeRef.value) {
    animate(badgeRef.value, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 500,
      ease: 'outExpo',
    })
  }

  // 2. Letters stagger reveal
  if (titleRef.value) {
    const chars = titleRef.value.querySelectorAll('.char-span')
    animate(chars, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(22, { start: 150 }),
      duration: 600,
      ease: 'outExpo',
    })
  }

  // 3. Subtitle fade up
  if (subRef.value) {
    animate(subRef.value, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: 450,
      duration: 650,
      ease: 'outExpo',
    })
  }
})
</script>

<style scoped>
.anime-hero-container {
  position: relative;
}

.char-span {
  display: inline-block;
  will-change: transform, opacity;
}
</style>
