<template>
  <button class="tt" :class="{light:isLight}" @click="toggle" :title="isLight?'Dark mode':'Light mode'">
    <span>{{ isLight ? '☀️' : '🌙' }}</span>
    <span class="track"><span class="thumb"></span></span>
  </button>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
const isLight = ref(false)
function toggle() {
  isLight.value = !isLight.value
  document.documentElement.setAttribute('data-theme', isLight.value ? 'light' : '')
  localStorage.setItem('theme', isLight.value ? 'light' : 'dark')
}
onMounted(() => {
  const s = localStorage.getItem('theme')
  isLight.value = s === 'light'
  if (isLight.value) document.documentElement.setAttribute('data-theme', 'light')
})
</script>
<style scoped>
.tt{display:flex;align-items:center;gap:8px;padding:5px 10px;border:1px solid var(--border);background:var(--surface);transition:border-color .2s;font-size:13px;}
.tt:hover{border-color:var(--azki-pink);}
.track{width:28px;height:14px;background:var(--b2);border-radius:7px;position:relative;transition:background .3s;}
.tt.light .track{background:linear-gradient(90deg,var(--azki-violet),var(--azki-pink));}
.thumb{position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:var(--dim);transition:transform .3s,background .3s;}
.tt.light .thumb{transform:translateX(14px);background:#fff;}
</style>