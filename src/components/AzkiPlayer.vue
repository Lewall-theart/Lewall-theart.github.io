<template>
  <div class="azki-player-dock" :class="{ 'is-playing': playing, 'is-collapsed': collapsed }">
    <audio ref="audioEl" preload="metadata"></audio>

    <!-- Collapsed Toggle Trigger -->
    <button
      v-if="collapsed"
      class="azki-pill-btn"
      @click="collapsed = false"
      title="Open AZKi Music Player"
      aria-label="Open AZKi Music Player"
    >
      <div class="bars-mini">
        <span v-for="i in 4" :key="i" class="bar-mini" :style="miniBarStyle(i)"></span>
      </div>
      <span class="font-mono text-[10px] tracking-widest uppercase">AZKi // {{ playing ? 'PLAYING' : 'IDLE' }}</span>
      <span class="pill-play-icon text-xs">{{ playing ? '⏸' : '▶' }}</span>
    </button>

    <!-- Expanded Player Panel -->
    <div v-else class="azki-full-card surface-card rounded-2xl p-3 sm:p-4 shadow-xl">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="flex items-center gap-2">
          <span class="status-indicator" :class="{ active: playing }"></span>
          <span class="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            // AZKi Soundstation
          </span>
        </div>
        <button
          class="close-btn text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1"
          @click="collapsed = true"
          title="Minimize player"
          aria-label="Minimize player"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 12H6" />
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <!-- Equalizer Bars -->
        <div class="eq-bars">
          <span v-for="i in 8" :key="i" class="eq-bar" :style="barStyle(i)"></span>
        </div>

        <!-- Track Info -->
        <div class="track-details flex-1 min-w-0">
          <div class="track-title truncate font-mono text-xs font-semibold text-neutral-900 dark:text-white">
            {{ track.title }}
          </div>
          <div class="track-meta flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>AZKi</span>
            <span>·</span>
            <span>{{ fmt(currentTime) }} / {{ fmt(duration) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-group flex items-center gap-1.5 shrink-0">
          <button
            class="ctrl-btn"
            @click.stop="prev"
            title="Previous track"
            aria-label="Previous"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            class="ctrl-btn ctrl-play"
            @click.stop="toggle"
            :title="playing ? 'Pause' : 'Play'"
            aria-label="Play/Pause"
          >
            <svg v-if="playing" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <svg v-else class="w-4 h-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            class="ctrl-btn"
            @click.stop="next"
            title="Next track"
            aria-label="Next"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Seek Progress Bar -->
      <div class="seek-bar mt-2.5" @click="handleSeek">
        <div class="seek-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { AZKI_TRACKS } from '../data/azki-tracks'

type Track = { title: string; src: string }
type AzkiState = {
  playing: boolean
  index: number
  track: Track
  currentTime: number
  duration: number
}

const audioEl = ref<HTMLAudioElement | null>(null)
const tracks = AZKI_TRACKS
const index = ref(0)
const playing = ref(false)
const collapsed = ref(false)
const track = ref<Track>(tracks[0] ?? { title: 'Inochi', src: '' })
const currentTime = ref(0)
const duration = ref(0)

const progress = computed(() => (duration.value ? Math.min(100, (currentTime.value / duration.value) * 100) : 0))

const STORAGE_KEY = 'azki-player'

function emitState() {
  const detail: AzkiState = {
    playing: playing.value,
    index: index.value,
    track: track.value,
    currentTime: currentTime.value,
    duration: duration.value,
  }
  window.dispatchEvent(new CustomEvent('azki:state', { detail }))
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      index: index.value,
      time: currentTime.value,
      playing: playing.value,
      collapsed: collapsed.value,
    })
  )
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { index?: number; time?: number; playing?: boolean; collapsed?: boolean }
  } catch {
    return null
  }
}

function loadTrack(i: number) {
  if (!tracks.length) return
  const nextIdx = (i + tracks.length) % tracks.length
  index.value = nextIdx
  track.value = tracks[nextIdx]
  if (audioEl.value) {
    audioEl.value.src = encodeURI(track.value.src)
    audioEl.value.load()
  }
  emitState()
  saveState()
}

async function play() {
  if (!audioEl.value) return
  try {
    await audioEl.value.play()
    playing.value = true
  } catch {
    playing.value = false
  }
  emitState()
  saveState()
}

function pause() {
  if (!audioEl.value) return
  audioEl.value.pause()
  playing.value = false
  emitState()
  saveState()
}

function toggle() {
  if (playing.value) pause()
  else play()
}

function next() {
  loadTrack(index.value + 1)
  if (playing.value) play()
}

function prev() {
  loadTrack(index.value - 1)
  if (playing.value) play()
}

function fmt(t: number) {
  if (!t || Number.isNaN(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

function handleSeek(e: MouseEvent) {
  if (!audioEl.value || !duration.value) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const seekTime = ratio * duration.value
  audioEl.value.currentTime = seekTime
  currentTime.value = seekTime
  saveState()
  emitState()
}

const hs = [35, 60, 25, 85, 50, 95, 40, 75]
function barStyle(i: number) {
  return {
    height: (playing.value ? hs[(i - 1) % hs.length] : 20) + '%',
    animationDelay: playing.value ? `${i * 0.09}s` : '0s',
  }
}

function miniBarStyle(i: number) {
  return {
    height: (playing.value ? [40, 90, 60, 80][i - 1] : 25) + '%',
    animationDelay: playing.value ? `${i * 0.1}s` : '0s',
  }
}

function handleRequest() { emitState() }
function handleToggle() { toggle() }
function handlePlay() { play() }
function handlePause() { pause() }
function handleNext() { next() }
function handlePrev() { prev() }
function handleSet(e: Event) {
  const detail = (e as CustomEvent<{ index?: number }>).detail
  if (typeof detail?.index === 'number') loadTrack(detail.index)
}

onMounted(() => {
  const stored = loadState()
  if (stored?.collapsed !== undefined) collapsed.value = stored.collapsed
  if (stored?.index !== undefined) index.value = Math.max(0, Math.min(tracks.length - 1, stored.index))
  track.value = tracks[index.value] ?? tracks[0]

  if (audioEl.value) {
    audioEl.value.src = encodeURI(track.value.src)
    audioEl.value.addEventListener('timeupdate', () => {
      currentTime.value = audioEl.value?.currentTime ?? 0
      duration.value = audioEl.value?.duration ?? 0
      saveState()
      emitState()
    })
    audioEl.value.addEventListener('loadedmetadata', () => {
      duration.value = audioEl.value?.duration ?? 0
      if (stored?.time) audioEl.value.currentTime = stored.time
      emitState()
    })
    audioEl.value.addEventListener('ended', () => next())
    audioEl.value.addEventListener('play', () => {
      playing.value = true
      emitState()
      saveState()
    })
    audioEl.value.addEventListener('pause', () => {
      playing.value = false
      emitState()
      saveState()
    })
  }

  if (stored?.playing) play()
  else emitState()

  window.addEventListener('azki:request', handleRequest)
  window.addEventListener('azki:toggle', handleToggle)
  window.addEventListener('azki:play', handlePlay)
  window.addEventListener('azki:pause', handlePause)
  window.addEventListener('azki:next', handleNext)
  window.addEventListener('azki:prev', handlePrev)
  window.addEventListener('azki:set', handleSet as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('azki:request', handleRequest)
  window.removeEventListener('azki:toggle', handleToggle)
  window.removeEventListener('azki:play', handlePlay)
  window.removeEventListener('azki:pause', handlePause)
  window.removeEventListener('azki:next', handleNext)
  window.removeEventListener('azki:prev', handlePrev)
  window.removeEventListener('azki:set', handleSet as EventListener)
})
</script>

<style scoped>
.azki-player-dock {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  max-width: 380px;
  width: calc(100vw - 40px);
}

.azki-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bar);
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 8px 14px;
  box-shadow: 0 8px 24px var(--shadow-strong);
  cursor: pointer;
  color: var(--fg);
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.azki-pill-btn:hover {
  transform: translateY(-2px);
  border-color: var(--muted);
}

.azki-full-card {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--bar);
  backdrop-filter: blur(14px);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
}

.status-indicator.active {
  background: #28c840;
  box-shadow: 0 0 8px #28c840;
}

.close-btn {
  cursor: pointer;
  background: none;
  border: none;
}

.eq-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 22px;
  width: 28px;
  flex-shrink: 0;
}

.eq-bar {
  flex: 1;
  background: var(--fg);
  border-radius: 1px;
  transition: height 0.2s ease;
}

.is-playing .eq-bar {
  animation: eq-wave 0.75s ease-in-out infinite alternate;
}

.bars-mini {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  width: 14px;
}

.bar-mini {
  flex: 1;
  background: var(--fg);
  border-radius: 1px;
}

.is-playing .bar-mini {
  animation: eq-wave 0.75s ease-in-out infinite alternate;
}

@keyframes eq-wave {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--card-2);
  color: var(--fg);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.ctrl-btn:hover {
  border-color: var(--fg);
}

.ctrl-play {
  width: 30px;
  height: 30px;
  background: var(--fg);
  color: var(--bg);
  border: none;
}

.ctrl-play:hover {
  opacity: 0.9;
}

.seek-bar {
  height: 3px;
  width: 100%;
  background: var(--border);
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
}

.seek-fill {
  height: 100%;
  background: var(--fg);
  border-radius: 2px;
  transition: width 0.1s linear;
}

@media (max-width: 640px) {
  .azki-player-dock {
    bottom: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
    width: auto;
  }
}
</style>
