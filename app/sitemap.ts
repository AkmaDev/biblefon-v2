import type { MetadataRoute } from "next"
import { books } from "@/lib/books"

const BASE = "https://biblefon.org"

export default function sitemap(): MetadataRoute.Sitemap {
  const storyRoutes = books
    .filter(b => !b.comingSoon)
    .map(b => ({
      url: `${BASE}/story/${b.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }))

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...storyRoutes,
  ]
}
