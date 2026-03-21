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
    if (page.type === "ending") {
      const audioFiles = page.audioFiles ?? []
      if (audioFiles.length > 0) {
        for (const af of audioFiles) {
          scenes.push({ image: "", fonText: af.fonText, audioSrc: af.src, wordTimestamps: tsMap[af.src] ?? af.words })
        }
      } else {
        scenes.push({ image: "", fonText: page.fonText ?? page.body, audioSrc: null })
      }
      continue
    }
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
function IconSpinner({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="40" strokeDashoffset="15" />
    </svg>
  )
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
  const [isBuffering, setIsBuffering] = useState(false)
  const [touchStart, setTouchStart]   = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [bgColor, setBgColor]         = useState("#130e07")
  const [isDesktop, setIsDesktop]     = useState(false)
  const [copied, setCopied]           = useState(false)

  const audioRef         = useRef<HTMLAudioElement | null>(null)
  const activeWordRef    = useRef<HTMLSpanElement | null>(null)
  const trackedPlayRef   = useRef<number>(-1)   // sceneIdx déjà tracké pour story_audio_play
  const trackedHalfRef   = useRef<number>(-1)   // sceneIdx déjà tracké pour story_progress_50

  const current      = scenes[sceneIdx] ?? scenes[0]
  const total        = scenes.length
  const hasAudio     = !!current?.audioSrc
  const isEnding     = current?.image === ""
  const displayImage = isEnding ? "" : (current?.image || book.cover)

  /* ── Détection breakpoint ── */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener("resize", check, { passive: true })
    return () => window.removeEventListener("resize", check)
  }, [])

  /* ── Couleur de fond dynamique ── */
  useEffect(() => {
    if (!current?.image || isEnding) return
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

  /**
   * wordFractions — position de début de chaque mot en fraction [0, 1] du temps total.
   * Pondère les pauses naturelles à la ponctuation pour que le surlignage
   * ralentisse aux virgules/points et reste aligné avec la prosodie.
   */
  const wordFractions = useMemo(() => {
    if (current?.wordTimestamps?.length) return null  // timestamps exacts disponibles
    if (words.length === 0) return null
    // Poids additionnel après ponctuation (en fraction d'un mot supplémentaire)
    const PAUSES: Record<string, number> = {
      ",": 0.5, ";": 0.7, ":": 0.6,
      ".": 1.2, "!": 1.2, "?": 1.2, "»": 0.4,
    }
    const weights = words.map(w => 1 + (PAUSES[w.slice(-1)] ?? 0))
    const total   = weights.reduce((s, w) => s + w, 0)
    let cum = 0
    return words.map((_, i) => {
      const f = cum / total
      cum += weights[i]
      return f
    })
  }, [words, current])

  const currentWordIdx = useMemo(() => {
    if (current?.wordTimestamps?.length) {
      const wts = current.wordTimestamps
      return wts.findIndex((w, i) =>
        currentTime >= w.start && (i === wts.length - 1 || currentTime < wts[i + 1].start)
      )
    }
    if (!wordFractions || duration <= 0) return -1
    const frac = currentTime / duration
    // Dernier mot dont la fraction de départ est ≤ frac courant
    let idx = -1
    for (let i = 0; i < wordFractions.length; i++) {
      if (frac >= wordFractions[i]) idx = i
      else break
    }
    return idx
  }, [current, currentTime, duration, wordFractions])

  /* ── Auto-scroll karaoke — mot actif toujours visible ── */
  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [currentWordIdx])

  /* ── Timeupdate + buffering ── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime     = () => setCurrentTime(audio.currentTime)
    const onMeta     = () => setDuration(audio.duration || 0)
    const onStalled  = () => setIsBuffering(true)
    const onWaiting  = () => setIsBuffering(true)
    const onPlaying  = () => setIsBuffering(false)
    const onCanPlay  = () => setIsBuffering(false)
    audio.addEventListener("timeupdate",     onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("durationchange", onMeta)
    audio.addEventListener("stalled",        onStalled)
    audio.addEventListener("waiting",        onWaiting)
    audio.addEventListener("playing",        onPlaying)
    audio.addEventListener("canplay",        onCanPlay)
    return () => {
      audio.removeEventListener("timeupdate",     onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("durationchange", onMeta)
      audio.removeEventListener("stalled",        onStalled)
      audio.removeEventListener("waiting",        onWaiting)
      audio.removeEventListener("playing",        onPlaying)
      audio.removeEventListener("canplay",        onCanPlay)
    }
  }, [])
  useEffect(() => { setCurrentTime(0); setDuration(0); setIsBuffering(false) }, [sceneIdx])

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

  /* ── Partage Web Share API ── */
  const handleShare = async () => {
    const url = `https://biblefon.org/story/${book.id}`
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: book.titleFon, text: `Écoute cette histoire biblique en langue fon — BibleFon`, url })
        track("story_shared", { book_id: book.id, method: "web_share" })
      } catch { /* annulé par l'utilisateur */ }
    } else {
      await navigator.clipboard.writeText(url)
      track("story_shared", { book_id: book.id, method: "clipboard" })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /* ── Téléchargement audio de la scène ── */
  const handleDownload = () => {
    if (!current?.audioSrc) return
    const a = document.createElement("a")
    a.href = current.audioSrc
    a.download = `biblefon-${book.id}-${sceneIdx + 1}.wav`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    track("story_audio_downloaded", { book_id: book.id, scene_index: sceneIdx })
  }

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
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white", fontFamily: "var(--font-serif, Georgia, serif)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {book.title}
        </p>
      </div>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0, fontVariantNumeric: "tabular-nums", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 20 }}>
        {sceneIdx + 1} / {total}
      </span>

      {/* Bouton Partager */}
      <button
        onClick={handleShare}
        aria-label={copied ? "Lien copié !" : "Partager cette histoire"}
        title={copied ? "Lien copié !" : "Partager"}
        style={{
          width: 34, height: 34, borderRadius: "50%",
          background: copied ? "rgba(45,212,191,0.25)" : "rgba(255,255,255,0.1)",
          border: copied ? "1px solid rgba(45,212,191,0.5)" : "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: copied ? "#2dd4bf" : "rgba(255,255,255,0.8)",
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        {copied ? (
          /* Checkmark */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          /* Share icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
      </button>
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
              {isBuffering && isPlaying ? <IconSpinner size={28} /> : isPlaying ? <IconPause size={28} /> : <IconPlay size={28} />}
            </button>

            <button onClick={nextScene} disabled={sceneIdx === total - 1} aria-label="Suivant" style={{
              width: 28, height: 28, background: "transparent", border: "none",
              cursor: sceneIdx === total - 1 ? "default" : "pointer",
              opacity: sceneIdx === total - 1 ? 0.2 : 0.6,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <IconNext size={28} />
            </button>

            {/* Bouton télécharger la scène */}
            <button onClick={handleDownload} disabled={!hasAudio} aria-label="Télécharger ce passage" title="Télécharger ce passage audio" style={{
              width: 28, height: 28, background: "transparent", border: "none",
              cursor: hasAudio ? "pointer" : "default",
              opacity: hasAudio ? 0.6 : 0.2,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
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

          {/* Image / Ending slide — flex:1 */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: "8px 0" }}>
            {/* Image — cover du livre pour le slide final, illustration pour les autres */}
            <div style={{
              width: "min(100%, calc(100vh - 280px))",
              aspectRatio: "1 / 1",
              position: "relative",
              transform: isPlaying ? "scale(1)" : "scale(0.95)",
              transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
            }}>
              {isEnding
                ? <Image key="ending-cover" src="/illustrations/david/4couverture.jpg" alt="" fill style={{ borderRadius: 22, objectFit: "cover" }} priority />
                : displayImage && <Image key={displayImage} src={displayImage} alt="" fill style={{ borderRadius: 22, objectFit: "contain" }} priority />
              }
            </div>
          </div>

          {/* Zone texte mobile — 56px, overflow auto, scrollbar cachée, auto-scroll */}
          <div style={{ paddingTop: 12, flexShrink: 0 }}>
            {KaraokeZone(56, 15)}
          </div>

          {/* Progress */}
          <div style={{ paddingTop: 14, flexShrink: 0 }}>{ProgressBar}</div>

          {/* Contrôles */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, paddingTop: 20, paddingBottom: "max(40px, 20px)", flexShrink: 0 }}>
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
              {isBuffering && isPlaying ? <IconSpinner size={28} /> : isPlaying ? <IconPause /> : <IconPlay />}
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
