// Placeholder hook for future Whisper speech recognition integration
// Pipeline: YouTube audio → Whisper API → captions → avatar
//
// This hook is NOT implemented yet.
// When implemented, it will:
// 1. Extract audio from the YouTube video stream
// 2. Send audio chunks to OpenAI Whisper API
// 3. Receive transcribed text with timestamps
// 4. Feed the text into the NLP → SiGML → Avatar pipeline

import { useStore } from "@/store/useStore";
import { useCallback, useRef, useState } from "react";

export interface WhisperSegment {
  text: string;
  start: number;
  end: number;
}

export function useWhisperFallback() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addLog = useStore((s) => s.addLog);

  const startListening = useCallback(async () => {
    addLog("Whisper fallback: Not yet implemented");
    setError("Whisper speech recognition is not yet implemented. Please use videos with captions.");
    // Future implementation:
    // 1. Create AudioContext from video element
    // 2. Create MediaStreamSource
    // 3. Record chunks with MediaRecorder
    // 4. Send chunks to /api/whisper endpoint
    // 5. Parse WhisperSegment[] response
    // 6. Feed into caption pipeline
  }, [addLog]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    addLog("Whisper fallback: Stopped");
  }, [addLog]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
  };
}
