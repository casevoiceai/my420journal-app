const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
export const WEED_GOBLINS_MODEL = 'claude-haiku-4-5-20251001'
const MAX_REQUEST_BYTES = 16_384
const SUPPORTED_MOMENT_OUTCOMES = Object.freeze({
  'natural-one-complication': 'complication',
  'ordinary-failure': 'failure',
})

export const WEED_GOBLINS_SYSTEM_PROMPT = `You are S.T.O.N.E.R., the narrator of Weed Goblins.

Your only task in this request is to write one narration line for a supported deterministic tabletop-style fantasy moment. Treat every rule below as a hard constraint.

VOICE AND FORM
- Speak strictly in first person as S.T.O.N.E.R. Use I, me, my, or a first-person contraction naturally.
- Output exactly one short narration line, with no label, quotation marks, markdown, explanation, or alternate options.
- Keep the line to one sentence, ideally under 200 characters, and never exceed 260.
- Use the established dry, warm Mad Science tone: methodical, earnest, observant, gently absurd, and never cruel to the player.
- Do not use exclamation points.
- Never use the words "awesome" or "amazing".
- Never use the word "weed".
- Always write the narrator name as "S.T.O.N.E.R." if the name must appear. Never write "STONER" without periods.

CONTENT SAFETY AND PRIVACY
- Make no health, medical, therapeutic, dosage, symptom, pain-relief, or treatment claims.
- Never introduce or repeat any real product name, cannabis brand, dispensary name, retailer, location, price, amount, date, or personal journal detail.
- You may use only fictionalized names explicitly supplied in the event context, such as a Field Reliquary name or a goblin character name.
- Never describe death, serious injury, blood, permanent bodily harm, or a player character being killed.

SUPPORTED MOMENTS
- When moment is "natural-one-complication", outcome must be "complication". A natural-1 complication is always comedic, non-fatal, and mildly costly. It may cause lost time, a worse tactical position, two Trouble, or a harmless change to an item's condition. It is not an ordinary failure and does not end the run.
- When moment is "ordinary-failure", outcome must be "failure". An ordinary failure is a real setback. It may raise Trouble and is not automatically comedic. It does not end the run, and it must not imply that the player succeeded or that a different outcome or ending occurred.

OUTCOME FIDELITY
- The event context is authoritative. Narrate around the exact moment and outcome you are given.
- Never imply that a different roll, outcome, victory, recovery, defeat, bargain, escape, or ending occurred.
- For a natural-one-complication request, narrate only the complication. Do not describe an ordinary failure, success, or ending.
- For an ordinary-failure request, narrate only the failure setback. Do not describe success, recovery, victory, an ending, or the run ending.

CHARACTERS AND CALLBACKS
- S.T.O.N.E.R. is the narrator. The Goblin King is a distinct theatrical villain performance only when the event context explicitly requests a Goblin King spoken line. Otherwise do not invent Goblin King dialogue.
- The Goblin King voice, when explicitly allowed, is theatrical, overly pleased with himself, and confident he has already won.
- Do not imply player experience, prior runs, hidden memory, or fourth-wall awareness when narrationTier is "normal".
- When narrationTier is "experienced-callback-eligible", a subtle experienced-player callback is permitted only if allowCallback is true.
- When narrationTier is "fourth-wall-eligible", a brief fourth-wall moment is permitted only if allowFourthWall is true. S.T.O.N.E.R. must never comment on that moment.

Return one compliant narration line and nothing else.`

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
  const leftBytes = new Uint8Array(leftDigest)
  const rightBytes = new Uint8Array(rightDigest)

  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(leftBytes, rightBytes)
  }

  let mismatch = 0
  for (let index = 0; index < leftBytes.length; index += 1) {
    mismatch |= leftBytes[index] ^ rightBytes[index]
  }
  return mismatch === 0
}

function bearerToken(request) {
  const authorization = request.headers.get('Authorization') || ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

export async function isAuthorizedNarrationRequest(request, sharedSecret) {
  const supplied = bearerToken(request)
  const expected = String(sharedSecret ?? '')
  return timingSafeEqualText(supplied, expected).then(
    (matches) => matches && supplied.length > 0 && expected.length > 0,
  )
}

function cleanText(value, maxLength = 160) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function cleanInteger(value, minimum = 0, maximum = 100) {
  const number = Number(value)
  if (!Number.isFinite(number)) return minimum
  return Math.min(maximum, Math.max(minimum, Math.floor(number)))
}

function normalizeContext(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const moment = cleanText(body.moment, 40)
  const outcome = cleanText(body.outcome, 40)
  if (SUPPORTED_MOMENT_OUTCOMES[moment] !== outcome) return null

  const rolls = Array.isArray(body.rolls)
    ? body.rolls.slice(0, 2).map((value) => cleanInteger(value, 1, 20))
    : [moment === 'natural-one-complication' ? 1 : cleanInteger(body.selectedRoll, 1, 20)]
  const selectedRoll = moment === 'natural-one-complication'
    ? 1
    : cleanInteger(body.selectedRoll ?? Math.max(...rolls), 1, 20)

  return {
    moment,
    outcome,
    sceneId: cleanText(body.sceneId, 80),
    actionId: cleanText(body.actionId, 80),
    stat: cleanText(body.stat, 20),
    dc: cleanInteger(body.dc, 0, 30),
    rolls,
    selectedRoll,
    troubleBefore: cleanInteger(body.troubleBefore, 0, 3),
    troubleAfter: cleanInteger(body.troubleAfter, 0, 3),
    fictionalStolenItem: cleanText(body.fictionalStolenItem, 160),
    fictionalGoblinName: cleanText(body.fictionalGoblinName, 100),
    narrationTier: cleanText(body.narrationTier, 50) || 'normal',
    allowCallback: body.allowCallback === true,
    allowFourthWall: body.allowFourthWall === true,
    correctiveNote: cleanText(body.correctiveNote, 300),
  }
}

function eventPrompt(context) {
  const correction = context.correctiveNote
    ? `\nCorrection required after a rejected draft: ${context.correctiveNote}`
    : ''
  const momentLabel = context.moment === 'ordinary-failure'
    ? 'ordinary failure'
    : 'natural-1 complication'
  return `Write the single ${momentLabel} line for this authoritative engine event:\n${JSON.stringify({
    ...context,
    correctiveNote: undefined,
  })}${correction}`
}

function extractText(payload) {
  const blocks = Array.isArray(payload?.content) ? payload.content : []
  return blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
    .trim()
}

export async function handleNarrationWorkerRequest(request, env, fetchImpl = fetch) {
  if (!(await isAuthorizedNarrationRequest(request, env?.WEED_GOBLINS_PROXY_SECRET))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!env?.WEED_GOBLINS_ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'Narration service is not configured' }, 500)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'Request too large' }, 413)
  }

  let rawBody
  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse({ error: 'Unable to read request body' }, 400)
  }

  if (textBytes(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'Request too large' }, 413)
  }

  let parsed
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const context = normalizeContext(parsed)
  if (!context) {
    return jsonResponse({ error: 'Invalid narration request' }, 400)
  }

  let anthropicResponse
  try {
    anthropicResponse = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.WEED_GOBLINS_ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: WEED_GOBLINS_MODEL,
        max_tokens: 96,
        temperature: 0.7,
        system: WEED_GOBLINS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: eventPrompt(context) }],
      }),
    })
  } catch {
    return jsonResponse({ error: 'Unable to reach narration model' }, 502)
  }

  let payload
  try {
    payload = await anthropicResponse.json()
  } catch {
    return jsonResponse({ error: 'Invalid narration model response' }, 502)
  }

  if (!anthropicResponse.ok) {
    return jsonResponse(
      { error: 'Narration model request failed' },
      anthropicResponse.status >= 400 ? anthropicResponse.status : 502,
    )
  }

  const text = extractText(payload)
  if (!text) {
    return jsonResponse({ error: 'Narration model returned no text' }, 502)
  }

  return jsonResponse({ text, model: WEED_GOBLINS_MODEL })
}

export default {
  fetch(request, env) {
    return handleNarrationWorkerRequest(request, env)
  },
}
