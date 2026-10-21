import React, { useState } from 'react'

interface FlagRevealProps {
  flag: string
}

export default function FlagReveal({ flag }: FlagRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [copied, setCopied] = useState(false)

  const handleReveal = async () => {
    if (revealed) return
    setRevealed(true)

    setDisplayedText('')
    for (let i = 0; i < flag.length; i++) {
      await new Promise((r) => setTimeout(r, 45))
      setDisplayedText((prev) => prev + flag[i])
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(flag)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="my-8 surface-panel rounded-xl p-5 border border-neutral-300 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${revealed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {revealed ? '// CTF Flag Decrypted' : '// Encrypted Flag'}
          </span>
        </div>
        {revealed && (
          <button
            onClick={handleCopy}
            className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy Flag'}
          </button>
        )}
      </div>

      <div
        onClick={handleReveal}
        className={`relative overflow-hidden rounded-lg p-4 font-mono text-xs sm:text-sm text-center select-none transition-all cursor-pointer ${
          revealed
            ? 'bg-neutral-900 text-emerald-400 dark:bg-black dark:text-emerald-400 border border-emerald-500/30'
            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-500'
        }`}
      >
        {revealed ? (
          <div className="tracking-wider break-all">{displayedText}</div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span className="tracking-widest uppercase text-xs">Click to decrypt and reveal CTF flag</span>
          </div>
        )}
      </div>
    </div>
  )
}
