'use client'

import { motion } from 'framer-motion'
import { 
  Menu, X, Home, Type, Hash, 
  BookOpen, Calculator, MessageSquare, 
  Dumbbell, GraduationCap 
} from 'lucide-react'
import Link from 'next/link'
import { LearningSection } from './learning-layout'

interface NavProps {
  activeSection: LearningSection
  onSectionChange: (section: LearningSection) => void
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { id: 'alphabets', label: 'Alphabets (A-Z)', icon: Type },
  { id: 'numbers', label: 'Numbers (0-90)', icon: Hash },
  { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { id: 'phrases', label: 'Common Phrases', icon: MessageSquare },
  { id: 'math', label: 'Mathematics', icon: Calculator },
  { id: 'practice', label: 'Practice Mode', icon: Dumbbell },
] as const

export function LearningNav({ activeSection, onSectionChange, isOpen, onToggle }: NavProps) {
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 280 : 72 }}
      className="fixed left-0 top-0 h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-white/5">
        {isOpen && (
          <Link href="/" className="flex items-center gap-2 text-white">
            <GraduationCap className="h-6 w-6 text-indigo-400" />
            <span className="font-bold tracking-tight">Learning Hub</span>
          </Link>
        )}
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors ml-auto flex-shrink-0"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto">
        <Link 
          href="/"
          className={`
            flex items-center gap-3 px-3 py-3 rounded-xl transition-all
            text-gray-400 hover:text-white hover:bg-white/5
          `}
          title="Back to Home"
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span className="font-medium">Back to Home</span>}
        </Link>
        
        <div className="h-px bg-white/5 my-2 mx-2" />

        <div className="px-3 mb-2">
          {isOpen && <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modules</p>}
        </div>

        {navItems.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={!isOpen ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left w-full
                ${isActive 
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
              {isOpen && (
                <span className={`font-medium ${isActive ? 'text-indigo-200' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-white/5">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/30 blur-2xl rounded-full" />
            <h4 className="text-white font-bold text-sm mb-1 relative z-10">Pro Progress</h4>
            <div className="w-full bg-black/50 rounded-full h-1.5 mb-2 mt-3">
              <div className="bg-indigo-500 h-1.5 rounded-full w-[15%]" />
            </div>
            <p className="text-indigo-200 text-xs font-medium relative z-10">15% Completed</p>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
