# BibleFon V2 — SKILL.md
## Erreurs rencontrées & instructions pour gagner du temps

---

## RÈGLES ABSOLUES

### 1. Isoler chaque changement par breakpoint
```
Mobile  → max-width: 767px
Desktop → min-width: 768px
```
Ne jamais modifier un breakpoint quand on touche à l'autre. Tester 390px ET 1280px après chaque modification.

### 2. Ne jamais toucher simultanément
- Mobile player + Desktop player (un à la fois)
- Layout + Audio logic (un à la fois)
- Carte + Player (un à la fois)

### 3. Toujours déployer après chaque modification
```bash
vercel deploy --prod
```

---

## ERREURS FRÉQUENTES & FIXES

### ❌ "Audio indisponible" au rechargement de page
**Cause** : `play()` rejette avec `NotAllowedError` — autoplay bloqué par le navigateur (pas d'interaction utilisateur). Ce n'est PAS une erreur de fichier manquant.

**Fix** :
```typescript
audio.play()
  .then(() => setAudioError(false))
  .catch((err: Error) => {
    if (err.name === "NotAllowedError") {
      setIsPlaying(false) // pause silencieuse, pas de message
    } else {
      console.error("[BibleFon] Erreur audio:", src, err.name, err.message)
      setAudioError(true)
    }
  })
```

---

### ❌ Image non carrée sur desktop (s'étire en largeur)
**Cause** : `width: "100%"` + `aspectRatio: "1/1"` + `maxHeight: "100%"` ne donne pas un carré — `maxHeight` ne réduit pas la largeur.

**Fix mobile** :
```css
width: min(100%, calc(100vh - 390px));
aspect-ratio: 1 / 1;
```

**Fix desktop** :
```css
width: min(100%, 45vh);
aspect-ratio: 1 / 1;
align-self: center;
```

---

### ❌ Zone texte karaoke pousse les contrôles hors écran
**Cause** : hauteur de la zone texte trop grande, ou `maxHeight` au lieu de `height` fixe.

**Fix** : Toujours utiliser `height` fixe (pas `maxHeight`) pour que `overflowY: auto` + `scrollIntoView` fonctionnent :
```css
height: 88px;       /* desktop */
height: 76px;       /* mobile */
overflow-y: auto;
scrollbar-width: none;
```

---

### ❌ `scrollIntoView` ne fonctionne pas dans la zone karaoke
**Cause** : `maxHeight` au lieu de `height` — le container n'est pas un vrai scroll container sans hauteur fixe.

**Fix** : Remplacer `maxHeight` par `height`.

---

### ❌ Texte karaoke affiché en double
**Cause** : deux blocs affichent le même texte — un bloc "aperçu statique" tronqué ET le bloc karaoke avec highlighting.

**Fix** : Supprimer le bloc aperçu statique. Un seul bloc karaoke suffit.

---

### ❌ Notebook Colab : JSON invalide (`Bad escaped character`)
**Cause** : `\` suivi d'un espace dans une chaîne JSON (commentaire Python dans le notebook).

**Fix** : Générer le notebook programmatiquement via Node.js avec `JSON.stringify()` — garantit un JSON valide :
```javascript
// make_nb.js
const nb = { cells: [...], metadata: {...}, nbformat: 4, nbformat_minor: 5 }
fs.writeFileSync("notebook.ipynb", JSON.stringify(nb, null, 1))
```

---

### ❌ fonTexts incorrects dans le notebook karaoke
**Cause** : fonTexts écrits de mémoire — légèrement différents des vrais textes dans `lib/books.ts`.

**Fix** : Extraire les fonTexts programmatiquement depuis `lib/books.ts` :
```javascript
const content = fs.readFileSync("lib/books.ts", "utf8")
const matches = [...content.matchAll(/fonText:\s*"([^"]+)"/g)]
```

---

### ❌ `npm ci` vs `npm install` sur biblefon-v2
**Cause** : `npm install` installe une version de Next.js légèrement différente du lock file, cassant `dist/bin/next`.

**Fix** : Toujours utiliser `npm ci` pour respecter exactement le lock file.

---

### ❌ Build TypeScript échoue (scripts inclus dans la compilation)
**Cause** : `tsconfig.json` sans `exclude: ["scripts"]` → `generate-illustrations.ts` est compilé avec l'app.

**Fix** :
```json
{
  "exclude": ["node_modules", "scripts"]
}
```

---

## ARCHITECTURE STABLE — NE PAS MODIFIER

```
StoryPlayer.tsx
├── buildScenes()         — skip type "title" et "meta"
├── isDesktop state       — useEffect window.resize, threshold 768px
├── tryPlay()             — gestion fine NotAllowedError vs vraie erreur
├── fast-average-color    — import dynamique, couleur × 0.22
├── KaraokeZone()         — height fixe, overflowY auto, activeWordRef
└── Backgrounds JSX       — position: fixed, zIndex: 0
```

---

## COULEURS DU BRAND

| Token | Valeur | Usage |
|---|---|---|
| Gold principal | `#c8a040` | Mot karaoke, barre progression, titre fon player |
| Gold hover | `#e8bc50` | Text-shadow karaoke |
| Fond sombre | `#130e07` | Background par défaut |
| Bouton play | `white` | Mobile ET desktop (cohérence) |
| Texte muted | `rgba(255,255,255,0.35)` | Timestamps, badges |

---

## COMMANDES UTILES

```bash
# Développement local
cd c:/Users/manew/Documents/NEXTJS/biblefon-v2
npm run dev

# Déploiement production
vercel deploy --prod

# Génération illustrations
npm run generate

# Génération notebook karaoke
node make_nb.js
```

---

## FICHIERS CLÉS

| Fichier | Rôle |
|---|---|
| `components/reader/StoryPlayer.tsx` | Player audio principal |
| `components/library/BookCard.tsx` | Carte bibliothèque |
| `components/library/BookGrid.tsx` | Grille (`1→2→3 cols`) |
| `components/ui/Navbar.tsx` | Navbar avec scroll behavior |
| `components/ui/ScrollChevron.tsx` | Chevron animé hero |
| `lib/books.ts` | Types + données livres |
| `public/word_timestamps.json` | Timestamps karaoke (généré par Colab) |
| `monmaster/biblefon_karaoke_alignment.ipynb` | Pipeline MMS forced alignment |
