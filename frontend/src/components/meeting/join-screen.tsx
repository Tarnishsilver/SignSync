'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Keyboard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JoinScreenProps {
  onJoin: (name: string, room: string) => void
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState('')
  const [room, setRoom] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    const finalRoom = room.trim() || Math.random().toString(36).substring(2, 10)
    onJoin(name, finalRoom)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.2)_0%,rgba(0,0,0,1)_100%)]">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Illustration / Info */}
        <div className="hidden lg:block space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              SignSync <span className="text-zinc-500">Video Meetings</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              High-fidelity video conferencing with real-time ISL translation integration. Secure, fast, and accessible.
            </p>
          </motion.div>

          <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              HD Video
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Low Latency
            </span>
          </div>
        </div>

        {/* Right Side: Join Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-2xl space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
            <p className="text-zinc-400">Enter your details to get started</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Meeting ID (optional)"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                />
                <Keyboard className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-2xl bg-white text-black hover:bg-zinc-200 text-lg font-bold group"
            >
              Enter Meeting Room
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
              By joining, you agree to our <br />
              <span className="text-zinc-400 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-zinc-400 cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
