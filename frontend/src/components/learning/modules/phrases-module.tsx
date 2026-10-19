'use client'

import { useState } from 'react'
import { Repeat, CheckCircle2 } from 'lucide-react'
import { AvatarViewer } from '../avatar-viewer'
import { useLocalStorage } from '@/lib/use-local-storage'

const commonPhrases = [
  { text: "Hello, nice to meet you", words: ["hello", "nice", "meet", "you"] },
  { text: "How are you today?", words: ["how", "are", "you", "today"] },
  { text: "Thank you very much", words: ["thank_you", "very", "much"] },
  { text: "I don't understand", words: ["i", "dont", "understand"] },
  { text: "What is your name?", words: ["what", "is", "your", "name"] },
  { text: "Can you help me?", words: ["can", "you", "help", "me"] },
  { text: "Where are you going?", words: ["where", "are", "you", "go"] },
  { text: "See you tomorrow", words: ["see", "you", "tomorrow"] },
]

export function PhrasesModule() {
  const [selectedPhrase, setSelectedPhrase] = useState(0)
  const [playTrigger, setPlayTrigger] = useState(0)
  const [progress, setProgress] = useLocalStorage<number[]>('signsync:phrases:progress', [])

  const current = commonPhrases[selectedPhrase]

  const markLearned = () => {
    if (!progress.includes(selectedPhrase)) {
      setProgress([...progress, selectedPhrase])
    }
    if (selectedPhrase < commonPhrases.length - 1) {
      setSelectedPhrase(selectedPhrase + 1)
      setPlayTrigger(p => p + 1)
    }
  }

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Common Phrases</h1>
        <p className="text-gray-400">Learn to string words together into meaningful sentences</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Main Viewer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 text-center border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <span className="text-9xl font-serif">"</span>
             </div>
             <p className="text-3xl font-medium text-white tracking-wide py-4">
                {current.text}
             </p>
             <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {current.words.map((w, i) => (
                  <span key={i} className="text-xs font-mono bg-white/10 text-rose-300 px-3 py-1 rounded-full uppercase tracking-wider">
                    {w}
                  </span>
                ))}
             </div>
          </div>

          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gradient-to-t from-[#2c1328] to-[#0f111a] border border-white/5 shadow-2xl">
              <AvatarViewer 
                wordList={current.words}
                currentWord=""
                speed="normal"
              />
              
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                 <button 
                  onClick={() => setPlayTrigger(p => p + 1)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                 >
                    <Repeat className="w-5 h-5" />
                 </button>
              </div>

              <div className="absolute bottom-6 inset-x-6">
                 <button 
                  onClick={markLearned}
                  className={`w-full py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-lg
                    ${progress.includes(selectedPhrase)
                      ? 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                    }`}
                 >
                    {progress.includes(selectedPhrase) ? (
                      <><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Mastered</>
                    ) : (
                      'Mark as Learned'
                    )}
                 </button>
              </div>
          </div>
        </div>

        {/* Phrase List */}
        <div className="lg:col-span-4 flex flex-col bg-white/5 backdrop-blur-md border border-white/5 rounded-[32px] p-6 overflow-hidden shadow-xl">
           <div className="mb-6 flex space-x-2">
             <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex-1 text-center">
                 <div className="text-rose-400 font-bold text-2xl">{progress.length}</div>
                 <div className="text-xs uppercase tracking-wider text-rose-300/70 font-bold">Learned</div>
             </div>
             <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex-1 text-center">
                 <div className="text-white font-bold text-2xl">{commonPhrases.length}</div>
                 <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total</div>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
              {commonPhrases.map((phrase, idx) => {
                const isActive = idx === selectedPhrase
                const isLearned = progress.includes(idx)

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPhrase(idx)
                      setPlayTrigger(p => p + 1)
                    }}
                    className={`
                      text-left p-5 rounded-2xl transition-all border relative overflow-hidden group
                      ${isActive 
                        ? 'bg-gradient-to-r from-rose-500/20 to-transparent border-rose-500/30 shadow-lg' 
                        : 'bg-black/30 hover:bg-white/5 border-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    {isLearned && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-emerald-500/50'}`} />
                      </div>
                    )}
                    <span className={`block font-medium text-lg leading-snug pr-6 transition-colors ${isActive ? 'text-rose-200 fade-in' : 'text-gray-300 group-hover:text-white'}`}>
                      {phrase.text}
                    </span>
                  </button>
                )
              })}
           </div>
        </div>

      </div>
    </div>
  )
}
