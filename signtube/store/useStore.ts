import { create } from 'zustand';

export interface Caption {
  start: number;
  duration: number;
  text: string;
}

interface AppState {
  // Video
  videoId: string;
  setVideoId: (id: string) => void;

  // Captions
  captions: Caption[];
  setCaptions: (captions: Caption[]) => void;
  currentCaption: string;
  setCurrentCaption: (caption: string) => void;
  currentCaptionIndex: number;
  setCurrentCaptionIndex: (index: number) => void;
  processedCaptionIds: Set<number>;
  markCaptionProcessed: (index: number) => void;
  resetProcessedCaptions: () => void;
  removeProcessedCaptionsAfter: (index: number) => void;

  // Avatar
  avatarQueue: string[];
  setAvatarQueue: (queue: string[]) => void;
  addToAvatarQueue: (item: string) => void;
  avatarReady: boolean;
  setAvatarReady: (ready: boolean) => void;
  currentSign: string;
  setCurrentSign: (sign: string) => void;
  signHistory: string[];
  addToSignHistory: (sign: string) => void;

  // Controls
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  fingerspellingEnabled: boolean;
  setFingerspellingEnabled: (enabled: boolean) => void;
  captionsAvailable: boolean;
  setCaptionsAvailable: (available: boolean) => void;

  // Highlighted word
  highlightedWord: string;
  setHighlightedWord: (word: string) => void;

  // Logs
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Video
  videoId: '',
  setVideoId: (id) => set({ videoId: id }),

  // Captions
  captions: [],
  setCaptions: (captions) => set({ captions }),
  currentCaption: '',
  setCurrentCaption: (caption) => set({ currentCaption: caption }),
  currentCaptionIndex: -1,
  setCurrentCaptionIndex: (index) => set({ currentCaptionIndex: index }),
  processedCaptionIds: new Set<number>(),
  markCaptionProcessed: (index) =>
    set((state) => {
      const newSet = new Set(state.processedCaptionIds);
      newSet.add(index);
      return { processedCaptionIds: newSet };
    }),
  resetProcessedCaptions: () => set({ processedCaptionIds: new Set() }),
  removeProcessedCaptionsAfter: (index) =>
    set((state) => {
      const newSet = new Set(state.processedCaptionIds);
      // Remove all IDs greater than the index (when user seeks backwards)
      for (const id of Array.from(newSet)) {
        if (id > index) newSet.delete(id);
      }
      return { processedCaptionIds: newSet };
    }),

  // Avatar
  avatarQueue: [],
  setAvatarQueue: (queue) => set({ avatarQueue: queue }),
  addToAvatarQueue: (item) =>
    set((state) => ({ avatarQueue: [...state.avatarQueue, item] })),
  avatarReady: false,
  setAvatarReady: (ready) => set({ avatarReady: ready }),
  currentSign: '',
  setCurrentSign: (sign) => set({ currentSign: sign }),
  signHistory: [],
  addToSignHistory: (sign) =>
    set((state) => ({
      signHistory: [...state.signHistory.slice(-15), sign],
    })),

  // Controls
  isPaused: false,
  setIsPaused: (paused) => set({ isPaused: paused }),
  fingerspellingEnabled: true,
  setFingerspellingEnabled: (enabled) =>
    set({ fingerspellingEnabled: enabled }),
  captionsAvailable: true,
  setCaptionsAvailable: (available) => set({ captionsAvailable: available }),

  // Highlighted word
  highlightedWord: '',
  setHighlightedWord: (word) => set({ highlightedWord: word }),

  // Logs
  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-50),
        `[${new Date().toLocaleTimeString()}] ${log}`,
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));
