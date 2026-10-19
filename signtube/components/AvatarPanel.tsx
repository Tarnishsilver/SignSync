"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useRef, useState, useCallback } from "react";

export function AvatarPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const processingRef = useRef(false);

  const avatarQueue = useStore((s) => s.avatarQueue);
  const setAvatarQueue = useStore((s) => s.setAvatarQueue);
  const setAvatarReady = useStore((s) => s.setAvatarReady);
  const currentSign = useStore((s) => s.currentSign);
  const setCurrentSign = useStore((s) => s.setCurrentSign);
  const addToSignHistory = useStore((s) => s.addToSignHistory);
  const setHighlightedWord = useStore((s) => s.setHighlightedWord);
  const signHistory = useStore((s) => s.signHistory);
  const addLog = useStore((s) => s.addLog);

  const onIframeLoad = useCallback(() => {
    // Give CWASA 2s to fully initialize inside the iframe
    setTimeout(() => {
      setIframeLoaded(true);
      setAvatarReady(true);
      addLog("Avatar engine ready");
    }, 2000);
  }, [setAvatarReady, addLog]);

  // Listen for postMessage from avatar iframe and actively ping it
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case "avatar-ready":
        case "pong":
          if (data.ready !== false) {
            setAvatarReady(true);
            setIframeLoaded(true);
          }
          break;
        case "avatar-playing":
          setCurrentSign(data.word || "");
          setHighlightedWord(data.word || "");
          break;
        case "avatar-word-done":
          addToSignHistory(data.word || "");
          break;
        case "avatar-idle":
          setCurrentSign("");
          setHighlightedWord("");
          break;
        case "avatar-skipped":
          addLog(`Skipped ${data.count} signs to keep up`);
          break;
      }
    };
    window.addEventListener("message", handler);

    // Actively ping the iframe in case we missed the load event
    const pingInterval = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: "ping" }, "*");
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", handler);
      clearInterval(pingInterval);
    };
  }, [setAvatarReady, setCurrentSign, addToSignHistory, setHighlightedWord, addLog]);

  // Send queued items to avatar iframe
  useEffect(() => {
    if (!iframeLoaded || avatarQueue.length === 0 || processingRef.current) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    processingRef.current = true;

    // Build items with correct durations
    const items = avatarQueue.map((pathStr) => {
      const word = pathStr.split("/").pop()?.replace(".sigml", "") || pathStr;
      // If single character = fingerspelling letter (faster), else full word sign
      const duration = word.length === 1 ? 400 : 700;
      return { path: pathStr, word, duration };
    });

    try {
      iframe.contentWindow.postMessage({ type: "play-batch", items }, "*");
      addLog(`Queued ${items.length} signs`);
    } catch (e) {
      addLog(`Send error: ${e}`);
    }

    setAvatarQueue([]);
    processingRef.current = false;
  }, [iframeLoaded, avatarQueue, setAvatarQueue, addLog]);

  // Test sign helper
  const testSign = useCallback((word: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: "play-sigml", path: `sigml/${word}.sigml`, word, duration: 700 },
      "*"
    );
    addLog(`Test: ${word}`);
  }, [addLog]);

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col bg-gray-950 border-2 border-blue-900/40 rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.06)] relative overflow-hidden">
      {/* Status */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${iframeLoaded ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-yellow-500 animate-pulse"}`} />
        <span className="text-xs font-mono text-gray-500">{iframeLoaded ? "LIVE" : "LOADING"}</span>
      </div>

      {/* Avatar iframe */}
      <div className="flex-1 relative min-h-[320px]">
        <iframe
          ref={iframeRef}
          src="/avatar/index.html"
          onLoad={onIframeLoad}
          className="w-full h-full min-h-[320px] border-0"
          allow="autoplay"
          title="Sign Language Avatar"
          style={{ display: "block" }}
        />
      </div>

      {/* Current sign + tests */}
      <div className="p-3 border-t border-gray-800/50 bg-black/60">
        <div className="flex items-center justify-between">
          <div>
            {currentSign ? (
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-mono animate-pulse">▶</span>
                <span className="text-white text-lg font-bold tracking-wider uppercase">{currentSign}</span>
              </div>
            ) : (
              <span className="text-gray-600 text-xs font-mono">Waiting for captions...</span>
            )}
          </div>
          <div className="flex gap-1">
            {["hello", "yes", "no"].map((w) => (
              <button key={w} onClick={() => testSign(w)}
                className="px-2 py-1 text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded hover:bg-blue-900/50 font-mono">
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sign history */}
      {signHistory.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {signHistory.slice(-12).map((s, i) => (
            <span key={i} className="px-2 py-0.5 bg-green-900/20 text-green-600/80 text-[10px] rounded font-mono">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
