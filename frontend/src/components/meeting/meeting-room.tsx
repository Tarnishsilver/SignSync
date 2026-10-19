'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlBar } from './control-bar'
import { SignToAudio } from './sign-to-audio'
import { AudioTranslator } from './audio-translator'
import { X, Copy, Check } from 'lucide-react'

interface MeetingRoomProps {
  roomName: string
  userName: string
  onLeave: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JitsiAPI = {
  addEventListeners: (listeners: Record<string, (payload: any) => void>) => void
  executeCommand: (command: string, ...args: unknown[]) => void
  getNumberOfParticipants: () => number
  dispose: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => JitsiAPI
  }
}

export function MeetingRoom({ roomName, userName, onLeave }: MeetingRoomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const [jitsiApi, setJitsiApi] = useState<JitsiAPI | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)
  const [copied, setCopied] = useState(false)

  // Feature toggles
  const [isSignToAudioEnabled, setIsSignToAudioEnabled] = useState(false)
  const [isAudioToSignEnabled, setIsAudioToSignEnabled] = useState(false)

  // Transcript state (shared between features)
  const [currentTranscript, setCurrentTranscript] = useState<{ text: string, speaker: string, isFinal: boolean } | null>(null)
  
  // Robust routing & permissions
  const [hasJoined, setHasJoined] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const localSessionIdRef = useRef(Math.random().toString(36).substring(7))

  const initJitsi = useCallback(() => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return

    const domain = 'meet.jit.si'
    const options = {
      roomName: `SignSync-${roomName}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: userName
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [], 
        SETTINGS_SECTIONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        MOBILE_APP_PROMO: false,
      }
    }

    const api = new window.JitsiMeetExternalAPI(domain, options)
    
    api.addEventListeners({
      videoConferenceJoined: () => {
        setHasJoined(true)
        setParticipantCount(api.getNumberOfParticipants())
      },
      participantJoined: () => {
        setParticipantCount(api.getNumberOfParticipants())
      },
      participantLeft: () => {
        setParticipantCount(api.getNumberOfParticipants())
      },
      audioMuteStatusChanged: (payload: { muted: boolean }) => {
        setIsMuted(payload.muted)
      },
      videoMuteStatusChanged: (payload: { muted: boolean }) => {
        setIsCameraOff(payload.muted)
      },
      incomingMessage: (payload: { from: string, nick: string, message: string }) => {
        // If message has our exact session ID, it's a loopback to ourselves — ignore it completely
        if (payload.message && payload.message.includes(`[ID:${localSessionIdRef.current}]`)) return

        // Handle [CC] messages (closed captions from remote users)
        if (payload.message && payload.message.startsWith('[CC]')) {
          const text = payload.message.replace(/\[CC\](\[ID:[^\]]+\])?/, '').trim()
          const speaker = payload.nick || 'Remote User'
          console.log('[MeetingRoom] Received CC from', speaker, ':', text)
          setCurrentTranscript({ text, speaker, isFinal: true })
        }
        
        // Handle [SIGN] messages (sign-detected words from remote users)
        if (payload.message && payload.message.startsWith('[SIGN]')) {
          const word = payload.message.replace(/\[SIGN\](\[ID:[^\]]+\])?/, '').trim()
          const speaker = payload.nick || 'Remote User'
          console.log('[MeetingRoom] Received SIGN from', speaker, ':', word)
          
          // Speak the detected sign via TTS for the hearing user
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(word)
            utterance.rate = 0.9
            utterance.pitch = 1.0
            window.speechSynthesis.speak(utterance)
          }
          
          // Also show as transcript for the avatar
          setCurrentTranscript({ text: word, speaker: `${speaker} (Sign)`, isFinal: true })
        }
      },
      readyToClose: () => {
        onLeave()
      }
    })

    setJitsiApi(api)
  }, [roomName, userName, onLeave])

  useEffect(() => {
    // Load Jitsi Script
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => initJitsi()
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
      if (jitsiApi) jitsiApi.dispose()
    }
  }, [initJitsi])




  const toggleMic = () => {
    if (jitsiApi) jitsiApi.executeCommand('toggleAudio')
  }

  const toggleCamera = () => {
    if (jitsiApi) jitsiApi.executeCommand('toggleVideo')
  }

  const toggleScreenShare = () => {
    if (jitsiApi) jitsiApi.executeCommand('toggleShareScreen')
  }

  const toggleChat = () => {
    if (jitsiApi) jitsiApi.executeCommand('toggleChat')
    setIsChatOpen(!isChatOpen)
  }

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen)
  }

  const toggleSignToAudio = () => {
    setIsSignToAudioEnabled(!isSignToAudioEnabled)
  }

  const toggleAudioToSign = () => {
    setIsAudioToSignEnabled(!isAudioToSignEnabled)
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/meeting?room=${roomName}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Callback when sign-to-audio detects a word — send via Jitsi
  const handleSignDetected = useCallback((word: string) => {
    if (jitsiApi) {
      console.log('[MeetingRoom] Broadcasting sign detection via Jitsi Chat:', word)
      jitsiApi.executeCommand('sendChatMessage', `[SIGN][ID:${localSessionIdRef.current}] ${word}`)
    }
  }, [jitsiApi])

  const handleUnlockAudio = async () => {
    // 1. Unlock TTS Audio Playback
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('')
      u.volume = 0
      window.speechSynthesis.speak(u)
    }

    // 2. Explicitly request Microphone permissions for the parent frame
    // This is REQUIRED because Jitsi runs in an iframe, and Web Speech API
    // runs in the parent Next.js frame. Without this, SpeechRecognition silently fails.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // We just need the permission, we don't need to keep the raw stream open
      // Jitsi and SpeechRecognition will manage their own streams.
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      console.warn('[MeetingRoom] Mic permission denied for parent frame:', err)
    }

    setAudioUnlocked(true)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col pt-16 overflow-hidden">
      {/* Audio Unlock Overlay (Required by browsers to play TTS & get parent Mic) */}
      {!audioUnlocked && (
        <div 
          className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
          onClick={handleUnlockAudio}
        >
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl animate-pulse">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-white text-xl font-bold">Click to Enter Meeting</h2>
            <p className="text-zinc-400 text-sm">Action required to unlock audio and microphone translations.</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full h-16 bg-zinc-900/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Meeting Room</span>
          </div>
          <h3 className="text-white font-bold tracking-tight text-lg">{roomName}</h3>
        </div>

        <div className="flex items-center gap-6">
          {isSignToAudioEnabled && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Sign → Audio</span>
            </div>
          )}
          {isAudioToSignEnabled && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">Audio → Sign</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-zinc-400">
             <div className="w-2 h-2 bg-emerald-500 rounded-full" />
             <span className="text-sm font-medium">{participantCount} Participating</span>
          </div>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-white text-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full bg-[#1e1e1e]">
         <div ref={jitsiContainerRef} className="w-full h-full" id="jitsi-container" />
      </div>

      {/* Sign-to-Audio Panel (camera detection → TTS) */}
      <SignToAudio 
        isEnabled={isSignToAudioEnabled} 
        onSignDetected={handleSignDetected} 
      />

      {/* Audio-to-Sign Translator Panel (speech → avatar) */}
      <AudioTranslator
        isEnabled={isAudioToSignEnabled}
        isMuted={isMuted}
        jitsiApi={jitsiApi}
        userName={userName}
        incomingTranscript={currentTranscript}
      />

      <ControlBar 
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        isSignToAudioEnabled={isSignToAudioEnabled}
        isAudioToSignEnabled={isAudioToSignEnabled}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={toggleChat}
        onToggleParticipants={toggleParticipants}
        onToggleSignToAudio={toggleSignToAudio}
        onToggleAudioToSign={toggleAudioToSign}
        onLeave={onLeave}
        onCopyLink={handleCopyLink}
      />

      <AnimatePresence>
        {isParticipantsOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-16 right-0 bottom-24 w-80 bg-zinc-900 border-l border-white/5 shadow-2xl z-30 p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-white font-bold">Participants</h4>
              <button onClick={() => setIsParticipantsOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {userName[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{userName} (You)</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Host</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
