"use client"

import { useState } from "react"
import { Github, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type Lang = "fr" | "en"

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("fr")

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Nav + lang toggle */}
      <div className="max-w-2xl mx-auto px-6 pt-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm transition-colors duration-200"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === "fr" ? "Retour à la bibliothèque" : "Back to library"}
        </Link>
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {(["fr", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200"
              style={
                lang === l
                  ? { background: "var(--gold-dark)", color: "#0c0804" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {lang === "fr" ? <FrContent /> : <EnContent />}

      {/* Footer */}
      <footer className="border-t py-8 px-6" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/"
            className="font-bold text-sm"
            style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
          >
            BibleFon
          </Link>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {lang === "fr"
              ? "Fait avec soin pour les enfants du Bénin et la diaspora africaine 🇧🇯"
              : "Made with care for the children of Benin and the African diaspora 🇧🇯"}
          </p>
        </div>
      </footer>

    </main>
  )
}

function Divider() {
  return <hr style={{ borderColor: "var(--border)" }} />
}

/* ─────────────────────────────────────────────────────────────── */
/*  FRENCH                                                         */
/* ─────────────────────────────────────────────────────────────── */

function FrContent() {
  return (
    <article className="max-w-2xl mx-auto px-6 pt-14 pb-24 space-y-16">

      {/* Header */}
      <header className="space-y-5">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(201,146,42,0.10)",
            border: "1px solid rgba(201,146,42,0.25)",
            color: "var(--gold-light)",
          }}
        >
          🇧🇯 À propos du projet
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight"
          style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
        >
          Pourquoi BibleFon existe
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Le numérique parle aux gens qui savent lire. Ce n'est pas tout le monde — et ça exclut précisément le public de BibleFon.
        </p>
      </header>

      {/* Opening */}
      <blockquote
        className="pl-5 py-1 text-base italic leading-relaxed"
        style={{
          borderLeft: "3px solid var(--gold-dark)",
          color: "var(--foreground)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Imaginez une salle de classe. L'enseignant parle dans une langue que vous ne maîtrisez pas. Personne ne vous exclut. Personne ne vous interdit d'entrer. Mais vous ne comprenez rien. Vous êtes là — mais absent.
        <br /><br />
        C'est ce que vivent chaque jour des millions de personnes face au numérique. Pas parce qu'elles manquent d'intelligence. Pas parce qu'elles refusent la technologie. Mais parce que nos interfaces ont été conçues sans elles.
      </blockquote>

      <Divider />

      {/* Section 1 — Le constat */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          Le problème que le numérique ne voit pas
        </h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          <p>
            Quand on conçoit une interface numérique, on fait inconsciemment des hypothèses sur l'utilisateur : il sait lire, il maîtrise une langue dominante, il dispose d'une connexion stable, il est habitué aux menus hiérarchiques. Ce ne sont pas des hypothèses universelles. Ce sont les hypothèses d'un profil particulier — celui qui ressemble aux personnes qui ont conçu les outils. Pour tous les autres, nos interfaces sont une salle où tout le monde parle une langue qu'ils ne comprennent pas.
          </p>
          <p>
            La langue fon est parlée par plusieurs millions de personnes au Bénin et dans les pays voisins. C'est une langue orale, vivante, portée par une culture riche. En 2022, Google Traduction l'a intégrée — une belle avancée sur le papier. Mais une traduction <em>écrite</em> ne suffit pas là où l'écrit est lui-même une barrière. Ce qu'il faut, c'est une voix. Du son. Une interface qui parle avant même qu'on ne touche quoi que ce soit.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "500 M", label: "adultes en analphabétisme fonctionnel en Afrique subsaharienne", source: "UNESCO" },
            { value: "90%", label: "des connexions internet en Afrique se font via smartphone", source: "GSMA 2024" },
            { value: "~5 M", label: "locuteurs fon — presque absents du numérique", source: "Ethnologue" },
          ].map(({ value, label, source }) => (
            <div
              key={source}
              className="rounded-xl p-4 text-center space-y-2"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{value}</p>
              <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              <p className="text-xs font-semibold" style={{ color: "var(--gold-dark)" }}>{source}</p>
            </div>
          ))}
        </div>

        <blockquote
          className="pl-5 py-1 text-sm italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          « Nos langues, au lieu d'être une source d'incompréhension, deviendraient un élément d'union. »
          <br />
          <span className="text-xs not-italic" style={{ color: "var(--muted-foreground)" }}>
            — Mme Aurelie I. ADAM SOULE, Ministre béninoise du Numérique, SENIA 2024
          </span>
        </blockquote>
      </section>

      <Divider />

      {/* Section 2 — Audio First */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          Audio First — une définition que personne n'a posée
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Le terme "audio-first" existe dans le monde du podcast. Mais dans le domaine de la conception d'interface — en particulier pour les cultures d'oralité en Afrique — la notion n'a jamais été formalisée.
        </p>
        <blockquote
          className="pl-5 py-1 text-base italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          Audio-first ne signifie pas « avoir un bouton play ». Cela signifie que le son est le mode de communication primaire.
        </blockquote>

        {/* Table */}
        <div className="rounded-xl overflow-hidden text-sm" style={{ border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2">
            <div
              className="px-4 py-3 font-semibold text-xs uppercase tracking-wide"
              style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}
            >
              Audio-first cosmétique
            </div>
            <div
              className="px-4 py-3 font-semibold text-xs uppercase tracking-wide"
              style={{ background: "rgba(201,146,42,0.10)", color: "var(--gold-light)", borderLeft: "1px solid var(--border)" }}
            >
              Audio-first réel
            </div>
          </div>
          {[
            ["L'audio est une fonctionnalité ajoutée", "Le son est le mode de communication primaire"],
            ["Lire est l'action principale, écouter est optionnel", "Écouter est l'action principale, lire est un support"],
            ["L'interface est muette jusqu'au clic", "L'interface parle avant qu'on clique quoi que ce soit"],
            ["Le texte explique ce que l'audio fait", "L'audio agit, le texte confirme pour ceux qui lisent"],
          ].map(([left, right], i) => (
            <div key={i} className="grid grid-cols-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="px-4 py-3 leading-snug" style={{ color: "var(--muted-foreground)" }}>{left}</div>
              <div className="px-4 py-3 leading-snug" style={{ color: "var(--foreground)", borderLeft: "1px solid var(--border)" }}>{right}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 3 — Recherche */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          Ce que dit la recherche — et que le design ignore
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Les études sur les interfaces pour publics peu alphabétisés existent. Elles sont claires. Elles sont ignorées par presque tous ceux qui conçoivent des produits.
        </p>
        <div className="space-y-4">
          {[
            {
              source: "ACM CHI — Interfaces for Low-Literacy Users",
              quote: "Les participants peu alphabétisés préfèrent et fonctionnent mieux avec de grands boutons et icônes qu'avec des menus textuels. Les structures de navigation hiérarchiques sont incomprises par la majorité des utilisateurs peu alphabétisés.",
              impl: "BibleFon : pas de menus déroulants, grandes icônes, navigation plate. Un seul CTA par écran.",
            },
            {
              source: "Microsoft Research India — Voice Interfaces for Emerging Markets",
              quote: "Les interfaces textuelles sont inutilisables par les utilisateurs peu alphabétisés sans expérience préalable. L'audio comme modalité primaire augmente l'engagement de 3× par rapport au texte seul dans les contextes d'oralité.",
              impl: "BibleFon : l'audio n'est pas optionnel — c'est l'interface. Le texte est le support.",
            },
            {
              source: "UNESCO — Rapport sur l'alphabétisme 2023",
              quote: "Une traduction écrite ne suffit pas là où l'écrit est lui-même une barrière — il faut de l'oral, des images, des formats de communication orale.",
              impl: "BibleFon : la mission est validée par les données. L'approche audio-first est la seule viable pour ce public.",
            },
          ].map(({ source, quote, impl }) => (
            <div
              key={source}
              className="rounded-xl p-5 space-y-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gold-light)" }}>
                {source}
              </p>
              <p className="text-sm italic leading-relaxed" style={{ color: "var(--foreground)", fontFamily: "var(--font-serif)" }}>
                « {quote} »
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", paddingTop: "10px" }}
              >
                → {impl}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 4 — 4 décisions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          BibleFon v2 — 4 décisions concrètes
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          En mars 2026, j'ai lancé BibleFon v2. L'objectif : transformer un flipbook avec audio en une vraie expérience audio-first. Voici les quatre décisions que j'ai prises, et pourquoi.
        </p>
        <div className="space-y-5">
          {[
            {
              num: "01",
              title: "Inverser la hiérarchie des actions",
              body: "Sur la v1, le bouton principal était « Lire ». Sur la v2 : le bouton play est le seul CTA principal. Ce changement déclare quelque chose de fondamental — l'utilisateur par défaut de ce site est quelqu'un qui écoute, pas quelqu'un qui lit.",
            },
            {
              num: "02",
              title: "L'interface parle en premier",
              body: "Au survol d'une carte (desktop) ou au tap d'une icône musicale (mobile), une voix en fon commence à décrire l'histoire. L'utilisateur n'a pas encore cliqué pour entrer. L'interface l'accueille dans sa langue, avant même qu'il ne demande quoi que ce soit.",
            },
            {
              num: "03",
              title: "Éliminer les étapes — image et son unifiés",
              body: "1 tap pour lancer l'audio. Les pages avancent automatiquement. L'image est grande et centrale. Le mot actuellement prononcé est surligné en or en temps réel — aide pédagogique pour les enfants qui apprennent à lire en fon.",
            },
            {
              num: "04",
              title: "L'ambiance avant le contenu",
              body: "Quand l'utilisateur descend vers la bibliothèque, une musique africaine commence doucement. Ce n'est pas de la décoration. C'est un signal : tu entres dans un espace d'histoires. Le son prépare l'écoute avant que l'histoire commence.",
            },
          ].map(({ num, title, body }) => (
            <div key={num} className="flex gap-5">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: "rgba(201,146,42,0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(201,146,42,0.25)",
                }}
              >
                {num}
              </div>
              <div className="space-y-1.5 pt-1.5">
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 5 — Ce que BibleFon démontre */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          Ce que BibleFon démontre
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          BibleFon n'est pas un produit fini. C'est une démonstration.
        </p>
        <ul className="space-y-3">
          {[
            "Qu'une interface audio-first est techniquement réalisable avec des outils accessibles",
            "Que Meta MMS-TTS-FON permet de synthétiser de la voix en langue fon de qualité suffisante",
            "Que les patterns UX des apps les plus utilisées (WhatsApp, Netflix) peuvent être adaptés à des contextes d'oralité",
            "Qu'une expérience numérique peut être pensée depuis le son, sans sacrifier la beauté",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }}>—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-3 pt-1">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Ce qui reste à construire :</p>
          <ul className="space-y-2">
            {[
              "Une vraie voix humaine pour le conteur — un locuteur fon natif enregistré",
              "Des enfants béninois qui répondent en chœur — le call-and-response du conte africain",
              "Plus d'histoires : La Fournaise, Noé, Abraham, Ruth sont en préparation",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                <span style={{ flexShrink: 0, marginTop: "2px" }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <blockquote
          className="pl-5 py-1 text-base italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          La vraie inclusivité en design, ce n'est pas ajouter des langues à une interface existante. C'est concevoir depuis le début pour ceux que les interfaces habituelles ignorent.
        </blockquote>
      </section>

      <Divider />

      {/* Section 6 — Qui */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Qui</h2>
        <div className="flex gap-6 items-start">
          <Image
            src="/manasse.jpg"
            alt="Manassé A. AKPOVI"
            width={88}
            height={88}
            className="rounded-full shrink-0 object-cover"
            style={{ border: "2px solid var(--border)" }}
          />
          <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            <p>
              Je m'appelle <span style={{ color: "var(--foreground)" }}>Manassé A. AKPOVI</span>. Je suis béninois. Licence en génie logiciel à l'IFRI (Cotonou), puis bachelor en ingénierie web à l'ESGI Paris. Ce projet est né à la croisée de ce parcours et d'une conviction : <span style={{ color: "var(--foreground)" }}>le numérique peut et doit parler à ceux qu'il ignore aujourd'hui</span>.
            </p>
            <p>
              BibleFon a démarré lors du hackathon SENIA 2024, dont le thème était « l'IA multimodale au service de nos langues locales ». Pour la première fois depuis que je codais, je ne travaillais pas sur une fonctionnalité abstraite. Je travaillais sur quelque chose qui avait du sens pour des millions de personnes réelles, qui parlent une langue réelle — mais que les outils numériques ignorent presque entièrement.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 7 — Ce que je cherche */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Ce que je cherche</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "💬", title: "Retours de locuteurs fon", body: "Prononciation, intonation, vocabulaire — si quelque chose sonne faux, je veux le savoir." },
            { icon: "🤝", title: "Partenaires de distribution", body: "Écoles, associations, ONG en Afrique de l'Ouest pour diffuser BibleFon là où il est utile." },
            { icon: "💻", title: "Collaborateurs techniques", body: "Développeurs Next.js / PWA / audio web intéressés par le numérique inclusif." },
            { icon: "🌱", title: "Financement et soutien", body: "Pour développer plus d'histoires, de langues, d'illustrations — Abraham, Ruth, Jonas..." },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl p-4 space-y-2"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p>
                <span className="mr-1.5">{icon}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{title}</span>
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Contact */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Me contacter</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:manasse.akpovi@manasseakpovi.com"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", color: "#0c0804" }}
          >
            <Mail className="w-4 h-4" />
            Envoyer un email
          </a>
          <a
            href="https://github.com/AkmaDev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium border transition-all duration-200 hover:border-white/30 hover:text-white/85"
            style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <Github className="w-4 h-4" />
            github.com/AkmaDev
          </a>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Chercheurs, partenaires potentiels, locuteurs fon, curieux — toutes les prises de contact sont les bienvenues.
        </p>
      </section>

    </article>
  )
}

/* ─────────────────────────────────────────────────────────────── */
/*  ENGLISH                                                        */
/* ─────────────────────────────────────────────────────────────── */

function EnContent() {
  return (
    <article className="max-w-2xl mx-auto px-6 pt-14 pb-24 space-y-16">

      {/* Header */}
      <header className="space-y-5">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(201,146,42,0.10)",
            border: "1px solid rgba(201,146,42,0.25)",
            color: "var(--gold-light)",
          }}
        >
          🇧🇯 About the project
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight"
          style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
        >
          Why BibleFon exists
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Digital technology speaks to people who can read. That is not everyone — and it excludes precisely those BibleFon was built for.
        </p>
      </header>

      {/* Opening */}
      <blockquote
        className="pl-5 py-1 text-base italic leading-relaxed"
        style={{
          borderLeft: "3px solid var(--gold-dark)",
          color: "var(--foreground)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Imagine a classroom. The teacher speaks a language you do not understand. Nobody excludes you. Nobody stops you from entering. But you understand nothing. You are there — but absent.
        <br /><br />
        This is what millions of people experience every day when they encounter digital products. Not because they lack intelligence. Not because they reject technology. But because our interfaces were built without them.
      </blockquote>

      <Divider />

      {/* Section 1 — The problem */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          The problem digital technology does not see
        </h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          <p>
            When designing a digital interface, we unconsciously make assumptions about the user: they can read, they speak a dominant language, they have a stable connection, they are comfortable navigating hierarchical menus. These are not universal assumptions. They describe a specific type of user — one who looks like the people who built the tools. For everyone else, our interfaces are a room where everyone speaks a language they do not understand.
          </p>
          <p>
            The Fon language is spoken by several million people in Benin and neighboring countries. It is an oral language, alive, carried by a rich culture. In 2022, Google Translate added it — a welcome step, on paper. But a <em>written</em> translation is not enough where writing itself is a barrier. What is needed is a voice. Sound. An interface that speaks before you touch anything.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "500 M", label: "adults in sub-Saharan Africa are functionally illiterate", source: "UNESCO" },
            { value: "90%", label: "of internet connections in Africa are made via smartphone", source: "GSMA 2024" },
            { value: "~5 M", label: "Fon speakers — almost entirely absent from the digital world", source: "Ethnologue" },
          ].map(({ value, label, source }) => (
            <div
              key={source}
              className="rounded-xl p-4 text-center space-y-2"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{value}</p>
              <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              <p className="text-xs font-semibold" style={{ color: "var(--gold-dark)" }}>{source}</p>
            </div>
          ))}
        </div>

        <blockquote
          className="pl-5 py-1 text-sm italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          "Our languages, instead of being a source of misunderstanding, would become an element of union."
          <br />
          <span className="text-xs not-italic" style={{ color: "var(--muted-foreground)" }}>
            — Ms. Aurelie I. ADAM SOULE, Benin's Minister of Digital Affairs, SENIA 2024
          </span>
        </blockquote>
      </section>

      <Divider />

      {/* Section 2 — Audio First */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          Audio First — a definition nobody has written down
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          The term "audio-first" exists in the world of podcasts. But in interface design — especially for oral cultures in Africa — the concept has never been formally defined. Here is the distinction I built while working on BibleFon.
        </p>
        <blockquote
          className="pl-5 py-1 text-base italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          Audio-first does not mean "having a play button." It means that sound is the primary mode of communication.
        </blockquote>

        {/* Table */}
        <div className="rounded-xl overflow-hidden text-sm" style={{ border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2">
            <div
              className="px-4 py-3 font-semibold text-xs uppercase tracking-wide"
              style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}
            >
              Cosmetic audio-first
            </div>
            <div
              className="px-4 py-3 font-semibold text-xs uppercase tracking-wide"
              style={{ background: "rgba(201,146,42,0.10)", color: "var(--gold-light)", borderLeft: "1px solid var(--border)" }}
            >
              Real audio-first
            </div>
          </div>
          {[
            ["Audio is an added feature", "Sound is the primary communication mode"],
            ["Reading is the main action, listening is optional", "Listening is the main action, reading is a support"],
            ["The interface is silent until you click", "The interface speaks before you click anything"],
            ["Text explains what audio does", "Audio acts, text confirms for those who read"],
          ].map(([left, right], i) => (
            <div key={i} className="grid grid-cols-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="px-4 py-3 leading-snug" style={{ color: "var(--muted-foreground)" }}>{left}</div>
              <div className="px-4 py-3 leading-snug" style={{ color: "var(--foreground)", borderLeft: "1px solid var(--border)" }}>{right}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 3 — Research */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          What research says — and design ignores
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Studies on interfaces for low-literacy users exist. They are clear. They are ignored by almost everyone who designs products.
        </p>
        <div className="space-y-4">
          {[
            {
              source: "ACM CHI — Interfaces for Low-Literacy Users",
              quote: "Low-literacy participants preferred and performed better with large buttons and icons than with text menus. Hierarchical navigation structures are misunderstood by the majority of low-literacy users.",
              impl: "BibleFon: no dropdown menus, large icons, flat navigation. One primary action per screen.",
            },
            {
              source: "Microsoft Research India — Voice Interfaces for Emerging Markets",
              quote: "Text-based interfaces are unusable by low-literacy users without prior experience. Audio as a primary modality increases engagement by 3× compared to text alone in oral-culture contexts.",
              impl: "BibleFon: audio is not optional — it is the interface. Text is the support.",
            },
            {
              source: "UNESCO — Literacy Report 2023",
              quote: "A written translation is not enough where writing itself is a barrier — what is needed is oral content, images, and oral communication formats.",
              impl: "BibleFon: the mission is validated by data. The audio-first approach is the only viable one for this audience.",
            },
          ].map(({ source, quote, impl }) => (
            <div
              key={source}
              className="rounded-xl p-5 space-y-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gold-light)" }}>
                {source}
              </p>
              <p className="text-sm italic leading-relaxed" style={{ color: "var(--foreground)", fontFamily: "var(--font-serif)" }}>
                "{quote}"
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", paddingTop: "10px" }}
              >
                → {impl}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 4 — 4 decisions */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          BibleFon v2 — 4 concrete decisions
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          In March 2026, I launched BibleFon v2. The goal: transform a flipbook with audio into a real audio-first experience. Here are the four decisions I made, and why.
        </p>
        <div className="space-y-5">
          {[
            {
              num: "01",
              title: "Reverse the action hierarchy",
              body: "On v1, the primary button was 'Read.' On v2: the play button is the only primary action. This change declares something fundamental — the default user of this site is someone who listens, not someone who reads.",
            },
            {
              num: "02",
              title: "Make the interface speak first",
              body: "On desktop hover or mobile tap of a music icon, a Fon-language voice begins describing the story. The user has not yet clicked to enter. The interface welcomes them in their language, before they ask for anything.",
            },
            {
              num: "03",
              title: "Eliminate steps — unify image and sound",
              body: "1 tap to start audio. Pages advance automatically. The image is large and central. The current word is highlighted in gold in real time — a pedagogical aid for children learning to read in Fon.",
            },
            {
              num: "04",
              title: "Ambiance before content",
              body: "When the user scrolls down to the library, African music begins softly. This is not decoration. It is a signal: you are entering a space of stories. Sound prepares the listener before the story begins.",
            },
          ].map(({ num, title, body }) => (
            <div key={num} className="flex gap-5">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: "rgba(201,146,42,0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(201,146,42,0.25)",
                }}
              >
                {num}
              </div>
              <div className="space-y-1.5 pt-1.5">
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Section 5 — What BibleFon proves */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
          What BibleFon demonstrates
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          BibleFon is not a finished product. It is a demonstration.
        </p>
        <ul className="space-y-3">
          {[
            "That an audio-first interface is technically achievable with accessible tools",
            "That Meta MMS-TTS-FON can synthesize Fon-language speech at usable quality",
            "That UX patterns from the most-used apps (WhatsApp, Netflix) can be adapted to oral-culture contexts",
            "That a digital experience can be designed from sound, without sacrificing beauty",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }}>—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-3 pt-1">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>What remains to be built:</p>
          <ul className="space-y-2">
            {[
              "A real human voice for the storyteller — a native Fon speaker recorded",
              "Beninese children responding in chorus — the call-and-response of traditional African storytelling",
              "More stories: The Furnace, Noah, Abraham, Ruth are in preparation",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                <span style={{ flexShrink: 0, marginTop: "2px" }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <blockquote
          className="pl-5 py-1 text-base italic leading-relaxed"
          style={{ borderLeft: "3px solid var(--gold-dark)", color: "var(--foreground)", fontFamily: "var(--font-serif)" }}
        >
          True inclusivity in design is not adding languages to an existing interface. It is designing from the start for those that existing interfaces ignore.
        </blockquote>
      </section>

      <Divider />

      {/* Section 6 — Who */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Who</h2>
        <div className="flex gap-6 items-start">
          <Image
            src="/manasse.jpg"
            alt="Manassé A. AKPOVI"
            width={88}
            height={88}
            className="rounded-full shrink-0 object-cover"
            style={{ border: "2px solid var(--border)" }}
          />
          <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            <p>
              My name is <span style={{ color: "var(--foreground)" }}>Manassé A. AKPOVI</span>. I am from Benin. I studied software engineering at IFRI in Cotonou, then moved to Paris to study web engineering at ESGI. This project was born at the intersection of that journey and a conviction: <span style={{ color: "var(--foreground)" }}>the digital world can — and must — speak to those it currently ignores</span>.
            </p>
            <p>
              BibleFon started at the SENIA 2024 hackathon, themed around AI and local languages. For the first time in my career as a developer, I was not building an abstract feature. I was working on something that mattered to millions of real people — people who speak a real language, but whom digital tools almost entirely overlook.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* Section 7 — What I'm looking for */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>What I am looking for</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "💬", title: "Feedback from Fon speakers", body: "Pronunciation, intonation, vocabulary — if something sounds wrong, I want to know." },
            { icon: "🤝", title: "Distribution partners", body: "Schools, associations, NGOs in West Africa to bring BibleFon where it is most needed." },
            { icon: "💻", title: "Technical collaborators", body: "Next.js / PWA / web audio developers interested in inclusive digital products." },
            { icon: "🌱", title: "Funding and support", body: "To develop more stories, more languages, more illustrations — Abraham, Ruth, Jonah..." },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl p-4 space-y-2"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p>
                <span className="mr-1.5">{icon}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{title}</span>
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Contact */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Get in touch</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:manasse.akpovi@manasseakpovi.com"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", color: "#0c0804" }}
          >
            <Mail className="w-4 h-4" />
            Send an email
          </a>
          <a
            href="https://github.com/AkmaDev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium border transition-all duration-200 hover:border-white/30 hover:text-white/85"
            style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <Github className="w-4 h-4" />
            github.com/AkmaDev
          </a>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Researchers, potential partners, Fon speakers, curious minds — all outreach is welcome.
        </p>
      </section>

    </article>
  )
}
