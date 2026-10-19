'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, ArrowLeft, Volume2 } from 'lucide-react'
import Link from 'next/link'

// Base dictionary processing logic from the avatar component
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

export default function TranslatorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Avatar state
  const [avatarReady, setAvatarReady] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [queueCount, setQueueCount] = useState(0)
  
  // Transcript state
  const [currentText, setCurrentText] = useState('')
  const [transcripts, setTranscripts] = useState<{text: string, id: number}[]>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const audioWsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<AudioWorkletNode | null>(null)

  // 1. Initialize Avatar iframe
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
    
    // Ping to check ready
    const interval = setInterval(() => {
      if (iframeRef.current?.contentWindow && !avatarReady) {
        iframeRef.current.contentWindow.postMessage({ type: 'ping' }, '*')
      }
    }, 1000)

    return () => {
      window.removeEventListener('message', handler)
      clearInterval(interval)
    }
  }, [avatarReady])

  // 2. Avatar Animation Logic
  const sendToAvatar = useCallback((items: { path: string; word: string; duration: number }[]) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'play-batch', items }, '*')
    setQueueCount(q => q + items.length)
  }, [])

  const animateSignLanguage = useCallback(async (text: string) => {
    const index = await loadSigmlIndex()
    const tokens = processText(text)
    const items: { path: string; word: string; duration: number }[] = []

    for (const word of tokens) {
      const clean = word.replace(/\s+/g, '_')
      if (index.has(clean + '.sigml')) {
        items.push({ path: `sigml/${clean}.sigml`, word: clean, duration: 700 })
      } else {
        // Spell it out if word not found
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
  }, [sendToAvatar])

  // 3. Audio Recording & WebSocket Logic
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  const stopRecording = () => {
    if (processorRef.current) processorRef.current.disconnect()
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop())
    if (audioWsRef.current) audioWsRef.current.close()
    setIsRecording(false)
  }

  const startRecording = async () => {
    try {
      // Connect to WebSocket
      const signServer = process.env.NEXT_PUBLIC_SIGN_SERVER || `http://${window.location.hostname}:8765`
      const wsUrl = signServer.replace(/^http/, 'ws') + '/ws/audio'
      
      const ws = new WebSocket(wsUrl)
      audioWsRef.current = ws

      ws.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
          })
          mediaStreamRef.current = stream

          const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || AudioContext
          const audioCtx = new AudioContextClass({ sampleRate: 16000 })
          audioContextRef.current = audioCtx

          const source = audioCtx.createMediaStreamSource(stream)
          
          await audioCtx.audioWorklet.addModule('/audio-processor.js')
          const processor = new AudioWorkletNode(audioCtx, 'recorder-worklet')
          processorRef.current = processor

          source.connect(processor)
          processor.connect(audioCtx.destination)

          processor.port.onmessage = (e: MessageEvent) => {
            if (ws.readyState !== WebSocket.OPEN) return
            
            const float32Array = e.data as Float32Array
            
            // Basic VAD
            let maxVol = 0
            for (let i = 0; i < float32Array.length; i++) {
              if (Math.abs(float32Array[i]) > maxVol) maxVol = Math.abs(float32Array[i])
            }
            if (maxVol < 0.005) return

            // Encode to Base64
            const uint8Array = new Uint8Array(float32Array.buffer)
            let binary = ''
            const chunk = 8192
            for (let i = 0; i < uint8Array.length; i += chunk) {
              binary += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunk)))
            }
            
            ws.send(JSON.stringify({ audio: btoa(binary) }))
          }
          
          setIsRecording(true)
        } catch (err) {
          console.error("Mic error:", err)
          ws.close()
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.text) {
            const text = data.text.trim()
            const gloss = data.gloss ? data.gloss.trim() : text
            
            setCurrentText(text)
            setTranscripts(prev => [...prev.slice(-49), { 
              text: data.gloss ? `${text} -> [ASL: ${gloss}]` : text, 
              id: Date.now() 
            }])
            
            if (avatarReady) {
              animateSignLanguage(gloss)
            }
          }
        } catch (e) {
          console.error("WS parse error:", e)
        }
      }

      ws.onclose = () => setIsRecording(false)

    } catch (err) {
      console.error("Start recording failed:", err)
      setIsRecording(false)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => stopRecording()
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Real-time Translator</h1>
              <p className="text-xs text-zinc-400 font-medium">Any Language → English Sign Language</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-6 gap-6">
        
        {/* Left Column: Input & Transcript */}
        <div className="flex-1 flex flex-col max-w-xl">
          
          {/* Main Recording UI */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
            {/* Background pulse when recording */}
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-indigo-500/10"
              />
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-500 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' 
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/50'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white fill-current" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
              
              {/* Ripple effect */}
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              )}
            </motion.button>

            <div className="relative z-10 mt-8 text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {isRecording ? 'Listening...' : 'Tap to Translate'}
              </h2>
              <p className="text-sm text-zinc-400">
                {isRecording 
                  ? 'Speak naturally. Pause to translate.' 
                  : 'Works completely offline.'}
              </p>
            </div>
            
            {/* Real-time transcribed text preview */}
            <AnimatePresence>
              {currentText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10 mt-8 p-4 bg-black/40 rounded-xl w-full text-center border border-white/5"
                >
                  <p className="text-lg font-medium text-emerald-400">
                    "{currentText}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transcript History */}
          <div className="mt-6 flex-1 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col overflow-hidden">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Transcription Log</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {transcripts.map((t) => (
                <div key={t.id} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                  <p className="text-white text-[15px] leading-relaxed">{t.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
              {transcripts.length === 0 && !isRecording && (
                <div className="h-full flex items-center justify-center text-zinc-600 italic text-sm">
                  Your translations will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Avatar */}
        <div className="flex-[1.5] relative rounded-3xl overflow-hidden bg-[#0d1117] border border-white/10 shadow-2xl flex flex-col">
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${avatarReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                {avatarReady ? 'SiGML Avatar Ready' : 'Initializing...'}
              </span>
            </div>
            
            {(currentWord || queueCount > 0) && (
              <div className="bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 px-4 py-2 rounded-full flex items-center gap-3">
                <span className="text-emerald-400 text-xs animate-pulse">▶</span>
                <span className="text-white text-xs font-bold uppercase tracking-widest">
                  {currentWord || 'Signing...'}
                </span>
                {queueCount > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">
                    {queueCount} queued
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Avatar Iframe */}
          <iframe
            ref={iframeRef}
            src="/avatar/index.html"
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay"
            title="Sign Language Avatar"
          />

          {!avatarReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-20">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Loading 3D Canvas...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
