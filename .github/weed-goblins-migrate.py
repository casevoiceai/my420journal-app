from pathlib import Path
import re

root = Path(".")
worker_path = root / "server/weed-goblins-narration-worker/index.js"
index_test_path = root / "server/weed-goblins-narration-worker/index.test.js"
story_test_path = root / "server/weed-goblins-narration-worker/story-beats.test.js"
wrangler_path = root / "server/weed-goblins-narration-worker/wrangler.jsonc"
readme_path = root / "server/weed-goblins-narration-worker/README.md"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)

worker = worker_path.read_text()
worker = replace_once(
    worker,
    """const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
export const WEED_GOBLINS_MODEL = 'claude-haiku-4-5-20251001'""",
    """export const WEED_GOBLINS_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'""",
    "provider constants",
)
worker = replace_once(
    worker,
    """function extractText(payload) {
  const blocks = Array.isArray(payload?.content) ? payload.content : []
  return blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
    .trim()
}""",
    """function extractText(payload) {
  return typeof payload?.response === 'string' ? payload.response.trim() : ''
}""",
    "provider response extraction",
)
worker = replace_once(
    worker,
    """export async function handleNarrationWorkerRequest(
  request,
  env,
  fetchImpl = fetch,
  now = Date.now(),
) {""",
    """export async function handleNarrationWorkerRequest(
  request,
  env,
  runModelImpl = null,
  now = Date.now(),
) {""",
    "handler signature",
)
worker = replace_once(
    worker,
    """  if (!env?.WEED_GOBLINS_ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'Narration service is not configured' }, 500)
  }
""",
    """  const runModel = runModelImpl ?? (env?.AI?.run ? env.AI.run.bind(env.AI) : null)
  if (!runModel) {
    return jsonResponse({ error: 'Narration service is not configured' }, 500)
  }
""",
    "provider configuration check",
)
worker = replace_once(
    worker,
    """  let anthropicResponse
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
""",
    """  let modelResponse
  try {
    modelResponse = await runModel(WEED_GOBLINS_MODEL, {
      max_tokens: 96,
      temperature: 0.7,
      messages: [
        { role: 'system', content: WEED_GOBLINS_SYSTEM_PROMPT },
        { role: 'user', content: eventPrompt(context) },
      ],
    })
  } catch {
    return jsonResponse({ error: 'Unable to reach narration model' }, 502)
  }

  const text = extractText(modelResponse)
""",
    "provider invocation",
)
worker_path.write_text(worker)

index_test = index_test_path.read_text()
index_test = index_test.replace(
    "WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',",
    "AI: { async run() { throw new Error('test must inject model runner') } },",
)
index_test = index_test.replace("anthropicResponse", "workersAiResponse")
index_test = re.sub(
    r"""function workersAiResponse\(text\) \{
  return new Response\(JSON\.stringify\(\{
    content: \[\{ type: 'text', text \}\],
  \}\), \{ status: 200, headers: \{ 'Content-Type': 'application/json' \} \}\)
\}""",
    """function workersAiResponse(text) {
  return { response: text }
}""",
    index_test,
    count=1,
)
first_forward_pattern = re.compile(
    r"""test\('forwards only an authorized valid natural-one request to Anthropic', async \(\) => \{.*?\n\}\)\n\n(?=test\('accepts ordinary-failure)""",
    re.S,
)
first_forward_replacement = """test('forwards only an authorized valid natural-one request to Workers AI', async () => {
  let forwarded
  const response = await handleNarrationWorkerRequest(
    request(),
    env,
    async (model, input) => {
      forwarded = { model, input }
      return workersAiResponse(
        'I note that the gate has reassigned your route to the longer route.',
      )
    },
  )

  assert.equal(response.status, 200)
  assert.equal(forwarded.model, WEED_GOBLINS_MODEL)
  assert.equal(forwarded.input.messages[0].role, 'system')
  assert.equal(forwarded.input.messages[0].content, WEED_GOBLINS_SYSTEM_PROMPT)
  assert.equal(forwarded.input.messages[1].role, 'user')
  assert.equal(forwarded.input.messages[1].content.includes('\"outcome\":\"complication\"'), true)
  assert.equal(JSON.stringify(forwarded).includes(SECRET), false)
})

"""
index_test, count = first_forward_pattern.subn(first_forward_replacement, index_test, count=1)
if count != 1:
    raise SystemExit(f"index test forward block: expected 1 match, found {count}")

index_test = index_test.replace(
    """async (_url, init) => {
      forwarded = JSON.parse(init.body)""",
    """async (_model, input) => {
      forwarded = input""",
)
index_test = index_test.replace(
    """async (url, init) => {
      forwarded = { url, init, body: JSON.parse(init.body) }""",
    """async (model, input) => {
      forwarded = { model, input }""",
)
index_test = index_test.replace("forwarded.messages[0].content", "forwarded.messages[1].content")
index_test = index_test.replace("before Anthropic forwarding", "before Workers AI invocation")
index_test = index_test.replace("before Anthropic", "before Workers AI")
index_test_path.write_text(index_test)

story = story_test_path.read_text()
story = story.replace(
    "WEED_GOBLINS_ANTHROPIC_API_KEY: 'test-api-key',",
    "AI: { async run() { throw new Error('test must inject model runner') } },",
)
story = story.replace("anthropicResponse", "workersAiResponse")
story = re.sub(
    r"""function workersAiResponse\(\) \{
  return new Response\(JSON\.stringify\(\{
    content: \[\{ type: 'text', text: 'I record the supplied result without altering it\.' \}\],
  \}\), \{ status: 200, headers: \{ 'Content-Type': 'application/json' \} \}\)
\}""",
    """function workersAiResponse() {
  return { response: 'I record the supplied result without altering it.' }
}""",
    story,
    count=1,
)
story = story.replace(
    """async (_url, init) => {
        forwarded = JSON.parse(init.body)""",
    """async (_model, input) => {
        forwarded = input""",
)
story = story.replace("forwarded.messages[0].content", "forwarded.messages[1].content")
story = story.replace("before Anthropic", "before Workers AI invocation")
story_test_path.write_text(story)

wrangler = wrangler_path.read_text()
wrangler = replace_once(
    wrangler,
    '  "compatibility_flags": ["nodejs_compat"],\n  "durable_objects": {',
    '  "compatibility_flags": ["nodejs_compat"],\n  "ai": {\n    "binding": "AI"\n  },\n  "durable_objects": {',
    "Workers AI binding",
)
wrangler_path.write_text(wrangler)

readme_path.write_text("""# my420journal Weed Goblins narration Worker

Dedicated Cloudflare Workers AI narrator for Weed Goblins. It is separate from CASEVOICE and My Written Statement infrastructure.

## Worker name

`my420journal-weed-goblins-narration`

## AI binding

Wrangler binds Cloudflare Workers AI as `AI`. The Worker calls the Cloudflare-hosted model `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through `env.AI.run(...)`.

No third-party provider API key is required for narration.

## Required Worker secrets

- `WEED_GOBLINS_PROXY_SECRET`
- `WEED_GOBLINS_RATE_LIMIT_SALT`

Set secrets with Wrangler. Never place their values in source, `wrangler.jsonc`, browser code, Pages build variables, logs, or test fixtures.

## Security contract

1. Every request is checked for `Authorization: Bearer <WEED_GOBLINS_PROXY_SECRET>` before method handling, configuration checks, body parsing, or model invocation.
2. Missing or incorrect authorization returns `401`.
3. The Worker exposes no browser CORS headers.
4. Only supported authoritative Weed Goblins moment/outcome pairs are accepted.
5. The Worker invokes Workers AI only after authorization and input validation.
6. The two free-text moments share a limit of 30 calls per hour per salted, hashed source address. Raw source addresses are not stored in the rate limiter.

The Pages Function uses `WEED_GOBLINS_NARRATION_WORKER_URL` and the same `WEED_GOBLINS_PROXY_SECRET` as private server-side bindings. The direct Worker URL must never be included in browser source.
""")

for path in [worker_path, index_test_path, story_test_path, wrangler_path, readme_path]:
    text = path.read_text().lower()
    for forbidden in ("anthropic", "claude"):
        if forbidden in text:
            raise SystemExit(f"{path}: forbidden provider reference remains: {forbidden}")
