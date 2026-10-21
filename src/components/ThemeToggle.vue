<template>
  <button
    @click="toggle"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="p-2 rounded-lg border border-transparent hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
  >
    <svg
      v-if="isDark"
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.5A8.5 8.5 0 0 1 11.5 3.1a7 7 0 1 0 9.5 9.4z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(true)

function syncState() {
  isDark.value = document.documentElement.classList.contains('dark')
}

function toggle() {
  if (isDark.value) {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  } else {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  }
  syncState()
}

onMounted(() => {
  const stored = localStorage.getItem('theme')
  if (stored === 'light') {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  syncState()
})
</script>
