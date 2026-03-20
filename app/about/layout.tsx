import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "À propos — BibleFon",
  description:
    "BibleFon : histoires bibliques illustrées en langue fon, pour les communautés orales d'Afrique de l'Ouest. Un projet de numérique inclusif par Manassé A. AKPOVI.",
  openGraph: {
    title: "À propos — BibleFon",
    description:
      "BibleFon : histoires bibliques illustrées en langue fon, pour les communautés orales d'Afrique de l'Ouest.",
    siteName: "BibleFon",
  },
  twitter: {
    card: "summary_large_image",
    title: "À propos — BibleFon",
  },
  alternates: {
    canonical: "/about",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
