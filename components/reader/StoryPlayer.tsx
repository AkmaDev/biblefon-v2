"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { track } from "@vercel/analytics"
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
   HELPER
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
   ICÔNES SVG
───────────────────────────────────────────────────────────────*/
function IconPlay({ size = 28 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M8 5.14v14l11-7-11-7z" /></svg>
}
function IconPause({ size = 28 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
}
function IconPrev({ size = 24 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
}
function IconNext({ size = 24 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M6 18 14.5 12 6 6v12zm10.5-12v12h2V6h-2z" /></svg>
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────────*/
export function StoryPlayer({ book }: { book: Book }) {
  /* ── Timestamps karaoke ── */
  const [timestampMap, setTimestampMap] = useState<Record<string, WordTimestamp[]>>({})
  useEffect(() => {
    const controller = new AbortController()
    fetch("/word_timestamps.json", { signal: controller.signal })
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, WordTimestamp[]>) => setTimestampMap(d))
      .catch((e: unknown) => {
        // AbortError = démontage du composant avant la fin du fetch, pas une erreur
        if (e instanceof Error && e.name === "AbortError") return
        console.error("[BibleFon] word_timestamps.json:", e)
      })
    return () => controller.abort()
  }, [])

  const scenes = useMemo(() => buildScenes(book.pages, timestampMap), [book.pages, timestampMap])

  /* ── État ── */
  const [sceneIdx, setSceneIdx]       = useState(0)
  const [isPlaying, setIsPlaying]     = useState(true)
  const [audioError, setAudioError]   = useState(false)
  const [touchStart, setTouchStart]   = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [bgColor, setBgColor]         = useState("#130e07")
  const [isDesktop, setIsDesktop]     = useState(false)

  const audioRef         = useRef<HTMLAudioElement | null>(null)
  const activeWordRef    = useRef<HTMLSpanElement | null>(null)
  const trackedPlayRef   = useRef<number>(-1)   // sceneIdx déjà tracké pour story_audio_play
  const trackedHalfRef   = useRef<number>(-1)   // sceneIdx déjà tracké pour story_progress_50

  const current      = scenes[sceneIdx] ?? scenes[0]
  const total        = scenes.length
  const hasAudio     = !!current?.audioSrc
  const displayImage = current?.image || book.cover

  /* ── Détection breakpoint ── */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener("resize", check, { passive: true })
    return () => window.removeEventListener("resize", check)
  }, [])

  /* ── Couleur de fond dynamique ── */
  useEffect(() => {
    if (!current?.image) return
    let cancelled = false
    import("fast-average-color").then(({ FastAverageColor }) => {
      const fac = new FastAverageColor()
      fac.getColorAsync(current.image, { algorithm: "dominant", crossOrigin: "anonymous" })
        .then(color => {
          if (cancelled) return
          const [r, g, b] = color.value
          setBgColor(`rgb(${Math.round(r * 0.22)}, ${Math.round(g * 0.22)}, ${Math.round(b * 0.22)})`)
        })
        .catch(() => { if (!cancelled) setBgColor("#130e07") })
    })
    return () => { cancelled = true }
  }, [current?.image])

  /* ── Navigation ── */
  const goTo = useCallback((idx: number) => {
    setSceneIdx(Math.max(0, Math.min(idx, total - 1)))
    setAudioError(false)
  }, [total])
  const nextScene = useCallback(() => goTo(sceneIdx + 1), [goTo, sceneIdx])
  const prevScene = useCallback(() => goTo(sceneIdx - 1), [goTo, sceneIdx])

  /* ── Karaoke — mots & index ── */
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

  /* ── Auto-scroll karaoke — mot actif toujours visible ── */
  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [currentWordIdx])

  /* ── Timeupdate ── */
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

  /* ── Audio play avec gestion fine des erreurs ── */
  const tryPlay = useCallback((audio: HTMLAudioElement, src: string) => {
    audio.play()
      .then(() => {
        setAudioError(false)
        if (trackedPlayRef.current !== sceneIdx) {
          trackedPlayRef.current = sceneIdx
          track("story_audio_play", { book_id: book.id, scene_index: sceneIdx })
        }
      })
      .catch((err: Error) => {
        if (err.name === "NotAllowedError") {
          // Autoplay bloqué par le navigateur — pas une erreur fichier
          setIsPlaying(false)
        } else {
          console.error("[BibleFon] Erreur audio:", src, err.name, err.message)
          setAudioError(true)
        }
      })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (current.audioSrc) {
      audio.src = current.audioSrc
      audio.load()
      if (isPlaying) tryPlay(audio, current.audioSrc)
    } else {
      audio.pause(); audio.src = ""
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, current.audioSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current.audioSrc) return
    if (isPlaying) tryPlay(audio, current.audioSrc)
    else audio.pause()
  }, [isPlaying, current.audioSrc, tryPlay])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => {
      if (sceneIdx < total - 1) nextScene()
      else { track("story_completed", { book_id: book.id }); setIsPlaying(false) }
    }
    audio.addEventListener("ended", onEnded)
    return () => audio.removeEventListener("ended", onEnded)
  }, [sceneIdx, total, nextScene, book.id])

  /* ── Tracking jalon 50% ── */
  useEffect(() => {
    if (duration <= 0 || currentTime <= 0) return
    if (currentTime / duration >= 0.5 && trackedHalfRef.current !== sceneIdx) {
      trackedHalfRef.current = sceneIdx
      track("story_progress_50", { book_id: book.id })
    }
  }, [currentTime, duration, sceneIdx, book.id])

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

  /* ── Progress scrub ── */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
    setCurrentTime(audioRef.current.currentTime)
  }

  const togglePlay    = () => { if (hasAudio) setIsPlaying(p => !p) }
  const progressRatio = duration > 0 ? currentTime / duration : 0

  /* ════════════════════════════════════════════════════════
     BLOCS PARTAGÉS
  ════════════════════════════════════════════════════════ */

  /** Fond pleine page */
  const Backgrounds = (
    <>
      <div style={{ position: "fixed", inset: 0, background: bgColor, transition: "background 1.2s ease", zIndex: 0 }} />
      {displayImage && (
        <div aria-hidden="true" style={{
          position: "fixed", inset: "-40px",
          backgroundImage: `url(${displayImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(90px) saturate(1.6)", opacity: 0.28, zIndex: 0,
        }} />
      )}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(170deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)", zIndex: 0 }} />
    </>
  )

  /** Barre de progression */
  const ProgressBar = (
    <div>
      <div onClick={handleProgressClick} style={{ padding: "8px 0", cursor: hasAudio ? "pointer" : "default" }}>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)", position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${progressRatio * 100}%`,
            background: "#c8a040", borderRadius: 2, transition: "width 0.1s linear",
          }} />
          {hasAudio && (
            <div style={{
              position: "absolute", top: "50%", left: `${progressRatio * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 12, height: 12, borderRadius: "50%",
              background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
            }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>{formatTime(currentTime)}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
          {duration > 0 ? `-${formatTime(duration - currentTime)}` : ""}
        </span>
      </div>
    </div>
  )

  /** Header partagé */
  const Header = (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Link href="/#bibliotheque" aria-label="Retour" style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.8)", textDecoration: "none", flexShrink: 0,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>

      <div style={{ flex: 1, textAlign: "center", overflow: "hidden" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "#c8a040", marginBottom: 1, fontFamily: "var(--font-serif, Georgia, serif)" }}>
          {book.titleFon}
        </p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white", fontFamily: "var(--font-serif, Georgia, serif)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {book.title}
        </p>
      </div>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0, fontVariantNumeric: "tabular-nums", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 20 }}>
        {sceneIdx + 1} / {total}
      </span>
    </div>
  )

  /** Zone karaoke scrollable — hauteur fixe, auto-scroll mot actif */
  const KaraokeZone = (h: number, fontSize: number) => (
    audioError ? (
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,100,100,0.9)", textAlign: "center" }}>
        Fichier audio introuvable ⏭
      </p>
    ) : words.length > 0 ? (
      <div style={{ height: h, overflowY: "auto", scrollbarWidth: "none" }}>
        <p style={{ margin: 0, fontSize, lineHeight: 1.6, fontFamily: "var(--font-serif, Georgia, serif)", color: "rgba(255,255,255,0.85)" }}>
          {words.map((word, i) => (
            <span
              key={i}
              ref={i === currentWordIdx ? activeWordRef : null}
              style={{
                color: i === currentWordIdx ? "#c8a040" : "rgba(255,255,255,0.85)",
                fontWeight: i === currentWordIdx ? 600 : 400,
                textShadow: i === currentWordIdx ? "0 0 16px rgba(200,160,64,0.45)" : "none",
                transition: "color 0.12s ease",
              }}
            >
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    ) : null
  )

  /* ════════════════════════════════════════════════════════
     RENDER — DESKTOP  (min-width: 768px)
     Layout : colonne centrée 520px, texte scrollable borné
  ════════════════════════════════════════════════════════ */
  if (isDesktop) {
    return (
      <div className="fixed inset-0" style={{ overflow: "auto" }}>
        {Backgrounds}
        <audio ref={audioRef} preload="auto" />

        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 520, margin: "0 auto",
          minHeight: "100dvh",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "20px 24px", boxSizing: "border-box",
        }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>{Header}</div>

          {/* Image — carré max 45vh, inchangée */}
          <div style={{
            width: "min(100%, 45vh)", aspectRatio: "1 / 1",
            alignSelf: "center",
            borderRadius: 20, overflow: "hidden", position: "relative",
            marginBottom: 20,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
            transform: isPlaying ? "scale(1)" : "scale(0.97)",
            transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
          }}>
            {displayImage && <Image key={displayImage} src={displayImage} alt="" fill className="object-cover" priority />}
          </div>

          {/* Zone texte desktop — max 120px, scrollable, auto-scroll mot actif.
              Bornée pour que les contrôles restent toujours visibles. */}
          <div style={{ marginBottom: 20 }}>
            {KaraokeZone(88, 17)}
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 20 }}>{ProgressBar}</div>

          {/* Contrôles — gap 48px, bouton play BLANC (identique mobile) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
            <button onClick={prevScene} disabled={sceneIdx === 0} aria-label="Précédent" style={{
              width: 28, height: 28, background: "transparent", border: "none",
              cursor: sceneIdx === 0 ? "default" : "pointer",
              opacity: sceneIdx === 0 ? 0.2 : 0.6,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <IconPrev size={28} />
            </button>

            {/* Bouton play blanc — même que mobile */}
            <button onClick={togglePlay} disabled={!hasAudio} aria-label={isPlaying ? "Pause" : "Lecture"} style={{
              width: 64, height: 64, borderRadius: "50%",
              background: hasAudio ? "white" : "rgba(255,255,255,0.12)",
              boxShadow: hasAudio ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
              border: "none", cursor: hasAudio ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hasAudio ? "#1a1208" : "rgba(255,255,255,0.25)",
            }}>
              {isPlaying ? <IconPause size={28} /> : <IconPlay size={28} />}
            </button>

            <button onClick={nextScene} disabled={sceneIdx === total - 1} aria-label="Suivant" style={{
              width: 28, height: 28, background: "transparent", border: "none",
              cursor: sceneIdx === total - 1 ? "default" : "pointer",
              opacity: sceneIdx === total - 1 ? 0.2 : 0.6,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <IconNext size={28} />
            </button>
          </div>

        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════
     RENDER — MOBILE  (max-width: 767px)
     Layout restauré exactement : image flex:1, texte 76px scrollable
  ════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0" style={{ overflow: "hidden" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {Backgrounds}
      <audio ref={audioRef} preload="auto" />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 500, height: "100%", display: "flex", flexDirection: "column", padding: "0 28px", boxSizing: "border-box" }}>

          {/* Header */}
          <div style={{ paddingTop: "max(52px, 20px)", paddingBottom: 10, flexShrink: 0 }}>
            {Header}
          </div>

          {/* Image — flex:1, carré parfait, ombre triple couche */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: "8px 0" }}>
            <div style={{
              width: "min(100%, calc(100vh - 390px))",
              aspectRatio: "1 / 1",
              borderRadius: 22,
              overflow: "hidden",
              position: "relative",
              boxShadow: `
                0 40px 100px rgba(0,0,0,0.75),
                0 16px 40px rgba(0,0,0,0.5),
                0 4px 10px rgba(0,0,0,0.35)
              `,
              transform: isPlaying ? "scale(1)" : "scale(0.95)",
              transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
            }}>
              {displayImage && <Image key={displayImage} src={displayImage} alt="" fill className="object-cover" priority />}
            </div>
          </div>

          {/* Zone texte mobile — 76px, overflow auto, scrollbar cachée, auto-scroll */}
          <div style={{ paddingTop: 18, flexShrink: 0 }}>
            {KaraokeZone(76, 15)}
          </div>

          {/* Progress */}
          <div style={{ paddingTop: 14, flexShrink: 0 }}>{ProgressBar}</div>

          {/* Contrôles */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: "max(40px, 20px)", flexShrink: 0 }}>
            <button onClick={prevScene} disabled={sceneIdx === 0} aria-label="Précédent" style={{
              width: 48, height: 48, background: "transparent", border: "none",
              cursor: sceneIdx === 0 ? "default" : "pointer",
              opacity: sceneIdx === 0 ? 0.2 : 0.75,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <IconPrev />
            </button>

            <button onClick={togglePlay} disabled={!hasAudio} aria-label={isPlaying ? "Pause" : "Lecture"} style={{
              width: 72, height: 72, borderRadius: "50%",
              background: hasAudio ? "white" : "rgba(255,255,255,0.12)",
              border: "none", cursor: hasAudio ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hasAudio ? "#1a1208" : "rgba(255,255,255,0.25)",
              boxShadow: hasAudio ? "0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)" : "none",
            }}>
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button onClick={nextScene} disabled={sceneIdx === total - 1} aria-label="Suivant" style={{
              width: 48, height: 48, background: "transparent", border: "none",
              cursor: sceneIdx === total - 1 ? "default" : "pointer",
              opacity: sceneIdx === total - 1 ? 0.2 : 0.75,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <IconNext />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
