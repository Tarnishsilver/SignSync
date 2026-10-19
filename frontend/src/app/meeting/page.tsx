'use client'

import { useState, Suspense } from 'react'
import { JoinScreen } from '@/components/meeting/join-screen'
import { MeetingRoom } from '@/components/meeting/meeting-room'
import { useSearchParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

function MeetingPageContent() {
  const searchParams = useSearchParams()
  const initialRoom = searchParams.get('room') || ''
  
  const [inMeeting, setInMeeting] = useState(false)
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState(initialRoom)
  const router = useRouter()

  const handleJoin = (name: string, room: string) => {
    setUserName(name)
    setRoomName(room)
    setInMeeting(true)
    
    // Update URL without reloading to allow direct links
    const newPath = `/meeting?room=${room}`
    window.history.pushState({ path: newPath }, '', newPath)
  }

  const handleLeave = () => {
    setInMeeting(false)
    router.push('/') // Go back home or stay at meeting landing
  }

  return (
    <main className="min-h-screen bg-black overflow-hidden font-manrope">
      <AnimatePresence mode="wait">
        {!inMeeting ? (
          <motion.div
            key="join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <JoinScreen onJoin={handleJoin} />
          </motion.div>
        ) : (
          <motion.div
            key="meeting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <MeetingRoom 
              roomName={roomName} 
              userName={userName} 
              onLeave={handleLeave} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function MeetingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>}>
      <MeetingPageContent />
    </Suspense>
  )
}

