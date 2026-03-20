"use client"

import { useState, useEffect, useRef } from "react"
import { books } from "@/lib/books"
import { BookCard } from "./BookCard"

/* ── Icône livre animée + audio "Bibliothèque" ── */
function LibraryIcon() {
  const [playing, setPlaying]   = useState(false)
  const [showTip, setShowTip]   = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stopper l'audio bibliothèque si un preview carte démarre
  useEffect(() => {
    const handler = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setPlaying(false)
        setShowTip(false)
      }
    }
    window.addEventListener("biblefon:stop-lib", handler)
    return () => window.removeEventListener("biblefon:stop-lib", handler)
  }, [])

  const handleClick = () => {
    if (playing) return
    setPlaying(true)

    // Arrêter les previews cartes s'ils tournent
    window.dispatchEvent(new CustomEvent("biblefon:stop-cards"))

    const audio = new Audio("/audio/bibliotheque.wav")
    audio.volume = 0.85
    audio.muted = true
    audioRef.current = audio

    audio.play()
      .then(() => { audio.muted = false })
      .catch(() => { setPlaying(false) })

    audio.addEventListener("playing", () => {
      setShowTip(true)
      window.dispatchEvent(new CustomEvent("biblefon:lib-start"))
    }, { once: true })
    audio.addEventListener("ended", () => {
      setPlaying(false)
      setShowTip(false)
      window.dispatchEvent(new CustomEvent("biblefon:lib-end"))
    }, { once: true })
  }

  // Sur touch, mouseenter ne doit pas déclencher l'audio
  const handleHover = () => {
    if (window.matchMedia("(hover: none)").matches) return
    handleClick()
  }

  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>

      {/* Bulle "Bibliothèque" */}
      {showTip && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1208",
          border: "1px solid rgba(201,146,42,0.25)",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 13,
          fontFamily: "var(--font-serif), Georgia, serif",
          color: "#c8a040",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          animation: "fade-in 0.2s ease forwards",
          zIndex: 10,
        }}>
          Bibliothèque
        </div>
      )}

      {/* Bouton icône */}
      <button
        key={playing ? "playing" : "idle"}
        onClick={handleClick}
        onMouseEnter={handleHover}
        aria-label="Écouter l'introduction de la bibliothèque"
        className={playing ? "lib-icon lib-icon--playing" : "lib-icon"}
        style={{
          position: "relative",
          background: "rgba(201,146,42,0.10)",
          border: "1px solid rgba(201,146,42,0.25)",
          borderRadius: "50%",
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: playing ? "default" : "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Icône livre SVG */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke="rgba(201,146,42,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            stroke="rgba(201,146,42,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        {/* Petite icône son — toujours visible à côté */}
        <span style={{
          position: "absolute",
          top: -4,
          right: -6,
          fontSize: 11,
          lineHeight: 1,
          background: playing ? "rgba(45,212,191,0.9)" : "rgba(201,146,42,0.75)",
          borderRadius: "50%",
          width: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s",
        }}>
          {playing ? "♪" : "♪"}
        </span>
      </button>

      <style>{`
        .lib-icon {
          animation: lib-bounce 2.2s ease-in-out infinite;
        }
        .lib-icon--playing {
          animation: none;
        }
        @keyframes lib-bounce {
          0%, 100% { transform: translateY(0);   opacity: 0.8; }
          50%       { transform: translateY(-6px); opacity: 1;   }
        }
        .lib-icon:hover:not(.lib-icon--playing) {
          animation-play-state: paused;
          background: rgba(201,146,42,0.18) !important;
        }
      `}</style>
    </div>
  )
}

export function BookGrid() {
  return (
    <section id="bibliotheque" className="px-4 pt-20 pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Icône livre animée */}
        <div className="flex justify-center mb-10">
          <LibraryIcon />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-[120px] sm:pb-0">
          {books.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>

        {/* More coming soon */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            D&apos;autres histoires arrivent bientôt ·
            <span className="ml-1" style={{ color: "var(--gold)" }}>
              Abraham · Ruth · Marie · Jonas
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
