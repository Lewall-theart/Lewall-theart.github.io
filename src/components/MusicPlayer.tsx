import React, { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'

interface Track {
  id: string
  title: string
  artist: string
  src: string
}

const TRACK: Track = {
  id: 'inochi',
  title: 'Inochi (いのち)',
  artist: 'AZKi',
  src: '/azki/inochi-azki.mp3',
}

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isLooping, setIsLooping] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')
    return `${m}:${s}`
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width))
    const newTime = newRatio * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioRef.current) {
      audioRef.current.volume = val
      if (val === 0) setIsMuted(true)
      else if (isMuted) setIsMuted(false)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isMuted) {
      audio.volume = volume || 0.85
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.8]
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
    const nextRate = rates[nextIdx]
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
    audio.loop = isLooping
    audio.playbackRate = playbackRate

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false)
        audio.currentTime = 0
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [volume, isMuted, isLooping, playbackRate])

  const handleToggleExpand = () => {
    const next = !isCollapsed
    setIsCollapsed(next)

    if (containerRef.current) {
      animate(containerRef.current, {
        scale: [0.97, 1],
        duration: 450,
        ease: 'outCubic',
      })
    }
  }

  return (
    <>
      <audio ref={audioRef} src={TRACK.src} preload="metadata" />

      {/* Floating Container (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50 select-none font-mono">
        {/* Morphing Container */}
        <div
          ref={containerRef}
          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl backdrop-blur-2xl border ${
            isCollapsed
              ? 'w-[230px] h-[48px] rounded-full bg-neutral-900/95 dark:bg-black/90 border-neutral-700/80 hover:border-neutral-500 hover:shadow-lg'
              : 'w-[340px] sm:w-[370px] h-[440px] rounded-3xl bg-neutral-900/95 dark:bg-neutral-950/95 border-neutral-700/80 shadow-2xl p-5'
          }`}
        >
          {/* ================= COLLAPSED PILL ================= */}
          {isCollapsed ? (
            <div className="w-full h-full flex items-center justify-between px-3">
              {/* Mini Rotating Vinyl */}
              <div
                onClick={handleToggleExpand}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Mở Máy Phát Đĩa Than"
              >
                <div className="relative w-7 h-7 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-900 ${
                      isPlaying ? 'animate-vinyl-spin' : ''
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-neutral-700/60 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-300 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-neutral-950"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-neutral-200 truncate max-w-[105px]">
                    {TRACK.title}
                  </span>
                  <span className="text-[9px] text-neutral-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Quick Play/Pause button */}
              <button
                onClick={togglePlay}
                className="w-7 h-7 rounded-full bg-white text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? (
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 fill-current translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            /* ================= EXPANDED TURNTABLE DECK ================= */
            <div className="w-full h-full flex flex-col justify-between text-neutral-100 transition-opacity duration-300">
              {/* Top Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <span className="font-bold tracking-widest text-neutral-300 text-[10px] uppercase">
                    VINYL TURNTABLE // HI-FI
                  </span>
                </div>
                <button
                  onClick={handleToggleExpand}
                  className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Thu nhỏ"
                >
                  <svg className="w-3 h-3 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Center Vinyl Platter & Tonearm */}
              <div className="relative w-full h-[180px] bg-neutral-950/80 rounded-2xl border border-neutral-800/80 overflow-hidden my-2 flex items-center justify-center">
                {/* Turntable Platter Base */}
                <div className="relative w-36 h-36 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-inner">
                  {/* Spinning Black Vinyl Record */}
                  <div
                    className={`relative w-[136px] h-[136px] rounded-full shadow-2xl flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black ${
                      isPlaying ? 'animate-vinyl-spin' : ''
                    }`}
                    style={{
                      boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Concentric Audio Grooves */}
                    <div className="w-[118px] h-[118px] rounded-full border border-neutral-700/30 flex items-center justify-center">
                      <div className="w-[96px] h-[96px] rounded-full border border-neutral-800/60 flex items-center justify-center">
                        <div className="w-[74px] h-[74px] rounded-full border border-neutral-700/40 flex items-center justify-center">
                          {/* Center Spindle Label */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-neutral-200 via-neutral-300 to-neutral-100 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 p-0.5 shadow-md flex items-center justify-center">
                            <div className="w-full h-full rounded-full border border-neutral-400 dark:border-neutral-600 flex flex-col items-center justify-center text-[8px] font-bold text-neutral-800 dark:text-neutral-200">
                              <span>AZKi</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 my-0.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stylus Tonearm (Cần kim máy đĩa than) */}
                  <div
                    className="absolute -top-1 right-2 w-12 h-24 pointer-events-none transition-transform duration-1000 ease-in-out origin-top-right z-10"
                    style={{
                      transform: isPlaying ? 'rotate(24deg)' : 'rotate(0deg)',
                    }}
                  >
                    {/* Pivot Base */}
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-neutral-400 border border-neutral-600 shadow-md"></div>
                    {/* Metal Arm Rod */}
                    <div className="absolute top-2.5 right-1.5 w-1 h-16 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-200 rounded-full shadow"></div>
                    {/* Cartridge Head & Needle */}
                    <div className="absolute bottom-3 right-0.5 w-3 h-4 bg-neutral-800 border border-neutral-600 rounded-sm shadow-sm flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                </div>

                {/* Status Overlay */}
                <div className="absolute bottom-2 left-3 text-[9px] text-neutral-400 font-mono pointer-events-none">
                  {isPlaying ? '▶ 33⅓ RPM STEREO' : '⏸ STANDBY'}
                </div>
              </div>

              {/* Track Details */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm tracking-wide text-white">
                      {TRACK.title}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {TRACK.artist} · Lossless 48kHz Master
                    </div>
                  </div>
                  {/* Subtle Equalizer bars */}
                  <div className="flex items-end gap-1 h-4">
                    {[12, 22, 10, 26, 18, 28].map((h, i) => (
                      <span
                        key={i}
                        className={`w-0.5 bg-neutral-300 dark:bg-neutral-200 rounded-full transition-all duration-300 ${
                          isPlaying ? 'opacity-80' : 'opacity-20'
                        }`}
                        style={{
                          height: isPlaying ? `${h}px` : '4px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Seek Bar */}
              <div className="mb-2">
                <div
                  onClick={handleSeek}
                  className="group relative h-1.5 w-full bg-neutral-800 rounded-full cursor-pointer overflow-hidden flex items-center"
                  title="Tua nhạc"
                >
                  <div
                    className="h-full bg-neutral-200 dark:bg-white rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1 pb-2 border-b border-neutral-800">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    isLooping ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title={isLooping ? 'Lặp lại: Bật' : 'Lặp lại: Tắt'}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                  </svg>
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white text-neutral-900 hover:bg-neutral-200 flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={cyclePlaybackRate}
                  className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 font-semibold transition-colors cursor-pointer"
                  title="Tốc độ phát"
                >
                  {playbackRate}x
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 px-1 text-neutral-400 pt-1">
                <button
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-white"
                />

                <span className="text-[9px] text-neutral-400 w-7 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes vinylSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-vinyl-spin {
          animation: vinylSpin 10s linear infinite;
        }
      `}</style>
    </>
  )
}
