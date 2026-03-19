"use client"

export function ScrollChevron() {
  const scrollToLibrary = () => {
    document.getElementById("bibliotheque")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollToLibrary}
      aria-label="Voir les histoires"
      className="chevron-btn"
      style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "50%",
        width: 44,
        height: 44,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Double chevron SVG */}
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden="true">
        <polyline points="2,2 9,8 16,2" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2,10 9,16 16,10" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <style>{`
        .chevron-btn {
          animation: chevron-bounce 2s ease-in-out infinite;
        }
        @keyframes chevron-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0);   opacity: 0.7; }
          50%       { transform: translateX(-50%) translateY(6px); opacity: 1;   }
        }
        .chevron-btn:hover {
          animation-play-state: paused;
          background: rgba(255,255,255,0.14) !important;
        }
      `}</style>
    </button>
  )
}
