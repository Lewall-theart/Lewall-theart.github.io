<template>
  <div class="flag-section">
    <div class="flag-section__header">
      <span class="flag-section__line"></span>
      <span class="flag-section__label">{{ revealed ? '// DECRYPTED · UNLOCKED ✓' : '// DECRYPTED MESSAGE' }}</span>
      <span class="flag-section__line"></span>
    </div>

    <div class="flag-wrap" :class="{ 'flag-wrap--revealed': revealed }" @click="reveal">
      <!-- Spinning background -->
      <div class="flag-wrap__spin" :class="{ active: revealed }"></div>

      <!-- The flag text -->
      <div class="flag-text" :class="{ 'flag-text--revealed': revealed }">
        {{ revealed ? displayedFlag : flag }}
      </div>

      <!-- Overlay when locked -->
      <Transition name="mask">
        <div v-if="!revealed" class="flag-mask">
          <div class="flag-mask__inner">
            <span class="flag-lock" :style="{ animation: revealed ? 'none' : 'shakeLock 3s ease-in-out infinite' }">🔒</span>
            <span class="flag-hint">click để giải mã</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Particles on reveal -->
    <div class="particles" ref="particlesEl"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{ flag: string }>()

const revealed = ref(false)
const displayedFlag = ref('')
const particlesEl = ref<HTMLElement | null>(null)

async function reveal() {
  if (revealed.value) return
  revealed.value = true

  // Typewriter
  displayedFlag.value = ''
  for (let i = 0; i < props.flag.length; i++) {
    await new Promise(r => setTimeout(r, 55))
    displayedFlag.value += props.flag[i]
  }

  // Spawn particles
  spawnParticles()
}

function spawnParticles() {
  if (!particlesEl.value) return
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    p.style.cssText = `
      left: ${30 + Math.random() * 40}%;
      animation-delay: ${Math.random() * 0.5}s;
      background: ${['#00d4ff','#7fff6b','#ffd700'][Math.floor(Math.random()*3)]};
    `
    particlesEl.value.appendChild(p)
    setTimeout(() => p.remove(), 1500)
  }
}
</script>

<style scoped>
.flag-section { margin: 40px 0; }

.flag-section__header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
}
.flag-section__line { flex: 1; height: 1px; background: var(--border); }
.flag-section__label {
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 3px; text-transform: uppercase; color: var(--mute);
  white-space: nowrap; transition: color 0.5s;
}

.flag-wrap {
  position: relative; text-align: center; padding: 48px 40px;
  background: linear-gradient(135deg, rgba(0,212,255,0.04), rgba(127,255,107,0.04));
  border: 1px solid rgba(0,212,255,0.2);
  cursor: pointer; overflow: hidden;
  transition: border-color 0.4s;
}
.flag-wrap:hover { border-color: rgba(0,212,255,0.4); }
.flag-wrap--revealed {
  cursor: default;
  border-color: rgba(127,255,107,0.3);
}

/* Spinning conic bg */
.flag-wrap__spin {
  position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.03) 60deg, transparent 120deg);
  animation: spin 12s linear infinite;
  pointer-events: none;
}
.flag-wrap__spin.active {
  background: conic-gradient(from 0deg, transparent 0deg, rgba(127,255,107,0.05) 60deg, transparent 120deg);
}
@keyframes spin { to { transform: rotate(360deg); } }

.flag-text {
  font-family: 'Syne', sans-serif;
  font-size: clamp(22px, 4vw, 38px);
  font-weight: 800;
  color: var(--green);
  letter-spacing: 2px;
  position: relative; z-index: 1;
  filter: blur(14px);
  user-select: none;
  transition: filter 0.7s ease, text-shadow 0.7s ease;
  min-height: 1.2em;
}
.flag-text--revealed {
  filter: blur(0);
  text-shadow: 0 0 30px rgba(127,255,107,0.5);
  animation: glowGreen 2s ease-in-out infinite alternate;
  user-select: text;
}

.flag-mask {
  position: absolute; inset: 0; z-index: 2;
  display: flex; align-items: center; justify-content: center;
}
.flag-mask__inner { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.flag-lock { font-size: 28px; }
.flag-hint {
  font-family: 'Space Mono', monospace; font-size: 11px;
  letter-spacing: 2px; text-transform: uppercase; color: var(--dim);
  transition: color 0.2s;
}
.flag-wrap:hover .flag-hint { color: var(--cyan); }

/* Hover preview */
@media (hover: hover) {
  .flag-wrap:not(.flag-wrap--revealed):hover .flag-text { filter: blur(5px); }
}

/* Mask transition */
.mask-enter-active, .mask-leave-active { transition: opacity 0.4s ease; }
.mask-enter-from, .mask-leave-to { opacity: 0; }

/* Particles */
.particles { position: relative; height: 0; }
.particle {
  position: absolute; bottom: 0;
  width: 4px; height: 4px; border-radius: 50%;
  animation: particleUp 1.2s ease-out forwards;
}
@keyframes particleUp {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) translateX(calc((var(--r, 0.5) - 0.5) * 100px)) scale(0); opacity: 0; }
}

@keyframes shakeLock {
  0%, 100% { transform: rotate(0); }
  92% { transform: rotate(0); }
  94% { transform: rotate(-10deg); }
  96% { transform: rotate(10deg); }
  98% { transform: rotate(-5deg); }
}

@keyframes glowGreen {
  from { text-shadow: 0 0 20px rgba(127,255,107,0.3); }
  to   { text-shadow: 0 0 50px rgba(127,255,107,0.8), 0 0 100px rgba(127,255,107,0.2); }
}
</style>
