import Image from "next/image"
import Link from "next/link"
import { BookGrid } from "@/components/library/BookGrid"

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(to bottom, rgba(8,6,4,0.7) 0%, transparent 100%)" }}>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            BibleFon
          </span>
          <span className="text-[10px] font-semibold tracking-widest uppercase leading-tight"
            style={{ color: "var(--gold-light)", opacity: 0.8 }}>
            Audio · Illustré · En Langue Fon
          </span>
        </div>
        <Link
          href="/about"
          className="text-sm px-4 py-1.5 rounded-full transition-all duration-200
            hover:text-white text-white/60 border border-white/10 hover:border-white/25"
        >
          À propos
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4">

        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="BibleFon"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,6,4,0.55) 0%, rgba(8,6,4,0.7) 50%, rgba(8,6,4,0.97) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          {/* Main title */}
          <div className="space-y-3 animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-none tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}>
              Bible<span className="shimmer-text">Fon</span>
            </h1>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-8 bg-white/50" />
        </div>
      </section>

      {/* ── Book grid ── */}
      <section id="bibliotheque" className="pt-16">
        <BookGrid />
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <span className="text-xs text-[var(--muted-foreground)]">
            Audio propulsé par{" "}
            <a href="https://huggingface.co/facebook/mms-tts-fon"
              target="_blank" rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--gold-dark)" }}>
              Meta MMS-TTS-FON
            </a>
            {" "}· Illustrations par IA
          </span>
        </div>
      </footer>
    </main>
  )
}
