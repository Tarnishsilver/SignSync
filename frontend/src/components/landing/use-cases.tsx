'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

const useCases = [
  { title: "Healthcare", description: "Enabling direct patient-doctor communication without delay." },
  { title: "Education", description: "Making lectures accessible for deaf students in real-time." },
  { title: "Public Services", description: "Digital kiosks at airports and banks with ISL support." },
  { title: "Book Reader", description: "Converting written literature into visual sign narratives." }
]

export function UseCases() {
  return (
    <section className="py-32 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 flex flex-col justify-center pr-8">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Built for the Real World</h2>
            <p className="text-xl text-zinc-400">From high-speed meetings to critical medical consultations, SignSync fits everywhere.</p>
          </div>
          
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between group cursor-default"
            >
              <div>
                <Plus className="w-8 h-8 text-zinc-700 mb-8 group-hover:rotate-90 group-hover:text-white transition-all duration-500" />
                <h4 className="text-2xl font-bold text-white mb-4">{useCase.title}</h4>
                <p className="text-zinc-400">{useCase.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
