"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAudioStore, TRACKS, Track } from "@/lib/store/audio-store";
import { useTimerStore } from "@/lib/store/timer-store";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  lofi: "Lo-fi & Ambient",
  nature: "Nature Sounds",
  noise: "Focus Noise",
  youtube: "Live Streams",
};

const CATEGORY_ORDER = ["lofi", "nature", "noise", "youtube"];

export function AudioPlayer({ isOpen, onClose }: Props) {
  const { trackId, isPlaying, volume, isMuted, selectTrack, setPlaying, setVolume, toggleMute } =
    useAudioStore();
  const timerStatus = useTimerStore((s) => s.status);

  const howlRef = useRef<InstanceType<typeof window.Howl> | null>(null);
  const ytPlayerRef = useRef<unknown>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const generatedNodeRef = useRef<AudioNode | null>(null);

  const currentTrack = TRACKS.find((t) => t.id === trackId);

  const stopAll = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.fade(howlRef.current.volume(), 0, 600);
      setTimeout(() => {
        howlRef.current?.unload();
        howlRef.current = null;
      }, 700);
    }
    if (ytPlayerRef.current) {
      (ytPlayerRef.current as { pauseVideo: () => void }).pauseVideo();
    }
    if (generatedNodeRef.current) {
      try {
        (generatedNodeRef.current as AudioBufferSourceNode | OscillatorNode).stop();
      } catch { }
      generatedNodeRef.current = null;
    }
  }, []);

  const playYouTube = useCallback(
    (youtubeId: string) => {
      if (ytPlayerRef.current) {
        (ytPlayerRef.current as { loadVideoById: (id: string) => void }).loadVideoById(youtubeId);
        if (isPlaying) {
          (ytPlayerRef.current as { playVideo: () => void }).playVideo();
        }
        return;
      }

      const iframe = document.getElementById("yt-player-iframe");
      if (!iframe) {
        const container = document.getElementById("yt-player-container");
        if (!container) return;
        const iframeEl = document.createElement("iframe");
        iframeEl.id = "yt-player-iframe";
        iframeEl.src = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&loop=1&controls=0`;
        iframeEl.allow = "autoplay";
        iframeEl.style.display = "none";
        container.appendChild(iframeEl);
      }
    },
    [isPlaying]
  );

  const playGenerated = useCallback(
    async (generator: string) => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;
      gainNode.connect(ctx.destination);

      if (generator === "brownNoise") {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        source.start();
        generatedNodeRef.current = source;
      } else if (generator === "whiteNoise") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        source.start();
        generatedNodeRef.current = source;
      } else if (generator === "binaural40") {
        const merger = ctx.createChannelMerger(2);
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.frequency.value = 200;
        oscR.frequency.value = 240;

        const gainL = ctx.createGain();
        const gainR = ctx.createGain();
        gainL.gain.value = 0.15;
        gainR.gain.value = 0.15;

        oscL.connect(gainL);
        oscR.connect(gainR);
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);
        merger.connect(gainNode);

        oscL.start();
        oscR.start();
        generatedNodeRef.current = oscL;
      }
    },
    [volume, isMuted]
  );

  const playFileTrack = useCallback(
    async (track: Track) => {
      const { Howl } = await import("howler");

      if (howlRef.current) {
        howlRef.current.fade(howlRef.current.volume(), 0, 700);
        setTimeout(() => howlRef.current?.unload(), 800);
      }

      const howl = new Howl({
        src: [track.src!],
        loop: true,
        volume: 0,
        html5: true,
        onload: () => {
          howl.fade(0, isMuted ? 0 : volume, 800);
        },
        onloaderror: () => {
          console.warn("Audio file not found:", track.src);
        },
      });

      howl.play();
      howlRef.current = howl;
    },
    [volume, isMuted]
  );

  // Handle track change
  useEffect(() => {
    if (!currentTrack) return;
    stopAll();

    if (!isPlaying) return;

    if (currentTrack.type === "file" && currentTrack.src) {
      playFileTrack(currentTrack);
    } else if (currentTrack.type === "generated" && currentTrack.generator) {
      playGenerated(currentTrack.generator);
    } else if (currentTrack.type === "youtube" && currentTrack.youtubeId) {
      playYouTube(currentTrack.youtubeId);
    }
  }, [trackId, isPlaying, currentTrack, playFileTrack, playGenerated, playYouTube, stopAll]);

  // Volume control
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(isMuted ? 0 : volume);
    }
    if (audioCtxRef.current) {
      // Update gainNode if we track it (simplified approach)
    }
  }, [volume, isMuted]);

  // Auto-control with timer
  useEffect(() => {
    if (timerStatus === "running" && !isPlaying) {
      setPlaying(true);
    }
  }, [timerStatus, isPlaying, setPlaying]);

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = TRACKS.filter((t) => t.category === cat);
      return acc;
    },
    {} as Record<string, Track[]>
  );

  return (
    <>
      {/* Hidden YouTube container */}
      <div id="yt-player-container" className="hidden" />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed bottom-0 left-16 right-0 z-30 p-4"
          >
            <div className="glass-heavy rounded-2xl p-6 max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4" style={{ color: "var(--ff-emerald)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--ff-text-primary)" }}>
                    Ambient Sound
                  </span>
                  {currentTrack && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full glass-sm"
                      style={{ color: "var(--ff-emerald)" }}
                    >
                      {currentTrack.icon} {currentTrack.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Volume */}
                  <div className="flex items-center gap-2 w-28">
                    <button
                      onClick={toggleMute}
                      className="shrink-0"
                      style={{ color: "var(--ff-text-tertiary)" }}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([v]) => {
                        setVolume(v);
                        if (isMuted && v > 0) toggleMute();
                      }}
                      className="flex-1"
                    />
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center glass-sm"
                    style={{ color: "var(--ff-text-tertiary)" }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Track grid */}
              <div className="space-y-4">
                {CATEGORY_ORDER.map((cat) => (
                  <div key={cat}>
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase mb-2"
                      style={{ color: "var(--ff-text-tertiary)" }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {grouped[cat].map((track) => {
                        const isActive = trackId === track.id;
                        return (
                          <button
                            key={track.id}
                            onClick={() => selectTrack(track.id)}
                            className={cn(
                              "relative p-2.5 rounded-xl text-left transition-all duration-200 group",
                              isActive
                                ? "bg-[var(--ff-emerald-dim)] border border-[var(--ff-border-accent)]"
                                : "glass-sm hover:border-[var(--ff-border-accent)]"
                            )}
                          >
                            {isActive && isPlaying && (
                              <motion.div
                                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--ff-emerald)]"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                            <div className="text-lg mb-0.5">{track.icon}</div>
                            <div
                              className="text-[10px] font-medium leading-tight"
                              style={{
                                color: isActive
                                  ? "var(--ff-emerald)"
                                  : "var(--ff-text-secondary)",
                              }}
                            >
                              {track.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
