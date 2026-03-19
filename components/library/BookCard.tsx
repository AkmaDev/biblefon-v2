"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Lock } from "lucide-react"
import type { Book } from "@/lib/books"

interface BookCardProps {
  book: Book
  index: number
}

export function BookCard({ book, index }: BookCardProps) {
  const delay = index * 100

  const cardContent = (
    <article
      className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-500
        bg-[var(--card)] border-[var(--border)]
        ${book.comingSoon
          ? "opacity-75 cursor-not-allowed"
          : "hover:border-[var(--gold)]/40 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,146,42,0.15)]"
        }`}
    >
      {/* ── Cover image ── */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
              <Lock className="w-4 h-4 text-white/70" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">À venir</span>
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

        {/* ▶ Play button — toujours visible au centre */}
        {!book.comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{
                width: 72, height: 72,
                background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}cc)`,
                boxShadow: `0 8px 32px ${book.accentColor}88`,
              }}
            >
              <span style={{ fontSize: 28, marginLeft: 5 }}>▶</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Infos sous l'image ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2">

        {/* Fon title + French title */}
        <div>
          <p className="text-[11px] font-medium opacity-75 truncate" style={{ color: book.accentColor }}>
            {book.titleFon}
          </p>
          <h2 className="text-base font-bold text-white leading-tight">
            {book.title}
          </h2>
        </div>

        {/* Métadonnées */}
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {book.readingTime}
          </span>
          <span>{book.ageRange}</span>
        </div>

        {/* CTA */}
        {book.comingSoon ? (
          <div className="flex items-center justify-center h-12 rounded-xl bg-white/10 text-xs font-semibold text-white/40 mt-1">
            Bientôt disponible
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 mt-1">
            <div
              className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200"
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
            <p className="text-[10px] text-stone-500">pages avancent automatiquement</p>
          </div>
        )}
      </div>
    </article>
  )

  if (book.comingSoon) {
    return (
      <div style={{ animationDelay: `${delay}ms` }}>
        {cardContent}
      </div>
    )
  }

  return (
    <Link
      href={`/story/${book.id}`}
      className="group block"
      style={{ animationDelay: `${delay}ms` }}
    >
      {cardContent}
    </Link>
  )
}
