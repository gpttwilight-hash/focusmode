"use client";

import { useEffect } from "react";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useSessionStore } from "@/lib/store/session-store";
import { useAudioStore } from "@/lib/store/audio-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const { isPanelOpen, closePanel } = useAudioStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className="min-h-screen" style={{ background: "var(--ff-bg)" }}>
      <AmbientBackground />
      <Sidebar />
      <main className="relative z-10 ml-16 min-h-screen">
        {children}
      </main>

      {/* Global Audio Panel */}
      <AudioPlayer isOpen={isPanelOpen} onClose={closePanel} />
    </div>
  );
}
