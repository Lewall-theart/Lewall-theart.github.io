import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { animate } from 'animejs'

interface Track {
  title: string
  artist: string
  src: string
}

const TRACKS: Track[] = [
  {
    title: 'Inochi (いのち)',
    artist: 'AZKi',
    src: '/azki/inochi-azki.mp3',
  },
]

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const notesContainerRef = useRef<HTMLDivElement | null>(null)
  const playerCardRef = useRef<HTMLDivElement | null>(null)

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sphereRef = useRef<THREE.LineSegments | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const animIdRef = useRef<number | null>(null)

  const currentTrack = TRACKS[0]
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Format time (mm:ss)
  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  // Toggle play/pause
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => {
        setIsPlaying(true)
        spawnAnimeNotes()
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }

  // Anime.js floating musical notes animation
  const spawnAnimeNotes = () => {
    if (!notesContainerRef.current) return
    const symbols = ['♪', '♫', '♬', '♩', '✦', '✧']

    for (let i = 0; i < 5; i++) {
      const span = document.createElement('span')
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)]
      span.className = 'absolute text-xs font-mono pointer-events-none select-none text-neutral-800 dark:text-neutral-200'
      span.style.left = `${20 + Math.random() * 60}%`
      span.style.bottom = '20px'
      span.style.opacity = '1'

      notesContainerRef.current.appendChild(span)

      animate(span, {
        translateY: -70 - Math.random() * 40,
        translateX: (Math.random() - 0.5) * 60,
        opacity: [1, 0],
        scale: [0.8, 1.4],
        duration: 1200 + Math.random() * 400,
        ease: 'outCubic',
        onComplete: () => {
          span.remove()
        },
      })
    }
  }

  // Seek handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickPos = (e.clientX - rect.left) / rect.width
    const newTime = clickPos * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Initialize Three.js 3D Audio Visualizer
  useEffect(() => {
    if (isCollapsed || !canvasRef.current) return

    const canvas = canvasRef.current
    const width = 110
    const height = 54

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.z = 2.8

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    const isDark = document.documentElement.classList.contains('dark')

    // 1. Audio Visualizer Icosahedron wireframe
    const geometry = new THREE.IcosahedronGeometry(0.9, 1)
    const wireframe = new THREE.WireframeGeometry(geometry)
    const material = new THREE.LineBasicMaterial({
      color: isDark ? 0x00d4ff : 0x111111,
      transparent: true,
      opacity: 0.7,
    })
    const sphere = new THREE.LineSegments(wireframe, material)
    sphereRef.current = sphere
    scene.add(sphere)

    // 2. Audio Particle Ring
    const pCount = 36
    const pGeo = new THREE.BufferGeometry()
    const pPositions = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const angle = (i / pCount) * Math.PI * 2
      const radius = 1.25 + (Math.random() - 0.5) * 0.15
      pPositions[i * 3] = Math.cos(angle) * radius
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.2
      pPositions[i * 3 + 2] = Math.sin(angle) * radius
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    const pMat = new THREE.PointsMaterial({
      color: isDark ? 0xbd93f9 : 0x555555,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    })
    const particles = new THREE.Points(pGeo, pMat)
    particlesRef.current = particles
    scene.add(particles)

    let angle = 0
    const renderLoop = () => {
      animIdRef.current = requestAnimationFrame(renderLoop)
      angle += 0.025

      if (sphereRef.current) {
        sphereRef.current.rotation.y += 0.015
        sphereRef.current.rotation.x += 0.008

        // Pulse scale when playing
        const scale = isPlaying ? 1 + Math.sin(angle * 2.5) * 0.12 : 1
        sphereRef.current.scale.set(scale, scale, scale)
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y -= 0.012
      }

      renderer.render(scene, camera)
    }

    renderLoop()

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
      renderer.dispose()
    }
  }, [isCollapsed, isPlaying])

  // Audio setup & persistence
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const onEnded = () => {
      setIsPlaying(false)
      audio.currentTime = 0
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [volume])

  return (
    <>
      <audio ref={audioRef} src={currentTrack.src} preload="metadata" />

      {/* Floating container */}
      <div className="fixed bottom-5 right-5 z-50 select-none">
        {/* Floating Notes Container for Anime.js */}
        <div ref={notesContainerRef} className="absolute inset-0 pointer-events-none" />

        {/* Collapsed Pill Button */}
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full surface-bar border border-neutral-300 dark:border-neutral-700 shadow-xl hover:border-neutral-500 transition-all cursor-pointer group"
            title="Open AZKi Music Player"
            aria-label="Open AZKi Music Player"
          >
            {/* Mini Equalizer */}
            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
              <span className={`w-0.5 bg-neutral-900 dark:bg-white rounded-full transition-all ${isPlaying ? 'animate-pulse h-3.5' : 'h-1.5'}`}></span>
              <span className={`w-0.5 bg-neutral-900 dark:bg-white rounded-full transition-all ${isPlaying ? 'animate-pulse h-2.5 delay-75' : 'h-1'}`}></span>
              <span className={`w-0.5 bg-neutral-900 dark:bg-white rounded-full transition-all ${isPlaying ? 'animate-pulse h-3 delay-150' : 'h-2'}`}></span>
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-neutral-800 dark:text-neutral-200 font-semibold">
              AZKi // {isPlaying ? 'Playing' : 'Music'}
            </span>

            <span className="text-xs text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
              {isPlaying ? '⏸' : '▶'}
            </span>
          </button>
        ) : (
          /* Expanded Player Panel */
          <div
            ref={playerCardRef}
            className="w-80 sm:w-96 surface-card rounded-2xl p-4 shadow-2xl border border-neutral-300 dark:border-neutral-800 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-200/70 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  AZKi Soundstation // Three.js
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors p-1"
                aria-label="Minimize player"
                title="Minimize player"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 12H6" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Three.js 3D Audio Visualizer Canvas */}
              <div className="w-[110px] h-[54px] rounded-lg bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center shrink-0 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />
                <span className="absolute bottom-1 right-1 text-[8px] font-mono uppercase tracking-widest text-neutral-400 opacity-60">
                  3D
                </span>
              </div>

              {/* Track Details */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                  <span>{currentTrack.artist}</span>
                  <span>·</span>
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Seek Bar */}
            <div
              onClick={handleSeek}
              className="mt-3 h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer overflow-hidden"
              title="Seek progress"
            >
              <div
                className="h-full bg-neutral-900 dark:bg-white transition-[width] duration-100 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
