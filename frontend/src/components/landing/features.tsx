'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const features = [
  {
    title: "Sign → Speech Translation",
    description: "Our proprietary Computer Vision models track 21 hand skeletal points in real-time, translating ISL and ASL gestures into clear, synthesized speech with zero latency.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070",
    color: "from-blue-500/20 to-transparent"
  },
  {
    title: "Speech → Sign Language",
    description: "Input voice or text and watch our custom-built 3D avatars perform the corresponding signs instantly. Perfect for non-signers to communicate back naturally.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=2070",
    color: "from-purple-500/20 to-transparent",
    reversed: true
  },
  {
    title: "Real-time Meeting Translation",
    description: "Integrate SignSync directly into your favorite video calling platforms. Live captions and sign avatars appear as an overlay, making digital meetings truly inclusive.",
    image: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=2070",
    color: "from-emerald-500/20 to-transparent"
  }
]

export function Features() {
  return (
    <section className="py-32 space-y-32" id="features">
      {features.map((feature, index) => (
        <div key={index} className="max-w-7xl mx-auto px-6">
          <div className={`flex flex-col ${feature.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24`}>
            {/* Visual Element */}
            <motion.div 
              initial={{ x: feature.reversed ? 100 : -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 relative aspect-square lg:aspect-video w-full rounded-[40px] overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} z-10`} />
              <Image 
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Optional UI Preview Overlay */}
              <div className="absolute top-8 right-8 z-20 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-zinc-300">AI TRANSLATION ACTIVE</span>
                </div>
              </div>
            </motion.div>

            {/* Text Overlay */}
            <div className="flex-1 space-y-6">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold text-white tracking-tight"
              >
                {feature.title}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl text-zinc-400 leading-relaxed"
              >
                {feature.description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <button className="text-white font-bold group flex items-center gap-2 hover:gap-4 transition-all">
                  Learn more <span className="text-xl">→</span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
