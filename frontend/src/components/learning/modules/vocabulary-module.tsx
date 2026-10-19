'use client'

import { useState } from 'react'
import { Search, Volume2, Play } from 'lucide-react'
import { AvatarViewer } from '../avatar-viewer'

// Known words from sigml indices
const categories = {
  Actions: ['play', 'walk', 'jump', 'laugh', 'cry', 'sleep', 'read', 'write', 'draw', 'dance'],
  Emotions: ['happy', 'angry', 'sad', 'scared', 'tired', 'nervous', 'calm', 'lonely', 'stressful'],
  Nature: ['tree', 'water', 'fire', 'sky', 'sun', 'moon', 'star', 'mountain', 'river', 'forest'],
  Family: ['mother', 'father', 'brother', 'sister', 'son', 'daughter', 'uncle', 'aunt', 'family'],
  Food: ['food', 'water', 'tea', 'coffee', 'apple', 'tomato', 'chicken', 'meal', 'sugar', 'salt']
}

export function VocabularyModule() {
  const [activeCategory, setActiveCategory] = useState('Actions')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWord, setSelectedWord] = useState('play')
  const [playTrigger, setPlayTrigger] = useState(0)

  const wordsToDisplay = categories[activeCategory as keyof typeof categories]
    .filter(word => word.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Vocabulary Builder</h1>
        <p className="text-gray-400">Expand your sign language vocabulary by category</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Left Side: Categories and Words List */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar flex-shrink-0">
            {Object.keys(categories).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all text-sm
                  ${activeCategory === cat 
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden shadow-xl flex flex-col">
              <div className="p-6 border-b border-white/5">
                 <h3 className="text-xl font-bold text-white">{activeCategory}</h3>
                 <p className="text-gray-400 text-sm mt-1">{wordsToDisplay.length} words found</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                {wordsToDisplay.length > 0 ? wordsToDisplay.map((word) => {
                  const isActive = word === selectedWord
                  return (
                    <button
                      key={word}
                      onClick={() => {
                        setSelectedWord(word)
                        setPlayTrigger(p => p + 1)
                      }}
                      className={`
                        flex items-center justify-between p-4 rounded-2xl transition-all
                        ${isActive 
                           ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-inner' 
                           : 'bg-black/40 hover:bg-white/5 text-gray-300 border border-transparent hover:border-white/5'
                        }
                      `}
                    >
                      <span className="font-semibold capitalize text-lg tracking-wide">{word}</span>
                      {isActive && <Play className="w-5 h-5 text-amber-400" />}
                    </button>
                  )
                }) : (
                  <div className="text-center p-8 text-gray-500">
                    No words matched your search.
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Right Side: Avatar Focus */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#201010] to-[#0f111a] border border-white/5 shadow-2xl p-2">
            <div className="absolute inset-0 z-0">
               <AvatarViewer 
                currentWord={selectedWord} 
                speed="normal" 
              />
            </div>

            <div className="absolute bottom-8 inset-x-8 z-10">
               <div className="bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex items-center justify-between">
                  <div>
                    <span className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-1 block">Current Word</span>
                    <h2 className="text-4xl font-black text-white capitalize">{selectedWord}</h2>
                  </div>
                  
                  <button 
                    onClick={() => setPlayTrigger(p => p + 1)}
                    className="w-16 h-16 bg-white hover:bg-gray-200 text-black rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
