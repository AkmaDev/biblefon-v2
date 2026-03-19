"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Book, PageContent } from "@/lib/books"

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/
interface Scene {
  image: string
  fonText: string
  audioSrc: string | null
  isTitle?: boolean
}

/* ─────────────────────────────────────────────────────────────
   HELPER — construire la playlist de scènes depuis les pages
───────────────────────────────────────────────────────────────*/
function buildScenes(pages: PageContent[]): Scene[] {
  const scenes: Scene[] = []

  for (const page of pages) {
    if (page.type === "title") {
      scenes.push({
        image: page.image,
        fonText: page.titleFon,
        audioSrc: null,
        isTitle: true,
      })
      continue
    }

    if (page.type === "meta") continue // page de métadonnées, on saute

    // Pages avec image + audioFiles
    const image =
      page.type === "mixed" ? page.image :
      page.type === "text"  ? (page.image ?? "") :
      page.type === "image" ? page.src :
      ""

    const audioFiles = (page.type === "mixed" || page.type === "text") ? (page.audioFiles ?? []) : []

    if (audioFiles.length > 0) {
      for (const af of audioFiles) {
        scenes.push({ image, fonText: af.fonText, audioSrc: af.src })
      }
    } else if (image) {
      // Page sans audio — scène muette, avancement manuel
      const fonText =
        page.type === "mixed" ? (page.fonText ?? page.caption) :
        page.type === "text"  ? (page.fonText ?? page.heading ?? "") :
        page.type === "quote" ? (page.fonText ?? page.verse) :
        ""
      scenes.push({ image, fonText, audioSrc: null })
    }
  }

  return scenes
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────────*/
export function StoryPlayer({ book }: { book: Book }) {
  const scenes = useMemo(() => buildScenes(book.pages), [book.pages])

  const [sceneIdx, setSceneIdx]   = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [iosUnlocked, setIosUnlocked] = useState(false)
  const [audioError, setAudioError]   = useState(false)
  const [touchStart, setTouchStart]   = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = scenes[sceneIdx] ?? scenes[0]
  const total   = scenes.length

  /* ── Navigation ─────────────────────────────────────────── */
  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, total - 1))
    setSceneIdx(clamped)
    setAudioError(false)
  }, [total])

  const nextScene = useCallback(() => goTo(sceneIdx + 1), [goTo, sceneIdx])
  const prevScene = useCallback(() => goTo(sceneIdx - 1), [goTo, sceneIdx])

  /* ── Karaoke — suivi de la position audio ────────────────── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    audio.addEventListener("timeupdate",    onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("durationchange", onMeta)
    return () => {
      audio.removeEventListener("timeupdate",    onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("durationchange", onMeta)
    }
  }, [])

  /* Reset position quand on change de scène */
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [sceneIdx])

  /* ── Audio setup ─────────────────────────────────────────── */
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current

    if (current.audioSrc) {
      audio.src = current.audioSrc
      audio.load()
      if (isPlaying) {
        audio.play().catch(() => setAudioError(true))
      }
    } else {
      audio.pause()
      audio.src = ""
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, current.audioSrc])

  /* Sync play/pause state with audio element */
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    if (!current.audioSrc) return

    if (isPlaying) {
      audio.play().catch(() => setAudioError(true))
    } else {
      audio.pause()
    }
  }, [isPlaying, current.audioSrc])

  /* Auto-advance quand l'audio se termine */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onEnded = () => {
      if (sceneIdx < total - 1) {
        nextScene()
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener("ended", onEnded)
    return () => audio.removeEventListener("ended", onEnded)
  }, [sceneIdx, total, nextScene])

  /* ── Media Session API (écran verrouillé) ────────────────── */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: book.title,
      artist: "BibleFon",
      album: current.fonText.slice(0, 60),
      artwork: [{ src: current.image, sizes: "512x512", type: "image/jpeg" }],
    })

    navigator.mediaSession.setActionHandler("play",          () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler("pause",         () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler("nexttrack",     nextScene)
    navigator.mediaSession.setActionHandler("previoustrack", prevScene)
  }, [sceneIdx, book.title, current, nextScene, prevScene])

  /* ── iOS — déverrouillage audio au premier tap ───────────── */
  const handleIosUnlock = () => {
    if (!audioRef.current) return
    // Joue et pause immédiatement pour déverrouiller le contexte
    audioRef.current.play().then(() => {
      audioRef.current?.pause()
      setIosUnlocked(true)
      setIsPlaying(true)
    }).catch(() => {
      setIosUnlocked(true)
      setIsPlaying(true)
    })
  }

  /* ── Swipe gauche / droite ───────────────────────────────── */
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const delta = e.changedTouches[0].clientX - touchStart
    if (Math.abs(delta) > 50) {
      if (delta < 0) nextScene()
      else           prevScene()
    }
    setTouchStart(null)
  }

  const togglePlay = () => {
    if (!current.audioSrc) return
    setIsPlaying(p => !p)
  }

  /* ── Image à afficher (fallback sur cover) ───────────────── */
  const displayImage = current.image || book.cover

  /* ── Karaoke — index du mot courant ─────────────────────── */
  const words = useMemo(
    () => (current.fonText ? current.fonText.split(/\s+/).filter(Boolean) : []),
    [current.fonText]
  )
  const currentWordIdx = duration > 0
    ? Math.min(Math.floor((currentTime / duration) * words.length), words.length - 1)
    : -1

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════*/
  return (
    <>
      {/* Audio toujours monté pour que audioRef soit disponible dès le splash */}
      <audio ref={audioRef} preload="auto" />

      {/* ── Splash iOS ── */}
      {!iosUnlocked && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ background: "#0a0f1a", cursor: "pointer", zIndex: 50 }}
          onClick={handleIosUnlock}
        >
          {/* Cover en fond */}
          <div className="absolute inset-0 opacity-30">
            <Image src={book.cover} alt={book.title} fill className="object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0a0f1a 0%, transparent 40%, #0a0f1a 100%)" }} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
            {/* Titre */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: book.accentColor }}>{book.titleFon}</p>
              <h1 className="text-3xl font-bold text-white">{book.title}</h1>
            </div>

            {/* Bouton play */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 80, height: 80,
                  background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}99)`,
                  boxShadow: `0 0 40px ${book.accentColor}66`,
                }}
              >
                <span style={{ fontSize: 32, marginLeft: 6 }}>▶</span>
              </div>
              <span className="text-sm font-semibold text-white/70">Appuie pour écouter</span>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>{book.readingTime}</span>
              <span>·</span>
              <span>{book.ageRange}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Player principal ── */}
      {iosUnlocked && (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#000", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ── Image de fond ── */}
      <div className="absolute inset-0">
        {displayImage && (
          <Image
            key={displayImage}
            src={displayImage}
            alt=""
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Gradient top → transparent → bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 50%, rgba(0,0,0,0.85) 100%)",
          }}
        />
      </div>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-12 pb-2 flex-shrink-0">
        <Link
          href="/#bibliotheque"
          className="flex items-center justify-center rounded-xl"
          style={{ minWidth: 44, minHeight: 44, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
          aria-label="Retour"
        >
          <span style={{ fontSize: 20 }}>←</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: book.accentColor }}>{book.titleFon}</p>
          <p className="text-sm font-bold text-white truncate">{book.title}</p>
        </div>
        {/* Compteur scènes */}
        <span className="text-xs text-white/50 flex-shrink-0">{sceneIdx + 1} / {total}</span>
      </div>

      {/* ── BARRE DE PROGRESSION (dots) ── */}
      <div className="relative z-10 flex gap-1 px-4 pb-2 flex-shrink-0">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Scène ${i + 1}`}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < sceneIdx ? "rgba(255,255,255,0.8)" : i === sceneIdx ? book.accentColor : "rgba(255,255,255,0.2)",
              minWidth: 4,
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* ── ZONE CENTRALE (tap pour play/pause) ── */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center"
        onClick={togglePlay}
        style={{ cursor: current.audioSrc ? "pointer" : "default" }}
      >
        {/* Titre de scène si c'est la page titre */}
        {current.isTitle && (
          <div className="text-center px-8">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{current.fonText}</h2>
          </div>
        )}
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div className="relative z-10 flex-shrink-0 px-4 pb-8">

        {/* Texte Fon — karaoke mot par mot */}
        {!current.isTitle && words.length > 0 && (
          <div
            className="mb-4 rounded-xl px-4 py-3"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)" }}
          >
            <p
              className="text-sm leading-relaxed font-medium"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  style={{
                    color: i === currentWordIdx
                      ? book.accentColor
                      : "rgba(255,255,255,0.85)",
                    fontWeight: i === currentWordIdx ? 700 : 500,
                    textShadow: i === currentWordIdx
                      ? `0 0 14px ${book.accentColor}cc`
                      : "none",
                    transition: "color 0.12s ease, text-shadow 0.12s ease",
                  }}
                >
                  {word}{" "}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Erreur audio */}
        {audioError && (
          <p className="text-xs text-center text-red-400 mb-3">
            Audio indisponible — utilise le bouton suivant ›
          </p>
        )}

        {/* ── CONTRÔLES ── */}
        <div className="flex items-center justify-between gap-3">

          {/* Précédent */}
          <button
            onClick={prevScene}
            disabled={sceneIdx === 0}
            aria-label="Scène précédente"
            style={{
              minWidth: 48, minHeight: 48,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              opacity: sceneIdx === 0 ? 0.3 : 1,
              border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>⏮</span>
          </button>

          {/* Play / Pause — bouton principal */}
          <button
            onClick={togglePlay}
            disabled={!current.audioSrc}
            aria-label={isPlaying ? "Pause" : "Lecture"}
            style={{
              minWidth: 64, minHeight: 64,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              background: current.audioSrc
                ? `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}bb)`
                : "rgba(255,255,255,0.15)",
              boxShadow: current.audioSrc ? `0 6px 24px ${book.accentColor}55` : "none",
              border: "none", cursor: current.audioSrc ? "pointer" : "default",
              fontSize: 24,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Suivant */}
          <button
            onClick={nextScene}
            disabled={sceneIdx === total - 1}
            aria-label="Scène suivante"
            style={{
              minWidth: 48, minHeight: 48,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              opacity: sceneIdx === total - 1 ? 0.3 : 1,
              border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>⏭</span>
          </button>

        </div>
      </div>
    </div>
      )}
    </>
  )
}
