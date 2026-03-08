<template>
  <aside class="toc" :class="{'toc--on':headings.length>0}">
    <div class="toc-label">// Contents</div>
    <nav class="toc-nav">
      <a v-for="h in headings" :key="h.id" :href="'#'+h.id"
         class="toc-item" :class="{'active':activeId===h.id,'h3':h.depth===3,'h4':h.depth===4}"
         @click.prevent="scrollTo(h.id)">
        <span class="dot"></span><span class="txt">{{ h.text }}</span>
      </a>
    </nav>
    <div class="toc-progress">
      <svg viewBox="0 0 36 36" class="arc">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" stroke-width="2"/>
        <circle cx="18" cy="18" r="15" fill="none" stroke="url(#g)" stroke-width="2"
          stroke-dasharray="94.2" :stroke-dashoffset="94.2-(94.2*progress/100)"
          stroke-linecap="round" transform="rotate(-90 18 18)"/>
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--cyan)"/>
          <stop offset="100%" stop-color="var(--azki-pink)"/>
        </linearGradient></defs>
      </svg>
      <span class="pct">{{ Math.round(progress) }}%</span>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
interface H{id:string;text:string;depth:number}
const props = defineProps<{headings:H[]}>()
const activeId=ref(''),progress=ref(0)
function scrollTo(id:string){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}
function onScroll(){
  const h=document.documentElement.scrollHeight-window.innerHeight
  progress.value=h>0?(window.scrollY/h)*100:0
  let cur=''
  for(const h of props.headings){const el=document.getElementById(h.id);if(el&&el.getBoundingClientRect().top<=100)cur=h.id}
  activeId.value=cur
}
onMounted(()=>window.addEventListener('scroll',onScroll,{passive:true}))
onUnmounted(()=>window.removeEventListener('scroll',onScroll))
</script>
<style scoped>
.toc{position:sticky;top:80px;max-height:calc(100vh - 100px);overflow-y:auto;padding:0 0 20px;opacity:0;transform:translateX(12px);transition:opacity .4s,transform .4s;}
.toc--on{opacity:1;transform:none;}
.toc-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mute);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);}
.toc-nav{display:flex;flex-direction:column;gap:2px;}
.toc-item{display:flex;align-items:flex-start;gap:10px;padding:5px 8px;font-family:'Space Mono',monospace;font-size:11px;line-height:1.5;color:var(--mute);border-left:2px solid transparent;transition:color .2s,border-color .2s;}
.toc-item:hover{color:var(--text);}
.toc-item.active{color:var(--cyan)!important;border-left-color:var(--cyan);}
.toc-item.h3{padding-left:20px;font-size:10.5px;}
.toc-item.h4{padding-left:32px;font-size:10px;}
.dot{width:4px;height:4px;border-radius:50%;background:currentColor;flex-shrink:0;margin-top:6px;}
.toc-item.active .dot{background:var(--azki-pink);box-shadow:0 0 6px var(--azki-pink);}
.txt{flex:1;}
.toc-progress{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);}
.arc{width:36px;height:36px;flex-shrink:0;}
.pct{font-family:'Space Mono',monospace;font-size:11px;color:var(--dim);}
.toc::-webkit-scrollbar{width:3px;}.toc::-webkit-scrollbar-thumb{background:var(--border);}
</style>