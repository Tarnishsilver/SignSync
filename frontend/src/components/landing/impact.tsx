'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const stats = [
  { label: "Deaf & Hard of Hearing", value: "466M+", description: "People worldwide rely on sign language for daily interaction." },
  { label: "Communication Gap", value: "90%", description: "Of families with deaf children do not know sign language." },
  { label: "Employment Rate", value: "2x", description: "Higher unemployment rates among the deaf community due to barriers." }
]

export function Impact() {
  return (
    <section className="py-32 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">More Than Just AI</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            We are building a world where communication knows no barriers. 
            SignSync transforms gestures into a global bridge for connection.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative p-10 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <h3 className="text-5xl font-bold text-white mb-4">{stat.value}</h3>
              <p className="text-lg font-semibold text-white mb-2">{stat.label}</p>
              <p className="text-zinc-400">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24 relative h-[500px] rounded-[40px] overflow-hidden group"
        >
          <Image 
            src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=2070"
            alt="Human connection"
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-12">
            <p className="text-3xl md:text-5xl font-medium text-white max-w-4xl tracking-tight leading-tight">
              Giving every gesture a <span className="text-zinc-500 italic">voice</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
