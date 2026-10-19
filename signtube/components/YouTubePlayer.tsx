"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useRef } from "react";

export function YouTubePlayer() {
  const videoId = useStore((s) => s.videoId);
  const captions = useStore((s) => s.captions);
  const setCurrentCaption = useStore((s) => s.setCurrentCaption);
  const setCurrentCaptionIndex = useStore((s) => s.setCurrentCaptionIndex);
  const markCaptionProcessed = useStore((s) => s.markCaptionProcessed);
  const addToAvatarQueue = useStore((s) => s.addToAvatarQueue);
  const addLog = useStore((s) => s.addLog);
  const isPaused = useStore((s) => s.isPaused);
  const fingerspellingEnabled = useStore((s) => s.fingerspellingEnabled);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    const loadAPI = () => {
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    };

    const createPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }

      playerRef.current = new (window as any).YT.Player("yt-player-frame", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 0,
        },
        events: {
          onReady: () => addLog(`Video ready: ${videoId}`),
        },
      });
    };

    loadAPI();

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, addLog]);

  // Caption sync loop — runs every 500ms
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!videoId || captions.length === 0) return;

    intervalRef.current = setInterval(async () => {
      if (isPaused) return;

      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      try {
        const currentTime = player.getCurrentTime();
        const { processedCaptionIds } = useStore.getState();

        // Find the CURRENT active caption
        let activeIndex = -1;
        for (let i = 0; i < captions.length; i++) {
          const c = captions[i];
          if (currentTime >= c.start && currentTime < c.start + c.duration) {
            activeIndex = i;
            break;
          }
        }

        if (activeIndex === -1) return;

        const { currentCaptionIndex, removeProcessedCaptionsAfter, setAvatarQueue } = useStore.getState();

        // Handle seeking backwards or restarting the video
        if (currentCaptionIndex !== -1 && activeIndex < currentCaptionIndex - 2) {
           removeProcessedCaptionsAfter(activeIndex - 1);
           setAvatarQueue([]); // Clear avatar queue so it doesn't keep playing old stuff
           addLog(`Video sought backwards: jumping to caption ${activeIndex}`);
        }

        // Must re-check processedCaptionIds after potentially mutating it above
        if (useStore.getState().processedCaptionIds.has(activeIndex)) return;

        // Mark ALL captions up to current as processed (skip missed ones)
        for (let j = 0; j <= activeIndex; j++) {
          if (!useStore.getState().processedCaptionIds.has(j)) {
            markCaptionProcessed(j);
          }
        }

        const c = captions[activeIndex];
        setCurrentCaption(c.text);
        setCurrentCaptionIndex(activeIndex);

        // NLP + SiGML pipeline
        try {
          const nlpRes = await fetch("/api/process-text", {
            method: "POST",
            body: JSON.stringify({ sentence: c.text }),
            headers: { "Content-Type": "application/json" },
          });
          const { tokens } = await nlpRes.json();

          for (const word of tokens) {
            const sigmlRes = await fetch(`/api/sigml?word=${word}`);
            const result = await sigmlRes.json();

            if (result.found) {
              result.paths.forEach((p: string) => addToAvatarQueue(p));
            } else if (fingerspellingEnabled && result.paths.length > 0) {
              // Fingerspelling fallback
              result.paths.forEach((p: string) => addToAvatarQueue(p));
            }
            // If no paths at all, word is effectively skipped (logged server-side)
          }
        } catch (err) {
          addLog(`Pipeline error: ${err}`);
        }
      } catch (e) {
        // Player not ready
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    videoId, captions, isPaused, fingerspellingEnabled,
    setCurrentCaption, setCurrentCaptionIndex,
    markCaptionProcessed, addToAvatarQueue, addLog,
  ]);

  if (!videoId) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-950 border border-gray-800/40 rounded-xl">
        <div className="text-center space-y-3">
          <div className="text-4xl">🎬</div>
          <p className="text-gray-600 font-mono text-sm">Paste a YouTube URL above to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border-2 border-gray-800/40 hover:border-red-900/30 transition-colors bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div id="yt-player-frame" className="w-full h-full min-h-[400px]" />
    </div>
  );
}
