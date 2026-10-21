<template>
  <div class="tech-canvas-wrapper" ref="containerRef">
    <canvas ref="canvasRef" class="tech-canvas"></canvas>
    <div class="tech-canvas-meta font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
      <span class="pulse-dot"></span>
      <span>3D Security Core // Interactive</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let animFrameId: number | null = null

let outerMesh: THREE.LineSegments | null = null
let innerMesh: THREE.Mesh | null = null
let particlePoints: THREE.Points | null = null
let ringsGroup: THREE.Group | null = null

let targetRotX = 0
let targetRotY = 0
let mouseX = 0
let mouseY = 0

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function updateColors(isDark: boolean) {
  if (outerMesh && outerMesh.material instanceof THREE.LineBasicMaterial) {
    outerMesh.material.color.set(isDark ? 0x00d4ff : 0x222222)
    outerMesh.material.opacity = isDark ? 0.75 : 0.6
  }
  if (innerMesh && innerMesh.material instanceof THREE.MeshBasicMaterial) {
    innerMesh.material.color.set(isDark ? 0xbd93f9 : 0x555555)
    innerMesh.material.opacity = isDark ? 0.35 : 0.2
  }
  if (particlePoints && particlePoints.material instanceof THREE.PointsMaterial) {
    particlePoints.material.color.set(isDark ? 0x7fff6b : 0x333333)
  }
}

function initScene() {
  if (!canvasRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth || 320
  const height = containerRef.value.clientHeight || 320

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.z = 5.2

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const dark = isDarkMode()

  // 1. Outer wireframe Icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(1.6, 1)
  const icoWireGeo = new THREE.WireframeGeometry(icoGeo)
  const icoMat = new THREE.LineBasicMaterial({
    color: dark ? 0x00d4ff : 0x222222,
    transparent: true,
    opacity: dark ? 0.75 : 0.6,
  })
  outerMesh = new THREE.LineSegments(icoWireGeo, icoMat)
  scene.add(outerMesh)

  // 2. Inner floating Octahedron core
  const coreGeo = new THREE.OctahedronGeometry(0.85, 0)
  const coreMat = new THREE.MeshBasicMaterial({
    color: dark ? 0xbd93f9 : 0x555555,
    wireframe: true,
    transparent: true,
    opacity: dark ? 0.35 : 0.2,
  })
  innerMesh = new THREE.Mesh(coreGeo, coreMat)
  scene.add(innerMesh)

  // 3. Orbiting cyber particle ring
  const particleCount = 140
  const particleGeo = new THREE.BufferGeometry()
  const posArray = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 2.1 + (Math.random() - 0.5) * 0.4
    const y = (Math.random() - 0.5) * 0.6
    posArray[i * 3] = Math.cos(angle) * radius
    posArray[i * 3 + 1] = y
    posArray[i * 3 + 2] = Math.sin(angle) * radius
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
  const particleMat = new THREE.PointsMaterial({
    color: dark ? 0x7fff6b : 0x333333,
    size: 0.045,
    transparent: true,
    opacity: 0.8,
  })
  particlePoints = new THREE.Points(particleGeo, particleMat)
  ringsGroup = new THREE.Group()
  ringsGroup.rotation.x = 0.5
  ringsGroup.add(particlePoints)
  scene.add(ringsGroup)

  // Mouse movement tracking
  window.addEventListener('mousemove', onMouseMove)

  // Theme change observer
  const observer = new MutationObserver(() => {
    updateColors(isDarkMode())
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // Animation Loop
  let clock = new THREE.Clock()
  function animate() {
    animFrameId = requestAnimationFrame(animate)
    const delta = clock.getDelta()

    if (outerMesh) {
      outerMesh.rotation.y += delta * 0.35
      outerMesh.rotation.x += delta * 0.15
      outerMesh.rotation.x += (targetRotX - outerMesh.rotation.x) * 0.05
      outerMesh.rotation.y += (targetRotY - outerMesh.rotation.y) * 0.05
    }

    if (innerMesh) {
      innerMesh.rotation.y -= delta * 0.5
      innerMesh.rotation.z += delta * 0.25
    }

    if (ringsGroup) {
      ringsGroup.rotation.y += delta * 0.2
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  animate()
}

function onMouseMove(e: MouseEvent) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  mouseX = (e.clientX - cx) / cx
  mouseY = (e.clientY - cy) / cy
  targetRotY = mouseX * 0.6
  targetRotX = mouseY * 0.6
}

function onResize() {
  if (!containerRef.value || !renderer || !camera) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.tech-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tech-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.tech-canvas-meta {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bar);
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid var(--border);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.pulse-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #28c840;
  box-shadow: 0 0 8px #28c840;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

@media (max-width: 640px) {
  .tech-canvas-wrapper {
    height: 240px;
  }
}
</style>
