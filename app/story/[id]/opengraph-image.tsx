import { ImageResponse } from "next/og"
import { books } from "@/lib/books"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export async function generateStaticParams() {
  return books.filter(b => !b.comingSoon).map(b => ({ id: b.id }))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = books.find(b => b.id === id)

  if (!book) {
    // Fallback to default OG
    return new ImageResponse(
      <div
        style={{
          width: "100%", height: "100%",
          background: "#0c0804",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#c9922a", fontSize: 80, fontFamily: "Georgia, serif",
        }}
      >
        BibleFon
      </div>,
      { width: 1200, height: 630 }
    )
  }

  // Load cover image as base64 for reliable edge rendering
  const coverUrl = `https://biblefon.org${book.cover}`

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#0c0804",
      }}
    >
      {/* Cover image — right side */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt=""
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "55%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Gradient overlay — left to right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, #0c0804 40%, rgba(12,8,4,0.85) 65%, rgba(12,8,4,0.1) 100%)",
          display: "flex",
        }}
      />

      {/* Gold border top */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 5,
          background: "linear-gradient(90deg, #c9922a, #e8b84b, #c9922a)",
        }}
      />

      {/* Content — left aligned */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 72px",
        }}
      >
        {/* BibleFon badge */}
        <div
          style={{
            fontSize: 18,
            color: "#c9922a",
            fontFamily: "Arial, sans-serif",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          BibleFon
        </div>

        {/* Title in Fon — gold, large */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#c9922a",
            fontFamily: "Georgia, serif",
            lineHeight: 1.2,
            marginBottom: 14,
            maxWidth: 580,
          }}
        >
          {book.titleFon}
        </div>

        {/* Title in French */}
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "Arial, sans-serif",
            marginBottom: 36,
            maxWidth: 520,
          }}
        >
          {book.title}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "Arial, sans-serif",
              background: "rgba(201,146,42,0.12)",
              border: "1px solid rgba(201,146,42,0.3)",
              padding: "6px 16px",
              borderRadius: 20,
            }}
          >
            {book.readingTime}
          </span>
          <span
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "Arial, sans-serif",
              background: "rgba(201,146,42,0.12)",
              border: "1px solid rgba(201,146,42,0.3)",
              padding: "6px 16px",
              borderRadius: 20,
            }}
          >
            {book.ageRange}
          </span>
        </div>
      </div>

      {/* Bottom border */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 5,
          background: "linear-gradient(90deg, #c9922a, #e8b84b, #c9922a)",
        }}
      />
    </div>,
    { width: 1200, height: 630 }
  )
}
