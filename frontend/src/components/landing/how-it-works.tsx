'use client'

import { motion } from 'framer-motion'
import { Camera, Scan, BrainCircuit, MessageSquareText } from 'lucide-react'

const steps = [
  { icon: <Camera className="w-8 h-8" />, title: "Camera Input", description: "Real-time HD video feed capture." },
  { icon: <Scan className="w-8 h-8" />, title: "Gesture Detection", description: "Skeletal tracking of hand joints." },
  { icon: <BrainCircuit className="w-8 h-8" />, title: "AI Recognition", description: "Contextual neural processing." },
  { icon: <MessageSquareText className="w-8 h-8" />, title: "Translation Output", description: "Instant text and speech synthesis." }
]

export function HowItWorks() {
  return (
    <section className="py-32 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">The Technology Behind</h2>
          <p className="text-xl text-zinc-400">Our neural pipeline processes sign language at the speed of human thought.</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative z-10 p-8 rounded-3xl bg-black border border-white/5 flex flex-col items-center text-center group hover:border-white/20 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all duration-500">
                  {step.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                <p className="text-zinc-400">{step.description}</p>
                
                {/* Step Marker */}
                <div className="mt-8 text-xs font-mono text-zinc-600">STEP 0{index + 1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
