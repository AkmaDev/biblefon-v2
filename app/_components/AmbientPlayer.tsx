"use client"

import { useEffect, useRef, useState } from "react"

const VOLUME_NORMAL = 0.28   // rule 3 : max 0.3
const VOLUME_DUCKED = 0.06
const STORAGE_KEY   = "biblefon-ambient-muted"

/* Fade vers une cible, appelle onComplete quand atteinte */
function fadeTo(
  audio: HTMLAudioElement,
  target: number,
  onComplete?: () => void,
): ReturnType<typeof setInterval> {
  const step = 0.012
  const id = setInterval(() => {
    const next =
      target > audio.volume
        ? Math.min(audio.volume + step, target)
        : Math.max(audio.volume - step, target)
    audio.volume = next
    if (Math.abs(audio.volume - target) < 0.001) {
      audio.volume = target
      clearInterval(id)
      onComplete?.()
    }
  }, 60)
  return id
}

export function AmbientPlayer() {
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const fadeRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(false)   // chevron cliqué au moins une fois
  const mutedRef   = useRef(false)   // ref sync pour callbacks async

  const [muted,   setMuted]   = useState(false)
  const [visible, setVisible] = useState(false)

  const clearFade = () => {
    if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null }
  }

  /* Crée l'audio UNE SEULE FOIS et démarre */
  const startAmbient = () => {
    if (audioRef.current) return  // singleton — jamais deux instances
    const audio = new Audio("/audio/backaccueilnew.mp3")
    audio.loop   = true  // boucle infinie
    audio.volume = 0
    audio.muted  = true  // trick cross-browser autoplay
    audioRef.current = audio
    audio.play()
      .then(() => {
        audio.muted = false
        clearFade()
        fadeRef.current = fadeTo(audio, VOLUME_NORMAL)
      })
      .catch(() => {
        // Blocked — garde la ref, réessaie au prochain interaction si besoin
      })
  }

  /* Duck (foreground audio démarre) */
  const duck = () => {
    if (mutedRef.current || !audioRef.current || audioRef.current.paused) return
    clearFade()
    fadeRef.current = fadeTo(audioRef.current, VOLUME_DUCKED)
  }

  /* Restore (foreground audio terminé) */
  const restore = () => {
    if (mutedRef.current || !audioRef.current || audioRef.current.paused) return
    clearFade()
    fadeRef.current = fadeTo(audioRef.current, VOLUME_NORMAL)
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "true"
    setMuted(saved)
    mutedRef.current = saved

    const onChevron = () => {
      if (startedRef.current) return
      startedRef.current = true
      setVisible(true)
      if (!mutedRef.current) startAmbient()
    }

    window.addEventListener("biblefon:chevron-click", onChevron)
    window.addEventListener("biblefon:stop-lib",      duck    as EventListener)
    window.addEventListener("biblefon:lib-start",     duck    as EventListener)
    window.addEventListener("biblefon:preview-stop",  restore as EventListener)
    window.addEventListener("biblefon:chain-end",     restore as EventListener)
    window.addEventListener("biblefon:lib-end",       restore as EventListener)

    return () => {
      window.removeEventListener("biblefon:chevron-click", onChevron)
      window.removeEventListener("biblefon:stop-lib",      duck    as EventListener)
      window.removeEventListener("biblefon:lib-start",     duck    as EventListener)
      window.removeEventListener("biblefon:preview-stop",  restore as EventListener)
      window.removeEventListener("biblefon:chain-end",     restore as EventListener)
      window.removeEventListener("biblefon:lib-end",       restore as EventListener)
      clearFade()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = "" }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    mutedRef.current = next
    localStorage.setItem(STORAGE_KEY, String(next))

    const audio = audioRef.current

    if (next) {
      /* ── MUTE : fade out → pause uniquement si toujours muted à la fin ── */
      clearFade()
      if (audio && !audio.paused) {
        fadeRef.current = fadeTo(audio, 0, () => {
          if (mutedRef.current) audio.pause()
        })
      }
    } else {
      /* ── UNMUTE ── */
      clearFade()

      if (!startedRef.current) {
        // Chevron pas encore cliqué → démarre maintenant (ce clic = user gesture)
        startedRef.current = true
        startAmbient()
        return
      }

      if (!audio) {
        startAmbient()
        return
      }

      if (audio.paused) {
        // Reprendre depuis silence (pas recréer)
        audio.volume = 0
        audio.play()
          .then(() => { fadeRef.current = fadeTo(audio, VOLUME_NORMAL) })
          .catch(() => {})
      } else {
        // Audio encore en cours (mi-fade-down) → remonter
        fadeRef.current = fadeTo(audio, VOLUME_NORMAL)
      }
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Activer la musique d'ambiance" : "Couper la musique d'ambiance"}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 200,
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(18,16,13,0.88)",
        border: "1px solid rgba(201,146,42,0.28)",
        backdropFilter: "blur(8px)",
        color: "#c8a040",
        fontSize: 17,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  )
}
