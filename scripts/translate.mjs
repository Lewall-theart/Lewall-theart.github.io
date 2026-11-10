import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// Load .env or .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const envFile of envFiles) {
    const fullPath = path.resolve(process.cwd(), envFile)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=')
          const value = rest.join('=').replace(/^['"](.*)['"]$/, '$1')
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = value.trim()
          }
        }
      }
    }
  }
}

loadEnv()

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY
const isGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
const isOpenAI = Boolean(!isGemini && process.env.OPENAI_API_KEY)

// Read Glossary
const glossaryPath = path.resolve(process.cwd(), 'scripts/glossary.json')
let glossary = { terms: {}, rules: {} }
if (fs.existsSync(glossaryPath)) {
  try {
    glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'))
  } catch (e) {
    console.warn('[translate] Warning: Could not parse scripts/glossary.json', e.message)
  }
}

const termsSummary = Object.entries(glossary.terms || {})
  .map(([vi, target]) => `  - "${vi}" -> EN: "${target.en}", JA: "${target.ja}"`)
  .join('\n')

const PROMPTS = {
  en: `You are an elite cybersecurity researcher, reverse engineer, and CTF player.
Translate the following Vietnamese technical blog post into natural, idiomatic, high-level English.

REQUIREMENTS:
1. TONE & VOCABULARY:
   - Use active voice, crisp technical English, authentic CTF writeup style (similar to LiveOverflow, 0xdf, Trail of Bits).
   - DO NOT translate word-for-word. Express ideas naturally and technically.
   - Use standard cybersecurity verbs and idioms: "deconstruct", "inspect disassembly", "carve the payload", "deobfuscate", "patch the binary".
   - Refer to this glossary whenever applicable:
${termsSummary}
   - ${glossary.rules?.en || ''}

2. STRUCTURE & CODE PRESERVATION:
   - Output valid Markdown with YAML Frontmatter at the top (enclosed in ---).
   - ONLY translate the 'title' and 'excerpt' values in the frontmatter.
   - PRESERVE EXACTLY: 'date', 'featured', 'flag', 'tags', and all other frontmatter keys.
   - DO NOT MODIFY ANY CODE BLOCKS (\`\`\`...\`\`\`) OR INLINE CODE (\`...\`).
   - Keep variable names, function names, file paths, URLs, flags, and hex strings 100% UNCHANGED.
   - Keep LaTeX math syntax ($...$ or $$...$$) and Markdown table syntax intact.
   - Do NOT wrap your whole response in extra markdown backticks; output the raw markdown file directly.`,

  ja: `You are a professional Japanese cybersecurity engineer and CTF player who regularly authors high-quality technical writeups on Qiita and Zenn.
Translate the following Vietnamese technical blog post into natural, professional Japanese.

REQUIREMENTS:
1. TONE & VOCABULARY:
   - Use the authoritative "だ・である" style standard in Japanese technical articles and CTF writeups (NOT polite です/ます).
   - Use accepted IT/Cybersecurity Katakana loanwords (e.g. リバースエンジニアリング, アセンブリ, デコンパイル, オフセット, ペイロード, スタック, レジスタ, フラグ) rather than awkward literal kanji translations.
   - Write clear, punchy, idiomatic Japanese that feels natively written by a Japanese security researcher.
   - Refer to this glossary whenever applicable:
${termsSummary}
   - ${glossary.rules?.ja || ''}

2. STRUCTURE & CODE PRESERVATION:
   - Output valid Markdown with YAML Frontmatter at the top (enclosed in ---).
   - ONLY translate the 'title' and 'excerpt' values in the frontmatter.
   - PRESERVE EXACTLY: 'date', 'featured', 'flag', 'tags', and all other frontmatter keys.
   - DO NOT MODIFY ANY CODE BLOCKS (\`\`\`...\`\`\`) OR INLINE CODE (\`...\`).
   - Keep variable names, function names, file paths, URLs, flags, and hex strings 100% UNCHANGED.
   - Keep LaTeX math syntax ($...$ or $$...$$) and Markdown table syntax intact.
   - Do NOT wrap your whole response in extra markdown backticks; output the raw markdown file directly.`
}

async function callGemini(systemPrompt, userText) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n=== SOURCE ARTICLE (VIETNAMESE) ===\n\n${userText}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      }
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidate) throw new Error('No translation generated from Gemini API.')

  // Strip wrapping ```markdown ... ``` if the model included it
  return candidate.replace(/^```(?:markdown)?\r?\n/, '').replace(/\r?\n```\s*$/, '').trim()
}

async function callOpenAI(systemPrompt, userText) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o'
  const url = 'https://api.openai.com/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const candidate = data.choices?.[0]?.message?.content
  if (!candidate) throw new Error('No translation generated from OpenAI API.')

  return candidate.replace(/^```(?:markdown)?\r?\n/, '').replace(/\r?\n```\s*$/, '').trim()
}

async function translateArticle(content, targetLang) {
  const systemPrompt = PROMPTS[targetLang]
  if (!systemPrompt) throw new Error(`Unsupported target language: ${targetLang}`)

  if (isGemini) {
    return await callGemini(systemPrompt, content)
  } else if (isOpenAI) {
    return await callOpenAI(systemPrompt, content)
  } else {
    throw new Error(
      'Missing API key! Please set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in your environment or .env.local file.'
    )
  }
}

async function processFile(filePath, targetLangs = ['en', 'ja'], force = false) {
  const absPath = path.resolve(filePath)
  if (!fs.existsSync(absPath)) {
    console.error(`[translate] File not found: ${filePath}`)
    return
  }

  const ext = path.extname(absPath)
  const baseWithoutExt = absPath.slice(0, -ext.length)

  // Don't translate already translated files
  if (baseWithoutExt.endsWith('.en') || baseWithoutExt.endsWith('.ja')) {
    console.log(`[translate] Skipping already translated file: ${path.basename(filePath)}`)
    return
  }

  const sourceContent = fs.readFileSync(absPath, 'utf8')
  console.log(`\n========================================`)
  console.log(`Translating: ${path.basename(filePath)}`)

  for (const lang of targetLangs) {
    const outputPath = `${baseWithoutExt}.${lang}.md`
    if (fs.existsSync(outputPath) && !force) {
      console.log(`  -> [${lang.toUpperCase()}] Already exists (${path.basename(outputPath)}). Pass --force to overwrite.`)
      continue
    }

    console.log(`  -> [${lang.toUpperCase()}] Generating translation...`)
    try {
      const translated = await translateArticle(sourceContent, lang)
      fs.writeFileSync(outputPath, translated, 'utf8')
      console.log(`     ✓ Saved to: ${path.basename(outputPath)}`)
    } catch (err) {
      console.error(`     ✗ Failed to translate to ${lang}:`, err.message)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isAll = args.includes('--all')
  const force = args.includes('--force')

  if (!apiKey) {
    console.log('[translate] Notice: No GEMINI_API_KEY or OPENAI_API_KEY found. Skipping auto-translation.')
    return
  }

  let targetLangs = ['en', 'ja']
  const langArgIdx = args.indexOf('--lang')
  if (langArgIdx !== -1 && args[langArgIdx + 1]) {
    const specified = args[langArgIdx + 1].toLowerCase()
    targetLangs = specified === 'all' ? ['en', 'ja'] : [specified]
  }

  const contentDir = path.resolve(process.cwd(), 'content')

  if (isAll) {
    const files = fs.readdirSync(contentDir)
      .filter(f => f.endsWith('.md') && !f.endsWith('.en.md') && !f.endsWith('.ja.md'))
      .map(f => path.join(contentDir, f))

    console.log(`Found ${files.length} base posts to translate.`)
    for (const file of files) {
      await processFile(file, targetLangs, force)
    }
  } else {
    const targetFile = args.find(a => !a.startsWith('--'))
    if (!targetFile) {
      console.log(`
Usage:
  node scripts/translate.mjs <path-to-post.md> [--lang en|ja|all] [--force]
  node scripts/translate.mjs --all [--lang en|ja|all] [--force]

Requirements:
  Set GEMINI_API_KEY in .env.local or your environment variables.
      `)
      return
    }
    await processFile(targetFile, targetLangs, force)
  }
}

main().catch(err => {
  console.error('[translate] Fatal error:', err)
  process.exit(1)
})
