'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, RefreshCw, Trophy, CheckCircle2 } from 'lucide-react'
import { AvatarViewer } from '../avatar-viewer'
import { useLocalStorage } from '@/lib/use-local-storage'

// Mock questions for the quiz mode
const QUIZ_QUESTIONS = [
  { word: "a", type: "alphabet", options: ["A", "B", "C", "D"], answer: "A" },
  { word: "tree", type: "vocabulary", options: ["Tree", "Water", "Sky", "Fire"], answer: "Tree" },
  { word: "happy", type: "vocabulary", options: ["Sad", "Happy", "Angry", "Tired"], answer: "Happy" },
  { word: "9", type: "number", options: ["6", "7", "8", "9"], answer: "9" },
  { word: "mother", type: "vocabulary", options: ["Father", "Mother", "Brother", "Sister"], answer: "Mother" }
]

export function PracticeModule() {
  const [activeTab, setActiveTab] = useState<'camera' | 'quiz'>('quiz')
  
  // Camera State
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [detectedSign, setDetectedSign] = useState<string>('WAITING...')
  const [confidence, setConfidence] = useState<number>(0)
  const [apiError, setApiError] = useState(false)

  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useLocalStorage<number>('signsync:practice:highscore', 0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [playTrigger, setPlayTrigger] = useState(0)

  useEffect(() => {
    if (!cameraActive) return

    const intervalId = setInterval(async () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.paused || video.ended) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

      try {
        const mlApi = process.env.NEXT_PUBLIC_ML_API_URL || "http://127.0.0.1:8000"
        const res = await fetch(`${mlApi}/predict_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl })
        })
        const data = await res.json()
        if (data.status === 'success' && data.predicted_char && data.predicted_char !== 'None') {
          setDetectedSign(data.predicted_char)
          setConfidence(data.confidence * 100)
        }
        setApiError(false)
      } catch (err) {
        setApiError(true)
        console.error('Prediction error:', err)
      }
    }, 1000)

    intervalRef.current = intervalId

    return () => clearInterval(intervalId)
  }, [cameraActive])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Setup Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } })
      setStream(mediaStream)
      setCameraActive(true)
      setCameraPermission('granted')
    } catch (err) {
      setCameraPermission('denied')
      console.error("Camera access denied:", err)
    }
  }

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
    setDetectedSign('WAITING...')
    setConfidence(0)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  // Handle Quiz
  const handleAnswerSelect = (opt: string) => {
    if (selectedAnswer !== null) return // Prevent multiple selects
    setSelectedAnswer(opt)
    
    const correct = opt === QUIZ_QUESTIONS[currentQuestion].answer
    if (correct) setScore(s => s + 1)
    
    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(c => c + 1)
        setSelectedAnswer(null)
      } else {
        const finalScore = correct ? score + 1 : score
        if (finalScore > highScore) setHighScore(finalScore)
        setQuizFinished(true)
      }
    }, 1500)
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setQuizFinished(false)
  }

  return (
    <div className="h-screen w-full p-8 flex flex-col overflow-hidden">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Practice & Test</h1>
          <p className="text-gray-400">Put your sign language knowledge to the test</p>
        </div>
        
        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button 
            onClick={() => { setActiveTab('quiz'); stopCamera() }}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'quiz' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Sign Quiz
          </button>
          <button 
            onClick={() => setActiveTab('camera')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'camera' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Live Practice
          </button>
        </div>
      </header>

      <div className="flex-1 w-full max-w-5xl mx-auto min-h-0 relative">
        <AnimatePresence mode="wait">
          
          {/* TAB: QUIZ */}
          {activeTab === 'quiz' && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col"
            >
              {!quizFinished ? (
                <div className="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-[32px] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center">
                  
                  {/* Avatar playing the sign in background or a box */}
                  <div className="w-full h-1 bg-white/10 absolute top-0 left-0">
                     <div 
                      className="h-full bg-cyan-500 transition-all duration-500" 
                      style={{ width: `${((currentQuestion) / QUIZ_QUESTIONS.length) * 100}%` }}
                     />
                  </div>

                  <div className="flex justify-between items-center mb-8">
                     <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
                     <span className="bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full font-bold text-sm border border-cyan-500/20">Category: {QUIZ_QUESTIONS[currentQuestion].type}</span>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row gap-12">
                     <div className="flex-1 relative rounded-3xl overflow-hidden bg-black/50 border border-white/10">
                        <AvatarViewer 
                          currentWord={QUIZ_QUESTIONS[currentQuestion].word}
                          autoPlay={activeTab === 'quiz'}
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-medium border border-white/10 z-20">
                          What is this sign?
                        </div>
                        <button 
                          onClick={() => setPlayTrigger(p => p + 1)}
                          className="absolute bottom-4 right-4 p-2 bg-indigo-500 rounded-lg text-white z-20 hover:bg-indigo-400 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="flex-1 flex flex-col justify-center gap-4">
                        {QUIZ_QUESTIONS[currentQuestion].options.map((opt, i) => {
                          const isSelected = selectedAnswer === opt
                          const isCorrect = opt === QUIZ_QUESTIONS[currentQuestion].answer
                          
                          let btnClass = "bg-white/5 hover:bg-white/10 text-white border-white/10"
                          if (selectedAnswer !== null) {
                            if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            else if (isSelected) btnClass = "bg-red-500/20 border-red-500/50 text-red-400"
                            else btnClass = "bg-black/40 border-transparent text-gray-600 opacity-50"
                          }

                          return (
                            <button
                              key={i}
                              disabled={selectedAnswer !== null}
                              onClick={() => handleAnswerSelect(opt)}
                              className={`p-6 rounded-2xl border-2 text-xl font-bold transition-all text-left flex justify-between items-center ${btnClass}`}
                            >
                              {opt}
                              {selectedAnswer !== null && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                            </button>
                          )
                        })}
                     </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-cyan-900/20 to-transparent border border-white/5 rounded-[32px] p-10 text-center">
                  <div className="w-32 h-32 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                    <Trophy className="w-16 h-16 text-cyan-400" />
                  </div>
                  <h2 className="text-5xl font-black text-white mb-4">Quiz Completed!</h2>
                  <p className="text-2xl text-gray-300 mb-8">You scored <span className="font-bold text-cyan-400">{score}</span> out of {QUIZ_QUESTIONS.length}</p>
                  
                  <button 
                    onClick={restartQuiz}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl"
                  >
                    <RefreshCw className="w-5 h-5" /> Play Again
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: CAMERA */}
          {activeTab === 'camera' && (
            <motion.div 
              key="camera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col bg-white/5 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md"
            >
              {!cameraActive ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                   <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                     <Camera className="w-10 h-10 text-gray-400" />
                   </div>
                   <h2 className="text-3xl font-bold text-white mb-4">Live Camera Feedback</h2>
                   <p className="text-lg text-gray-400 max-w-lg mb-8">
                     Enable your camera to practice your signs in front of our AI model. We'll provide real-time feedback on your accuracy.
                   </p>
                   {cameraPermission === 'denied' && (
                     <p className="text-rose-400 mb-4 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20 text-sm">
                       Camera access was denied. Please allow camera permissions in your browser.
                     </p>
                   )}
                   <button 
                    onClick={startCamera}
                    className="bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105"
                   >
                     Enable Camera
                   </button>
                </div>
              ) : (
                 <div className="flex-1 relative bg-black">
                   <video 
                     ref={videoRef}
                     autoPlay 
                     playsInline 
                     muted
                     className="w-full h-full object-cover transform scale-x-[-1]"
                   />
                   <canvas ref={canvasRef} className="hidden" />

                   
                   {/* UI Overlays */}
                   <div className="absolute top-6 inset-x-6 flex justify-between items-start pointer-events-none">
                     <div className="flex flex-col gap-2">
                       <div className="bg-black/60 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-white/10 font-medium w-max">
                         <span className="text-emerald-400 mr-2 flex items-center gap-2 inline-flex">
                           <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> Tracking Active
                         </span>
                       </div>
                       
                       {apiError && (
                         <div className="bg-red-500/10 backdrop-blur-md text-red-400 px-4 py-2 text-xs rounded-xl border border-red-500/20 font-medium w-max flex items-center gap-1">
                           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                           Connection to Python Server failed
                         </div>
                       )}
                     </div>
                     <button 
                      onClick={stopCamera}
                      className="bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 px-5 py-3 rounded-2xl font-bold transition-all pointer-events-auto"
                     >
                       Stop Practice
                     </button>
                   </div>
                   
                   <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full max-w-xl">
                      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                          <p className="text-gray-400 font-medium text-sm mb-2 uppercase tracking-wide">AI Recognizes:</p>
                         <h3 className="text-5xl font-black text-white mb-4">"{detectedSign}"</h3>
                         
                         <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_#10b981] transition-all duration-300" style={{ width: `${Math.max(confidence, 5)}%` }} />
                         </div>
                         <p className="text-emerald-400 font-bold mt-2 text-right text-xs">{confidence.toFixed(1)}% Accuracy</p>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
