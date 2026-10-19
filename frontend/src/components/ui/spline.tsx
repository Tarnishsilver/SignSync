'use client'

import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
