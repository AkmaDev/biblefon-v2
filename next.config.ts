// next.config.ts
/** @type {import('next').NextConfig} */

const cspHeader = [
  "default-src 'self'",
  // Scripts locaux (Service Worker inclus)
  "script-src 'self' 'unsafe-inline'",
  // Inline styles nécessaires (nombreux objets style JSX)
  "style-src 'self' 'unsafe-inline'",
  // Images locales + Pexels/Unsplash + blobs SVG
  "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com",
  // Blobs audio (TTS) + audio local
  "media-src 'self' blob:",
  // API HuggingFace pour TTS + SW fetch
  "connect-src 'self' https://api-inference.huggingface.co",
  // Polices Google Fonts chargées localement par Next.js
  "font-src 'self' data:",
  // Service Workers depuis la même origine
  "worker-src 'self'",
  // Pas d'embedding dans une iframe externe
  "frame-ancestors 'none'",
  // Empêche les injections de base URL
  "base-uri 'self'",
  // Limit form submissions to same origin
  "form-action 'self'",
].join("; ")

const nextConfig: import('next').NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: cspHeader },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Cache long pour les fichiers audio (immutables une fois produits)
      {
        source: "/audio/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache long pour les illustrations
      {
        source: "/illustrations/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
