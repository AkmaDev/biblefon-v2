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
   HELPER — playlist sans page titre/meta
───────────────────────────────────────────────────────────────*/
function buildScenes(pages: PageContent[], tsMap: Record<string, WordTimestamp[]> = {}): Scene[] {
  const scenes: Scene[] = []
  for (const page of pages) {
    if (page.type === "title" || page.type === "meta") continue
    const image =
      page.type === "mixed" ? page.image :
      page.type === "text"  ? (page.image ?? "") :
      page.type === "image" ? page.src : ""
    const audioFiles = (page.type === "mixed" || page.type === "text") ? (page.audioFiles ?? []) : []
    if (audioFiles.length > 0) {
      for (const af of audioFiles) {
        scenes.push({ image, fonText: af.fonText, audioSrc: af.src, wordTimestamps: tsMap[af.src] ?? af.words })
      }
    } else if (image) {
      const fonText =
        page.type === "mixed" ? (page.fonText ?? page.caption) :
        page.type === "text"  ? (page.fonText ?? page.heading ?? "") :
        page.type === "quote" ? (page.fonText ?? page.verse) : ""
      scenes.push({ image, fonText, audioSrc: null })
    }
  }
  return scenes
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────────*/
export function StoryPlayer({ book }: { book: Book }) {
  const [timestampMap, setTimestampMap] = useState<Record<string, WordTimestamp[]>>({})
  useEffect(() => {
    fetch("/word_timestamps.json")
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, WordTimestamp[]>) => setTimestampMap(d))
      .catch(() => {})
  }, [])

  const scenes = useMemo(() => buildScenes(book.pages, timestampMap), [book.pages, timestampMap])

  const [sceneIdx, setSceneIdx]     = useState(0)
  const [isPlaying, setIsPlaying]   = useState(true)
  const [audioError, setAudioError] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)

  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const current = scenes[sceneIdx] ?? scenes[0]
  const total   = scenes.length

  /* ── Navigation ── */
  const goTo = useCallback((idx: number) => {
    setSceneIdx(Math.max(0, Math.min(idx, total - 1)))
    setAudioError(false)
  }, [total])
  const nextScene = useCallback(() => goTo(sceneIdx + 1), [goTo, sceneIdx])
  const prevScene = useCallback(() => goTo(sceneIdx - 1), [goTo, sceneIdx])

  /* ── Karaoke timeupdate ── */
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

  /* ── Audio setup ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (current.audioSrc) {
      audio.src = current.audioSrc
      audio.load()
      if (isPlaying) audio.play().catch(() => setAudioError(true))
    } else {
      audio.pause(); audio.src = ""
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, current.audioSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current.audioSrc) return
    if (isPlaying) audio.play().catch(() => setAudioError(true))
    else audio.pause()
  }, [isPlaying, current.audioSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => { if (sceneIdx < total - 1) nextScene(); else setIsPlaying(false) }
    audio.addEventListener("ended", onEnded)
    return () => audio.removeEventListener("ended", onEnded)
  }, [sceneIdx, total, nextScene])

  /* ── Media Session ── */
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: book.title, artist: "BibleFon",
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

  /* ── Progress bar scrub ── */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }

  const togglePlay = () => { if (current?.audioSrc) setIsPlaying(p => !p) }

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

  /* ── Progress ratio ── */
  const progressRatio = duration > 0 ? currentTime / duration : sceneIdx / Math.max(total - 1, 1)
  const displayImage  = current?.image || book.cover

  /* ═════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════ */
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#1a1208", overflow: "hidden" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <audio ref={audioRef} preload="auto" />

      {/* ── HEADER transparent ── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "52px 20px 12px",
          flexShrink: 0,
        }}
      >
        <Link
          href="/#bibliotheque"
          aria-label="Retour"
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", textDecoration: "none", fontSize: 16, flexShrink: 0,
          }}
        >
          ←
        </Link>
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 15, fontWeight: 700, color: "white",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontFamily: "var(--font-serif, Georgia, serif)",
          }}>
            {book.title}
          </p>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
          {sceneIdx + 1} / {total}
        </span>
      </div>

      {/* ── IMAGE — centrée, border-radius, shadow ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", minHeight: 0 }}>
        <div
          style={{
            width: "100%",
            aspectRatio: "3 / 4",
            maxHeight: "100%",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            position: "relative",
            flexShrink: 0,
          }}
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
            />
          )}
          {/* Overlay play/pause au tap */}
          {!isPlaying && current?.audioSrc && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.25)",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(200,160,64,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>▶</div>
            </div>
          )}
        </div>
      </div>

      {/* ── ZONE TEXTE — sous l'image, transparent ── */}
      <div
        style={{
          height: 80, minHeight: 80, maxHeight: 80,
          overflow: "hidden",
          padding: "8px 24px 0",
          flexShrink: 0,
        }}
      >
        {words.length > 0 && (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, fontFamily: "var(--font-serif, Georgia, serif)", color: "rgba(255,255,255,0.85)" }}>
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  color: i === currentWordIdx ? "#c8a040" : "rgba(255,255,255,0.85)",
                  fontWeight: i === currentWordIdx ? 700 : 400,
                  textShadow: i === currentWordIdx ? "0 0 12px rgba(200,160,64,0.6)" : "none",
                  transition: "color 0.12s ease",
                }}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        )}
        {audioError && (
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,100,100,0.8)", textAlign: "center" }}>
            Audio indisponible ⏭
          </p>
        )}
      </div>

      {/* ── BARRE DE PROGRESSION — scrubable ── */}
      <div style={{ padding: "12px 24px 4px", flexShrink: 0 }}>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.2)",
            cursor: "pointer", position: "relative",
          }}
        >
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${progressRatio * 100}%`,
            background: "#c8a040",
            borderRadius: 2,
            transition: "width 0.1s linear",
          }} />
          {/* Thumb */}
          <div style={{
            position: "absolute", top: "50%",
            left: `${progressRatio * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 12, height: 12, borderRadius: "50%",
            background: "#c8a040",
            boxShadow: "0 0 6px rgba(200,160,64,0.6)",
          }} />
        </div>
        {/* Timestamps textuels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {duration > 0 ? `-${formatTime(duration - currentTime)}` : ""}
          </span>
        </div>
      </div>

      {/* ── CONTRÔLES ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 40px 40px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={prevScene}
          disabled={sceneIdx === 0}
          aria-label="Précédent"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "transparent", border: "none",
            cursor: sceneIdx === 0 ? "default" : "pointer",
            opacity: sceneIdx === 0 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: "white",
          }}
        >⏮</button>

        <button
          onClick={togglePlay}
          disabled={!current?.audioSrc}
          aria-label={isPlaying ? "Pause" : "Lecture"}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: current?.audioSrc ? "#c8a040" : "rgba(255,255,255,0.15)",
            boxShadow: current?.audioSrc ? "0 4px 24px rgba(200,160,64,0.5)" : "none",
            border: "none",
            cursor: current?.audioSrc ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: current?.audioSrc ? "#1a1208" : "rgba(255,255,255,0.4)",
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={nextScene}
          disabled={sceneIdx === total - 1}
          aria-label="Suivant"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "transparent", border: "none",
            cursor: sceneIdx === total - 1 ? "default" : "pointer",
            opacity: sceneIdx === total - 1 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, color: "white",
          }}
        >⏭</button>
      </div>
    </div>
  )
}

/* ── Utilitaire : formatage MM:SS ── */
function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
