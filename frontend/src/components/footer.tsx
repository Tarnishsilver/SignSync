import Link from 'next/link'
import { Hand } from 'lucide-react'

export function Footer() {
  return (
    <footer className="py-20 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Hand className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white tracking-tight">SignSync</span>
            </Link>
            <p className="text-zinc-500 max-w-xs">
              Bridging the communication gap with enterprise-grade AI sign language translation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
            <div className="space-y-4">
              <h5 className="text-white font-bold">Product</h5>
              <ul className="space-y-2 text-zinc-500">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/translator" className="hover:text-white transition-colors">Translator</Link></li>
                <li><Link href="/learning" className="hover:text-white transition-colors">Learning</Link></li>
                <li><Link href="/meeting" className="hover:text-white transition-colors">Meetings</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-white font-bold">Company</h5>
              <ul className="space-y-2 text-zinc-500">
                <li><Link href="/#impact" className="hover:text-white transition-colors">Impact</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/#extension" className="hover:text-white transition-colors">Extension</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-white font-bold">Resources</h5>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <a
                    href="https://github.com/Hackverse-AIML/signsync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li><Link href="/#tech-stack" className="hover:text-white transition-colors">Tech Stack</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-xs font-mono text-zinc-600 uppercase tracking-widest">
          <div>© {new Date().getFullYear()} SignSync AI. All Rights Reserved.</div>
          <div className="flex gap-8">
            <span className="cursor-default">Privacy Policy</span>
            <span className="cursor-default">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
