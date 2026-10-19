'use client'

import { useState } from 'react'
import { AvatarViewer } from '../avatar-viewer'
import { Play, ChevronRight, ChevronLeft } from 'lucide-react'

// Available numbers based on sigml index 
const numbers = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
  '15', '16', '17', '18', '19', '20', '23', '30', '40', '50', '70', '72', '80', '90', '2023', '3000'
]

export function NumbersModule() {
  const [selectedNumber, setSelectedNumber] = useState('0')
  const [playTrigger, setPlayTrigger] = useState(0)

  const currentIndex = numbers.indexOf(selectedNumber)

  const handleNext = () => {
    if (currentIndex < numbers.length - 1) {
      setSelectedNumber(numbers[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedNumber(numbers[currentIndex - 1])
    }
  }

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Learn Numbers</h1>
        <p className="text-gray-400">Master numbers and counting in Indian Sign Language</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gradient-to-b from-[#1a1b26] to-[#0f111a] border border-white/5 shadow-2xl">
            <AvatarViewer 
              currentWord={selectedNumber} 
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
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Play className="w-6 h-6 ml-1" />
              </button>
              
              <button 
                onClick={handleNext}
                disabled={currentIndex === numbers.length - 1}
                className="p-3 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="absolute top-8 left-8">
               <div className="auto px-6 h-16 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">{selectedNumber}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col bg-white/5 backdrop-blur-md border border-white/5 rounded-[32px] p-6 overflow-hidden shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Number Grid</h3>
            <span className="text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
              {currentIndex + 1} / {numbers.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-3 gap-3">
              {numbers.map((num) => {
                const isActive = num === selectedNumber
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(num)}
                    className={`
                      aspect-[4/3] rounded-2xl flex items-center justify-center text-xl font-bold transition-all
                      ${isActive 
                        ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] transform scale-105' 
                        : 'bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }
                    `}
                  >
                    {num}
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
