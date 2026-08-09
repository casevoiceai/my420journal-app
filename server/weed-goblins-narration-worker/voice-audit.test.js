import test from 'node:test'
import assert from 'node:assert/strict'
import { WEED_GOBLINS_SYSTEM_PROMPT } from './legacyChapterOne.js'
import { validateGeneratedNarration } from '../../src/features/games/weed-goblins/weedGoblinsNarrationValidation.js'

test('prompt separates fiction and table-aside registers and keeps Eliza distinct', () => {
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /TWO REGISTERS, NEVER BLENDED/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /separate from S\.T\.O\.N\.E\.R\./)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /1966 ELIZA chatbot/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /ELIZA's Mirror/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Sprout, Bloom, Harvest, and Wither/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Scraped, Bruised, Broken, and Downed/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Rootcoin/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Ashka Greyroot/)
})

test('prompt locks messenger bubble structure and controlled fragments', () => {
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /One GM turn is one coherent messenger bubble/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /usually two to five sentences/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Fragments are punctuation for dramatic effect, not the default structure/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Never stack fragment after fragment/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Do not optimize for concision\. Optimize for immersion\./)
})

test('prompt varies sentence completeness without undoing coherent bubble chunking', () => {
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /roughly one sentence in four or five may break grammatical completeness/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /highest tension, the sharpest visual detail, the sudden realization, or the dry punch of the joke/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /This is a rhythm tool, not a content tool/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /single em dash when the spoken rhythm genuinely cuts off/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Do not force a break just to hit a quota/)
})

test('validator permits a deliberate em-dash trail-off but still rejects an en dash', () => {
  const emDash = validateGeneratedNarration(
    'The bottle-cap line trembles once, then goes still. Something moved beneath the bridge—',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.equal(emDash.valid, true, emDash.reasons.join('; '))

  const enDash = validateGeneratedNarration(
    'The bridge is quiet – too quiet to trust.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.ok(enDash.reasons.includes('uses an en dash'))
})

test('prompt limits hedge explanations and breaks the repeated triad cadence', () => {
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Use "as though" at most once in a scene/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Do not replace a cut hedge with "as if", "seemingly", "almost as if", or another phrase that performs the same explanatory job/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Do not default to lists of three/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /Vary enumeration shape across neighboring beats/)
  assert.match(WEED_GOBLINS_SYSTEM_PROMPT, /one strong image with no list at all/)
})

test('validator accepts grounded direct narration without first-person observer framing', () => {
  const result = validateGeneratedNarration(
    'Cold rain beads on the bottle-cap alarm line. It ticks softly against the bridge rail while mud pulls at your heel, and the goblin prints continue across the boards.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('validator rejects observer framing and UI language inside fiction', () => {
  const observer = validateGeneratedNarration(
    'I watch the rain gather on the bridge rail while the tracks continue uphill.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.ok(observer.reasons.includes('uses narrator-observer framing instead of direct scene narration'))

  const ui = validateGeneratedNarration(
    'The tracks continue uphill. Hit Continue when you are ready.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.ok(ui.reasons.includes('contains UI instruction in the fiction register'))
})

test('validator permits varied rhythm beyond the old 300-character ceiling', () => {
  const text = 'Wind comes down off the ridge cold enough to sting your ears, carrying the smell of wet pine and old smoke. Four sets of small bootprints cut through the mud ahead of you; a fifth wanders in and out of the others as if its owner could not decide where the road was. Fresh. Water has only just begun to collect in the heels.'
  assert.ok(text.length > 300)
  const result = validateGeneratedNarration(text, {
    moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition',
  })
  assert.equal(result.valid, true, result.reasons.join('; '))
})
