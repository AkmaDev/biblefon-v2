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
          : "hover:border-[var(--gold)]/40 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,146,42,0.15)]"
        }`}
    >
      {/* Cover image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className={`object-cover transition-transform duration-700 ${book.comingSoon ? "" : "group-hover:scale-105"}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index < 3}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Coming soon overlay */}
        {book.comingSoon && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
              <Lock className="w-4 h-4 text-white/70" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">À venir</span>
            </div>
          </div>
        )}

        {/* Testament badge */}
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

        {/* Big play button — centre de l'image, visible au hover */}
        {!book.comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className="flex items-center justify-center rounded-full shadow-2xl"
              style={{
                width: 64, height: 64,
                background: `linear-gradient(135deg, ${book.accentColor}, ${book.accentColor}cc)`,
                boxShadow: `0 8px 32px ${book.accentColor}66`,
              }}
            >
              <span style={{ fontSize: 26, marginLeft: 4 }}>▶</span>
            </div>
          </div>
        )}

        {/* Bottom overlay — titre + CTA audio */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 55%, transparent 100%)" }}
        >
          <p className="text-xs font-medium mb-0.5 opacity-75" style={{ color: book.accentColor }}>
            {book.titleFon}
          </p>
          <h2 className="text-base font-bold text-white leading-tight mb-3">
            {book.title}
          </h2>

          {/* Métadonnées */}
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {book.readingTime}
            </span>
            <span>{book.ageRange}</span>
          </div>

          {/* CTA principal — Écouter en Fon */}
          {book.comingSoon ? (
            <div className="flex items-center justify-center h-12 rounded-xl bg-white/10 text-xs font-semibold text-white/40">
              Bientôt disponible
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 group-hover:shadow-lg"
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
