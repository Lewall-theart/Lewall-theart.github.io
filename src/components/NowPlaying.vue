<template>
  <div class="np" :class="{playing}" @click="toggle">
    <div class="bars"><span v-for="i in 12" :key="i" class="bar" :style="barStyle(i)"></span></div>
    <div class="info">
      <div class="lbl">{{ playing ? '// now playing' : '// azki station' }}</div>
      <div class="track"><span class="artist">AZKi</span><span class="sep">—</span><span class="title">{{ track.title }}</span></div>
    </div>
    <div class="notes" ref="notesEl"></div>
    <div class="btn">{{ playing ? '⏸' : '▶' }}</div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const playing = ref(false)
const notesEl = ref<HTMLElement|null>(null)
const tracks = [{title:'Inochi'},{title:'without U'},{title:'Fake.Fake.Fake'},{title:'Hello alone'}]
const track = ref(tracks[Math.floor(Math.random()*tracks.length)])
function toggle(){playing.value=!playing.value;if(playing.value)spray()}
function spray(){const ns=['♪','♫','♬','♩','🎵'];for(let i=0;i<6;i++)setTimeout(()=>{const el=document.createElement('span');el.className='spray';el.textContent=ns[Math.floor(Math.random()*ns.length)];el.style.cssText=`left:${20+Math.random()*60}%;animation-delay:${Math.random()*.3}s;font-size:${12+Math.random()*10}px;`;notesEl.value?.appendChild(el);setTimeout(()=>el.remove(),1400)},i*80)}
const hs=[40,65,30,80,55,90,45,70,35,85,60,50]
function barStyle(i:number){return{height:(playing.value?hs[(i-1)%hs.length]:20)+'%',animationDelay:playing.value?`${i*.08}s`:'0s',background:i%3===0?'var(--azki-pink)':i%3===1?'var(--azki-violet)':'var(--cyan)'}}
</script>
<style scoped>
.np{display:flex;align-items:center;gap:16px;padding:14px 20px;background:var(--surface);border:1px solid var(--border);cursor:pointer;transition:border-color .2s,background .2s;position:relative;overflow:hidden;}
.np:hover{border-color:var(--azki-pink);background:var(--s2);}
.np.playing{border-color:rgba(255,110,180,.4);}
.np.playing::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--azki-violet),var(--azki-pink),var(--cyan));}
.bars{display:flex;align-items:flex-end;gap:2px;height:28px;flex-shrink:0;}
.bar{display:block;width:3px;border-radius:2px;transition:height .3s ease;}
.playing .bar{animation:wave .8s ease-in-out infinite alternate;}
.info{flex:1;min-width:0;}
.lbl{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--azki-pink);margin-bottom:3px;}
.track{display:flex;align-items:center;gap:6px;}
.artist{font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--bright);}
.sep{color:var(--mute);font-size:11px;}
.title{font-family:'Space Mono',monospace;font-size:12px;color:var(--dim);}
.btn{font-size:16px;width:32px;height:32px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;}
.np:hover .btn{border-color:var(--azki-pink);}
.notes{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.np :deep(.spray){position:absolute;bottom:0;color:var(--azki-pink);animation:sprayUp 1.2s ease-out forwards;pointer-events:none;}
@keyframes sprayUp{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-60px) rotate(30deg)}}
</style>