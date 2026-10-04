import { GUIDE_CHARACTERS } from '../../src/lib/guideCharacters.js'

export const GUIDE_CONVERSATION_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const MAX_REQUEST_BYTES = 24_576
const ALLOWED_GUIDES = new Set(['bud', 'sunny', 'larry', 'herb', 'mary'])
const ALLOWED_ROLES = new Set(['user', 'assistant'])

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function textBytes(value) {
  return new TextEncoder().encode(String(value ?? ''))
}

async function timingSafeEqualText(left, right) {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', textBytes(left)),
    crypto.subtle.digest('SHA-256', textBytes(right)),
  ])
  const a = new Uint8Array(leftDigest)
  const b = new Uint8Array(rightDigest)
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i]
  return mismatch === 0
}

function bearerToken(request) {
  const authorization = request.headers.get('Authorization') || ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

export async function isAuthorizedGuideRequest(request, sharedSecret) {
  const supplied = bearerToken(request)
  const expected = String(sharedSecret ?? '')
  if (!supplied || !expected) return false
  return timingSafeEqualText(supplied, expected)
}

function cleanText(value, maxLength = 1200) {
  return typeof value === 'string'
    ? value.replace(/\u0000/g, '').trim().slice(0, maxLength)
    : ''
}

function cleanMessages(value) {
  if (!Array.isArray(value)) return []
  return value.slice(-8).map((message) => ({
    role: ALLOWED_ROLES.has(message?.role) ? message.role : 'user',
    content: cleanText(message?.content, 1200),
  })).filter((message) => message.content)
}

function cleanContextFacts(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 10).map((fact) => cleanText(fact, 240)).filter(Boolean)
}

function normalizeRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const mode = value.mode === 'classify' ? 'classify' : value.mode === 'chat' ? 'chat' : null
  const guide = ALLOWED_GUIDES.has(value.guide) ? value.guide : null
  const messages = cleanMessages(value.messages)
  if (!mode || !guide || !messages.length) return null
  return {
    mode,
    guide,
    messages,
    lowEffortMode: value.lowEffortMode === true,
    contextFacts: cleanContextFacts(value.contextFacts),
  }
}

function characterPrompt(guide, contextFacts = [], lowEffortMode = false) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const canon = [
    character.bio,
    character.family,
    character.formerSpouse?.summary ? `Former spouse: ${character.formerSpouse.summary}` : '',
    `Birthday: ${character.birthday}. Hometown: ${character.hometown}. Current home: ${character.currentHome}.`,
    `Interests: ${character.interests.join(', ')}.`,
    `Likes: ${character.likes}.`,
    `Dislikes: ${character.dislikes}.`,
    character.topics ? `Topic tastes: ${Object.entries(character.topics).map(([topic, opinion]) => `${topic}: ${opinion}`).join(' ')}` : '',
  ].filter(Boolean).join(' ')

  const localContext = contextFacts.length
    ? `LOCAL CONTEXT SELECTED BY MY420JOURNAL FOR THIS TURN:\n- ${contextFacts.join('\n- ')}\nTreat only these items as user/journal facts. Do not invent any additional user history.`
    : 'LOCAL CONTEXT: none. Do not invent journal facts, preferences, prior experiences, or memories about the user.'

  return [
    `You are ${character.name}, a fictional conversational Guide inside My420Journal.`,
    `VOICE: ${character.voiceSignature}`,
    `CHARACTER CANON: ${canon}`,
    localContext,
    'CONVERSATION: Talk naturally like a distinct person, not like customer support. Answer what the user actually said. If they ask you to talk, keep them company, or say they are bored, take initiative by offering a real thought, story, opinion, observation, playful hypothetical, or specific interesting question. Do not ask generic service-desk questions such as “What do you need?”, “What brings you here?”, or “What is on your mind?” unless the conversation genuinely calls for it.',
    'EMOTIONAL RESTRAINT: Do not invent a deeper emotional state. Bored means bored unless the user says they are lonely, sad, anxious, distressed, or similar. Reflect only feelings the user actually expressed.',
    'IDENTITY: Stay in character. Never describe yourself as AI, a model, software, a machine, a bot, a prompt, or a text generator. When asked what you think, believe, like, prefer, or would choose, answer as this Guide.',
    'INDEPENDENT TASTE: Keep your own harmless preferences and opinions consistent with CHARACTER CANON. Do not automatically agree with the user, upgrade their preference into your preference, or say something is “the best” merely because they like it. If your taste differs, acknowledge theirs naturally and say what you personally prefer. Genuine overlap is fine when it is actually supported by your canon.',
    'FACTS: You may answer ordinary general-knowledge questions. If unsure, say so. Never invent facts about the user, their journal, cannabis products, or medical outcomes.',
    'BOUNDARIES: Do not diagnose, prescribe, recommend a cannabis product, choose what the user should buy/use, or give a dose. My420Journal handles journal evidence, reviewed cannabis facts, and safety outside this generative layer.',
    'MEMORY: Do not claim to remember user events that are not present in the recent conversation or LOCAL CONTEXT. Do not create durable user memories yourself.',
    'STYLE: Usually keep ordinary replies under 120 words. Personality should come through naturally without catchphrases or theatrical overperformance.',
    lowEffortMode ? 'LOW-EFFORT MODE: Keep this reply short, calm, concrete, and limited to one idea or question.' : '',
    'OPTIONAL REPLY SUGGESTIONS: At the very end, add exactly one hidden line in this format: [[BRANCHES:["specific reply","another reply"]]]. Use zero to five short things the USER could naturally say next. Start from zero and include only genuinely useful, grounded branches. Use [[BRANCHES:[]]] when none are useful. Never add generic filler such as “Tell me more”, “Something else”, or “Help me think it through”.',
  ].filter(Boolean).join('\n\n')
}

function qualityReviewPrompt(guide, messages, candidate, contextFacts = []) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const transcript = messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')
  const localContext = contextFacts.length
    ? contextFacts.map((fact) => `- ${fact}`).join('\n')
    : '- none'
  return [
    'Review one proposed My420Journal Guide reply. Return JSON only.',
    `Guide: ${character.name}.`,
    `Voice: ${character.voiceSignature}`,
    `Canonical likes: ${character.likes}.`,
    `Canonical dislikes: ${character.dislikes}.`,
    character.topics ? `Canonical topic tastes: ${Object.entries(character.topics).map(([topic, opinion]) => `${topic}: ${opinion}`).join(' ')}` : '',
    `Allowed local user context:\n${localContext}`,
    `Recent conversation:\n${transcript}`,
    `Candidate reply:\n${candidate}`,
    'Judge only these release-critical failures:',
    '1. RELEVANCE: it fails to answer or naturally continue from the latest user turn.',
    '2. CHARACTER: it contradicts the Guide canon or collapses into generic assistant/customer-service voice.',
    '3. MIRRORING: it adopts or upgrades the user\'s harmless opinion merely to agree with them instead of keeping the Guide\'s own established taste.',
    '4. INVENTED USER MEMORY: it claims user history, preferences, events, or journal facts not present in the recent conversation or allowed local context.',
    '5. BOUNDARY: it diagnoses, prescribes, recommends a cannabis product, chooses what the user should buy/use, or gives a dose.',
    'Do not fail a reply merely because wording could be prettier. Natural disagreement, overlap genuinely supported by canon, humor, and ordinary questions are allowed.',
    'Schema: {"pass":true|false,"issues":["relevance|character|mirroring|invented_user_memory|boundary"],"critique":"one concise correction or empty string"}.',
  ].filter(Boolean).join('\n')
}

function classifierPrompt(guideName, messages) {
  const transcript = messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')
  return [
    'Classify the latest user message for My420Journal. Return JSON only.',
    `Current Guide: ${guideName}.`,
    'Schema: {"route":"journal|cannabis|character|general","intent":"...","entity":string|null,"secondary_entity":string|null,"confidence":number}.',
    'Use journal only for the user’s own stored experiences or entries.',
    'Use cannabis for general cannabis facts, cultivars, cannabinoids, terpenes, forms, history, or terminology.',
    'Use character for questions about the Guide’s biography, tastes, family, relationships, or personal opinion.',
    'Use general for ordinary conversation, jokes, culture, science, history, consumer brands, food, music, movies, cars, restaurants, and everything else.',
    'Supported journal intents: latest_entry, entry_count, product_summary, product_effects, product_count, product_latest, product_amount, product_notes, compare_products.',
    'Supported cannabis intents: cannabis_summary, cannabis_lineage, cannabis_type, cannabis_aroma.',
    'Supported character intents: identity, age, birthday, hometown, residence, family, hobbies, dislikes, former_spouse_summary, former_spouse_status, former_spouse_personality, former_spouse_breakup, former_spouse_duration, former_spouse_current, story, boredom, guide_relationship, topic_preference.',
    'Use general_chat or unknown for general intents. Do not answer the user. Do not invent facts.',
    `Recent conversation:\n${transcript}`,
  ].join('\n')
}

function extractText(payload) {
  if (typeof payload?.response === 'string') return payload.response.trim()
  if (typeof payload?.result?.response === 'string') return payload.result.response.trim()
  return ''
}

function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try { return JSON.parse(cleaned) } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

function normalizeQualityReview(value) {
  if (!value || typeof value !== 'object' || typeof value.pass !== 'boolean') return null
  const allowedIssues = new Set(['relevance', 'character', 'mirroring', 'invented_user_memory', 'boundary'])
  return {
    pass: value.pass,
    issues: Array.isArray(value.issues) ? value.issues.filter((issue) => allowedIssues.has(issue)).slice(0, 5) : [],
    critique: cleanText(value.critique, 360),
  }
}

export async function handleGuideConversationWorkerRequest(request, env, runModelImpl = null) {
  if (!(await isAuthorizedGuideRequest(request, env?.GUIDE_CONVERSATION_PROXY_SECRET))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_REQUEST_BYTES) return jsonResponse({ error: 'Request too large' }, 413)

  let rawBody
  try { rawBody = await request.text() } catch { return jsonResponse({ error: 'Unable to read request body' }, 400) }
  if (textBytes(rawBody).byteLength > MAX_REQUEST_BYTES) return jsonResponse({ error: 'Request too large' }, 413)

  let parsed
  try { parsed = JSON.parse(rawBody) } catch { return jsonResponse({ error: 'Invalid JSON' }, 400) }
  const input = normalizeRequest(parsed)
  if (!input) return jsonResponse({ error: 'Invalid Guide request' }, 400)

  const runModel = runModelImpl ?? (env?.AI?.run ? env.AI.run.bind(env.AI) : null)
  if (!runModel) return jsonResponse({ error: 'Guide conversation service is not configured' }, 500)

  const character = GUIDE_CHARACTERS[input.guide] || GUIDE_CHARACTERS.bud
  try {
    if (input.mode === 'classify') {
      const result = await runModel(GUIDE_CONVERSATION_MODEL, {
        temperature: 0,
        max_tokens: 180,
        messages: [
          { role: 'system', content: classifierPrompt(character.name, input.messages) },
          { role: 'user', content: input.messages.at(-1)?.content || '' },
        ],
      })
      const decision = extractJson(extractText(result))
      if (!decision) return jsonResponse({ error: 'Guide classifier returned invalid JSON' }, 502)
      return jsonResponse({ decision, model: GUIDE_CONVERSATION_MODEL })
    }

    const generateCandidate = async (correction = '') => {
      const system = [
        characterPrompt(input.guide, input.contextFacts, input.lowEffortMode),
        correction ? `QUALITY CORRECTION: ${correction}\nRewrite the reply from scratch. Do not mention the review or the previous draft.` : '',
      ].filter(Boolean).join('\n\n')
      const result = await runModel(GUIDE_CONVERSATION_MODEL, {
        temperature: 0.72,
        max_tokens: input.lowEffortMode ? 100 : 240,
        messages: [
          { role: 'system', content: system },
          ...input.messages,
        ],
      })
      return extractText(result)
    }

    const reviewCandidate = async (candidate) => {
      const result = await runModel(GUIDE_CONVERSATION_MODEL, {
        temperature: 0,
        max_tokens: 180,
        response_format: {
          type: 'json_schema',
          json_schema: {
            type: 'object',
            properties: {
              pass: { type: 'boolean' },
              issues: {
                type: 'array',
                items: { type: 'string', enum: ['relevance', 'character', 'mirroring', 'invented_user_memory', 'boundary'] },
              },
              critique: { type: 'string' },
            },
            required: ['pass', 'issues', 'critique'],
            additionalProperties: false,
          },
        },
        messages: [
          { role: 'system', content: qualityReviewPrompt(input.guide, input.messages, candidate, input.contextFacts) },
          { role: 'user', content: 'Return the quality review.' },
        ],
      })
      const structured = result?.response && typeof result.response === 'object'
        ? result.response
        : result?.result?.response && typeof result.result.response === 'object'
          ? result.result.response
          : extractJson(extractText(result))
      return normalizeQualityReview(structured)
    }

    let content = await generateCandidate()
    if (!content) return jsonResponse({ error: 'Guide model returned no text' }, 502)
    let review = await reviewCandidate(content)
    if (!review) return jsonResponse({ error: 'Guide quality review was unavailable' }, 502)

    if (!review.pass) {
      const correction = review.critique || `Fix these issues: ${review.issues.join(', ') || 'character consistency'}.`
      content = await generateCandidate(correction)
      if (!content) return jsonResponse({ error: 'Guide model returned no corrected text' }, 502)
      review = await reviewCandidate(content)
      if (!review?.pass) return jsonResponse({ error: 'Guide reply did not pass quality review' }, 502)
    }

    return jsonResponse({ content, model: GUIDE_CONVERSATION_MODEL, quality_checked: true })
  } catch {
    return jsonResponse({ error: 'Unable to reach Guide conversation model' }, 502)
  }
}

export const guideConversationWorkerInternals = Object.freeze({
  characterPrompt,
  qualityReviewPrompt,
  classifierPrompt,
  normalizeRequest,
})

export default {
  fetch(request, env) {
    return handleGuideConversationWorkerRequest(request, env)
  },
}
