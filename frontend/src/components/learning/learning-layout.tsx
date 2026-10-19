'use client'

import { useState } from 'react'
import { LearningNav } from './learning-nav'
import { AlphabetsModule } from './modules/alphabets-module'
import { NumbersModule } from './modules/numbers-module'
import { VocabularyModule } from './modules/vocabulary-module'
import { MathModule } from './modules/math-module'
import { PhrasesModule } from './modules/phrases-module'
import { PracticeModule } from './modules/practice-module'
import { useLocalStorage } from '@/lib/use-local-storage'

export type LearningSection =
  | 'alphabets'
  | 'numbers'
  | 'vocabulary'
  | 'math'
  | 'phrases'
  | 'practice'

export function LearningLayout() {
  const [activeSection, setActiveSection] = useLocalStorage<LearningSection>('signsync:learning:section', 'alphabets')
  const [navOpen, setNavOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#080810] flex" style={{ fontFamily: 'var(--font-manrope)' }}>
      {/* Side Navigation */}
      <LearningNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={navOpen}
        onToggle={() => setNavOpen(!navOpen)}
      />

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: navOpen ? '280px' : '72px' }}
      >
        <div className="min-h-screen">
          {activeSection === 'alphabets' && <AlphabetsModule />}
          {activeSection === 'numbers' && <NumbersModule />}
          {activeSection === 'vocabulary' && <VocabularyModule />}
          {activeSection === 'math' && <MathModule />}
          {activeSection === 'phrases' && <PhrasesModule />}
          {activeSection === 'practice' && <PracticeModule />}
        </div>
      </main>
    </div>
  )
}
