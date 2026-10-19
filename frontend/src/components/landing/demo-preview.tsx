'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const demoDialogs = [
  { 
    gesture: "/gestures/thank-you.gif", 
    label: "THANK YOU", 
    output: "Thank you for the wonderful presentation." 
  },
  { 
    gesture: "/gestures/please.gif", 
    label: "PLEASE", 
    output: "Could you please help me with these instructions?" 
  },
  { 
    gesture: "/gestures/sorry.gif", 
    label: "SORRY", 
    output: "I am really sorry for being late to the meeting." 
  },
  { 
    gesture: "/gestures/I_love_you.gif", 
    label: "I LOVE YOU", 
    output: "I appreciate your support and kindness so much." 
  }
]

export function DemoPreview() {
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % demoDialogs.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-32 bg-black overflow-hidden" id="live-demo">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800 border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl">
          
          {/* Left: Camera Feed / Gesture Input */}
          <div className="bg-zinc-950 aspect-square md:aspect-video lg:aspect-auto p-8 md:p-12 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute top-8 left-8 flex items-center gap-2 z-20">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Live Input</span>
            </div>
            
            <div className="w-full h-full border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center relative overflow-hidden bg-black/40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full h-full"
                >
                  <Image 
                    src={demoDialogs[currentIdx].gesture}
                    alt={demoDialogs[currentIdx].label}
                    fill
                    className="object-cover opacity-80"
                  />
                  {/* Floating OCR/Gesture Tag */}
                  <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
                    <span className="text-xs font-mono text-white tracking-widest">DETECTED: {demoDialogs[currentIdx].label}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Translation Output */}
          <div className="bg-black aspect-video lg:aspect-auto p-8 md:p-16 flex flex-col justify-center">
             <div className="space-y-12">
                <div className="text-xs font-mono text-zinc-600 tracking-widest uppercase flex items-center gap-3">
                   <div className="w-8 h-px bg-zinc-800" />
                   AI Translation Output
                </div>
                <div className="min-h-[180px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="text-4xl md:text-6xl font-medium text-white leading-tight tracking-tight"
                    >
                      {demoDialogs[currentIdx].output}
                    </motion.p>
                  </AnimatePresence>
                </div>
                
                <div className="relative w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden">
                   <motion.div 
                    key={currentIdx}
                    initial={{ scaleX: 0 }} 
                    animate={{ scaleX: 1 }} 
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute inset-0 bg-white origin-left" 
                   />
                </div>
             </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm">
               <span className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">Neural Engine v4.2</span>
               <div className="w-px h-4 bg-zinc-800" />
               <span className="text-emerald-500 font-mono text-xs uppercase tracking-[0.2em]">Latency: 1.2ms</span>
            </div>
        </div>
      </div>
    </section>
  )
}
