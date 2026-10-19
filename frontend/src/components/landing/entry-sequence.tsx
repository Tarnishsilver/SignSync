'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function EntrySequence() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [loaded, setLoaded] = useState(false)

  const frameCount = 80
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Map scroll (0 to 1) to frame index (0 to 79)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1])

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = []
    let loadedCount = 0

    for (let i = 0; i < frameCount; i++) {
      const img = new Image()
      const frameStr = i.toString().padStart(3, '0')
      img.src = `/sequence/robot_video_${frameStr.toString()}.jpg`
      img.onload = () => {
        loadedCount++
        if (loadedCount === frameCount) {
          setLoaded(true)
        }
      }
      loadedImages.push(img)
    }
    setImages(loadedImages)
  }, [])

  // Draw current frame to canvas
  useEffect(() => {
    const unsub = frameIndex.on('change', (latest) => {
      const ctx = canvasRef.current?.getContext('2d')
      const index = Math.floor(latest)
      if (ctx && images[index]) {
        const img = images[index]
        const canvas = canvasRef.current!

        // Clear and draw (keeping aspect ratio)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const hRatio = canvas.width / img.width
        const vRatio = canvas.height / img.height
        const ratio = Math.max(hRatio, vRatio)
        const centerShift_x = (canvas.width - img.width * ratio) / 2
        const centerShift_y = (canvas.height - img.height * ratio) / 2

        ctx.drawImage(
          img,
          0, 0, img.width, img.height,
          centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
        )
      }
    })

    return () => unsub()
  }, [images, frameIndex])

  // Initial draw
  useEffect(() => {
    if (loaded && images[0]) {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        // Trigger first draw
        const canvas = canvasRef.current!
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const img = images[0]
        const hRatio = canvas.width / img.width
        const vRatio = canvas.height / img.height
        const ratio = Math.max(hRatio, vRatio)
        const centerShift_x = (canvas.width - img.width * ratio) / 2
        const centerShift_y = (canvas.height - img.height * ratio) / 2
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio)
      }
    }
  }, [loaded, images])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-black">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
            <span className="loader"></span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />

        {/* Entrance Messaging */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase animate-bounce">
            Scroll to initialize
          </p>
        </motion.div>

        {/* Closing Phase Overlay */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0.85, 1], [0, 1]) }}
          className="absolute inset-0 bg-black pointer-events-none"
        />
      </div>
    </div>
  )
}
