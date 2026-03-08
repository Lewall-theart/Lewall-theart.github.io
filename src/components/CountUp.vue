<template>
  <div class="stat" :class="{ 'stat--visible': visible }">
    <div class="stat__num">{{ displayValue }}</div>
    <div class="stat__label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ target: number; label: string }>()

const displayValue = ref(0)
const visible = ref(false)

onMounted(() => {
  visible.value = true
  const duration = 1200
  const steps = 40
  const step = props.target / steps
  let current = 0
  const timer = setInterval(() => {
    current = Math.min(current + step, props.target)
    displayValue.value = Math.floor(current)
    if (current >= props.target) clearInterval(timer)
  }, duration / steps)
})
</script>

<style scoped>
.stat {
  padding: 24px 28px;
  border-right: 1px solid var(--border);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.stat:last-child { border-right: none; }
.stat--visible { opacity: 1; transform: none; }
.stat__num {
  font-family: 'Syne', sans-serif;
  font-size: 40px; font-weight: 800;
  color: var(--cyan); line-height: 1;
  margin-bottom: 4px; letter-spacing: -2px;
}
.stat__label {
  font-family: 'Space Mono', monospace;
  font-size: 10px; letter-spacing: 2px;
  text-transform: uppercase; color: var(--mute);
}
</style>
