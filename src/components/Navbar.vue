<template>
  <nav class="nav" :class="{scrolled}">
    <div class="nav-inner">
      <a href="/" class="logo" @mouseenter="spawnNote">
        <div class="logo-box"><span>0x</span><span v-if="note" class="note">♪</span></div>
        <span>Blog</span>
      </a>
      <ul class="links">
        <li v-for="l in links" :key="l.href">
          <a :href="l.href" class="link" :class="{active:isActive(l.href)}">{{ l.label }}</a>
        </li>
      </ul>
      <div class="right">
        <button class="sbtn" @click="openSearch">⌕ <span class="sl">Search</span><kbd>Ctrl K</kbd></button>
        <ThemeToggle />
        <button class="ham" @click="open=!open" :class="{open}"><span/><span/><span/></button>
      </div>
    </div>
    <Transition name="slide">
      <div v-if="open" class="mobile">
        <a v-for="l in links" :key="l.href" :href="l.href" class="mlink" :class="{active:isActive(l.href)}" @click="open=false">{{ l.label }}</a>
      </div>
    </Transition>
  </nav>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
const props = defineProps<{currentPath:string}>()
const scrolled = ref(false), open = ref(false), note = ref(false)
const links = [{href:'/',label:'Home'},{href:'/writeups',label:'Writeups'},{href:'/tags',label:'Tags'},{href:'/about',label:'About'}]
const isActive = (h:string) => h==='/' ? props.currentPath==='/' : props.currentPath.startsWith(h)
const openSearch = () => window.dispatchEvent(new CustomEvent('open-search'))
const spawnNote = () => { note.value=true; setTimeout(()=>note.value=false,1000) }
const onScroll = () => scrolled.value = window.scrollY>10
onMounted(() => window.addEventListener('scroll',onScroll,{passive:true}))
onUnmounted(() => window.removeEventListener('scroll',onScroll))
</script>
<style scoped>
.nav{position:fixed;top:0;left:0;right:0;height:60px;z-index:100;background:rgba(8,12,16,.6);backdrop-filter:blur(24px);border-bottom:1px solid transparent;transition:border-color .3s,background .3s;}
.nav.scrolled{background:rgba(8,12,16,.92);border-color:var(--border);}
[data-theme="light"] .nav{background:rgba(240,244,248,.85);}
[data-theme="light"] .nav.scrolled{background:rgba(240,244,248,.96);border-color:var(--border);}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:100%;max-width:var(--page-max);margin:0 auto;padding:0 var(--page-pad);}
.logo{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--bright);letter-spacing:-.5px;transition:color .2s;}
.logo:hover{color:var(--azki-pink);}
.logo-box{width:32px;height:32px;border:1px solid var(--cyan);display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:12px;color:var(--cyan);background:rgba(0,212,255,.06);position:relative;transition:all .2s;}
.logo:hover .logo-box{border-color:var(--azki-pink);color:var(--azki-pink);background:rgba(255,110,180,.06);}
.note{position:absolute;top:-18px;right:-4px;font-size:16px;color:var(--azki-pink);animation:noteFloat 1s ease-out forwards;pointer-events:none;}
.links{display:flex;align-items:center;gap:4px;list-style:none;}
.link{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);padding:6px 14px;border:1px solid transparent;transition:all .2s;position:relative;}
.link::after{content:'';position:absolute;bottom:0;left:50%;right:50%;height:1px;background:var(--azki-pink);transition:left .25s,right .25s;}
.link:hover{color:var(--bright);}.link:hover::after{left:0;right:0;}
.link.active{color:var(--cyan);border-color:rgba(0,212,255,.25);background:rgba(0,212,255,.06);}
.link.active::after{left:0;right:0;background:var(--cyan);}
.right{display:flex;align-items:center;gap:10px;}
.sbtn{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);padding:6px 14px;font-family:'Space Mono',monospace;font-size:11px;color:var(--dim);transition:border-color .2s;}
.sbtn:hover{border-color:var(--cyan);color:var(--text);}
.sbtn kbd{background:var(--s2);border:1px solid var(--b2);padding:1px 5px;font-size:10px;color:var(--mute);}
.sl{display:none;}
.ham{display:none;flex-direction:column;gap:5px;padding:8px;}
.ham span{display:block;width:22px;height:2px;background:var(--dim);transition:all .3s;}
.ham.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px);}
.ham.open span:nth-child(2){opacity:0;}
.ham.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px);}
.mobile{position:fixed;top:60px;left:0;right:0;background:rgba(8,12,16,.97);border-bottom:1px solid var(--border);padding:16px;display:flex;flex-direction:column;gap:4px;}
.mlink{font-family:'Space Mono',monospace;font-size:13px;padding:10px 16px;color:var(--dim);border:1px solid transparent;transition:all .2s;}
.mlink:hover,.mlink.active{color:var(--cyan);border-color:rgba(0,212,255,.2);background:rgba(0,212,255,.06);}
.slide-enter-active,.slide-leave-active{transition:opacity .2s,transform .2s;}
.slide-enter-from,.slide-leave-to{opacity:0;transform:translateY(-8px);}
@media(max-width:768px){.links,.sbtn{display:none;}.ham{display:flex;}.nav-inner{padding:0 var(--page-pad-sm);}}
@media(min-width:900px){.sl{display:inline;}}
</style>
