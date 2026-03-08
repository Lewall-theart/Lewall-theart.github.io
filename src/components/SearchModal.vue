<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="search-overlay" @click.self="close">
        <div class="search-box">
          <!-- Header -->
          <div class="search-header">
            <span class="search-icon">⌕</span>
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              placeholder="Tìm writeup, category, tag..."
              autocomplete="off"
              spellcheck="false"
              @keydown.down.prevent="navigate(1)"
              @keydown.up.prevent="navigate(-1)"
              @keydown.enter.prevent="openResult"
              @keydown.esc="close"
            />
            <button class="search-close" @click="close">ESC</button>
          </div>

          <!-- Results -->
          <div class="search-results" ref="resultsEl">
            <template v-if="query.length > 0">
              <a
                v-for="(r, i) in results"
                :key="r.url"
                :href="r.url"
                class="search-result"
                :class="{ 'search-result--active': i === activeIndex }"
                @click="close"
                @mouseenter="activeIndex = i"
              >
                <div class="search-result__title" v-html="highlight(r.title)"></div>
                <div class="search-result__meta">
                  <span :class="`tag-${r.catColor}`" class="tag">{{ r.category }}</span>
                  <span v-for="t in r.tags" :key="t" class="tag tag-orange">{{ t }}</span>
                </div>
              </a>
              <div v-if="results.length === 0" class="search-empty">
                Không tìm thấy kết quả cho "<strong>{{ query }}</strong>"
              </div>
            </template>
            <div v-else class="search-recent">
              <div class="search-recent__label">// Recent</div>
              <a v-for="r in recentItems" :key="r.url" :href="r.url" class="search-result" @click="close">
                <div class="search-result__title">{{ r.title }}</div>
                <div class="search-result__meta">
                  <span :class="`tag-${r.catColor}`" class="tag">{{ r.category }}</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Hints -->
          <div class="search-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> điều hướng</span>
            <span><kbd>↵</kbd> mở</span>
            <span><kbd>esc</kbd> đóng</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const resultsEl = ref<HTMLElement | null>(null)

// ── WRITEUP DATA (extend as you add writeups) ──
const writeups = [
  { title: "Papi Cris' Fortune", category: 'Crypto', catColor: 'cyan', tags: ['RSA', 'Small Prime'], url: '/writeups/papi-cris' },
  { title: 'Baby RSA',           category: 'Crypto', catColor: 'cyan', tags: ['RSA', 'e=3'],         url: '/writeups/baby-rsa' },
  { title: 'Forbidden Injection',category: 'Web',    catColor: 'red',  tags: ['SQLi', 'WAF Bypass'], url: '/writeups/forbidden-injection' },
  { title: 'Stack Overflow 101', category: 'Pwn',    catColor: 'orange',tags: ['Buffer Overflow', 'ROP'], url: '/writeups/stack-overflow' },
  { title: 'Blind Vision',       category: 'Reverse',catColor: 'purple',tags: ['IDA', 'Anti-debug'], url: '/writeups/blind-vision' },
]

const recentItems = writeups.slice(0, 3)

const results = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.toLowerCase()
  return writeups.filter(w =>
    w.title.toLowerCase().includes(q) ||
    w.category.toLowerCase().includes(q) ||
    w.tags.some(t => t.toLowerCase().includes(q))
  )
})

watch(results, () => { activeIndex.value = 0 })
watch(query, () => { activeIndex.value = 0 })

function highlight(text: string) {
  if (!query.value) return text
  return text.replace(
    new RegExp(`(${query.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
    '<mark>$1</mark>'
  )
}

function navigate(dir: number) {
  const max = results.value.length - 1
  activeIndex.value = Math.max(0, Math.min(max, activeIndex.value + dir))
}

function openResult() {
  const r = results.value[activeIndex.value]
  if (r) { window.location.href = r.url; close() }
}

function openModal() {
  open.value = true
  nextTick(() => inputEl.value?.focus())
}

function close() {
  open.value = false
  query.value = ''
  activeIndex.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openModal() }
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('open-search', openModal)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('open-search', openModal)
})
</script>

<style scoped>
.search-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 100px;
}
.search-box {
  width: 100%; max-width: 580px;
  background: var(--surface);
  border: 1px solid var(--b2);
  box-shadow: 0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.05);
  overflow: hidden;
}
.search-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.search-icon { font-size: 20px; color: var(--dim); flex-shrink: 0; }
.search-header input {
  flex: 1; background: none; border: none; outline: none;
  font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--bright);
}
.search-header input::placeholder { color: var(--mute); }
.search-close {
  font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px;
  color: var(--mute); border: 1px solid var(--b2); padding: 3px 8px;
  background: none; cursor: pointer; transition: all 0.2s;
}
.search-close:hover { color: var(--text); border-color: var(--dim); }
.search-results { max-height: 340px; overflow-y: auto; }
.search-result {
  display: block; padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s; cursor: pointer;
}
.search-result:hover,
.search-result--active { background: var(--s2); }
.search-result__title {
  font-family: 'Syne', sans-serif; font-weight: 700;
  color: var(--bright); margin-bottom: 7px;
}
.search-result__title :deep(mark) {
  background: rgba(0,212,255,0.2); color: var(--cyan);
}
.search-result__meta { display: flex; gap: 6px; flex-wrap: wrap; }
.search-empty { padding: 24px 20px; color: var(--mute); font-size: 13px; }
.search-empty strong { color: var(--text); }
.search-recent__label {
  padding: 10px 20px 4px;
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 2px; color: var(--mute); text-transform: uppercase;
}
.search-hints {
  padding: 10px 20px; border-top: 1px solid var(--border);
  display: flex; gap: 20px;
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--mute);
}
.search-hints kbd {
  background: var(--s2); border: 1px solid var(--b2);
  padding: 1px 5px; border-radius: 2px; color: var(--dim); font-size: 11px;
}

/* Tags in search */
.tag { display: inline-flex; align-items: center; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 8px; border: 1px solid; }
.tag-cyan   { color: #00d4ff; border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.06); }
.tag-green  { color: #7fff6b; border-color: rgba(127,255,107,0.4); background: rgba(127,255,107,0.06); }
.tag-orange { color: #ff6b35; border-color: rgba(255,107,53,0.4); background: rgba(255,107,53,0.06); }
.tag-red    { color: #ff4757; border-color: rgba(255,71,87,0.4); background: rgba(255,71,87,0.06); }
.tag-purple { color: #bd93f9; border-color: rgba(189,147,249,0.4); background: rgba(189,147,249,0.06); }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .search-box, .modal-leave-active .search-box { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from .search-box, .modal-leave-to .search-box { transform: translateY(-16px) scale(0.98); opacity: 0; }
</style>
