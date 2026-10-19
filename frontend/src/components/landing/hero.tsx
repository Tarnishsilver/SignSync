'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SplineScene } from '@/components/ui/spline'

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Animation values for the first scroll phase (Initial content)
  const opacity1 = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const scale1 = useTransform(scrollYProgress, [0, 0.25], [1, 0.9])
  
  // Animation values for the scroll-driven gestures
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.5, 0.65], [0, 1, 0])
  const opacity3 = useTransform(scrollYProgress, [0.75, 0.9, 1], [0, 1, 1])

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-black">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Content */}
          <div className="relative z-20 space-y-12">
            <motion.div style={{ opacity: opacity1, scale: scale1 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 text-sm font-mono mb-6"
              >
                AI SIGN LANGUAGE TRANSLATION
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-[0.9] mb-8">
                SignSync
              </h1>
              <p className="text-xl md:text-2xl text-zinc-400 max-w-lg leading-relaxed">
                Experience the frontier of human communication. 
                Real-time translation for a world without barriers.
              </p>
              <div className="flex flex-wrap gap-6 pt-8">
                <button
                  onClick={() => router.push('/translator')}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95"
                >
                  Try Live Demo
                </button>
                <button
                  onClick={() => router.push('/learning')}
                  className="px-8 py-4 border border-zinc-700 text-white rounded-full font-bold hover:bg-zinc-900 transition-all"
                >
                  Start Learning
                </button>
              </div>
            </motion.div>

            {/* Gesture Labels (Overlays during scroll) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
              <motion.div 
                style={{ opacity: opacity2 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-sm"
              >
                <div className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Detection 041</div>
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">HELLO</h2>
                <p className="text-zinc-400">Gesture mapped to synthesized speech successfully.</p>
              </motion.div>

              <motion.div 
                style={{ opacity: opacity3 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-sm"
              >
                <div className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">Detection 042</div>
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">BYE</h2>
                <p className="text-zinc-400">Closing communication bridge. Translation archived.</p>
              </motion.div>
            </div>
          </div>

          {/* Right Side: Robot Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[600px] lg:h-[800px] w-full"
          >
            <div className="absolute inset-0 z-0">
               <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
            
            {/* Visual HUD Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/[0.03] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/[0.03] rounded-full pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </div>
  )
}
