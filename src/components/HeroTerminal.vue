<template>
  <div class="terminal">
    <div class="terminal__bar">
      <div class="terminal__dots">
        <span></span><span></span><span></span>
      </div>
      <span class="terminal__title">terminal</span>
    </div>
    <div class="terminal__body">
      <div v-for="(line, i) in visibleLines" :key="i" class="terminal__line">
        <span v-if="line.type === 'prompt'" class="terminal__prompt">$ </span>
        <span v-if="line.type === 'prompt'" class="terminal__cmd">{{ line.text }}</span>
        <span v-if="line.type === 'out'" class="terminal__out">{{ line.text }}</span>
        <span v-if="line.type === 'flag'" class="terminal__flag">{{ line.text }}</span>
        <span v-if="line.type === 'err'" class="terminal__err">{{ line.text }}</span>
      </div>
      <div class="terminal__line" v-if="showCursor">
        <span class="terminal__prompt">$ </span>
        <span class="terminal__cursor"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  slug: string
  flag?: string
}>()

type LineType = 'prompt' | 'out' | 'flag' | 'err'
interface Line { type: LineType; text: string; delay: number }

const allLines: Line[] = [
  { type: 'prompt', text: 'python3 solve.py',              delay: 400  },
  { type: 'out',    text: '[*] Trying primes up to 100000...', delay: 900  },
  { type: 'out',    text: '[+] Factor found: q = 65537',   delay: 1500 },
  { type: 'out',    text: '[+] Computing φ(n)...',         delay: 2000 },
  { type: 'out',    text: '[+] Private key recovered',     delay: 2500 },
  { type: 'prompt', text: 'decrypt --rsa -i cipher.bin',   delay: 3000 },
  { type: 'flag',   text: `[+] Flag: ${props.flag ?? 'S3cr3t_to_p4pis_f0rtune'}`, delay: 3800 },
]

const visibleLines = ref<Line[]>([])
const showCursor = ref(false)

onMounted(() => {
  allLines.forEach(line => {
    setTimeout(() => {
      visibleLines.value.push(line)
    }, line.delay)
  })
  setTimeout(() => { showCursor.value = true }, 4200)
})
</script>

<style scoped>
.terminal {
  background: var(--s2);
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  min-height: 200px;
}
.terminal__bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; background: var(--s3);
  border-bottom: 1px solid var(--border);
}
.terminal__dots { display: flex; gap: 6px; }
.terminal__dots span { width: 10px; height: 10px; border-radius: 50%; }
.terminal__dots span:nth-child(1) { background: #ff5f56; }
.terminal__dots span:nth-child(2) { background: #ffbd2e; }
.terminal__dots span:nth-child(3) { background: #27c93f; }
.terminal__title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--mute); margin-left: auto; }
.terminal__body { padding: 20px; font-family: 'Space Mono', monospace; font-size: 12px; line-height: 1.8; flex: 1; }
.terminal__line { display: flex; gap: 0; animation: fadeUp 0.3s ease both; }
.terminal__prompt { color: var(--cyan); flex-shrink: 0; }
.terminal__cmd    { color: var(--text); }
.terminal__out    { color: var(--dim); }
.terminal__flag   { color: var(--green); font-weight: 700; }
.terminal__err    { color: var(--orange); }
.terminal__cursor {
  display: inline-block; width: 7px; height: 13px;
  background: var(--cyan); animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}
@keyframes blink { 50% { opacity: 0; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } }
</style>
