<template>
  <div class="cat-grid" ref="gridEl">
    <a v-for="cat in categories" :key="cat.slug"
       :href="`/categories/${cat.slug}`"
       class="cat-card">
      <div class="cat-card__icon">{{ cat.icon }}</div>
      <div class="cat-card__name">{{ cat.name }}</div>
      <div class="cat-card__count">{{ cat.count }} writeup{{ cat.count !== 1 ? 's' : '' }}</div>
      <div class="cat-card__bar">
        <div class="cat-card__fill"
             :style="{ width: animated ? (cat.count / maxCount * 100) + '%' : '0%',
                       background: cat.color }">
        </div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  writeups: Array<{ category: string }>
}>()

const animated = ref(false)
const gridEl = ref<HTMLElement | null>(null)

const CAT_META: Record<string, { icon: string; color: string; slug: string }> = {
  'Crypto':   { icon: '🔐', color: '#00d4ff', slug: 'crypto' },
  'Web':      { icon: '🌐', color: '#7fff6b', slug: 'web'    },
  'Pwn':      { icon: '💥', color: '#ff6b35', slug: 'pwn'    },
  'Reverse':  { icon: '🔍', color: '#bd93f9', slug: 'rev'    },
  'Misc':     { icon: '🎲', color: '#ffd700', slug: 'misc'   },
  'Forensics':{ icon: '🧬', color: '#ff4757', slug: 'forensics' },
}

const categories = computed(() => {
  const counts: Record<string, number> = {}
  props.writeups.forEach(w => { counts[w.category] = (counts[w.category] || 0) + 1 })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, ...CAT_META[name] ?? { icon: '📁', color: '#6e7681', slug: name.toLowerCase() } }))
    .sort((a, b) => b.count - a.count)
})

const maxCount = computed(() => Math.max(...categories.value.map(c => c.count), 1))

onMounted(() => {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      setTimeout(() => { animated.value = true }, 200)
      obs.disconnect()
    }
  })
  if (gridEl.value) obs.observe(gridEl.value)
})
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1px; background: var(--border);
  border: 1px solid var(--border);
}
.cat-card {
  background: var(--surface); padding: 24px;
  display: flex; flex-direction: column; gap: 8px;
  transition: background 0.2s; cursor: pointer;
}
.cat-card:hover { background: var(--s2); }
.cat-card__icon { font-size: 24px; }
.cat-card__name {
  font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--bright);
}
.cat-card__count {
  font-family: 'Space Mono', monospace; font-size: 11px; color: var(--mute);
}
.cat-card__bar {
  height: 3px; background: var(--b2); margin-top: 8px; overflow: hidden;
}
.cat-card__fill {
  height: 100%;
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
