'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Sign Language Avatar Panel for Meetings
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'being', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could',
  'has', 'have', 'had', 'having', 'to', 'of', 'its'
])

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i", "i'll": "i will", "i've": "i have", "i'd": "i would",
  "you're": "you", "you'll": "you will", "you've": "you have",
  "he's": "he", "she's": "she", "it's": "it",
  "we're": "we", "they're": "they",
  "don't": "dont", "doesn't": "dont", "didn't": "didnt",
  "can't": "can not", "won't": "not will",
  "isn't": "not", "aren't": "not", "wasn't": "not",
  "that's": "that", "what's": "what", "there's": "there",
  "let's": "let us", "here's": "here",
}

const PHRASE_MAP: [RegExp, string][] = [
  [/\bi am going to\b/g, "i go"],
  [/\bi am\b/g, "i"],
  [/\bwe are\b/g, "we"],
  [/\bthey are\b/g, "they"],
  [/\bhe is\b/g, "he"],
  [/\bshe is\b/g, "she"],
  [/\ba lot of\b/g, "a_lot"],
  [/\bthank you\b/g, "thank"],
  [/\bthank god\b/g, "thank_god"],
  [/\bi don't know\b/g, "i_dont_know"],
  [/\bi know\b/g, "i_know"],
]

function processText(text: string): string[] {
  if (!text) return []
  let clean = text
    .replace(/\[.*?\]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase().trim()

  if (!clean) return []

  const words = clean.split(/\s+/)
  clean = words.map(w => CONTRACTIONS[w] || w).join(' ')

  for (const [pat, rep] of PHRASE_MAP) {
    clean = clean.replace(pat, rep)
  }

  return clean.split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w))
}

let sigmlIndex: Set<string> | null = null

async function loadSigmlIndex(): Promise<Set<string>> {
  if (sigmlIndex) return sigmlIndex
  try {
    const res = await fetch('/avatar/sigml-index.json')
    const data: string[] = await res.json()
    sigmlIndex = new Set(data)
  } catch {
    sigmlIndex = new Set()
  }
  return sigmlIndex
}

interface MeetingAvatarProps {
  isEnabled: boolean
  transcriptObj: { text: string; speaker: string; isFinal: boolean } | null
}

export function MeetingAvatar({ isEnabled, transcriptObj }: MeetingAvatarProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [avatarReady, setAvatarReady] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [queueCount, setQueueCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 80 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const processedRef = useRef<Set<string>>(new Set())

  // Handle messages from the avatar iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || !data.type) return

      switch (data.type) {
        case 'avatar-ready':
        case 'pong':
          setAvatarReady(true)
          break
        case 'avatar-playing':
          setCurrentWord(data.word || '')
          break
        case 'avatar-idle':
          setCurrentWord('')
          setQueueCount(0)
          break
        case 'avatar-word-done':
          setQueueCount(q => Math.max(0, q - 1))
          break
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Ping avatar iframe to check if ready
  useEffect(() => {
    if (!isEnabled) return
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'ping' }, '*')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isEnabled])

  const sendToAvatar = useCallback((items: { path: string; word: string; duration: number }[]) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'play-batch', items }, '*')
    setQueueCount(q => q + items.length)
  }, [])

  // Process incoming finalized transcription and sign it
  useEffect(() => {
    if (!isEnabled || !avatarReady || !transcriptObj || !transcriptObj.isFinal) return
    const text = transcriptObj.text
    if (!text) return

    const hash = `${transcriptObj.speaker}:${text.trim().toLowerCase()}`
    if (processedRef.current.has(hash)) return
    processedRef.current.add(hash)

    if (processedRef.current.size > 200) {
      processedRef.current = new Set(Array.from(processedRef.current).slice(-100))
    }

    const processAndSign = async () => {
      const index = await loadSigmlIndex()
      const tokens = processText(text)
      const items: { path: string; word: string; duration: number }[] = []

      for (const word of tokens) {
        const clean = word.replace(/\s+/g, '_')
        if (index.has(clean + '.sigml')) {
          items.push({ path: `sigml/${clean}.sigml`, word: clean, duration: 700 })
        } else {
          for (const c of clean) {
            if (/^[a-z0-9]$/.test(c) && index.has(c + '.sigml')) {
              items.push({ path: `sigml/${c}.sigml`, word: c, duration: 400 })
            }
          }
        }
      }

      if (items.length > 0) {
        sendToAvatar(items)
      }
    }

    processAndSign()
  }, [transcriptObj, isEnabled, avatarReady, sendToAvatar])

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  if (!isEnabled) return null

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        width: 260,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-2xl rounded-[20px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_60px_rgba(99,102,241,0.08)]">
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/8 to-transparent border-b border-white/5 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Translator Active
            </span>
          </div>
        </div>

        <div className="relative" style={{ height: 220 }}>
          <iframe
            ref={iframeRef}
            src="/avatar/index.html"
            className="w-full h-full border-0"
            allow="autoplay"
            title="Sign Language Avatar"
            style={{ display: 'block', background: '#0d1117' }}
          />
          {!avatarReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
              <div className="flex flex-col items-center gap-3">
                <div className="loader !w-8 !h-8 !border-3" />
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Loading Avatar...</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-black/40 border-t border-white/5">
          {currentWord ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-[10px] animate-pulse">▶</span>
                <span className="text-white text-sm font-bold uppercase tracking-wider">
                  {currentWord}
                </span>
              </div>
              {queueCount > 0 && <span className="text-[9px] font-mono text-zinc-600">Q:{queueCount}</span>}
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 italic">Waiting...</span>
          )}
        </div>

        {transcriptObj && transcriptObj.text && (
          <div className="px-4 py-2 border-t border-white/5 bg-black/20">
            <div className="flex flex-col">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">{transcriptObj.speaker}</span>
              <p className="text-[10px] text-white font-medium leading-relaxed truncate">
                &quot;{transcriptObj.text}&quot;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
