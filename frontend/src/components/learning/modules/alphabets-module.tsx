'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarViewer } from '../avatar-viewer'
import { Play, Pause, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react'

const alphabets = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))

export function AlphabetsModule() {
  const [selectedLetter, setSelectedLetter] = useState('a')
  const [playTrigger, setPlayTrigger] = useState(0)

  const currentIndex = alphabets.indexOf(selectedLetter)

  const handleNext = () => {
    if (currentIndex < alphabets.length - 1) {
      setSelectedLetter(alphabets[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedLetter(alphabets[currentIndex - 1])
    }
  }

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Learn Alphabets</h1>
        <p className="text-gray-400">Master the foundation of Indian Sign Language from A to Z</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Left Side: Avatar Viewer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gradient-to-b from-[#1a1b26] to-[#0f111a] border border-white/5 shadow-2xl">
            <AvatarViewer 
              currentWord={selectedLetter} 
              speed="normal" 
            />
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-3 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => setPlayTrigger(p => p + 1)}
                className="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                <Play className="w-6 h-6 ml-1" />
              </button>
              
              <button 
                onClick={handleNext}
                disabled={currentIndex === alphabets.length - 1}
                className="p-3 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="absolute top-8 left-8">
               <div className="w-24 h-24 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center">
                  <span className="text-6xl font-black text-white uppercase">{selectedLetter}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Grid Selection */}
        <div className="lg:col-span-4 flex flex-col bg-white/5 backdrop-blur-md border border-white/5 rounded-[32px] p-6 overflow-hidden shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Select Letter</h3>
            <span className="text-sm text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full">
              {currentIndex + 1} / 26
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-4 gap-3">
              {alphabets.map((letter) => {
                const isActive = letter === selectedLetter
                return (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className={`
                      aspect-square rounded-2xl flex items-center justify-center text-2xl font-black uppercase transition-all
                      ${isActive 
                        ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform scale-105' 
                        : 'bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }
                    `}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
