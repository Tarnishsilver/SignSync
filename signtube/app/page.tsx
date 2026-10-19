import { VideoInput } from "@/components/VideoInput";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { AvatarPanel } from "@/components/AvatarPanel";
import { CaptionDisplay } from "@/components/CaptionDisplay";
import { Controls } from "@/components/Controls";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white pb-20">
      {/* Header */}
      <header className="w-full py-6 text-center border-b border-gray-900/50 bg-gray-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-br from-blue-400 via-cyan-300 to-indigo-500 bg-clip-text text-transparent mb-1">
            SignTube
          </h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm tracking-wide">
            YouTube → Sign Language · Real-time 3D Avatar Translation
          </p>
        </div>
      </header>

      {/* URL Input */}
      <section className="container mx-auto px-4 mt-6 flex justify-center">
        <VideoInput />
      </section>

      {/* Main Grid: Video + Avatar */}
      <section className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: YouTube Player */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400">
              Video Player
            </h2>
          </div>
          <YouTubePlayer />
        </div>

        {/* Right: Avatar Engine */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-blue-400">
              Sign Language Avatar
            </h2>
          </div>
          <AvatarPanel />
        </div>
      </section>

      {/* Caption Display */}
      <section className="container mx-auto px-4 mt-4">
        <CaptionDisplay />
      </section>

      {/* Controls + Debug */}
      <section className="container mx-auto px-4 mt-2">
        <Controls />
      </section>
    </main>
  );
}
