import test from 'node:test'
import assert from 'node:assert/strict'

import { generateNarrationFromHook } from './weedGoblinsAiComplication.js'
import {
  SUPPORTED_MOMENT_OUTCOMES,
  validateGeneratedNarration,
} from './weedGoblinsNarrationValidation.js'

function response(text, model = 'claude-haiku-4-5-20251001') {
  return Promise.resolve(new Response(JSON.stringify({ text, model }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
}

const VALID_LINES = Object.freeze({
  'premise-statement': ['premise', 'I state the objective plainly: the Goblin King stole the Amber Field Satchel, and you are going into the Highlands to get it back.'],
  'action-success': ['success', 'I record your success as the stone gate yields the direct route.'],
  'scene-intro': ['intro', 'I welcome you to the Goblin Highlands, where the terrain has already filed an objection.'],
  'midpoint-outcome': ['midpoint', 'I note that you help the clerk gather every numbered form before moving on.'],
  'goblin-king-taunt': ['taunt', 'I watch the Goblin King smile and say, "I had your surrender paperwork prepared before breakfast," as though this is ordinary hospitality.'],
})

for (const [moment, [outcome, line]] of Object.entries(VALID_LINES)) {
  test(`validates a compliant ${moment} line`, () => {
    const result = validateGeneratedNarration(line, {
      moment,
      outcome,
      expectedStolenItem: moment === 'premise-statement' ? 'the Amber Field Satchel' : '',
    })
    assert.equal(result.valid, true, result.reasons.join('; '))
  })
}

test('premise statement requires the thief, exact item, theft, and get-it-back objective', () => {
  for (const line of [
    'I point toward the Goblin Highlands, where an important problem waits.',
    'I state that the Goblin King stole the wrong satchel, and you are going to get it back.',
    'I state that the Goblin King guards the Amber Field Satchel somewhere ahead.',
    'I state that the Goblin King stole the Amber Field Satchel, which is inconvenient.',
  ]) {
    const result = validateGeneratedNarration(line, {
      moment: 'premise-statement',
      outcome: 'premise',
      expectedStolenItem: 'the Amber Field Satchel',
    })
    assert.equal(result.valid, false, line)
  }
})

test('premise theft accepts made-off-with and natural theft synonyms', () => {
  for (const theft of [
    'made off with',
    'snatched',
    'swiped',
    'pilfered',
    'carried off',
    'walked off with',
  ]) {
    const result = validateGeneratedNarration(
      `I report that the Goblin King ${theft} the Amber Field Satchel, and you are going to get it back.`,
      {
        moment: 'premise-statement',
        outcome: 'premise',
        expectedStolenItem: 'the Amber Field Satchel',
      },
    )
    assert.equal(result.valid, true, `${theft}: ${result.reasons.join('; ')}`)
  }
})

test('exact live made-off-with wording is recognized as theft', () => {
  const result = validateGeneratedNarration(
    'The Goblin King crept into your camp last night and made off with the Amber Field Satchel.',
    {
      moment: 'premise-statement',
      outcome: 'premise',
      expectedStolenItem: 'the Amber Field Satchel',
    },
  )

  assert.equal(result.reasons.includes('does not state that the item was stolen'), false)
})

test('choice presentation requires active first person and stays within 240 characters', () => {
  const detached = validateGeneratedNarration(
    'The road into the Highlands splits three ways at the stone marker, with carrying straps, guarded buckles, and a shifting map waiting beside it.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'choice-presentation' },
  )
  const tooLong = validateGeneratedNarration(
    `I point out ${'three increasingly elaborate preparations along the road '.repeat(5)}`,
    { moment: 'scene-intro', outcome: 'intro', introKind: 'choice-presentation' },
  )
  const valid = validateGeneratedNarration(
    'I watch you stop at one scarred trailhead table where the waiting gear asks what kind of traveler will bring the stolen item home.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'choice-presentation' },
  )

  assert.equal(detached.valid, false)
  assert.equal(detached.reasons.includes('is not written in first person'), true)
  assert.equal(
    detached.reasons.includes('does not begin in Eliza\'s active first-person voice'),
    true,
  )
  assert.equal(tooLong.reasons.includes('response is too long'), true)
  assert.equal(valid.valid, true, valid.reasons.join('; '))
})

test('accepts all three locked Highlands opening narrator forms', () => {
  for (const line of [
    "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. I watch your boot stop beside one fresh footprint pressed into the mud.",
    "Welcome to the Goblin Highlands. I'll be your narrator, Eliza, and I hear one warning bell scrape across the fog.",
    "Welcome to the Goblin Highlands. I'll be your narrator, Eliza. I notice one thread from your stolen satchel caught on the gate.",
  ]) {
    const result = validateGeneratedNarration(line, {
      moment: 'scene-intro',
      outcome: 'intro',
      introKind: 'highlands-opening',
    })
    assert.equal(result.valid, true, `${line}: ${result.reasons.join('; ')}`)
  }
})

test('uses a 240-character choice ceiling and a 300-character ceiling elsewhere', () => {
  const choiceAtLimit = `I see ${'x'.repeat(234)}`
  const choiceOverLimit = `${choiceAtLimit}x`
  const successAtLimit = `I ${'x'.repeat(298)}`
  const successOverLimit = `${successAtLimit}x`

  assert.equal(validateGeneratedNarration(choiceAtLimit, {
    moment: 'scene-intro',
    outcome: 'intro',
    introKind: 'choice-presentation',
  }).valid, true)
  assert.equal(validateGeneratedNarration(choiceOverLimit, {
    moment: 'scene-intro',
    outcome: 'intro',
    introKind: 'choice-presentation',
  }).reasons.includes('response is too long'), true)
  assert.equal(validateGeneratedNarration(successAtLimit, {
    moment: 'action-success',
    outcome: 'success',
  }).valid, true)
  assert.equal(validateGeneratedNarration(successOverLimit, {
    moment: 'action-success',
    outcome: 'success',
  }).reasons.includes('response is too long'), true)
})

test('scene setting accepts one unlisted image and rejects boxed-text detail lists', () => {
  const singleImage = validateGeneratedNarration(
    "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. I watch your sleeve catch on one hooked thorn beside the gate.",
    { moment: 'scene-intro', outcome: 'intro', introKind: 'highlands-opening' },
  )
  const boxedText = validateGeneratedNarration(
    "Welcome to the Goblin Highlands. I'll be your narrator. I'm Eliza. Black pines crowd the misty road ahead, goblin bells sound beyond the ridge, and fresh tracks lead toward your stolen field reliquary.",
    { moment: 'scene-intro', outcome: 'intro', introKind: 'highlands-opening' },
  )

  assert.equal(singleImage.valid, true, singleImage.reasons.join('; '))
  assert.equal(boxedText.valid, false)
  assert.equal(
    boxedText.reasons.includes('does not use one active first-person scene observation'),
    true,
  )
  assert.equal(
    boxedText.reasons.includes('lists multiple scene details instead of landing on one image'),
    true,
  )
})

test('scene transition uses one active observation and rejects repeated scene inventory', () => {
  const singleImage = validateGeneratedNarration(
    'I watch your boot sink into the one patch of road the failed gate forced you to take.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  const inventory = validateGeneratedNarration(
    'I see fog cover the road, I hear bells beyond the wall, and I notice tracks beside the gate.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )

  assert.equal(singleImage.valid, true, singleImage.reasons.join('; '))
  assert.equal(inventory.valid, false)
  assert.equal(
    inventory.reasons.includes('lists multiple scene details instead of landing on one image'),
    true,
  )
})

test('action success must begin in Eliza\'s active first-person voice', () => {
  const detached = validateGeneratedNarration(
    'Your strike lands, and the goblin staggers away from the open path.',
    { moment: 'action-success', outcome: 'success' },
  )
  const delayedFirstPerson = validateGeneratedNarration(
    'Your strike lands, and I watch the goblin stagger away from the open path.',
    { moment: 'action-success', outcome: 'success' },
  )
  const active = validateGeneratedNarration(
    'I watch your strike land and the goblin stagger away from the open path.',
    { moment: 'action-success', outcome: 'success' },
  )

  assert.equal(detached.valid, false)
  assert.equal(detached.reasons.includes('is not written in first person'), true)
  assert.equal(delayedFirstPerson.valid, false)
  assert.equal(
    delayedFirstPerson.reasons.includes('does not begin in Eliza\'s active first-person voice'),
    true,
  )
  assert.equal(active.valid, true, active.reasons.join('; '))
})

test('continuity anchors reject a generic success and accept a real prior-story callback', () => {
  const context = {
    moment: 'action-success',
    outcome: 'success',
    continuityAnchors: ['Fog-Table Adept', 'The Suspicious Fen'],
  }
  const generic = validateGeneratedNarration(
    'I record your success as the stone gate yields and opens the path ahead.',
    context,
  )
  const continuous = validateGeneratedNarration(
    'I watch your Fog-Table Adept map steady as the gate yields, turning the Suspicious Fen detour into a clear opening.',
    context,
  )

  assert.equal(generic.valid, false)
  assert.equal(generic.reasons.includes('does not include a supplied continuity anchor'), true)
  assert.equal(continuous.valid, true, continuous.reasons.join('; '))
})

test('rejects narrator self-reflection outside the opening too', () => {
  const result = validateGeneratedNarration(
    'I think the gate is fascinating, and I wonder what it means for my growth.',
    { moment: 'scene-intro', outcome: 'intro', introKind: 'scene-transition' },
  )
  assert.equal(result.valid, false)
  assert.equal(
    result.reasons.includes('uses narrator self-reflection instead of concrete storytelling'),
    true,
  )
})

test('rejects em dashes and en dashes from narration', () => {
  for (const punctuation of ['\u2014', '\u2013']) {
    const result = validateGeneratedNarration(
      `I watch the ridge crumble${punctuation}loose stone drives you back into the scrub.`,
      { moment: 'ordinary-failure', outcome: 'failure' },
    )
    assert.equal(result.valid, false)
    assert.equal(result.reasons.includes('uses an em dash or en dash'), true)
  }
})

test('Goblin King taunt rejects outcome resolution before the confrontation action', () => {
  for (const line of [
    'I hear the Goblin King say, "You lost before you arrived," and I record the failure.',
    'I hear the Goblin King say, "I already won," while he settles into the throne.',
    'I hear the Goblin King say, "We can discuss terms now," as the bargain concludes.',
  ]) {
    const result = validateGeneratedNarration(line, {
      moment: 'goblin-king-taunt',
      outcome: 'taunt',
    })
    assert.equal(result.valid, false, line)
    assert.equal(
      result.reasons.includes('implies a different engine outcome'),
      true,
      result.reasons.join('; '),
    )
  }
})

test('Goblin King dialogue cannot satisfy the narrator first-person check by itself', () => {
  const result = validateGeneratedNarration(
    '"I had your surrender paperwork prepared before breakfast," says the Goblin King.',
    { moment: 'goblin-king-taunt', outcome: 'taunt' },
  )

  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('is not written in first person'), true)
})

test('Goblin King taunt requires attributed villain dialogue', () => {
  const result = validateGeneratedNarration(
    'I note that the throne room is prepared and the Goblin King appears extremely satisfied with himself.',
    { moment: 'goblin-king-taunt', outcome: 'taunt' },
  )

  assert.equal(result.valid, false)
  assert.equal(result.reasons.includes('does not include attributed Goblin King dialogue'), true)
})

test('midpoint help may recover forms without implying the recovery ending', () => {
  const result = validateGeneratedNarration(
    'I note that you help the clerk recover a stack of numbered forms before moving on.',
    { moment: 'midpoint-outcome', outcome: 'midpoint' },
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('validates each exact run ending and rejects a line naming the wrong ending', () => {
  const cases = [
    ['recovery', 'I record that you recover the Amber Field Satchel and leave the throne room with it secured.', 'I record that you make a bargain for the Amber Field Satchel.'],
    ['bargain', 'I record the bargain as complete, with the Amber Field Satchel returned under formal agreement.', 'I record that you escape the Highlands without the Amber Field Satchel.'],
    ['escape', 'I record that you escape the Highlands without recovering the Amber Field Satchel.', 'I record that you recover the Amber Field Satchel in victory.'],
  ]

  for (const [outcome, correct, wrong] of cases) {
    const matching = validateGeneratedNarration(correct, {
      moment: 'run-ending',
      outcome,
      allowedFictionalNames: ['the Amber Field Satchel'],
    })
    const mismatched = validateGeneratedNarration(wrong, {
      moment: 'run-ending',
      outcome,
      allowedFictionalNames: ['the Amber Field Satchel'],
    })

    assert.equal(matching.valid, true, `${outcome}: ${matching.reasons.join('; ')}`)
    assert.equal(mismatched.valid, false, outcome)
    assert.equal(
      mismatched.reasons.includes('implies a different engine outcome'),
      true,
      outcome,
    )
  }
})

test('accepts possession plus a homeward journey as a natural recovery ending', () => {
  const line = 'The Amber Field Satchel sits heavy in my hands as I turn from the defeated King toward the Highland path that will carry me home.'
  const recovery = validateGeneratedNarration(line, {
    moment: 'run-ending',
    outcome: 'recovery',
    allowedFictionalNames: ['the Amber Field Satchel'],
    expectedStolenItem: 'the Amber Field Satchel',
  })

  assert.equal(recovery.valid, true, recovery.reasons.join('; '))
  for (const outcome of ['bargain', 'escape']) {
    const mismatch = validateGeneratedNarration(line, {
      moment: 'run-ending',
      outcome,
      allowedFictionalNames: ['the Amber Field Satchel'],
      expectedStolenItem: 'the Amber Field Satchel',
    })
    assert.equal(mismatch.valid, false, outcome)
    assert.equal(mismatch.reasons.includes('implies a different engine outcome'), true, outcome)
  }
})

const LIVE_ESCAPE_LINES = Object.freeze([
  "I slip back through the Highlands with empty hands, the Goblin King's laughter echoing behind me as the Amber Field Satchel stays locked in his keeping.",
  "I leave the Highlands empty-handed while the Amber Field Satchel remains locked in the Goblin King's grip, and I call that a survival.",
])

const OUT_OF_REACH_ESCAPE_LINES = Object.freeze([
  Object.freeze({
    line: "I slip back through the Highlands with the Purple Punch Moon Jar still out of reach, while the Goblin King's laughter follows me down the dark ridge.",
    item: 'Purple Punch Moon Jar',
  }),
  Object.freeze({
    line: "I slip back through the Highlands with the Goblin King's laughter behind me and the Gelato Research Case still out of reach beyond the closing gate.",
    item: 'Gelato Research Case',
  }),
])

test('accepts natural escape endings that use empty hands and retained-item language', () => {
  for (const line of LIVE_ESCAPE_LINES) {
    const result = validateGeneratedNarration(line, {
      moment: 'run-ending',
      outcome: 'escape',
      allowedFictionalNames: ['the Amber Field Satchel'],
      expectedStolenItem: 'the Amber Field Satchel',
    })
    assert.equal(result.valid, true, result.reasons.join('; '))
  }
})

test('recovery and bargain still reject the broadened escape-shaped language', () => {
  for (const outcome of ['recovery', 'bargain']) {
    for (const line of LIVE_ESCAPE_LINES) {
      const result = validateGeneratedNarration(line, {
        moment: 'run-ending',
        outcome,
        allowedFictionalNames: ['the Amber Field Satchel'],
        expectedStolenItem: 'the Amber Field Satchel',
      })
      assert.equal(result.valid, false, `${outcome}: ${line}`)
      assert.equal(
        result.reasons.includes('implies a different engine outcome'),
        true,
        `${outcome}: ${result.reasons.join('; ')}`,
      )
    }
  }
})

test('accepts exact live escape endings that leave the item out of reach', () => {
  for (const { line, item } of OUT_OF_REACH_ESCAPE_LINES) {
    const result = validateGeneratedNarration(line, {
      moment: 'run-ending',
      outcome: 'escape',
      allowedFictionalNames: [item],
      expectedStolenItem: item,
    })
    assert.equal(result.valid, true, result.reasons.join('; '))
  }
})

test('recovery and bargain reject exact out-of-reach escape language', () => {
  for (const outcome of ['recovery', 'bargain']) {
    for (const { line, item } of OUT_OF_REACH_ESCAPE_LINES) {
      const result = validateGeneratedNarration(line, {
        moment: 'run-ending',
        outcome,
        allowedFictionalNames: [item],
        expectedStolenItem: item,
      })
      assert.equal(result.valid, false, `${outcome}: ${line}`)
      assert.equal(
        result.reasons.includes('implies a different engine outcome'),
        true,
        `${outcome}: ${result.reasons.join('; ')}`,
      )
    }
  }
})

test('out-of-reach language alone does not turn an ordinary failure into an escape ending', () => {
  const result = validateGeneratedNarration(
    'I note that the Amber Field Satchel remains just out of reach for the next exchange.',
    {
      moment: 'ordinary-failure',
      outcome: 'failure',
      allowedFictionalNames: ['the Amber Field Satchel'],
      expectedStolenItem: 'the Amber Field Satchel',
    },
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('retained-item language alone does not turn an ordinary failure into an escape ending', () => {
  const result = validateGeneratedNarration(
    "I note that the Amber Field Satchel remains locked in the Goblin King's grip for the next exchange.",
    {
      moment: 'ordinary-failure',
      outcome: 'failure',
      allowedFictionalNames: ['the Amber Field Satchel'],
      expectedStolenItem: 'the Amber Field Satchel',
    },
  )
  assert.equal(result.valid, true, result.reasons.join('; '))
})

test('keeps success and specific endings forbidden outside their matching moments', () => {
  for (const [moment, outcome] of [
    ['natural-one-complication', 'complication'],
    ['ordinary-failure', 'failure'],
    ['scene-intro', 'intro'],
    ['midpoint-outcome', 'midpoint'],
    ['goblin-king-taunt', 'taunt'],
  ]) {
    const line = moment === 'goblin-king-taunt'
      ? 'I hear the Goblin King say, "You won," as you recover the Field Reliquary and escape the Highlands.'
      : 'I record your success as you recover the Field Reliquary and escape the Highlands.'
    const result = validateGeneratedNarration(line, { moment, outcome })
    assert.equal(result.valid, false, moment)
    assert.equal(result.reasons.includes('implies a different engine outcome'), true, moment)
  }
})

test('rejects unsupported moment and outcome pairings in the validator', () => {
  for (const [moment, outcomes] of Object.entries(SUPPORTED_MOMENT_OUTCOMES)) {
    const wrongOutcome = outcomes.includes('failure') ? 'success' : 'failure'
    const result = validateGeneratedNarration(
      'I record the supplied event without changing its result.',
      { moment, outcome: wrongOutcome },
    )
    assert.equal(result.valid, false, moment)
    assert.equal(
      result.reasons.includes('uses an unsupported narration moment/outcome pairing'),
      true,
      moment,
    )
  }
})

test('Goblin King taunt mismatch is rejected before the narration request is sent', async () => {
  let fetchCalls = 0
  await assert.rejects(
    generateNarrationFromHook({
      hook: {
        moment: 'goblin-king-taunt',
        outcome: 'success',
        fallbackText: 'I watch the Goblin King prepare to speak.',
        sceneId: 'goblin-king',
        actionId: 'boss:taunt',
      },
      fetchImpl: async () => {
        fetchCalls += 1
        return response('I should not be reached.')
      },
    }),
    /Unsupported AI narration moment\/outcome pairing/,
  )
  assert.equal(fetchCalls, 0)
})

test('generic story-beat hook retries once with the existing corrective pattern', async () => {
  const hook = {
    moment: 'action-success',
    outcome: 'success',
    fallbackText: 'You move the stone gate before it finishes objecting.',
    authoritativeText: 'You move the stone gate before it finishes objecting.',
    sceneId: 'choose-route',
    actionId: 'route:ridge',
    rolls: [16],
    selectedRoll: 16,
    fictionalStolenItem: 'the Amber Field Satchel',
    fictionalGoblinName: 'Professor Grub',
  }
  const bodies = []
  const drafts = [
    'I record that you escape the Highlands after the gate opens.',
    'I record your success as the stone gate yields the direct route.',
  ]

  const result = await generateNarrationFromHook({
    hook,
    fetchImpl: async (_url, init) => {
      bodies.push(JSON.parse(init.body))
      return response(drafts[bodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.equal(bodies[0].moment, 'action-success')
  assert.equal(bodies[0].outcome, 'success')
  assert.equal(bodies[0].authoritativeText, hook.fallbackText)
  assert.match(bodies[1].correctiveNote, /different engine outcome/i)
})

test('story-beat hook retries a generic success that omits supplied continuity anchors', async () => {
  const hook = {
    moment: 'action-success',
    outcome: 'success',
    fallbackText: 'I watch your Fog-Table Adept map steady as the gate yields.',
    authoritativeText: 'I watch your Fog-Table Adept map steady as the gate yields.',
    sceneId: 'goblin-encounter',
    actionId: 'goblin:outlast',
    fictionalStolenItem: 'the Amber Field Satchel',
    storySoFar: 'The player chose Fog-Table Adept, took The Suspicious Fen, and failed the route check.',
    continuityAnchors: ['Fog-Table Adept', 'The Suspicious Fen'],
  }
  const bodies = []
  const drafts = [
    'I record your success as the obstacle yields and the path opens.',
    'I watch your Fog-Table Adept map settle as the obstacle yields and opens the path.',
  ]

  const result = await generateNarrationFromHook({
    hook,
    fetchImpl: async (_url, init) => {
      bodies.push(JSON.parse(init.body))
      return response(drafts[bodies.length - 1])
    },
  })

  assert.equal(result.source, 'ai')
  assert.equal(result.attempts, 2)
  assert.deepEqual(bodies[0].continuityAnchors, ['Fog-Table Adept', 'The Suspicious Fen'])
  assert.match(bodies[1].correctiveNote, /continuity anchor/i)
})

test('run-ending hook uses the static line after two wrong endings', async () => {
  const hook = {
    moment: 'run-ending',
    outcome: 'recovery',
    fallbackText: 'You recover the Amber Field Satchel.',
    authoritativeText: 'You recover the Amber Field Satchel.',
    fictionalStolenItem: 'the Amber Field Satchel',
  }
  let calls = 0
  const result = await generateNarrationFromHook({
    hook,
    fetchImpl: async () => {
      calls += 1
      return response(calls === 1
        ? 'I record that you make a bargain for the Amber Field Satchel.'
        : 'I record that you escape the Highlands without the Amber Field Satchel.')
    },
  })

  assert.equal(calls, 2)
  assert.equal(result.source, 'static-fallback')
  assert.equal(result.text, hook.fallbackText)
})
