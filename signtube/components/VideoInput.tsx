"use client";

import { useStore } from "@/store/useStore";
import { useState } from "react";
import { extractVideoId } from "@/lib/youtube";

export function VideoInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setVideoId = useStore((s) => s.setVideoId);
  const setCaptions = useStore((s) => s.setCaptions);
  const setCaptionsAvailable = useStore((s) => s.setCaptionsAvailable);
  const resetProcessedCaptions = useStore((s) => s.resetProcessedCaptions);
  const setAvatarQueue = useStore((s) => s.setAvatarQueue);
  const setCurrentCaption = useStore((s) => s.setCurrentCaption);
  const addLog = useStore((s) => s.addLog);

  const handleLoad = async () => {
    setError("");
    const id = extractVideoId(url);
    if (!id) {
      setError("Invalid YouTube URL. Please use a valid link.");
      return;
    }

    setLoading(true);
    addLog(`Loading video: ${id}`);

    try {
      // Reset state
      resetProcessedCaptions();
      setAvatarQueue([]);
      setCurrentCaption("");
      setVideoId(id);

      // Fetch captions
      const res = await fetch(`/api/captions?videoId=${id}`);
      if (!res.ok) throw new Error("Caption fetch failed");

      const captions = await res.json();

      if (captions.length === 0) {
        setCaptionsAvailable(false);
        addLog("No captions found for this video");
      } else {
        setCaptionsAvailable(true);
        setCaptions(captions);
        addLog(`Loaded ${captions.length} captions`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLoad();
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3 p-5 bg-gray-950/80 border border-gray-800/40 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔗</span>
          <input
            type="text"
            placeholder="Paste YouTube Video URL here…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="YouTube URL input"
            className="w-full bg-black text-white pl-9 pr-4 py-3.5 rounded-lg border border-gray-700/50 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] font-mono text-sm placeholder-gray-600 transition-all"
          />
        </div>
        <button
          onClick={handleLoad}
          disabled={loading || !url}
          aria-label="Load video"
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:shadow-none text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Loading...
            </span>
          ) : (
            "Load Video"
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-xs font-mono bg-red-900/10 p-2 rounded border border-red-900/30">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
