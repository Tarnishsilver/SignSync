'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'

const LearningLayout = dynamic(
  () => import('@/components/learning/learning-layout').then((mod) => mod.LearningLayout),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    ),
  }
)

export default function LearningPage() {
  return (
    <ErrorBoundary>
      <LearningLayout />
    </ErrorBoundary>
  )
}
