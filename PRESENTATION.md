# BibleFon — Derrière le projet

*Par Manassé A. AKPOVI*

---

## Le point de départ

Tout a commencé lors d'un hackathon — le SENIA — dont le thème était : **« l'intelligence artificielle au service de nos langues locales »**.

Pour la première fois depuis que je codais, je ne travaillais pas sur une fonctionnalité abstraite. Je travaillais sur quelque chose qui avait du sens pour des millions de personnes. Des personnes réelles, qui parlent une langue réelle — mais que les outils numériques ignorent presque entièrement.

Cette expérience a planté une question qui ne m'a plus quitté :

> *Comment le numérique peut-il prétendre transformer le monde s'il reproduit les mêmes inégalités que le monde analogique ?*

---

## Ce que j'ai compris

Il y a un impensé fondamental dans la façon dont on conçoit les outils numériques.

Nos interfaces sont pensées pour quelqu'un qui sait lire, qui maîtrise une langue dominante — souvent l'anglais ou le français —, et qui dispose d'une connexion stable. Ce n'est pas un choix délibéré d'exclusion. C'est simplement que les personnes qui conçoivent ces outils ne réalisent pas que cette personne n'est pas universelle.

Selon l'UNESCO, près de **500 millions d'adultes en Afrique subsaharienne** sont en situation d'analphabétisme. Ces personnes ne sont pas exclues du numérique par manque d'intérêt ou de capacité. Elles en sont exclues **par conception**.

En 2022, Google Traduction a intégré la langue fon. Une belle avancée. Mais une traduction écrite ne suffit pas dans des contextes où l'écrit lui-même est une barrière. Ce qu'il faut, c'est de l'oral. Du son. Des images. Des formats qui parlent à des gens qui communiquent oralement depuis des générations.

C'est là que BibleFon prend sens.

---

## Ce qu'est BibleFon

BibleFon est un livre numérique animé. On y lit des histoires bibliques — illustrées, page par page — et on peut les **écouter en langue fon**.

Le fon est la langue maternelle de plusieurs millions de personnes au Bénin et dans les pays voisins. C'est une langue orale, vivante, portée par une culture riche. Mais presque absente du numérique.

Avec BibleFon :
- Un enfant qui ne sait pas encore bien lire peut suivre l'histoire en l'écoutant dans sa langue
- Une grand-mère qui ne lit pas le français peut partager ce moment avec ses petits-enfants
- Une famille peut retrouver des histoires universelles racontées depuis leur propre culture

Les illustrations ont été générées par intelligence artificielle, avec un soin particulier pour représenter des personnages africains, dans un style doux et chaleureux. La voix qui lit le texte en fon est, elle aussi, synthétisée par IA — grâce à un modèle développé par Meta spécifiquement pour les langues peu dotées.

Ce n'est pas une application de divertissement. C'est une tentative concrète de répondre à une exclusion réelle.

---

## Ce qui a été accompli

BibleFon a été conçu et réalisé en collaboration avec **Claude Code**, un assistant de programmation par intelligence artificielle développé par Anthropic. C'est une précision qui me tient à cœur, parce qu'elle est honnête — et parce qu'elle fait partie du sujet.

Ce que j'ai apporté : la vision, les choix, les arbitrages. Quel public ? Quelle langue ? Quel format ? Quelles histoires, et comment les raconter ? Pourquoi le fon et pas une autre langue ? À quel moment une illustration est juste ou ne l'est pas ? Ces questions n'ont pas de réponse technique — elles demandent une intention, une sensibilité, une connaissance du terrain.

Ce que Claude Code a apporté : l'exécution technique. Écrire le code, configurer les outils, débugger, déployer. Le bras, pas la tête.

Travailler ainsi — diriger un outil IA vers un objectif précis, en gardant le sens du projet — est lui-même une compétence. Peut-être même l'une des compétences clés du numérique à venir.

Voilà ce qui a été construit ensemble :

**Le livre numérique animé** — un lecteur de type flipbook (livre qui se feuillette), avec des animations fluides, adapté aussi bien aux téléphones mobiles qu'aux ordinateurs.

**Les illustrations** — générées par IA (modèle FLUX de fal.ai), avec un personnage cohérent d'un bout à l'autre de l'histoire : David, un jeune berger africain, représenté avec soin dans chaque scène.

**La voix en fon** — plus de 30 segments audio enregistrés par synthèse vocale, organisés scène par scène. Chaque passage du texte en fon peut être lu à voix haute.

**Le premier livre complet** — *David le Petit Berger*, tiré de 1 Samuel 16-17. Vingt pages, treize scènes illustrées, du moment où Samuel arrive à Bethléem jusqu'à la victoire de David sur Goliath.

**La structure pour la suite** — le projet est conçu pour accueillir facilement de nouveaux livres. Les prochains prévus : La Fournaise, Noé, Abraham, Ruth.

**La mise en ligne** — le projet est accessible gratuitement sur [biblefon.vercel.app](https://biblefon.vercel.app), sans inscription, sans publicité.

---

## BibleFon v2 — Ce qui a été construit

Après le lancement de la v1 (le flipbook David), une deuxième version a été développée. L'objectif : transformer BibleFon d'un lecteur de livre unique en une **plateforme de bibliothèque interactive** — avec une expérience d'entrée soignée, un système audio immersif, et une interface mobile-first repensée.

### Une nouvelle page d'accueil

La page d'accueil a été entièrement redessinée. Un hero pleine hauteur avec une photo de fond, une palette de couleurs chaudes (or, brun, ambre), et un chevron animé qui invite à descendre vers la bibliothèque. Chaque détail visuel est pensé pour créer une ambiance — comme entrer dans une salle de conte.

### Une bibliothèque de livres

La page principale présente maintenant une grille de cartes livres, avec couverture illustrée, titre en fon et en français, durée de lecture, et tranche d'âge. Les livres terminés sont cliquables. Les livres à venir (La Fournaise, Noé) sont affichés avec un badge "À venir" — la bibliothèque prend forme visuellement.

### Aperçus audio sur les cartes

C'est la fonctionnalité la plus complexe de la v2. Chaque carte est associée à un fichier audio de quelques secondes qui joue en aperçu.

**Sur desktop :** le survol de la carte déclenche automatiquement l'aperçu audio. Aucun clic requis. En même temps, une *rich card* apparaît à côté de la carte — une bulle flottante qui affiche le titre, un extrait du texte, une citation biblique, et une phrase d'invitation à lire l'histoire.

**Sur mobile :** une icône ♪ apparaît sur la couverture. Un tap joue l'audio et fait apparaître une *bottom sheet* — un panneau qui monte depuis le bas de l'écran avec le même contenu que la rich card desktop. Un tap sur l'overlay referme le panneau.

La rich card se positionne intelligemment selon l'espace disponible à l'écran (droite, gauche, ou au-dessus) grâce à `getBoundingClientRect`. Elle ne couvre jamais l'image de la carte.

Un seul audio peut jouer à la fois. Un gestionnaire singleton coordonne les transitions entre cartes : si un aperçu est en cours et qu'on survole une autre carte, le premier s'arrête proprement avant que le second commence.

### Cartes "À venir" — animation dorée et chain audio

Pour les livres à venir, l'aperçu audio enchaîne deux fichiers : l'audio spécifique au livre, puis un audio commun "bientôt disponible". Pendant que ce second audio joue, l'overlay de la carte s'illumine en or avec une animation de pulsation — un signal visuel qui accompagne la voix.

### L'icône bibliothèque animée

En haut de la section bibliothèque, une icône livre SVG anime en bounce (flottement vertical continu). Au survol ou au tap, elle joue un audio d'introduction à la bibliothèque, et une bulle "Bibliothèque" apparaît au-dessus. Pendant la lecture, l'animation s'arrête et une icône ♪ vire au vert. À la fin, tout reprend son état initial.

### Musique d'ambiance — architecture respectueuse

La v2 intègre une musique de fond, conçue selon les règles UX de la Web Audio API :

- **Pas d'autoplay.** La musique ne démarre jamais sans interaction. Elle se déclenche au premier clic sur le chevron ↓ — quand l'utilisateur entre dans la bibliothèque, symboliquement.
- **Ducking.** Quand un aperçu audio ou l'audio de bibliothèque joue, la musique baisse automatiquement en douceur. Elle remonte à la fin.
- **Bouton 🔇/🔊** visible en bas à droite, apparaît dès que la musique démarre.
- **Mémoire.** Le choix de l'utilisateur (coupé ou non) est sauvegardé en localStorage. Si l'utilisateur a coupé le son, il ne redémarre jamais sans qu'il le demande.
- **Fade in/out.** Pas de démarrage brutal — la musique monte progressivement sur 2-3 secondes.

### UX mobile — carte suivante visible

Sur mobile, la grille n'affiche qu'une carte par ligne. Un padding-bottom de 120px fait dépasser légèrement le haut de la carte suivante en bas de l'écran — indiquant instinctivement qu'il y a plus à découvrir en scrollant.

### Technique

- Stack : Next.js 16, React 19, Tailwind CSS v4, TypeScript strict
- Déploiement : Vercel
- Architecture audio : CustomEvents cross-composants (`biblefon:stop-lib`, `biblefon:preview-stop`, `biblefon:chain-start`, etc.)
- Trick autoplay : `audio.muted = true → play() → muted = false` — compatible tous navigateurs mobiles
- Audios produits : `david-preview.wav`, `fournaise-preview.wav`, `noe-preview.wav`, `bientotdisponible.wav`, `bibliotheque.wav`, musique d'ambiance

---

## Le chemin parcouru

Je suis béninois. J'ai fait ma licence en génie logiciel à l'IFRI, à Cotonou. Puis je suis venu en France, à l'ESGI Paris, pour un bachelor en ingénierie web.

Pendant ce parcours, j'ai développé d'autres projets à la croisée de la technique et de l'impact : un système d'automatisation par IA pour un cabinet juridique, un outil d'analyse de prospects avec GPT-4. Des projets qui m'ont appris que ce qui m'intéresse, ce n'est pas la technologie pour elle-même — c'est ce qu'elle permet de résoudre pour de vraies personnes.

BibleFon est la synthèse de tout ça. C'est le projet où technique et sens se rejoignent pleinement.

---

## La vision

Je crois que le numérique inclusif n'est pas un idéal lointain. C'est une série de choix — de design, de langue, de représentation — que l'on peut commencer à faire maintenant.

BibleFon n'est pas un produit fini. C'est une démonstration que c'est possible. Qu'avec les bons outils, on peut créer des expériences numériques qui parlent à des communautés que le numérique habituel ignore.

La prochaine étape est de penser plus largement : pas seulement des histoires bibliques, mais des contenus éducatifs, culturels, civiques — en fon, en yoruba, en wolof, en bambara. Des interfaces qui ne demandent pas à leurs utilisateurs de se conformer à une norme qui n'est pas la leur.

C'est le chemin sur lequel je suis. BibleFon en est la première pierre.

---

*Manassé A. AKPOVI — 2025*
*Développeur, étudiant en ingénierie web, Bénin / Paris*
*[github.com/AkmaDev](https://github.com/AkmaDev)*
