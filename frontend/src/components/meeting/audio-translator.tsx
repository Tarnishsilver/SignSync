'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Audio-to-Sign Translator Panel
 * Captures speech via Web Speech API → processes text → drives SiGML avatar
 * Also handles incoming [CC] messages from remote users
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
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"[\]]/g, ' ')
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

interface TranscriptEntry {
  text: string
  speaker: string
  timestamp: number
}

interface AudioTranslatorProps {
  isEnabled: boolean
  isMuted: boolean
  jitsiApi: { executeCommand: (cmd: string, ...args: unknown[]) => void } | null
  userName: string
  incomingTranscript?: { text: string; speaker: string; isFinal: boolean } | null
}

export function AudioTranslator({
  isEnabled,
  isMuted,
  jitsiApi,
  userName,
  incomingTranscript,
}: AudioTranslatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const recognitionRef = useRef<any>(null)

  const [avatarReady, setAvatarReady] = useState(false)
  const [currentWord, setCurrentWord] = useState('')
  const [queueCount, setQueueCount] = useState(0)
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [isListening, setIsListening] = useState(false)

  const processedRef = useRef<Set<string>>(new Set())

  // Dragging
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 80 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const transcriptEndRef = useRef<HTMLDivElement>(null)

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

  // Ping avatar iframe
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

  const processAndSign = useCallback(async (text: string) => {
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
  }, [sendToAvatar])

  // Handle offline local speech translation via WebSocket
  const audioWsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isEnabled || isMuted) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      if (audioWsRef.current) {
        audioWsRef.current.close()
        audioWsRef.current = null
      }
      setIsListening(false)
      return
    }

    let isComponentMounted = true
    let processor: AudioWorkletNode | null = null

    const startOfflineTranslation = async () => {
      try {
        // 1. Connect to Backend WebSocket
        // In local development, NEXT_PUBLIC_SIGN_SERVER or default to 8765
        const signServer = process.env.NEXT_PUBLIC_SIGN_SERVER || `http://${window.location.hostname}:8765`
        const wsUrl = signServer.replace(/^http/, 'ws') + '/ws/audio'
        
        const ws = new WebSocket(wsUrl)
        audioWsRef.current = ws

        ws.onopen = async () => {
          if (!isComponentMounted) return
          console.log('[AudioTranslator] Connected to offline translator WebSocket')
          
          try {
            // 2. Get Microphone Stream (Forcing the parent Next.js frame to grab the mic)
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              } 
            })
            mediaStreamRef.current = stream

            // 3. Extract Raw Float32 PCM at 16kHz
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioCtx = new AudioContextClass({ sampleRate: 16000 })
            audioContextRef.current = audioCtx

            const source = audioCtx.createMediaStreamSource(stream)
            // 4096 samples = ~256ms of audio per chunk
            await audioCtx.audioWorklet.addModule('/audio-processor.js')
            processor = new AudioWorkletNode(audioCtx, 'recorder-worklet')

            source.connect(processor)
            processor.connect(audioCtx.destination) // Required to keep Node alive in some browsers

            processor.port.onmessage = (e: MessageEvent) => {
              if (ws.readyState !== WebSocket.OPEN) return
              
              const float32Array = e.data as Float32Array
              
              // Only send if there's actual sound (simple VAD threshold to save bandwidth)
              let maxVol = 0
              for (let i = 0; i < float32Array.length; i++) {
                if (Math.abs(float32Array[i]) > maxVol) maxVol = Math.abs(float32Array[i])
              }
              if (maxVol < 0.005) return // Silence

              // Convert Float32Array to Base64 efficiently
              const uint8Array = new Uint8Array(float32Array.buffer)
              let binary = ''
              const chunk = 8192
              for (let i = 0; i < uint8Array.length; i += chunk) {
                binary += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunk)))
              }
              const base64Audio = btoa(binary)

              ws.send(JSON.stringify({ audio: base64Audio }))
            }
            
            setIsListening(true)
          } catch (err) {
            console.error('[AudioTranslator] Microphone error:', err)
            setIsListening(false)
          }
        }

        ws.onmessage = (event) => {
          if (!isComponentMounted) return
          try {
            const data = JSON.parse(event.data)
            if (data.text) {
              const text = data.text.trim()
              const gloss = data.gloss ? data.gloss.trim() : text
              
              // Add to transcript log
              setTranscripts(prev => [...prev.slice(-19), {
                text,
                speaker: data.gloss ? 'You (Mistral ASL Gloss)' : 'You (Translating...)',
                timestamp: Date.now(),
              }])

              // Send as CC to remote users
              if (jitsiApi) {
                jitsiApi.executeCommand('sendChatMessage', `[CC][ID:${Math.random().toString(36).substring(7)}] ${text}`)
              }

              // Process and sign locally using the Grammatical Gloss if available
              if (avatarReady) {
                processAndSign(gloss)
              }
            }
          } catch (e) {
            console.error('[AudioTranslator] WebSocket message error:', e)
          }
        }

        ws.onclose = () => {
          console.log('[AudioTranslator] Offline translator disconnected')
          setIsListening(false)
        }

      } catch (err) {
        console.error('[AudioTranslator] Failed to start offline translation:', err)
        setIsListening(false)
      }
    }

    startOfflineTranslation()

    return () => {
      isComponentMounted = false
      if (processor && audioContextRef.current) {
        processor.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioWsRef.current) {
        audioWsRef.current.close()
      }
      setIsListening(false)
    }
  }, [isEnabled, isMuted, jitsiApi, avatarReady, processAndSign])

  // Manual Mic Restart for hardware conflicts
  const handleManualMicRestart = () => {
    // For offline translation, we toggle enabled/muted off and on to restart the effect
    setIsListening(false)
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    if (audioWsRef.current) audioWsRef.current.close()
  }

  // Handle all transcripts (local and remote)
  useEffect(() => {
    if (!isEnabled || !avatarReady || !incomingTranscript || !incomingTranscript.isFinal) return
    const text = incomingTranscript.text
    if (!text) return

    const hash = `${incomingTranscript.speaker}:${text.trim().toLowerCase()}:${Date.now()}`
    if (processedRef.current.has(hash)) return
    processedRef.current.add(hash)

    if (processedRef.current.size > 200) {
      processedRef.current = new Set(Array.from(processedRef.current).slice(-100))
    }

    setTranscripts(prev => [...prev.slice(-19), {
      text,
      speaker: incomingTranscript.speaker,
      timestamp: Date.now(),
    }])
    processAndSign(text)
  }, [incomingTranscript, isEnabled, avatarReady, processAndSign])

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts])

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
        width: 300,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-2xl rounded-[20px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_60px_rgba(99,102,241,0.08)]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/8 to-transparent border-b border-white/5 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500'} ${isListening ? 'animate-pulse' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Audio → Sign
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleManualMicRestart(); }}
              className="ml-2 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] font-mono text-zinc-300 transition-colors"
              title="Click to force restart microphone transcription if it crashed"
            >
              MIC RESTART
            </button>
          </div>
          <span className="text-[9px] font-mono text-zinc-600">
            {isListening ? 'LISTENING' : isMuted ? 'MIC MUTED' : 'STANDBY'}
          </span>
        </div>

        {/* Avatar */}
        <div className="relative" style={{ height: 200 }}>
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
                <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Loading Avatar...</span>
              </div>
            </div>
          )}
        </div>

        {/* Current Word */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/5">
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
            <span className="text-[10px] text-zinc-600 italic">Waiting for speech...</span>
          )}
        </div>

        {/* Transcript Log */}
        <div className="border-t border-white/5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {transcripts.length > 0 ? (
            <div className="px-3 py-2 space-y-1.5">
              {transcripts.map((entry, i) => (
                <div key={i} className="flex flex-col">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${
                    entry.speaker === 'You' ? 'text-emerald-400' : 'text-indigo-400'
                  }`}>
                    {entry.speaker}
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          ) : (
            <div className="px-4 py-3">
              <span className="text-[10px] text-zinc-600 italic">
                {isMuted ? 'Unmute mic to start translating...' : 'Speak to see sign translations...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
