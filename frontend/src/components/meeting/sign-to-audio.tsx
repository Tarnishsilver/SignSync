/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Sign-to-Audio Panel
 * Captures webcam frames → sends to FastAPI WebSocket → receives sign predictions → speaks via TTS
 */

// Dynamic WS URL: connects to the Next.js origin, which proxies to the Python backend
function getWsUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws/detect'
  const signServer = process.env.NEXT_PUBLIC_SIGN_SERVER
  if (signServer) {
    return signServer.replace(/^http/, 'ws') + '/ws/detect'
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws/detect`
}
const CAPTURE_INTERVAL_MS = 200  // 5 FPS
const STABILIZE_COUNT = 3        // Speak after same sign detected N consecutive times
const COOLDOWN_MS = 2500         // Don't repeat same word within this window

interface SignToAudioProps {
  isEnabled: boolean
  onSignDetected?: (word: string) => void  // Callback to send word to Jitsi chat
}

export function SignToAudio({ isEnabled, onSignDetected }: SignToAudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [currentSign, setCurrentSign] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [gesture, setGesture] = useState<string>('')
  const [wsConnected, setWsConnected] = useState(false)
  const [spokenWord, setSpokenWord] = useState<string>('')
  const [detectionHistory, setDetectionHistory] = useState<string[]>([])

  // Stabilization refs
  const consecutiveRef = useRef<{ word: string; count: number }>({ word: '', count: 0 })
  const lastSpokenRef = useRef<{ word: string; time: number }>({ word: '', time: 0 })

  // Dragging
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 80 })
  const dragOffset = useRef({ x: 0, y: 0 })

  // Visual indicator state only (actual TTS happens on receiver side in meeting-room.tsx)
  const showSpeakingIndicator = useCallback((text: string) => {
    // Don't repeat same word within cooldown
    const now = Date.now()
    if (
      lastSpokenRef.current.word === text &&
      now - lastSpokenRef.current.time < COOLDOWN_MS
    ) return

    lastSpokenRef.current = { word: text, time: now }
    setSpokenWord(text)
    setTimeout(() => setSpokenWord(''), 2000)
  }, [])

  // Connect to WebSocket
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      console.log('[SignToAudio] WebSocket connected')
      setWsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          console.warn('[SignToAudio] Server error:', data.error)
          return
        }

        // Process keypoint signs
        if (data.signs && data.signs.length > 0) {
          const best = data.signs.reduce((a: any, b: any) =>
            a.confidence > b.confidence ? a : b
          )
          setCurrentSign(best.label)
          setConfidence(best.confidence)

          // Stabilization: only speak after N consecutive detections of same word
          if (best.confidence >= 0.6) {
            if (consecutiveRef.current.word === best.label) {
              consecutiveRef.current.count++
            } else {
              consecutiveRef.current = { word: best.label, count: 1 }
            }

            if (consecutiveRef.current.count >= STABILIZE_COUNT) {
              // Only broadcast the sign, do NOT speak it locally for the sender
              onSignDetected?.(best.label)
              setDetectionHistory(prev => [...prev.slice(-9), best.label])
              consecutiveRef.current.count = 0  // Reset after speaking
            }
          }
        } else {
          setCurrentSign('')
          setConfidence(0)
          consecutiveRef.current = { word: '', count: 0 }
        }

        // Process gesture
        if (data.gesture) {
          setGesture(data.gesture.label)
          // Send gesture if high confidence
          if (data.gesture.confidence >= 0.7) {
            onSignDetected?.(data.gesture.label)
            setDetectionHistory(prev => [...prev.slice(-9), data.gesture.label])
          }
        } else {
          setGesture('')
        }
      } catch (e) {
        console.error('[SignToAudio] Parse error:', e)
      }
    }

    ws.onclose = () => {
      console.log('[SignToAudio] WebSocket disconnected')
      setWsConnected(false)
      // Auto-reconnect after 2s
      if (isEnabled) {
        setTimeout(connectWS, 2000)
      }
    }

    ws.onerror = (err) => {
      console.error('[SignToAudio] WebSocket error:', err)
    }

    wsRef.current = ws
  }, [isEnabled, showSpeakingIndicator, onSignDetected])

  // Start/stop camera + WebSocket
  useEffect(() => {
    if (!isEnabled) {
      // Cleanup
      if (captureTimerRef.current) clearInterval(captureTimerRef.current)
      if (wsRef.current) wsRef.current.close()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      setCurrentSign('')
      setConfidence(0)
      setGesture('')
      setWsConnected(false)
      return
    }

    // Start camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        console.error('[SignToAudio] Camera error:', err)
      }
    }

    startCamera()
    connectWS()

    // Capture frames and send to WebSocket
    captureTimerRef.current = setInterval(() => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) return

      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = 640
      canvas.height = 480

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Mirror the image (same as app.py cv.flip)
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      // Convert to base64 JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      const base64 = dataUrl.split(',')[1]

      wsRef.current.send(JSON.stringify({ image: base64 }))
    }, CAPTURE_INTERVAL_MS)

    return () => {
      if (captureTimerRef.current) clearInterval(captureTimerRef.current)
      if (wsRef.current) wsRef.current.close()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [isEnabled, connectWS])

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
      className="fixed z-[9998] select-none"
      style={{
        right: 20,
        top: position.y,
        left: 'auto',
        width: 300,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-2xl rounded-[20px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_60px_rgba(16,185,129,0.08)]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/8 to-transparent border-b border-white/5 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`} />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Sign → Audio
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-600">
            {wsConnected ? 'CONNECTED' : 'CONNECTING...'}
          </span>
        </div>

        {/* Camera Preview */}
        <div className="relative" style={{ height: 160 }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Detection overlay */}
          {currentSign && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
                <span className="text-emerald-400 text-lg font-bold">{currentSign}</span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              {gesture && (
                <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <span className="text-indigo-300 text-xs font-semibold">{gesture}</span>
                </div>
              )}
            </div>
          )}

          {/* Speaking indicator */}
          {spokenWord && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-xs font-bold px-4 py-1.5 rounded-full animate-pulse shadow-lg">
              🔊 Speaking: {spokenWord}
            </div>
          )}
        </div>

        {/* Recent detections */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/5">
          {detectionHistory.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detectionHistory.map((word, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-lg font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-zinc-600 italic">Show hand signs to the camera...</span>
          )}
        </div>
      </div>
    </div>
  )
}
