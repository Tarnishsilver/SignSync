'use client'

import { useState } from 'react'
import { Plus, Equal, Eraser, Play, RefreshCcw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarViewer } from '../avatar-viewer'

// Known operational signs and math terms in sigml (fallback to fingerspelling if not exact)
const knownMathTerms = ['plus', 'minus', 'multiply', 'divide', 'equal', 'math', 'calculate', 'number']
// These are not in sigml-index but the engine supports fingerspelling when a word lacks a sigml file explicitly.
// But some of these might have custom signs. Let's rely on batch sequence playback for equations.

export function MathModule() {
  const [equation, setEquation] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTrigger, setPlayTrigger] = useState(0)

  const handleAddToken = (token: string) => {
    setEquation([...equation, token])
  }

  const handleClear = () => {
    setEquation([])
  }

  const handleBackspace = () => {
    setEquation(prev => prev.slice(0, -1))
  }

  const handlePlay = () => {
    if (equation.length > 0) {
      setPlayTrigger(p => p + 1)
      setIsPlaying(true)
      setTimeout(() => setIsPlaying(false), equation.length * 1500) // Rough duration
    }
  }

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Sign Math</h1>
        <p className="text-gray-400">Learn to express equations and calculations in sign language</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Workspace */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/5 flex flex-col min-h-[160px]">
            <h3 className="text-white font-bold mb-4 opacity-70">Equation Builder</h3>
            <div className="flex-1 bg-black/50 rounded-2xl p-4 flex items-center border border-white/5 overflow-x-auto custom-scrollbar">
              {equation.length === 0 ? (
                <span className="text-gray-500 font-mono text-xl">Build an equation...</span>
              ) : (
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {equation.map((token, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        key={`${i}-${token}`} 
                        className="h-14 min-w-[3.5rem] px-4 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold font-mono"
                      >
                        {token}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-3">
              <button 
                onClick={handlePlay}
                disabled={equation.length === 0 || isPlaying}
                className="flex-1 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isPlaying ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Signing Equation...' : 'Sign Equation'}
              </button>
              <button 
                onClick={handleBackspace} 
                disabled={equation.length === 0}
                className="w-16 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button 
                onClick={handleClear} 
                disabled={equation.length === 0}
                className="w-16 bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gradient-to-b from-[#1a1b26] to-[#0f111a] border border-white/5 shadow-2xl">
              <AvatarViewer 
                wordList={equation.length > 0 && playTrigger > 0 ? equation.map(e => {
                    // Map symbols to words for the avatar system
                    if (e === '+') return 'plus'
                    if (e === '-') return 'minus'
                    if (e === '×') return 'multiply'
                    if (e === '÷') return 'divide'
                    if (e === '=') return 'equal'
                    return e // numbers etc
                }) : undefined}
                currentWord=""
                autoPlay={true}
              />
          </div>
        </div>

        {/* Numpad & Operators */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/5 flex-1 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Numpad</h3>
            <div className="grid grid-cols-4 gap-3 h-full">
              {/* Row 1 */}
              <button onClick={() => handleAddToken('7')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">7</button>
              <button onClick={() => handleAddToken('8')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">8</button>
              <button onClick={() => handleAddToken('9')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">9</button>
              <button onClick={() => handleAddToken('÷')} className="bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 text-3xl font-bold rounded-2xl border border-fuchsia-500/30">÷</button>
              
              {/* Row 2 */}
              <button onClick={() => handleAddToken('4')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">4</button>
              <button onClick={() => handleAddToken('5')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">5</button>
              <button onClick={() => handleAddToken('6')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">6</button>
              <button onClick={() => handleAddToken('×')} className="bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 text-3xl font-bold rounded-2xl border border-fuchsia-500/30">×</button>
              
              {/* Row 3 */}
              <button onClick={() => handleAddToken('1')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">1</button>
              <button onClick={() => handleAddToken('2')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">2</button>
              <button onClick={() => handleAddToken('3')} className="bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">3</button>
              <button onClick={() => handleAddToken('-')} className="bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 text-3xl font-bold rounded-2xl border border-fuchsia-500/30">-</button>
              
              {/* Row 4 */}
              <button onClick={() => handleAddToken('0')} className="col-span-2 bg-black/40 hover:bg-white/10 text-white text-2xl font-bold rounded-2xl border border-white/5">0</button>
              <button onClick={() => handleAddToken('=')} className="bg-indigo-500 hover:bg-indigo-400 text-white text-3xl font-bold rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">=</button>
              <button onClick={() => handleAddToken('+')} className="bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 text-3xl font-bold rounded-2xl border border-fuchsia-500/30">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
