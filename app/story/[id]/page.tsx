import { notFound } from "next/navigation"
import { getBookById } from "@/lib/books"
import { StoryPlayer } from "@/components/reader/StoryPlayer"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const book = getBookById(id)
  if (!book) return { title: "Livre introuvable" }

  const description = `${book.description} Écouter l'histoire "${book.titleFon}" en langue fon — ${book.readingTime}, pour ${book.ageRange}.`

  return {
    title: `${book.title} — BibleFon`,
    description,
    openGraph: {
      title: `${book.titleFon} · ${book.title}`,
      description,
      type: "website",
      siteName: "BibleFon",
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.titleFon} · ${book.title}`,
      description,
    },
    alternates: {
      canonical: `/story/${id}`,
    },
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const book = getBookById(id)
  if (!book) notFound()

  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "AudioObject",
    name: book.title,
    alternateName: book.titleFon,
    description: book.description,
    inLanguage: "fon",
    url: `https://biblefon.org/story/${book.id}`,
    thumbnailUrl: `https://biblefon.org${book.cover}`,
    creator: {
      "@type": "Organization",
      name: "BibleFon",
      url: "https://biblefon.org",
    },
    audience: {
      "@type": "Audience",
      audienceType: book.ageRange,
      geographicArea: "Bénin, Afrique de l'Ouest",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "BibleFon",
      url: "https://biblefon.org",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <StoryPlayer book={book} />
    </>
  )
}
