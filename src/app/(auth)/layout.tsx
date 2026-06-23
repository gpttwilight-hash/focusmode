import { AmbientBackground } from "@/components/layout/AmbientBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--ff-bg)" }}>
      <AmbientBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
