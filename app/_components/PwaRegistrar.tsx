"use client"

import { useEffect } from "react"
import { track } from "@vercel/analytics"

export function PwaRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err))
    }

    const onInstall = () => track("pwa_installed")
    window.addEventListener("appinstalled", onInstall)
    return () => window.removeEventListener("appinstalled", onInstall)
  }, [])

  return null
}
