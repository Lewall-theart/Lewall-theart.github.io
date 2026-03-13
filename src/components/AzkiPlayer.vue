<template>
  <div class="azki-mini" :class="{playing}" @click="toggle">
    <audio ref="audioEl" preload="metadata"></audio>
    <div class="bars"><span v-for="i in 10" :key="i" class="bar" :style="barStyle(i)"></span></div>
    <div class="info">
      <div class="lbl">{{ playing ? '// now playing' : '// azki station' }}</div>
      <div class="track">
        <span class="artist">AZKi</span><span class="sep">—</span>
        <span class="title">{{ track.title }}</span>
      </div>
      <div class="time">
        <span>{{ fmt(currentTime) }}</span>
        <span class="sep">/</span>
        <span>{{ fmt(duration) }}</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" @click.stop="prev" title="Previous">⏮</button>
      <button class="btn" @click.stop="toggle" :title="playing ? 'Pause' : 'Play'">
        {{ playing ? '⏸' : '▶' }}
      </button>
      <button class="btn" @click.stop="next" title="Next">⏭</button>
    </div>
    <div class="progress">
      <span :style="{ width: progress + '%' }"></span>
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
const track = ref<Track>(tracks[0])
const currentTime = ref(0)
const duration = ref(0)

const progress = computed(() => duration.value ? Math.min(100, (currentTime.value / duration.value) * 100) : 0)

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    index: index.value,
    time: currentTime.value,
    playing: playing.value,
  }))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { index?: number; time?: number; playing?: boolean }
  } catch {
    return null
  }
}

function loadTrack(i: number) {
  if (!tracks.length) return
  const next = (i + tracks.length) % tracks.length
  index.value = next
  track.value = tracks[next]
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
  const s = Math.floor(t % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const hs = [40, 65, 30, 80, 55, 90, 45, 70, 35, 85]
function barStyle(i: number) {
  return {
    height: (playing.value ? hs[(i - 1) % hs.length] : 20) + '%',
    animationDelay: playing.value ? `${i * 0.08}s` : '0s',
    background: i % 3 === 0 ? 'var(--azki-pink)' : i % 3 === 1 ? 'var(--azki-violet)' : 'var(--cyan)',
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
.azki-mini{
  position:fixed;right:18px;bottom:18px;z-index:150;
  display:flex;align-items:center;gap:14px;
  padding:12px 14px 14px 14px;
  border:1px solid var(--border);background:var(--surface);
  box-shadow:0 12px 30px rgba(0,0,0,.18);
  cursor:pointer;min-width:320px;max-width:420px;
  transition:border-color .2s,background .2s,transform .2s,opacity .2s;
}
.azki-mini:hover{border-color:var(--azki-pink);background:var(--s2);}
.azki-mini.playing{border-color:rgba(255,110,180,.5);}
.bars{display:flex;align-items:flex-end;gap:2px;height:24px;flex-shrink:0;}
.bar{display:block;width:3px;border-radius:2px;transition:height .3s ease;}
.playing .bar{animation:wave .8s ease-in-out infinite alternate;}
.info{flex:1;min-width:0;}
.lbl{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--azki-pink);margin-bottom:3px;}
.track{display:flex;align-items:center;gap:6px;min-width:0;}
.artist{font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--bright);}
.sep{color:var(--mute);font-size:11px;}
.title{font-family:'Space Mono',monospace;font-size:12px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.time{font-family:'Space Mono',monospace;font-size:10px;color:var(--mute);margin-top:4px;}
.actions{display:flex;align-items:center;gap:6px;}
.btn{font-size:14px;width:30px;height:30px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:transparent;color:var(--text);transition:all .2s;border-radius:2px;}
.azki-mini:hover .btn{border-color:var(--azki-pink);}
.progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--border);}
.progress span{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--azki-pink),var(--azki-violet));width:0%;}

@media(max-width:640px){
  .azki-mini{right:12px;left:12px;min-width:0;max-width:none;}
  .actions{display:none;}
}
</style>
