'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const modules = [
  { title: "Alphabets", gestures: "A-Z", image: "https://images.unsplash.com/photo-1534940856027-414cc7d43f05?auto=format&fit=crop&q=80&w=2000" },
  { title: "Numbers", gestures: "0-99", image: "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80&w=2000" },
  { title: "Basic Words", gestures: "500+ Words", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=2000" },
  { title: "Practice Gestures", gestures: "Live Feedback", image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&q=80&w=2000" },
  { title: "Quiz Mode", gestures: "Certifications", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=2000" }
]

export function Learning() {
  return (
    <section className="py-32 bg-zinc-950" id="learning">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Learn ISL Today</h2>
            <p className="text-xl text-zinc-400">Master Indian Sign Language with interactive AI guidance. Track your progress and join a community of learners.</p>
          </div>
          <Link href="/learning" className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all text-center">
            Join Learning Hub
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group cursor-pointer relative aspect-[4/5] rounded-[32px] overflow-hidden"
            >
              <Image
                src={module.image}
                alt={module.title}
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-10 flex flex-col justify-end">
                <h4 className="text-2xl font-bold text-white mb-2">{module.title}</h4>
                <p className="text-zinc-400 font-mono text-xs tracking-widest uppercase">{module.gestures}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
