<template>
  <div>
    <!-- Filters -->
    <div class="filters">
      <button
        v-for="f in catFilters" :key="f"
        class="filter-btn"
        :class="{ active: activeFilter === f }"
        @click="setFilter(f)"
      >{{ f }}</button>
      <div class="filter-sep"></div>
      <button
        v-for="d in diffFilters" :key="d"
        class="filter-btn"
        :class="{ active: activeDiff === d }"
        @click="setDiff(d)"
      >{{ d }}</button>
    </div>

    <!-- Count -->
    <div class="result-count">
      <span class="font-mono text-[11px] text-mute">
        {{ filtered.length }} writeup{{ filtered.length !== 1 ? 's' : '' }}
        <template v-if="activeFilter !== 'All'"> in {{ activeFilter }}</template>
        <template v-if="activeDiff !== 'All'"> · {{ activeDiff }}</template>
      </span>
    </div>

    <!-- Grid -->
    <TransitionGroup name="card-grid" tag="div" class="wu-grid">
      <a
        v-for="w in filtered"
        :key="w.slug"
        :href="`/writeups/${w.slug}`"
        class="wu-card"
      >
        <div class="wu-card__top">
          <span class="wu-cat font-mono text-[10px] tracking-[2px] uppercase text-mute">{{ w.category }}</span>
          <div :class="`diff diff-${w.difficulty}`">
            <div class="diff-dot"></div><div class="diff-dot"></div><div class="diff-dot"></div>
          </div>
        </div>

        <div class="wu-card__title">{{ w.title }}</div>

        <p class="wu-card__desc">{{ w.description }}</p>

        <div class="wu-card__tags">
          <span :class="`tag-${w.catColor}`" class="tag">{{ w.category }}</span>
          <span v-for="t in w.tags.slice(0,2)" :key="t" class="tag tag-orange">{{ t }}</span>
        </div>

        <div class="wu-card__footer">
          <div class="wu-card__meta">
            <span>{{ w.event ?? '' }}</span>
            <span v-if="w.readTime">· {{ w.readTime }} min</span>
          </div>
          <span class="wu-card__arrow">→</span>
        </div>
      </a>
    </TransitionGroup>

    <div v-if="filtered.length === 0" class="empty-state">
      <div class="font-mono text-[40px] mb-4 opacity-20">∅</div>
      <div class="font-mono text-sm text-mute">Không có writeup nào phù hợp với filter hiện tại.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface WriteupItem {
  slug: string; title: string; description: string
  category: string; catColor: string; difficulty: string
  tags: string[]; date: string; event?: string; readTime?: number
}

const props = defineProps<{ items: WriteupItem[] }>()

const activeFilter = ref('All')
const activeDiff   = ref('All')

const catFilters  = computed(() => ['All', ...new Set(props.items.map(i => i.category))])
const diffFilters = ['All', 'easy', 'medium', 'hard', 'insane']

const filtered = computed(() =>
  props.items.filter(w => {
    const catOk  = activeFilter.value === 'All' || w.category === activeFilter.value
    const diffOk = activeDiff.value === 'All'   || w.difficulty === activeDiff.value
    return catOk && diffOk
  })
)

function setFilter(f: string) { activeFilter.value = f }
function setDiff(d: string)   { activeDiff.value = d }
</script>

<style scoped>
/* Tags */
.tag { display: inline-flex; align-items: center; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 8px; border: 1px solid; }
.tag-cyan   { color: #00d4ff; border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.06); }
.tag-green  { color: #7fff6b; border-color: rgba(127,255,107,0.4); background: rgba(127,255,107,0.06); }
.tag-orange { color: #ff6b35; border-color: rgba(255,107,53,0.4); background: rgba(255,107,53,0.06); }
.tag-red    { color: #ff4757; border-color: rgba(255,71,87,0.4); background: rgba(255,71,87,0.06); }
.tag-purple { color: #bd93f9; border-color: rgba(189,147,249,0.4); background: rgba(189,147,249,0.06); }

/* Diff dots */
.diff { display: inline-flex; gap: 4px; align-items: center; }
.diff-dot { width: 7px; height: 7px; border-radius: 50%; background: #263547; }
.diff-easy   .diff-dot:nth-child(-n+1) { background: #7fff6b; }
.diff-medium .diff-dot:nth-child(-n+2) { background: #ffd700; }
.diff-hard   .diff-dot:nth-child(-n+3) { background: #ff6b35; }
.diff-insane .diff-dot                 { background: #ff4757; }

.filters {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
}
.filter-btn {
  font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase; padding: 6px 14px;
  border: 1px solid var(--border); color: var(--dim);
  background: none; cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover, .filter-btn.active {
  border-color: #00d4ff; color: #00d4ff; background: rgba(0,212,255,0.06);
}
.filter-sep { width: 1px; height: 20px; background: var(--border); flex-shrink: 0; }
.result-count { margin-bottom: 28px; }

.wu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1px; background: var(--border);
  border: 1px solid var(--border);
}
.wu-card {
  background: var(--surface); padding: 28px 32px;
  display: flex; flex-direction: column; gap: 14px;
  transition: background 0.2s; position: relative; overflow: hidden;
}
.wu-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: #00d4ff; transform: scaleY(0); transform-origin: bottom;
  transition: transform 0.3s ease;
}
.wu-card:hover { background: var(--s2); }
.wu-card:hover::before { transform: scaleY(1); }

.wu-card__top { display: flex; align-items: center; justify-content: space-between; }
.wu-card__title {
  font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700;
  color: var(--bright); line-height: 1.2; transition: color 0.2s;
}
.wu-card:hover .wu-card__title { color: #00d4ff; }
.wu-card__desc {
  font-size: 13px; color: var(--dim); line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.wu-card__tags { display: flex; gap: 6px; flex-wrap: wrap; }
.wu-card__footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border);
}
.wu-card__meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--mute); }
.wu-card__arrow { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--mute); transition: all 0.2s; }
.wu-card:hover .wu-card__arrow { color: #00d4ff; transform: translateX(4px); }

.empty-state {
  grid-column: 1 / -1; text-align: center;
  padding: 80px 40px; border: 1px solid var(--border); background: var(--surface);
}

/* Vue TransitionGroup animations */
.card-grid-move,
.card-grid-enter-active,
.card-grid-leave-active { transition: all 0.4s ease; }
.card-grid-enter-from { opacity: 0; transform: translateY(20px) scale(0.97); }
.card-grid-leave-to   { opacity: 0; transform: scale(0.95); }
.card-grid-leave-active { position: absolute; }

@media (max-width: 640px) {
  .wu-grid { grid-template-columns: 1fr; }
}
</style>
