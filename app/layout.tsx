import type { Metadata, Viewport } from "next"
import { Lora, Inter } from "next/font/google"
import "./globals.css"
import { PwaRegistrar } from "./_components/PwaRegistrar"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#c9922a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "BibleFon — Histoires Bibliques en Langue Fon",
  description:
    "Histoires bibliques illustrées, racontées en langue fon. Pour les enfants du Bénin et de la diaspora — des récits de foi dans leur langue maternelle.",
  keywords: ["Bible", "Fon", "Bénin", "histoires pour enfants", "langue fon", "audio"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BibleFon",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg" }],
  },
  openGraph: {
    title: "BibleFon",
    description: "Histoires bibliques illustrées en langue fon",
    type: "website",
    images: [{ url: "/logo.svg", width: 320, height: 80, alt: "BibleFon" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-BJ" className={`${inter.variable} ${lora.variable}`}>
      <body className="antialiased">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  )
}
