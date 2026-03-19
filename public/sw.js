/* ─────────────────────────────────────────────────────────────
   BibleFon Service Worker — cache-first pour audio et images
   network-first pour les pages
───────────────────────────────────────────────────────────────*/
const CACHE_VER    = 'v1'
const AUDIO_CACHE  = `biblefon-audio-${CACHE_VER}`
const IMAGE_CACHE  = `biblefon-img-${CACHE_VER}`
const STATIC_CACHE = `biblefon-static-${CACHE_VER}`

const ALL_CACHES = [AUDIO_CACHE, IMAGE_CACHE, STATIC_CACHE]

/* ── Install : precache la page d'accueil ────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(['/']).catch(() => {})
    )
  )
  self.skipWaiting()
})

/* ── Activate : supprime les vieux caches ────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !ALL_CACHES.includes(k))
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

/* ── Fetch ───────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-GET et requêtes externes (HuggingFace, etc.)
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Audio → cache-first (priorité offline)
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(cacheFirst(AUDIO_CACHE, request))
    return
  }

  // Images → cache-first
  if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/)) {
    event.respondWith(cacheFirst(IMAGE_CACHE, request))
    return
  }

  // Next.js static chunks → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(STATIC_CACHE, request))
    return
  }

  // Pages et API → network-first avec fallback cache
  event.respondWith(networkFirst(STATIC_CACHE, request))
})

/* ── Stratégies ─────────────────────────────────────────── */
async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok && response.status < 400) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Contenu indisponible hors connexion.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

async function networkFirst(cacheName, request) {
  try {
    const response = await fetch(request)
    if (response.ok && response.status < 400) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response('Hors connexion — démarre une histoire pour la télécharger.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
