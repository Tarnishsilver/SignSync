'use client'

import Link from 'next/link'
import { Hand, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  const hashLink = (hash: string) => isHome ? hash : `/${hash}`

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Hand className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white tracking-tight">SignSync</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href={hashLink('#features')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</Link>
              <Link href={hashLink('#live-demo')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Live Demo</Link>
              <Link href="/meeting" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Meetings</Link>
              <Link href={hashLink('#extension')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                Extension <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase">New</span>
              </Link>
              <Link href="/learning" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Learning</Link>
              <Link href="/translator" className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105">
                Get Started
              </Link>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-center">
            <Link href={hashLink('#features')} onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-4 text-base font-medium">Features</Link>
            <Link href={hashLink('#live-demo')} onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-4 text-base font-medium">Live Demo</Link>
            <Link href="/meeting" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-4 text-base font-medium">Meetings</Link>
            <Link href={hashLink('#extension')} onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-4 text-base font-medium">Extension</Link>
            <Link href="/learning" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white block px-3 py-4 text-base font-medium">Learning</Link>
            <Link href="/translator" onClick={() => setIsOpen(false)} className="bg-white text-black block px-3 py-3 rounded-md text-base font-bold mx-4 mb-4">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
