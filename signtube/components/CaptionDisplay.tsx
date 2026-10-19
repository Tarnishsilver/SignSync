"use client";

import { useStore } from "@/store/useStore";

export function CaptionDisplay() {
  const currentCaption = useStore((s) => s.currentCaption);
  const highlightedWord = useStore((s) => s.highlightedWord);
  const captionsAvailable = useStore((s) => s.captionsAvailable);

  if (!captionsAvailable) {
    return (
      <div className="w-full bg-yellow-950/30 border border-yellow-800/40 rounded-xl p-6 mt-4">
        <p className="text-yellow-500 text-center font-mono text-sm">
          ⚠️ Captions unavailable — using speech recognition.
        </p>
        <p className="text-yellow-700 text-center text-xs mt-1">
          (Whisper integration placeholder — not yet implemented)
        </p>
      </div>
    );
  }

  // Split caption into words to highlight the current one
  const words = currentCaption ? currentCaption.split(/\s+/) : [];

  return (
    <div className="w-full bg-gray-950 border border-blue-900/30 rounded-xl p-6 mt-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        <h3 className="text-blue-400/80 text-xs font-semibold tracking-[0.2em] uppercase">
          Live Caption
        </h3>
      </div>
      <div className="flex items-center justify-center min-h-[80px] w-full bg-black/50 rounded-lg p-4">
        {words.length > 0 ? (
          <p className="text-2xl font-bold tracking-wide text-center leading-relaxed">
            {words.map((word, i) => {
              const isHighlighted =
                highlightedWord &&
                word.toLowerCase().includes(highlightedWord.toLowerCase());
              return (
                <span
                  key={i}
                  className={`${
                    isHighlighted
                      ? "text-blue-400 bg-blue-500/10 px-1 rounded"
                      : "text-white/90"
                  } transition-colors duration-200`}
                >
                  {word}{" "}
                </span>
              );
            })}
          </p>
        ) : (
          <p className="text-gray-700 italic font-mono text-sm">
            Captions will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
