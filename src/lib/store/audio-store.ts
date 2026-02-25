import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AudioCategory = "lofi" | "nature" | "noise" | "youtube";

export interface Track {
  id: string;
  name: string;
  category: AudioCategory;
  icon: string;
  description: string;
  type: "file" | "generated" | "youtube";
  src?: string;
  generator?: string;
  youtubeId?: string;
}

export const TRACKS: Track[] = [
  {
    id: "lofi-chill",
    name: "Lo-fi Chill",
    category: "lofi",
    icon: "🎵",
    description: "Gentle lofi beats for deep focus",
    type: "file",
    src: "/audio/lofi-chill.mp3",
  },
  {
    id: "rain",
    name: "Rain",
    category: "nature",
    icon: "🌧️",
    description: "Steady rainfall on windows",
    type: "file",
    src: "/audio/rain.mp3",
  },
  {
    id: "forest",
    name: "Forest Morning",
    category: "nature",
    icon: "🌿",
    description: "Birds and rustling leaves",
    type: "file",
    src: "/audio/forest.mp3",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    category: "nature",
    icon: "🌊",
    description: "Gentle rolling waves",
    type: "file",
    src: "/audio/ocean.mp3",
  },
  {
    id: "cafe",
    name: "Café Ambience",
    category: "nature",
    icon: "☕",
    description: "Soft coffee shop atmosphere",
    type: "file",
    src: "/audio/cafe.mp3",
  },
  {
    id: "brown-noise",
    name: "Brown Noise",
    category: "noise",
    icon: "🔉",
    description: "Deep, warm noise for focus",
    type: "generated",
    generator: "brownNoise",
  },
  {
    id: "white-noise",
    name: "White Noise",
    category: "noise",
    icon: "📻",
    description: "Classic focus background noise",
    type: "generated",
    generator: "whiteNoise",
  },
  {
    id: "binaural-40",
    name: "Binaural 40Hz",
    category: "noise",
    icon: "🧠",
    description: "Gamma waves for deep focus",
    type: "generated",
    generator: "binaural40",
  },
  {
    id: "work-music-mm",
    name: "Work Music",
    category: "youtube",
    icon: "▶️",
    description: "Light instrumental work music (mm channel)",
    type: "youtube",
    youtubeId: "jfKfPfyJRdk",
  },
  {
    id: "lofi-girl",
    name: "Lofi Girl",
    category: "youtube",
    icon: "📺",
    description: "lofi hip hop radio — beats to study/relax",
    type: "youtube",
    youtubeId: "jfKfPfyJRdk",
  },
];

interface AudioStore {
  trackId: string | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isPanelOpen: boolean;

  selectTrack: (trackId: string) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      trackId: "lofi-chill",
      isPlaying: false,
      volume: 0.6,
      isMuted: false,
      isPanelOpen: false,

      selectTrack: (trackId) => {
        set({ trackId, isPlaying: true });
      },

      setPlaying: (playing) => set({ isPlaying: playing }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      toggleMute: () => set({ isMuted: !get().isMuted }),

      togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
    }),
    {
      name: "focusflow-audio",
      partialize: (state) => ({
        trackId: state.trackId,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    }
  )
);
