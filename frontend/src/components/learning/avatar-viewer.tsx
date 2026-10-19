'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AvatarViewerProps {
  currentWord: string
  wordList?: string[] // For batch playing
  speed?: 'normal' | 'slow'
  autoPlay?: boolean
}

export function AvatarViewer({ currentWord, wordList, speed = 'normal', autoPlay = true }: AvatarViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [signingWord, setSigningWord] = useState<string | null>(null)

  // Initialization & Message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, word } = event.data || {}
      if (type === 'avatar-ready') {
        setIsReady(true)
      } else if (type === 'avatar-playing') {
        setSigningWord(word)
      } else if (type === 'avatar-idle') {
        setSigningWord(null)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Setup speeds
  useEffect(() => {
    if (!isReady || !iframeRef.current?.contentWindow) return
    
    const signDur = speed === 'slow' ? 1200 : 700
    const letterDur = speed === 'slow' ? 800 : 400
    
    iframeRef.current.contentWindow.postMessage({
      type: 'set-speed',
      signDuration: signDur,
      letterDuration: letterDur
    }, '*')
  }, [isReady, speed])

  const [availableSigml, setAvailableSigml] = useState<string[]>([])

  // Load sigml index
  useEffect(() => {
    fetch('/avatar/sigml-index.json')
      .then(res => res.json())
      .then(data => setAvailableSigml(data))
      .catch(err => console.error("Failed to load sigml index:", err))
  }, [])

  // Played word(s)
  useEffect(() => {
    if (!isReady || !iframeRef.current?.contentWindow || !autoPlay) return

    const sendPlay = (word: string) => {
      const path = `sigml/${word.toLowerCase()}.sigml`
      iframeRef.current?.contentWindow?.postMessage({ type: 'play-sigml', word, path }, '*')
    }

    const sendBatch = (words: string[]) => {
      const items = words.map(w => ({ 
        word: w, 
        path: `sigml/${w.toLowerCase()}.sigml` 
      }))
      iframeRef.current?.contentWindow?.postMessage({ type: 'play-batch', items }, '*')
    }

    iframeRef.current.contentWindow.postMessage({ type: 'clear' }, '*')

    if (wordList && wordList.length > 0) {
      sendBatch(wordList)
    } else if (currentWord) {
      const fileName = `${currentWord.toLowerCase()}.sigml`
      const exists = availableSigml.includes(fileName) || FALLBACK_SIGML.includes(fileName)
      
      if (!exists && currentWord.length > 1) {
        // Word not available - fingerspell it
        sendBatch(currentWord.split(''))
      } else {
        // Direct play (either exists or its a single letter/fallback)
        sendPlay(currentWord)
      }
    }
  }, [currentWord, wordList, isReady, autoPlay, availableSigml])

// Fallback list in case fetch fails
const FALLBACK_SIGML = [
  "0.sigml", "1.sigml", "2.sigml", "3.sigml", "4.sigml", "5.sigml", "6.sigml", "7.sigml", "8.sigml", "9.sigml",
  "a.sigml", "b.sigml", "c.sigml", "d.sigml", "e.sigml", "f.sigml", "g.sigml", "h.sigml", "i.sigml", "j.sigml",
  "k.sigml", "l.sigml", "m.sigml", "n.sigml", "o.sigml", "p.sigml", "q.sigml", "r.sigml", "s.sigml", "t.sigml",
  "u.sigml", "v.sigml", "w.sigml", "x.sigml", "y.sigml", "z.sigml"
]

  return (
    <div className="relative w-full h-full bg-black/40 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm flex items-center justify-center">
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] z-10">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-indigo-300 font-medium">Loading 3D Engine...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/avatar/index.html"
        className="w-full h-full border-none"
        allow="autoplay"
        title="3D Sign Language Avatar"
      />

      <AnimatePresence>
        {signingWord && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-20 pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-white font-bold tracking-wide text-sm whitespace-nowrap">
                {signingWord.length === 1 ? `Letter "${signingWord.toUpperCase()}"` : `Signing "${signingWord.toUpperCase()}"`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual Glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />
    </div>
  )
}
