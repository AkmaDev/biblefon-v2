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
  return {
    title: `${book.title} — BibleFon`,
    description: book.description,
    openGraph: { images: [book.cover] },
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const book = getBookById(id)
  if (!book) notFound()
  return <StoryPlayer book={book} />
}
