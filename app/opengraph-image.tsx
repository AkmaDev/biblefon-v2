import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(145deg, #0c0804 0%, #1a1208 55%, #0c0804 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gold border top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "linear-gradient(90deg, #c9922a, #e8b84b, #c9922a)",
        }}
      />

      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,146,42,0.12) 0%, transparent 70%)",
        }}
      />

      {/* BibleFon title */}
      <div
        style={{
          fontSize: 108,
          fontWeight: 700,
          color: "#c9922a",
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 24,
        }}
      >
        BibleFon
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 34,
          color: "rgba(255,255,255,0.65)",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          letterSpacing: "0.03em",
        }}
      >
        Histoires Bibliques en Langue Fon
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 20,
          fontSize: 22,
          color: "rgba(201,146,42,0.6)",
          fontFamily: "Arial, sans-serif",
          letterSpacing: "0.08em",
        }}
      >
        biblefon.org
      </div>

      {/* Gold border bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "linear-gradient(90deg, #c9922a, #e8b84b, #c9922a)",
        }}
      />
    </div>,
    { width: 1200, height: 630 }
  )
}
