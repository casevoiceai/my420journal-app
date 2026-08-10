export const PRIVATE_TESTING_ACCESS_PATH = '/api/private-testing-access'
export const PRIVATE_TESTING_COOKIE = '__Host-my420journal_private_testing'
export const PRIVATE_TESTING_SESSION_TTL_SECONDS = 12 * 60 * 60
export const PRIVATE_TESTING_CONTACT_EMAIL = 'casevoice.ai@gmail.com'

const encoder = new TextEncoder()

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqualBytes(left, right) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index]
  }
  return mismatch === 0
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value ?? '')))
  return new Uint8Array(digest)
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret ?? '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return bytesToHex(new Uint8Array(signature))
}

export async function timingSafeEqualText(left, right) {
  const [leftDigest, rightDigest] = await Promise.all([sha256(left), sha256(right)])
  return constantTimeEqualBytes(leftDigest, rightDigest)
}

function readCookie(cookieHeader, name) {
  const cookies = String(cookieHeader ?? '').split(';')
  for (const part of cookies) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    if (key !== name) continue
    return part.slice(separator + 1).trim()
  }
  return ''
}

async function sessionSignature(secret, expiresAt) {
  return hmacHex(secret, `my420journal-private-testing:${expiresAt}`)
}

export async function createPrivateTestingSession(secret, now = Date.now()) {
  const expiresAt = now + PRIVATE_TESTING_SESSION_TTL_SECONDS * 1000
  const signature = await sessionSignature(secret, expiresAt)
  return `${expiresAt}.${signature}`
}

export async function isPrivateTestingSessionValid(cookieHeader, secret, now = Date.now()) {
  const expectedSecret = String(secret ?? '').trim()
  if (!expectedSecret) return false

  const raw = readCookie(cookieHeader, PRIVATE_TESTING_COOKIE)
  const separator = raw.indexOf('.')
  if (separator <= 0) return false

  const expiresText = raw.slice(0, separator)
  const suppliedSignature = raw.slice(separator + 1)
  if (!/^\d{13}$/.test(expiresText) || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) return false

  const expiresAt = Number(expiresText)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false

  const expectedSignature = await sessionSignature(expectedSecret, expiresText)
  const [suppliedBytes, expectedBytes] = await Promise.all([
    sha256(suppliedSignature.toLowerCase()),
    sha256(expectedSignature),
  ])
  return constantTimeEqualBytes(suppliedBytes, expectedBytes)
}

export async function buildPrivateTestingCookie(secret) {
  const session = await createPrivateTestingSession(secret)
  return `${PRIVATE_TESTING_COOKIE}=${session}; Path=/; Max-Age=${PRIVATE_TESTING_SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
}

export function renderPrivateTestingGate({ showError = false } = {}) {
  const error = showError
    ? `<p class="error" role="alert">That code is not valid or has expired. Contact ${PRIVATE_TESTING_CONTACT_EMAIL} for access.</p>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>Private Testing</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, Arial, sans-serif; background: #0a1a0a; color: #f4f1e8; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0a1a0a; }
    main { width: min(100%, 560px); padding: clamp(28px, 6vw, 48px); border: 1px solid rgba(201,168,76,.45); border-radius: 22px; background: #102510; box-shadow: 0 24px 70px rgba(0,0,0,.35); }
    h1 { margin: 0 0 18px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(34px, 8vw, 52px); color: #f4f1e8; }
    p { margin: 0 0 24px; color: #c8d9c8; font-size: 17px; line-height: 1.65; }
    label { display: block; margin-bottom: 8px; color: #c9a84c; font-weight: 800; }
    input { width: 100%; min-height: 52px; padding: 12px 14px; border: 1px solid #8faf8f; border-radius: 10px; background: #071407; color: #f4f1e8; font: inherit; }
    button { width: 100%; min-height: 52px; margin-top: 16px; border: 0; border-radius: 10px; background: #c9a84c; color: #071407; font: inherit; font-weight: 900; cursor: pointer; }
    .error { margin: 18px 0 0; padding: 14px; border: 1px solid rgba(255,190,190,.45); border-radius: 10px; background: rgba(120,20,20,.22); color: #ffd9d9; }
  </style>
</head>
<body>
  <main>
    <h1>Private Testing</h1>
    <p>This app is currently in private testing and is not open to the public. Enter your tester access code to continue.</p>
    <form method="post" action="${PRIVATE_TESTING_ACCESS_PATH}" autocomplete="off">
      <label for="access-code">Access code</label>
      <input id="access-code" name="access_code" type="password" required autocomplete="one-time-code" autocapitalize="none" spellcheck="false" />
      <button type="submit">Continue</button>
    </form>
    ${error}
  </main>
</body>
</html>`
}
