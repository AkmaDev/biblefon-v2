"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Lock } from "lucide-react"
import { track } from "@vercel/analytics"
import type { Book } from "@/lib/books"

/* ─────────────────────────────────────────────────────────────
   SINGLETON AUDIO MANAGER
   Trick autoplay : muted=true → play() réussit toujours →
   puis muted=false immédiatement → son audible sans clic préalable.
───────────────────────────────────────────────────────────────*/
const previewManager = {
  audio: null as HTMLAudioElement | null,
  currentId: null as string | null,

  play(id: string, chainUrl?: string): HTMLAudioElement {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ""
      if (this.currentId && this.currentId !== id) {
        window.dispatchEvent(
          new CustomEvent("biblefon:preview-stop", { detail: this.currentId })
        )
      }
    }
    const audio = new Audio(`/audio/cards/${id}-preview.wav`)
    audio.volume = 0.8
    audio.muted = true          // bypass autoplay policy
    this.audio = audio
    this.currentId = id

    // Enchaîner l'audio "bientôt disponible" à la fin si demandé
    if (chainUrl) {
      audio.addEventListener("ended", () => {
        if (this.currentId !== id) return
        const chain = new Audio(chainUrl)
        chain.volume = 0.8
        this.audio = chain
        window.dispatchEvent(new CustomEvent("biblefon:chain-start", { detail: id }))
        chain.play().catch(() => {})
        chain.addEventListener("ended", () => {
          window.dispatchEvent(new CustomEvent("biblefon:chain-end", { detail: id }))
        }, { once: true })
      }, { once: true })
    }

    // Arrêter l'audio bibliothèque s'il tourne en parallèle
    window.dispatchEvent(new CustomEvent("biblefon:stop-lib"))

    audio.play()
      .then(() => { audio.muted = false })
      .catch(() => {
        window.dispatchEvent(
          new CustomEvent("biblefon:audio-blocked", { detail: id })
        )
      })

    return audio
  },

  stop(id: string) {
    if (this.currentId !== id || !this.audio) return
    this.audio.pause()
    this.audio.src = ""
    this.audio = null
    this.currentId = null
    window.dispatchEvent(
      new CustomEvent("biblefon:preview-stop", { detail: id })
    )
  },
}

/* Quand l'audio bibliothèque démarre, stopper les previews carte */
if (typeof window !== "undefined") {
  window.addEventListener("biblefon:stop-cards", () => {
    if (previewManager.currentId) previewManager.stop(previewManager.currentId)
  })
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT
───────────────────────────────────────────────────────────────*/
interface BookCardProps {
  book: Book
  index: number
}

export function BookCard({ book, index }: BookCardProps) {
  const delay = index * 100

  const [isPlaying,    setIsPlaying]    = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [chainPlaying, setChainPlaying] = useState(false)
  const [previewPos,   setPreviewPos]   = useState<"right"|"left"|"above">("right")
  const [isMobile,     setIsMobile]     = useState(false)
  const cleanupRef  = useRef<(() => void) | null>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  /* ── Réinitialisation quand une autre carte prend la main ── */
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail === book.id) {
        setIsPlaying(false)
        setProgress(0)
        cleanupRef.current?.()
        cleanupRef.current = null
      }
    }
    window.addEventListener("biblefon:preview-stop", handler as EventListener)
    return () => window.removeEventListener("biblefon:preview-stop", handler as EventListener)
  }, [book.id])

  /* ── Positionner la rich card (getBoundingClientRect) ── */
  useEffect(() => {
    if (!isPlaying || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft  = rect.left
    if      (spaceRight > 300) setPreviewPos("right")
    else if (spaceLeft  > 300) setPreviewPos("left")
    else                       setPreviewPos("above")
  }, [isPlaying])

  /* ── Écouter le chain audio (bientôt disponible) ── */
  useEffect(() => {
    const onStart = (e: CustomEvent) => { if (e.detail === book.id) setChainPlaying(true)  }
    const onEnd   = (e: CustomEvent) => { if (e.detail === book.id) setChainPlaying(false) }
    window.addEventListener("biblefon:chain-start", onStart as EventListener)
    window.addEventListener("biblefon:chain-end",   onEnd   as EventListener)
    return () => {
      window.removeEventListener("biblefon:chain-start", onStart as EventListener)
      window.removeEventListener("biblefon:chain-end",   onEnd   as EventListener)
    }
  }, [book.id])

  /* ── Détection mobile ── */
  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches)
  }, [])

  /* ── Scroll lock quand bottom sheet ouverte ── */
  useEffect(() => {
    const sheetOpen = isPlaying && isMobile && !!book.previewCard
    document.body.style.overflow = sheetOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isPlaying, isMobile, book.previewCard])

  /* ── Cleanup au démontage ── */
  useEffect(() => {
    return () => {
      // Détacher les listeners audio AVANT d'appeler stop() :
      // stop() dispatche "biblefon:preview-stop" dont le handler a déjà été
      // retiré à ce stade (effets nettoyés dans l'ordre). Sans cet appel explicite,
      // les listeners playing/timeupdate/ended resteraient accrochés à l'objet audio.
      cleanupRef.current?.()
      cleanupRef.current = null
      if (previewManager.currentId === book.id) previewManager.stop(book.id)
    }
  }, [book.id])

  /* ── Démarrer le preview ── */
  const startPreview = useCallback(() => {
    const chain = book.comingSoon ? "/audio/cards/bientotdisponible.wav" : undefined
    const audio = previewManager.play(book.id, chain)
    track("book_preview_play", { book_id: book.id, book_title: book.title })

    const onPlaying    = () => setIsPlaying(true)
    const onTimeUpdate = () => {
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      cleanupRef.current = null
    }

    audio.addEventListener("playing",    onPlaying)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended",      onEnded)

    cleanupRef.current = () => {
      audio.removeEventListener("playing",    onPlaying)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended",      onEnded)
    }

    setProgress(0)
  }, [book.id])

  /* ── Arrêter le preview ── */
  const stopPreview = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
    previewManager.stop(book.id)
    setIsPlaying(false)
    setProgress(0)
  }, [book.id])

  /* ── Tap icône ♪ (mobile uniquement) ── */
  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPlaying) stopPreview()
    else startPreview()
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  const pc = book.previewCard

  /* ── Inline styles selon la position détectée ── */
  const previewInlineStyle: React.CSSProperties =
    previewPos === "right" ? { left: "105%",  top: 0 } :
    previewPos === "left"  ? { right: "105%", top: 0 } :
                             { bottom: "105%", left: 0 }

  /* ── Rich preview card (desktop hover uniquement) ── */
  const previewCardEl = isPlaying && pc && !isMobile ? (
    <div className="preview-card" style={previewInlineStyle}>
      <p className="preview-title">{book.title}</p>
      {book.comingSoon ? (
        <>
          <p className="preview-body">{pc.intro}</p>
          {pc.quote && (
            <blockquote className="preview-quote">{pc.quote}</blockquote>
          )}
          <p className="preview-status">
            <span style={{ marginRight: 6 }}>🔒</span>Histoire à venir
          </p>
        </>
      ) : (
        <>
          <p className="preview-body">{pc.intro}</p>
          {pc.quote && <blockquote className="preview-quote">{pc.quote}</blockquote>}
          {pc.closing && <p className="preview-invite">{pc.closing}</p>}
        </>
      )}
    </div>
  ) : null

  const cardContent = (
    <article
      className={`relative flex flex-col overflow-hidden rounded-xl transition-all duration-500
        bg-[var(--card)]
        ${book.comingSoon ? "opacity-75" : "hover:-translate-y-1"}`}
      style={{
        boxShadow: `
          0 24px 60px rgba(0,0,0,0.6),
          0 8px 20px rgba(0,0,0,0.4),
          0 2px 6px rgba(0,0,0,0.25)
        `,
        cursor: book.comingSoon ? "default" : undefined,
      }}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      {/* ── Cover image ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden md:max-h-[260px]">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index < 3}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

        {/* Coming soon overlay */}
        {book.comingSoon && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-700"
            style={{
              background: chainPlaying
                ? "rgba(201,146,42,0.18)"
                : "rgba(0,0,0,0.50)",
            }}
          >
            <div
              className={`flex flex-col items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-700${chainPlaying ? " chain-pulse" : ""}`}
              style={{
                background: chainPlaying ? "rgba(201,146,42,0.22)" : "rgba(0,0,0,0.60)",
                border: chainPlaying
                  ? "1px solid rgba(201,146,42,0.6)"
                  : "1px solid rgba(255,255,255,0.20)",
              }}
            >
              <Lock
                className="w-4 h-4 transition-colors duration-700"
                style={{ color: chainPlaying ? "#c8a040" : "rgba(255,255,255,0.7)" }}
              />
              <span
                className="text-[10px] font-semibold uppercase tracking-widest transition-colors duration-700"
                style={{ color: chainPlaying ? "#c8a040" : "rgba(255,255,255,0.8)" }}
              >
                {chainPlaying ? "Bientôt…" : "À venir"}
              </span>
            </div>
          </div>
        )}

        {/* Testament badge — top left */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: `${book.accentColor}22`,
            border: `1px solid ${book.accentColor}55`,
            color: book.accentColor,
          }}
        >
          {book.testament === "ancien" ? "Ancien Testament" : "Nouveau Testament"}
        </div>

        {/* ♪ Icône preview — touch uniquement (CSS masquée sur desktop) */}
        <button
          className="card-preview-icon absolute top-3 right-3"
          onClick={handleIconClick}
          aria-label="Écouter un aperçu"
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(45,212,191,0.85)",
            border: "none", cursor: "pointer",
            alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 13, fontWeight: 700,
            backdropFilter: "blur(4px)",
            zIndex: 10,
          }}
        >
          ♪
        </button>

        {/* Barre de progression */}
        {isPlaying && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "12px 10px 8px",
            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          }}>
            <div style={{
              height: 3, borderRadius: 2,
              background: "rgba(255,255,255,0.2)", position: "relative",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${progress * 100}%`,
                background: "#2dd4bf", borderRadius: 2,
                transition: "width 0.1s linear",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Infos sous l'image ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2">

        <div>
          <p className="text-[11px] font-medium opacity-75 truncate" style={{ color: book.accentColor }}>
            {book.titleFon}
          </p>
          <h2 className="text-base font-bold text-white leading-tight">
            {book.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {book.readingTime}
          </span>
          <span>{book.ageRange}</span>
        </div>

        {book.comingSoon ? (
          <div className="flex items-center justify-center h-12 rounded-xl bg-white/10 text-xs font-semibold text-white/40 mt-1">
            Bientôt disponible
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 mt-1"
            style={{
              minHeight: 48,
              background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}bb)`,
              color: "#0c0804",
              boxShadow: `0 4px 16px ${book.accentColor}44`,
            }}
          >
            <span>▶</span>
            <span>Écouter en Fon</span>
          </div>
        )}
      </div>
    </article>
  )

  /* ── Bottom sheet mobile ── */
  const bottomSheet = isPlaying && pc && isMobile ? (
    <>
      {/* Overlay */}
      <div
        onClick={stopPreview}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 99,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#1a1208",
        borderRadius: "20px 20px 0 0",
        padding: "24px",
        zIndex: 100,
        animation: "slideUp 300ms ease",
      }}>
        <p className="preview-title">{book.title}</p>
        {book.comingSoon ? (
          <>
            <p className="preview-body">{pc.intro}</p>
            {pc.quote && <blockquote className="preview-quote">{pc.quote}</blockquote>}
            <p className="preview-status">
              <span style={{ marginRight: 6 }}>🔒</span>Histoire à venir
            </p>
          </>
        ) : (
          <>
            <p className="preview-body">{pc.intro}</p>
            {pc.quote && <blockquote className="preview-quote">{pc.quote}</blockquote>}
            {pc.closing && <p className="preview-invite">{pc.closing}</p>}
          </>
        )}
      </div>
    </>
  ) : null

  const inner = (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {previewCardEl}
      {bottomSheet}
      {cardContent}
    </div>
  )

  /* Cartes "À venir" : div non-cliquable */
  if (book.comingSoon) {
    return <div style={{ animationDelay: `${delay}ms` }}>{inner}</div>
  }

  return (
    <Link
      href={`/story/${book.id}`}
      className="group block"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => track("book_opened", { book_id: book.id })}
    >
      {inner}
    </Link>
  )
}
