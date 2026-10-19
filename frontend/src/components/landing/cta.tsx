'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CTA() {
  const router = useRouter()

  return (
    <section className="py-40 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tight">
            Start communicating <br /> <span className="text-zinc-500">without barriers.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <Button size="lg" className="px-12 py-6 text-xl" onClick={() => router.push('/translator')}>
              Try Demo
            </Button>
            <Button variant="outline" size="lg" className="px-12 py-6 text-xl" onClick={() => router.push('/learning')}>
              Explore Learning
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
