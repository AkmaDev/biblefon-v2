#!/usr/bin/env node
/**
 * Génère les fichiers audio Fon pour les nouvelles scènes David
 * via l'API Gradio 5 sur https://guunk-ttsfon.hf.space/
 */
import { writeFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, "../public")

const GRADIO_URL = "https://guunk-ttsfon.hf.space"

const AUDIO_TASKS = [
  {
    text: "Filisitɛ́ɛn ɔ́ jɛ sisɛkpɔ́ Davídi jí kpɛɖé kpɛɖé. Ée Filisitɛ́ɛn ɔ́ mɔ Davídi sɛ́ dó ɔ́, é hu tɛ́ n'i, ɖó é ɔ́ kpɛví, bó nyɔ nyinya wɛ bo nyi. Filisitɛ́ɛn ɔ́ ɖɔ nú Davídi: Ma wá gɔ́n mì bó sú bò fí, bó xo gbɛ́nɔ mì. Wá fí, bɔ un ná ná nɔ ta towe nú winyin, bó ná ná nɔ hán towe nú sɔ́tɔ́.",
    out: "audio/david/david-goliath-v1/31.wav",
  },
  {
    text: "Davídi ka ɖɔ nú Filisitɛ́ɛn ɔ́ ɖɔ: Hwɛ ɔ́, a hɛn hwǐ bó hɛn hwǎn kpɛví bó wá gɔ́n mì; mɔ̌ wiwa nɛ. Mawu Mavɔmavɔ sín nyikɔ mɛ wɛ un wá gɔ́n we, nyikɔ Mawu ahwangɔnu Izlayɛ́li tɔn lɛ́ɛ sín, mɛ e a ɖi kpɔ́n dó wu tɔn ɔ́.",
    out: "audio/david/david-goliath-v2/32.wav",
  },
  {
    text: "Filisitɛ́ɛn ɔ́ xo zǐn, bó ná sɛkpɔ́ Davídi, bɔ Davídi bɛ́ wezun, bo sɛkpɔ́ Filisitɛ́ɛn ɔ́ gɔ́n. É sɔ́ kɛ́n ɖokpó ɖo gló tɔn mɛ, bo flin lɛngbɔ́ tɔn, bó xan Filisitɛ́ɛn ɔ́ sín dɔ xwé jí, bɔ é jɛ afɔ wlí jí.",
    out: "audio/david/david-lance-pierre/33.wav",
  },
  {
    text: "Lě e Davídi ɖu ɖo Filisitɛ́ɛn ɔ́ jí gbɔn ɔ́ nɛ́; klohwán kpó awǐnnya kpó ǎ. É sɔ́ hwǐ Filisitɛ́ɛn ɔ́ tɔn, bo ɖó xwé ɖo kan tɔn mɛ, bo vɔ́sɔ́ ta tɔn.",
    out: "audio/david/david-vainqueur/34.wav",
  },
  {
    text: "Gbè enɛ gbè ɔ, mɛ bǐ mɔ ɖɔ Mawu Mavɔmavɔ wɛ nɔ ná ɖuɖéjí mɛ. ayixa mɛ wɛ é nɔ kpɔ́n, é nɔ kpɔ́n ayi mɛ wɛ.",
    out: "audio/david/david-ending/35.wav",
  },
]

async function generateAudio(text) {
  // Step 1: POST to queue
  const joinRes = await fetch(`${GRADIO_URL}/gradio_api/call/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [text] }),
  })
  if (!joinRes.ok) throw new Error(`Queue failed: ${joinRes.status} ${await joinRes.text()}`)
  const { event_id } = await joinRes.json()
  if (!event_id) throw new Error("No event_id returned")

  // Step 2: Poll SSE stream for result
  const streamRes = await fetch(`${GRADIO_URL}/gradio_api/call/predict/${event_id}`)
  if (!streamRes.ok) throw new Error(`Stream failed: ${streamRes.status}`)
  const body = await streamRes.text()

  // Parse SSE: format is "event: complete\ndata: [{...}]"
  const lines = body.split("\n")
  let isComplete = false
  for (const line of lines) {
    if (line.startsWith("event: complete")) isComplete = true
    if (isComplete && line.startsWith("data: ")) {
      const payload = line.slice(6).trim()
      try {
        const parsed = JSON.parse(payload)
        // parsed is an array: [{path, url, ...}]
        if (Array.isArray(parsed) && parsed[0]) return parsed[0]
        if (parsed.data && parsed.data[0]) return parsed.data[0]
      } catch {}
    }
  }
  throw new Error(`No result found in SSE stream. Raw: ${body.substring(0, 200)}`)
}

async function main() {
  for (const task of AUDIO_TASKS) {
    const outPath = join(PUBLIC, task.out)
    console.log(`\nGénération: ${task.out}`)
    console.log(`Texte: ${task.text.substring(0, 60)}...`)

    try {
      const result = await generateAudio(task.text)

      let wavData
      if (result && result.url) {
        const audioRes = await fetch(result.url)
        wavData = Buffer.from(await audioRes.arrayBuffer())
      } else if (result && result.path && !result.url) {
        // Gradio file path — build URL
        const fileUrl = `${GRADIO_URL}/gradio_api/file=${result.path}`
        const audioRes = await fetch(fileUrl)
        wavData = Buffer.from(await audioRes.arrayBuffer())
      } else if (typeof result === "string" && result.startsWith("data:")) {
        const b64 = result.replace(/^data:audio\/\w+;base64,/, "")
        wavData = Buffer.from(b64, "base64")
      } else {
        throw new Error(`Format inconnu: ${JSON.stringify(result).substring(0, 150)}`)
      }

      writeFileSync(outPath, wavData)
      console.log(`✓ Sauvegardé: ${outPath} (${wavData.length} bytes)`)
    } catch (err) {
      console.error(`✗ Erreur pour ${task.out}:`, err.message)
    }
  }
  console.log("\nTerminé.")
}

main()
