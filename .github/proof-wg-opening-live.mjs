import { chromium } from 'playwright'

const url = process.env.PLAYTEST_URL
const secret = process.env.PLAYTEST_SESSION_SECRET
const expected = [
  "You've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you.",
  "There are little bootprints all over the mud, a drag mark from the case, and one extremely clear goblin faceprint where somebody apparently lost an argument with the hill. They got back up. The faceprint did not.",
  "The theft itself was also a mess. While they were taking the case, two of them stopped to argue about whether this counted as theft or 'aggressive redistribution.' A third one produced a form. Nobody knew who was supposed to fill it out. Then they remembered they were escaping and ran.",
  "Now the tracks are heading straight toward the King's Stash Hall, which you can just make out up on the ridge whenever the fog gets out of the way. There's a miserable little bell up there going clonk every so often. Very regal.",
  "What's your character's name, and are they human, dwarf, elf, or gnome?",
]

const check = (condition, message) => {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1050, height: 923 } })
  await context.addCookies([{
    name: 'wg_private_playtest',
    value: secret,
    domain: 'weed-goblins-playtest.casevoice-ai.workers.dev',
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
  }])
  await context.addInitScript(() => localStorage.clear())
  const page = await context.newPage()
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  check(response?.ok(), `playtest response was ${response?.status()}`)

  await page.getByText(expected[0], { exact: true }).waitFor({ timeout: 30000 })
  await page.getByText(expected[4], { exact: true }).waitFor({ timeout: 30000 })

  const bubbles = await page.locator('.weed-goblins-game__message-bubble.is-eliza > p').allTextContents()
  check(bubbles.length >= 5, `only ${bubbles.length} narrator bubbles visible`)
  check(
    JSON.stringify(bubbles.slice(0, 5)) === JSON.stringify(expected),
    `opening bubbles did not match exact approved sequence: ${JSON.stringify(bubbles.slice(0, 5))}`,
  )

  const body = await page.locator('body').innerText()
  for (const stale of [
    'Welcome to the THC Trails.',
    'A bell, or maybe just the idea of a bell, rings three times.',
    'Half a beat later, it rings once more. Very regal.',
    'Type a name in the message box.',
    'forcing yourself to invent one on command',
  ]) {
    check(!body.includes(stale), `stale copy still visible: ${stale}`)
  }

  check(
    await page.locator('.weed-goblins-game__guidance-bubble').count() === 0,
    'automatic idle guidance is still rendered',
  )

  await page.screenshot({
    path: 'playtest-artifacts/weed-goblins-opening-approved.png',
    fullPage: true,
  })

  await page.getByRole('button', { name: /^Help/ }).click()
  const help = page.locator('.weed-goblins-game__help-bubble p')
  await help.waitFor({ timeout: 10000 })
  check(
    (await help.innerText()) === 'If you want name suggestions, I can give you a few.',
    `unexpected Help text: ${await help.innerText()}`,
  )

  console.log('LIVE_APPROVED_PREMISE_EXACT=PASS')
  console.log('LIVE_VERY_REGAL_BEAT_EXACT=PASS')
  console.log('LIVE_LOCKED_CHARACTER_QUESTION_EXACT=PASS')
  console.log('LIVE_AUTOMATIC_GUIDANCE_ABSENT=PASS')
  console.log('LIVE_HELP_BUTTON_OPT_IN=PASS')
  console.log(`LIVE_URL=${page.url()}`)
  console.log('SCREENSHOT=playtest-artifacts/weed-goblins-opening-approved.png')
} finally {
  await browser.close()
}
