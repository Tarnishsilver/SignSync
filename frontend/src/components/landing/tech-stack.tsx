'use client'

import { motion } from 'framer-motion'
import { Cpu, Eye, HandMetal, Zap } from 'lucide-react'

const techs = [
  { icon: <Eye />, title: "Computer Vision", detail: "Mediapipe & OpenCV" },
  { icon: <HandMetal />, title: "Gesture Recognition", detail: "LSTM & Transformers" },
  { icon: <Cpu />, title: "Speech Processing", detail: "Whisper & TTS Models" },
  { icon: <Zap />, title: "AI Pipeline", detail: "Cloud-Native Infrastructure" }
]

export function TechStack() {
  return (
    <section className="py-24 border-y border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-12 lg:gap-24">
          {techs.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-all">
                {tech.icon}
              </div>
              <div>
                <div className="text-white font-bold">{tech.title}</div>
                <div className="text-zinc-500 text-sm font-mono">{tech.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
