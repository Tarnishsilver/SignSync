'use client'

import { motion } from 'framer-motion'
import { Chrome, Download, Puzzle, ArrowRight, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    step: '01',
    title: 'Download Extension',
    description: 'Click the button below to get the SignTube extension files.',
  },
  {
    step: '02',
    title: 'Open Chrome Extensions',
    description: 'Go to chrome://extensions/ and enable Developer Mode.',
  },
  {
    step: '03',
    title: 'Load & Enjoy',
    description: 'Click "Load unpacked", select the folder, and you\'re done!',
  },
]

const features = [
  'Real-time caption detection',
  '641+ pre-built sign animations',
  'Fingerspelling for unknown words',
  'Draggable & resizable avatar panel',
  'Works on any YouTube video',
  'No server required — 100% client-side',
]

export function ExtensionCTA() {
  return (
    <section className="py-32 relative overflow-hidden" id="extension">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-sm font-mono mb-6">
            <Chrome className="w-4 h-4" />
            BROWSER EXTENSION
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            SignTube for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">YouTube</span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Watch any YouTube video with a sign language avatar overlay. 
            The avatar appears right next to the video — no eye strain, no barriers.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Install Steps */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Install Steps */}
            <div className="space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 font-mono text-sm font-bold group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{step.title}</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Install Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <a
                href="/signtube-extension.zip"
                download
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
              >
                <Download className="w-5 h-5" />
                Download Extension
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="mt-3 text-xs text-zinc-600 font-mono">
                <Puzzle className="w-3 h-3 inline mr-1" />
                Chrome / Edge / Brave compatible • Manifest V3
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Feature List + Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Preview Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[28px] border border-white/10 p-8 space-y-6 hover:border-indigo-500/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg">
                  🤟
                </div>
                <div>
                  <h4 className="text-white font-bold">SignTube Extension</h4>
                  <p className="text-zinc-500 text-xs font-mono">v1.0.0 • 641 signs</p>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-300 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Meeting Integration Card */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm">🎥</span>
                </div>
                <h4 className="text-white font-semibold">Also works in Meetings!</h4>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Join a SignSync meeting from the <a href="/meeting" className="text-indigo-400 hover:underline">Meetings page</a> and 
                enable the <strong className="text-white">Sign Language</strong> toggle (🤚 button) in the control bar. 
                The avatar will translate live speech into signs in real-time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
