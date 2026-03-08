<template>
  <canvas ref="canvas" class="pc" aria-hidden="true"></canvas>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const canvas = ref<HTMLCanvasElement|null>(null)
let animId=0, ctx:CanvasRenderingContext2D|null=null
const COLORS=['#00d4ff','#9b6dff','#ff6eb4','#7fff6b','#ffd700']
const rand=(a:number,b:number)=>Math.random()*(b-a)+a
const particles:any[]=[]
function make(w:number,h:number){return{x:rand(0,w),y:rand(0,h),vx:rand(-.15,.15),vy:rand(-.3,-.05),size:rand(1,2.5),opacity:0,color:COLORS[Math.floor(Math.random()*COLORS.length)],life:0,maxLife:rand(200,500)}}
function init(){const c=canvas.value;if(!c)return;ctx=c.getContext('2d');resize();for(let i=0;i<60;i++){const p=make(c.width,c.height);p.life=rand(0,p.maxLife);particles.push(p)}loop()}
function resize(){const c=canvas.value;if(!c)return;c.width=window.innerWidth;c.height=window.innerHeight}
function loop(){const c=canvas.value;if(!c||!ctx)return;ctx.clearRect(0,0,c.width,c.height);for(const p of particles){p.life++;p.x+=p.vx;p.y+=p.vy;const half=p.maxLife/2;p.opacity=p.life<half?(p.life/half)*.5:((p.maxLife-p.life)/half)*.5;if(p.life>=p.maxLife)Object.assign(p,make(c.width,c.height),{life:0});ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.opacity;ctx.fill()}ctx.globalAlpha=1;animId=requestAnimationFrame(loop)}
onMounted(()=>{init();window.addEventListener('resize',resize,{passive:true})})
onUnmounted(()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize)})
</script>
<style scoped>
.pc{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.55;}
[data-theme="light"] .pc{opacity:.12;}
</style>