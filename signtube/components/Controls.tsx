"use client";

import { useStore } from "@/store/useStore";

export function Controls() {
  const captions = useStore((s) => s.captions);
  const avatarQueue = useStore((s) => s.avatarQueue);
  const avatarReady = useStore((s) => s.avatarReady);
  const isPaused = useStore((s) => s.isPaused);
  const setIsPaused = useStore((s) => s.setIsPaused);
  const fingerspellingEnabled = useStore((s) => s.fingerspellingEnabled);
  const setFingerspellingEnabled = useStore((s) => s.setFingerspellingEnabled);
  const setAvatarQueue = useStore((s) => s.setAvatarQueue);
  const setCurrentCaption = useStore((s) => s.setCurrentCaption);
  const setCurrentSign = useStore((s) => s.setCurrentSign);
  const resetProcessedCaptions = useStore((s) => s.resetProcessedCaptions);
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);
  const addLog = useStore((s) => s.addLog);

  const handlePauseResume = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    addLog(newState ? "Avatar paused" : "Avatar resumed");

    // Send pause/resume to avatar iframe
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: newState ? "pause" : "resume" },
        "*"
      );
    }
  };

  const handleClearQueue = () => {
    setAvatarQueue([]);
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "clear" }, "*");
    }
    addLog("Queue cleared");
  };

  const handleFullReset = () => {
    setAvatarQueue([]);
    setCurrentCaption("");
    setCurrentSign("");
    resetProcessedCaptions();
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "clear" }, "*");
    }
    addLog("Full reset");
  };

  return (
    <div className="w-full bg-gray-950 border border-gray-800/40 rounded-xl p-5 mt-4 space-y-5">
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
          Controls & Debug
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePauseResume}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isPaused
                ? "bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-900/50"
                : "bg-yellow-900/30 text-yellow-400 border border-yellow-800 hover:bg-yellow-900/50"
            }`}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"} Avatar
          </button>
          <button
            onClick={handleClearQueue}
            className="px-4 py-1.5 text-xs bg-orange-900/20 text-orange-400 border border-orange-800/50 rounded-lg hover:bg-orange-900/40 transition-all font-mono"
          >
            Clear Queue
          </button>
          <button
            onClick={handleFullReset}
            className="px-4 py-1.5 text-xs bg-red-900/20 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/40 transition-all font-mono"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Captions" value={captions.length} color="blue" />
        <StatCard label="Queue" value={avatarQueue.length} color="cyan" />
        <StatCard
          label="Avatar"
          value={avatarReady ? "Ready" : "Loading"}
          color={avatarReady ? "green" : "yellow"}
        />
        <div className="bg-black/40 p-3 rounded-lg border border-gray-800/50">
          <span className="text-gray-600 text-[10px] font-mono uppercase tracking-wider">
            Fingerspell
          </span>
          <div className="mt-1">
            <button
              onClick={() => setFingerspellingEnabled(!fingerspellingEnabled)}
              className={`text-xs font-bold px-3 py-1 rounded transition-all ${
                fingerspellingEnabled
                  ? "bg-blue-600/20 text-blue-400 border border-blue-800"
                  : "bg-gray-800 text-gray-500 border border-gray-700"
              }`}
            >
              {fingerspellingEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
            Activity Log
          </span>
          <button
            onClick={clearLogs}
            className="text-[10px] text-gray-600 hover:text-gray-400 font-mono"
          >
            Clear
          </button>
        </div>
        <div className="bg-black/50 rounded-lg border border-gray-800/50 p-3 max-h-[150px] overflow-y-auto font-mono text-[11px] text-gray-500 space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-gray-700 italic">No activity yet...</p>
          ) : (
            logs
              .slice()
              .reverse()
              .map((log, i) => (
                <p key={i} className="leading-tight">
                  {log}
                </p>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-black/40 p-3 rounded-lg border border-gray-800/50">
      <span className="text-gray-600 text-[10px] font-mono uppercase tracking-wider">
        {label}
      </span>
      <p className={`${colorMap[color] || "text-white"} text-lg font-bold mt-1`}>
        {value}
      </p>
    </div>
  );
}
