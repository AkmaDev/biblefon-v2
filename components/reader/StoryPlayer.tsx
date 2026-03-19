"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Book, PageContent, WordTimestamp } from "@/lib/books"

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/
interface Scene {
  image: string
  fonText: string
  audioSrc: string | null
  wordTimestamps?: WordTimestamp[]
}

/* ─────────────────────────────────────────────────────────────
   HELPER — construire la playlist (sans page titre)
───────────────────────────────────────────────────────────────*/
function buildScenes(pages: PageContent[], tsMap: Record<string, WordTimestamp[]> = {}): Scene[] {
  const scenes: Scene[] = []

  for (const page of pages) {
    // Page titre → skipped (le titre est dans la top bar)
    if (page.type === "title" || page.type === "meta") continue

    const image =
      page.type === "mixed" ? page.image :
      page.type === "text"  ? (page.image ?? "") :
      page.type === "image" ? page.src :
      ""

    const audioFiles = (page.type === "mixed" || page.type === "text") ? (page.audioFiles ?? []) : []

    if (audioFiles.length > 0) {
      for (const af of audioFiles) {
        const words = tsMap[af.src] ?? af.words
        scenes.push({ image, fonText: af.fonText, audioSrc: af.src, wordTimestamps: words })
      }
    } else if (image) {
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

const BG = "#0a0f1a"
const TOP_H = 44
const TEXT_H = 120
const CTRL_H = 56

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────────*/
export function StoryPlayer({ book }: { book: Book }) {
  const [timestampMap, setTimestampMap] = useState<Record<string, WordTimestamp[]>>({})

  useEffect(() => {
    fetch("/word_timestamps.json")
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, WordTimestamp[]>) => setTimestampMap(data))
      .catch(() => {})
  }, [])

  const scenes = useMemo(() => buildScenes(book.pages, timestampMap), [book.pages, timestampMap])

  const [sceneIdx, setSceneIdx]   = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)  // auto-start
  const [audioError, setAudioError]   = useState(false)
  const [touchStart, setTouchStart]   = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = scenes[sceneIdx] ?? scenes[0]
  const total   = scenes.length

  /* ── Navigation ── */
  const goTo = useCallback((idx: number) => {
    setSceneIdx(Math.max(0, Math.min(idx, total - 1)))
    setAudioError(false)
  }, [total])

  const nextScene = useCallback(() => goTo(sceneIdx + 1), [goTo, sceneIdx])
  const prevScene = useCallback(() => goTo(sceneIdx - 1), [goTo, sceneIdx])

  /* ── Karaoke — timeupdate ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    audio.addEventListener("timeupdate",     onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("durationchange", onMeta)
    return () => {
      audio.removeEventListener("timeupdate",     onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("durationchange", onMeta)
    }
  }, [])

  useEffect(() => { setCurrentTime(0); setDuration(0) }, [sceneIdx])

  /* ── Audio setup — charge + joue quand scène change ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (current.audioSrc) {
      audio.src = current.audioSrc
      audio.load()
      if (isPlaying) audio.play().catch(() => setAudioError(true))
    } else {
      audio.pause()
      audio.src = ""
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, current.audioSrc])

  /* ── Sync play/pause ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current.audioSrc) return
    if (isPlaying) audio.play().catch(() => setAudioError(true))
    else audio.pause()
  }, [isPlaying, current.audioSrc])

  /* ── Auto-advance ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => {
      if (sceneIdx < total - 1) nextScene()
      else setIsPlaying(false)
    }
    audio.addEventListener("ended", onEnded)
    return () => audio.removeEventListener("ended", onEnded)
  }, [sceneIdx, total, nextScene])

  /* ── Media Session ── */
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: book.title,
      artist: "BibleFon",
      album: current.fonText.slice(0, 60),
      artwork: [{ src: current.image || book.cover, sizes: "512x512", type: "image/jpeg" }],
    })
    navigator.mediaSession.setActionHandler("play",          () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler("pause",         () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler("nexttrack",     nextScene)
    navigator.mediaSession.setActionHandler("previoustrack", prevScene)
  }, [sceneIdx, book, current, nextScene, prevScene])

  /* ── Swipe ── */
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const delta = e.changedTouches[0].clientX - touchStart
    if (Math.abs(delta) > 50) delta < 0 ? nextScene() : prevScene()
    setTouchStart(null)
  }

  const togglePlay = () => { if (current.audioSrc) setIsPlaying(p => !p) }
  const displayImage = current?.image || book.cover

  /* ── Karaoke ── */
  const words = useMemo(() => {
    if (current?.wordTimestamps?.length) return current.wordTimestamps.map(w => w.word)
    return current?.fonText ? current.fonText.split(/\s+/).filter(Boolean) : []
  }, [current])

  const currentWordIdx = useMemo(() => {
    if (current?.wordTimestamps?.length) {
      const wts = current.wordTimestamps
      return wts.findIndex((w, i) =>
        currentTime >= w.start && (i === wts.length - 1 || currentTime < wts[i + 1].start)
      )
    }
    return duration > 0
      ? Math.min(Math.floor((currentTime / duration) * words.length), words.length - 1)
      : -1
  }, [current, currentTime, duration, words.length])

  const imageH = `calc(100vh - ${TOP_H}px - ${TEXT_H}px - ${CTRL_H}px)`

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: BG }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <audio ref={audioRef} preload="auto" />

      {/* ── TOP BAR — 44px opaque ── */}
      <div
        style={{
          height: TOP_H,
          minHeight: TOP_H,
          background: BG,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingInline: 12,
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Bouton retour */}
        <Link
          href="/#bibliotheque"
          aria-label="Retour"
          style={{
            width: 32, height: 32, flexShrink: 0,
            borderRadius: "50%",
            background: "#1e3d4a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "white", textDecoration: "none",
          }}
        >
          ←
        </Link>

        {/* Titres */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.titleFon}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.title}
          </p>
        </div>

        {/* Compteur */}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
          {sceneIdx + 1} / {total}
        </span>

        {/* Barre de progression — bas de la top bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: "100%",
            width: `${total > 1 ? (sceneIdx / (total - 1)) * 100 : 100}%`,
            background: book.accentColor,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* ── IMAGE — hauteur fixe calculée ── */}
      <div
        style={{ height: imageH, minHeight: imageH, position: "relative", overflow: "hidden", flexShrink: 0 }}
        onClick={togglePlay}
      >
        {displayImage && (
          <Image
            key={displayImage}
            src={displayImage}
            alt=""
            fill
            className="object-cover"
            priority
            style={{ cursor: current?.audioSrc ? "pointer" : "default" }}
          />
        )}
      </div>

      {/* ── ZONE TEXTE — 120px fixe, scroll interne ── */}
      <div
        style={{
          height: TEXT_H,
          minHeight: TEXT_H,
          maxHeight: TEXT_H,
          background: BG,
          overflowY: "auto",
          padding: "12px 16px",
          flexShrink: 0,
        }}
      >
        {words.length > 0 ? (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, fontFamily: "var(--font-serif, Georgia, serif)" }}>
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  color: i === currentWordIdx ? book.accentColor : "rgba(255,255,255,0.85)",
                  fontWeight: i === currentWordIdx ? 700 : 400,
                  textShadow: i === currentWordIdx ? `0 0 12px ${book.accentColor}cc` : "none",
                  transition: "color 0.12s ease, text-shadow 0.12s ease",
                }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        ) : (
          audioError && (
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,100,100,0.8)", textAlign: "center", paddingTop: 8 }}>
              Audio indisponible — passe à la scène suivante ⏭
            </p>
          )
        )}
      </div>

      {/* ── CONTRÔLES — 56px ── */}
      <div
        style={{
          height: CTRL_H,
          minHeight: CTRL_H,
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 24,
          flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={prevScene}
          disabled={sceneIdx === 0}
          aria-label="Scène précédente"
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            border: "none", cursor: "pointer", fontSize: 18,
            opacity: sceneIdx === 0 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >⏮</button>

        <button
          onClick={togglePlay}
          disabled={!current?.audioSrc}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: current?.audioSrc
              ? `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}bb)`
              : "rgba(255,255,255,0.12)",
            boxShadow: current?.audioSrc ? `0 4px 20px ${book.accentColor}55` : "none",
            border: "none", cursor: current?.audioSrc ? "pointer" : "default",
            fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={nextScene}
          disabled={sceneIdx === total - 1}
          aria-label="Scène suivante"
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            border: "none", cursor: "pointer", fontSize: 18,
            opacity: sceneIdx === total - 1 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >⏭</button>
      </div>
    </div>
  )
}
