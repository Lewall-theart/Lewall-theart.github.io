<template>
  <div class="skills-grid" ref="el">
    <div v-for="skill in skills" :key="skill.name" class="skill-card">
      <div class="skill-card__head">
        <span class="skill-card__name">{{ skill.name }}</span>
        <span class="skill-card__level">{{ skill.level }}</span>
      </div>
      <div class="skill-bar">
        <div class="skill-fill"
             :style="{ width: animated ? skill.pct + '%' : '0%', background: skill.color }">
        </div>
      </div>
      <div class="skill-tags">
        <span v-for="t in skill.tags" :key="t" :class="`tag-${skill.tagColor}`" class="tag">{{ t }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const el = ref<HTMLElement | null>(null)
const animated = ref(false)

const skills = [
  { name: 'Cryptography',       level: 'Advanced',     pct: 88, color: '#00d4ff', tagColor: 'cyan',   tags: ['RSA', 'ECC', 'AES', 'Hash'] },
  { name: 'Web Security',       level: 'Advanced',     pct: 80, color: '#7fff6b', tagColor: 'green',  tags: ['SQLi', 'XSS', 'SSRF', 'SSTI'] },
  { name: 'Reverse Engineering',level: 'Intermediate', pct: 62, color: '#ff6b35', tagColor: 'orange', tags: ['IDA Pro', 'Ghidra', 'x86/64'] },
  { name: 'Binary Exploitation',level: 'Intermediate', pct: 55, color: '#bd93f9', tagColor: 'purple', tags: ['ROP', 'Heap', 'pwntools'] },
]

onMounted(() => {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { setTimeout(() => animated.value = true, 200); obs.disconnect() }
  })
  if (el.value) obs.observe(el.value)
})
</script>

<style scoped>
.tag { display: inline-flex; align-items: center; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 8px; border: 1px solid; }
.tag-cyan   { color: #00d4ff; border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.06); }
.tag-green  { color: #7fff6b; border-color: rgba(127,255,107,0.4); background: rgba(127,255,107,0.06); }
.tag-orange { color: #ff6b35; border-color: rgba(255,107,53,0.4); background: rgba(255,107,53,0.06); }
.tag-purple { color: #bd93f9; border-color: rgba(189,147,249,0.4); background: rgba(189,147,249,0.06); }

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1px; background: var(--border); border: 1px solid var(--border);
}
.skill-card {
  background: var(--surface); padding: 28px 32px;
  display: flex; flex-direction: column; gap: 12px;
}
.skill-card__head { display: flex; align-items: center; justify-content: space-between; }
.skill-card__name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--bright); }
.skill-card__level { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; color: var(--mute); text-transform: uppercase; }
.skill-bar { height: 3px; background: var(--b2); overflow: hidden; }
.skill-fill { height: 100%; transition: width 1.3s cubic-bezier(0.22, 1, 0.36, 1); }
.skill-tags { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
