# BibleFon — De la V1 à la V2 : Récapitulatif complet

## Vue d'ensemble

La V2 est une refonte complète de la plateforme BibleFon : passage d'un lecteur de livre animé (flipbook CSS 3D) à une expérience audio-first inspirée d'Apple Music / Spotify.

---

## 1. Architecture & routing

| | V1 | V2 |
|---|---|---|
| Route lecteur | `/flipbook/[id]` | `/story/[id]` |
| Composant principal | `StoryReader.tsx` (flipbook CSS 3D) | `StoryPlayer.tsx` (audio player) |
| Chargement | `dynamic(() => import(...), { ssr: false })` | `"use client"` direct |

---

## 2. Page d'accueil (`app/page.tsx`)

**Supprimé :**
- Strip "fonctionnalités" (3 colonnes avec icônes)
- Plusieurs CTAs redondants
- Sous-titre hero

**Gardé / ajouté :**
- Hero minimaliste : image `/hero.jpg` + titre `BibleFon` uniquement
- `<ScrollChevron />` — double chevron animé (bounce 2s) qui scroll vers la bibliothèque
- Footer simplifié : "Audio propulsé par Meta MMS-TTS-FON · Illustrations par IA"

---

## 3. Navbar (`components/ui/Navbar.tsx`)

- **Tagline** "Audio · Illustré · En Langue Fon" : visible au top, se masque au scroll (max-height 0, opacity 0)
- Scroll threshold : `window.scrollY > 60`
- `whiteSpace: "nowrap"` sur tagline ET bouton "À propos" pour éviter le wrapping mobile
- Taille tagline : `text-[9px]` (assez petit pour tenir sur tous les mobiles)

---

## 4. Bibliothèque — BookCard (`components/library/BookCard.tsx`)

**Supprimé :**
- Description de l'histoire
- Badge "16 pages" (page count)
- Lien "Lire →"
- Texte overlay "pages avancent automatiquement"

**Modifié :**
- `aspect-[2/3]` → `aspect-[3/4]` (cartes moins allongées, plus compactes)
- Badge testament retiré puis restauré (top-left, couleur `accentColor`)
- Ombre profonde triple couche à la place de la bordure visible :
  ```css
  box-shadow:
    0 24px 60px rgba(0,0,0,0.6),
    0 8px 20px rgba(0,0,0,0.4),
    0 2px 6px rgba(0,0,0,0.25);
  ```
- `rounded-xl` (12px) — identique à V1
- Bouton CTA : "Écouter en Fon" (David) / "Bientôt disponible" (autres)
- Hover : `hover:-translate-y-1` (sans bordure dorée)

**Grille (BookGrid) — inchangée par rapport à V1 :**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl`

---

## 5. Player audio (`components/reader/StoryPlayer.tsx`)

### Architecture générale
- Playlist `Scene[]` construite depuis `book.pages` (skip `title` et `meta`)
- Chaque scène : `{ image, fonText, audioSrc, wordTimestamps? }`
- Timestamps karaoke chargés depuis `/word_timestamps.json` au runtime

### Layout responsive
**Mobile (< 768px) :**
- Plein écran `fixed inset-0`, colonne flex
- Image : `flex:1`, carré `width: min(100%, calc(100vh - 390px))`, `border-radius: 22px`
- Ombre triple couche : `0 40px 100px`, `0 16px 40px`, `0 4px 10px`
- Zone texte : `height: 76px`, `overflow-y: auto`, scrollbar cachée, auto-scroll
- Bouton play : blanc 72px

**Desktop (≥ 768px) :**
- Colonne centrée `max-width: 520px`, `justify-content: center` (verticalement centré)
- Image : `width: min(100%, 45vh)`, carré, `border-radius: 20px`
- Zone texte : `height: 88px`, `overflow-y: auto`, scrollbar cachée, auto-scroll
- Bouton play : blanc 64px
- Contrôles : `gap: 48px`, centrés

### Fond dynamique (Apple Music style)
- `fast-average-color` extrait la couleur dominante de l'image
- Assombrie × 0.22 → couleur de fond
- Image courante floutée (`blur(90px) saturate(1.6)`, opacity 0.28) en `position: fixed`
- Transition 1.2s ease entre scènes

### Karaoke
- Mots surlignés en `#c8a040`, `font-weight: 600`, `text-shadow` doré
- Auto-scroll : `activeWordRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })`
- Fallback sans timestamps : index proportionnel au temps

### Audio — gestion fine des erreurs
- `NotAllowedError` (autoplay bloqué) → pause silencieuse, **pas** de message d'erreur
- Autres erreurs → `console.error("[BibleFon] Erreur audio:", src, err)` + message "Fichier audio introuvable"
- `play().then(() => setAudioError(false))` — efface l'erreur si l'audio reprend

### Header du player
- Titre en fon : doré `#c8a040`, police serif
- Titre en français : blanc, dessous
- Badge `X / N` : fond `rgba(255,255,255,0.08)`
- Bouton retour : `←` (SVG chevron), cercle semi-transparent

### Icônes
- SVG inline (pas d'emoji) : `IconPlay`, `IconPause`, `IconPrev`, `IconNext`

### Animation image
- `scale(1)` en lecture → `scale(0.95/0.97)` en pause
- Transition `cubic-bezier(0.34, 1.4, 0.64, 1)` 500ms

### Media Session API
- Métadonnées : titre, artiste "BibleFon", artwork, album = fonText tronqué
- Handlers : play, pause, nexttrack, previoustrack

### Swipe mobile
- Delta > 50px → nextScene (gauche) / prevScene (droite)

### Progress bar scrubable
- Click sur la barre → `currentTime` mis à jour
- Thumb blanc 12px

---

## 6. Karaoke — Pipeline de génération (`monmaster/biblefon_karaoke_alignment.ipynb`)

- **Modèle** : `facebook/mms-1b-all` (MMS forced alignment via torchaudio)
- `torchaudio.functional.forced_align` → timestamps mot par mot
- Output : `/public/word_timestamps.json`
- Structure : `{ "audio/david/1.wav": [{ word, start, end }, ...], ... }`
- Script de génération : `make_nb.js` (extrait les fonTexts exacts de `lib/books.ts`)

---

## 7. Types (`lib/books.ts`)

Ajoutés :
```typescript
export interface WordTimestamp { word: string; start: number; end: number }
export interface AudioFile { src: string; fonText: string; words?: WordTimestamp[] }
```

---

## 8. Cohérence visuelle carte ↔ player

- Même ombre profonde triple couche sur les cartes et l'image du player
- Même `border-radius` arrondi
- Titre en fon doré `#c8a040` sur les deux (carte : `accentColor` / player : `#c8a040`)
- Fond sombre identique (`var(--card)` / `bgColor` dynamique)
- Résultat : l'utilisateur reconnaît le même univers visuel entre la bibliothèque et le player

---

## 9. Décisions de design notables

| Décision | Raison |
|---|---|
| Fond flou Apple Music | Immersion, cohérence avec l'artwork |
| Pas d'overlay sur l'image (play/pause) | "Le bouton en bas suffit" — simplicité iOS |
| Titre fon en doré | Fon = identité centrale du projet, doré = couleur signature |
| Autoplay → pause silencieuse | `NotAllowedError` n'est pas une vraie erreur |
| `width: min(100%, calc(100vh - 390px))` | Carré parfait sur mobile sans JS |
| Bouton play blanc (desktop ET mobile) | Cohérence inter-breakpoints |
