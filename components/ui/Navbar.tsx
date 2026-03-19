"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{
        background: "linear-gradient(to bottom, rgba(8,6,4,0.75) 0%, transparent 100%)",
        paddingTop: scrolled ? 12 : 16,
        paddingBottom: scrolled ? 12 : 16,
        transition: "padding 0.3s ease",
      }}
    >
      <div className="flex flex-col overflow-hidden">
        <span
          className="font-bold text-white text-base leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          BibleFon
        </span>
        <span
          className="text-[9px] font-semibold tracking-widest uppercase leading-tight"
          style={{
            color: "var(--gold-light)",
            maxHeight: scrolled ? 0 : 20,
            opacity: scrolled ? 0 : 0.8,
            transition: "max-height 0.3s ease, opacity 0.3s ease",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          Audio · Illustré · En Langue Fon
        </span>
      </div>

      <Link
        href="/about"
        className="text-sm px-4 py-1.5 rounded-full transition-all duration-200
          hover:text-white text-white/60 border border-white/10 hover:border-white/25"
        style={{ whiteSpace: "nowrap" }}
      >
        À propos
      </Link>
    </nav>
  )
}
