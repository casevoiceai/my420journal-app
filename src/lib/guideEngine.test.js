import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGuideResponse } from './guideEngine.js'

const entries = [
  {
    product_name: 'Strawberry Cream',
    category: 'Flower',
    amount: '0.5 g',
    body_tags: ['Tired'],
    mind_tags: ['Foggy'],
    mood_tags: [],
    notes: 'Hardly any taste and not much body effect.',
    created_at: '2026-09-30T18:00:00.000Z',
  },
  {
    product_name: 'Red Berries',
    category: 'Flower',
    amount: '0.4 g',
    body_tags: ['Relaxed', 'Tingly'],
    mind_tags: ['Clear'],
    mood_tags: ['Calm'],
    notes: 'Good body effect.',
    created_at: '2026-10-01T18:00:00.000Z',
  },
]

function reply(text, guide = 'larry', history = []) {
  return buildGuideResponse({ guide, entries, messages: [...history, { role: 'user', content: text }] })
}

test('Lucky Larry answers a social check-in in character', () => {
  assert.match(reply('how are you today?'), /Still kicking/)
  assert.doesNotMatch(reply('how are you today?'), /latest note as/i)
})

test('greeting does not echo user input', () => {
  const result = reply('hi')
  assert.match(result, /Good to see you/)
  assert.doesNotMatch(result, /\bhi\b.*latest/i)
})

test('help describes bounded guide capabilities', () => {
  const result = reply('what can you do?')
  assert.match(result, /log an experience/i)
  assert.match(result, /compare two products/i)
})

test('recommendation requests are refused', () => {
  const result = reply('what should I buy next?')
  assert.match(result, /don't choose products/i)
})

test('medical requests are refused', () => {
  const result = reply('what dose should I use?')
  assert.match(result, /can't diagnose, prescribe, or tell you what dose/i)
})

test('looks up an exact product from local journal data', () => {
  const result = reply('what did I think of Strawberry Cream?')
  assert.match(result, /1 entry for Strawberry Cream/)
  assert.match(result, /Hardly any taste/)
})

test('compares two products without recommending one', () => {
  const result = reply('compare Strawberry Cream vs Red Berries')
  assert.match(result, /Strawberry Cream: 1 entry/)
  assert.match(result, /Red Berries: 1 entry/)
  assert.match(result, /not a recommendation/i)
})

test('summarizes latest entry', () => {
  const result = reply('show me my latest entry')
  assert.match(result, /latest entry is Red Berries/i)
  assert.match(result, /Good body effect/)
})

test('counts local entries', () => {
  assert.equal(reply('how many entries do I have?'), 'You have 2 entries in your local journal.')
})

test('recognizes a new product logging statement', () => {
  const result = reply('I tried Blue Dream and it made me sleepy')
  assert.match(result, /Blue Dream/)
  assert.match(result, /What happened with it/)
})

test('recognizes effect language without pretending to infer more', () => {
  const result = reply('I felt relaxed and clear')
  assert.match(result, /Relaxed, Clear/)
  assert.doesNotMatch(result, /recommend/i)
})

test('uses recent product context for follow-up lookup', () => {
  const history = [
    { role: 'user', content: 'I was looking at Red Berries' },
    { role: 'assistant', content: 'What do you want to know about it?' },
  ]
  const result = reply('what did I record about it?', 'larry', history)
  assert.match(result, /1 entry for Red Berries/)
})

test('falls back conversationally instead of echoing or forcing journal mode', () => {
  const result = reply('purple elephants on Tuesday')
  assert.match(result, /listening|go on|keep going|what happened|thinking/i)
  assert.doesNotMatch(result, /purple elephants|journal|logging something new/i)
})

test('other guides share the engine but retain distinct voice', () => {
  assert.match(reply('how are you?', 'sunny'), /I am good/)
  assert.match(reply('how are you?', 'herb'), /Doing well/)
  assert.match(reply('how are you?', 'mary'), /doing well/)
})

test('short check-in answer continues naturally', () => {
  const history = [{ role: 'assistant', content: 'Still kicking. How are you doing?' }]
  assert.match(reply('good', 'larry', history), /Good\. What are we doing today/i)
})

test('known product name wins over extra category wording', () => {
  const result = reply('I got Red Berries flower')
  assert.match(result, /Alright\. Red Berries\./)
  assert.doesNotMatch(result, /Red Berries flower/)
})

test('cannabis question opener gets a natural conversational bridge', () => {
  const result = reply('I have a question about weed.', 'mary')
  assert.equal(result, 'Of course. What would you like to know about weed?')
})

test('general cannabis question after bridge uses local B knowledge', () => {
  const history = [{ role: 'assistant', content: 'Of course. What is your question?' }]
  const result = reply('What is the difference between indica and sativa?', 'mary', history)
  assert.match(result, /do not reliably map/i)
  assert.doesNotMatch(result, /do not have general cannabis facts built into the Guide yet/i)
})

test('question about an arbitrary topic starts a real dialogue', () => {
  assert.equal(
    reply('i have question about Blue Dream', 'larry'),
    'Sure. What do you want to know about Blue Dream?'
  )
})

test('unknown product topic survives into a follow-up question', () => {
  const history = [
    { role: 'user', content: 'i have question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  assert.equal(reply('did I like it?', 'larry', history), 'I do not see Blue Dream in your local journal yet.')
})

test('known product topic survives into natural pronoun follow-ups', () => {
  const history = [
    { role: 'user', content: 'I have a question about Red Berries' },
    { role: 'assistant', content: 'Sure. What do you want to know about Red Berries?' },
  ]
  const result = reply('how did it make me feel?', 'larry', history)
  for (const effect of ['Relaxed', 'Tingly', 'Clear', 'Calm']) assert.match(result, new RegExp(effect, 'i'))
})

test('known topic supports count, date, amount, and note follow-ups', () => {
  const history = [
    { role: 'user', content: 'question about Red Berries' },
    { role: 'assistant', content: 'Sure. What do you want to know about Red Berries?' },
  ]
  assert.match(reply('how many times did I use it?', 'larry', history), /1 entry for Red Berries/i)
  assert.match(reply('when did I last use it?', 'larry', history), /Oct 1, 2026/i)
  assert.match(reply('how much did I use?', 'larry', history), /0\.4 g/)
  assert.match(reply('what did I write about it?', 'larry', history), /Good body effect/i)
})

test('reviewed cultivar question keeps the remembered topic and uses B', () => {
  const history = [
    { role: 'user', content: 'I have a question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  const result = reply('what kind of strain is it?', 'larry', history)
  assert.match(result, /Blue Dream|Santa Cruz|Blueberry/i)
  assert.doesNotMatch(result, /do not have general cannabis facts built into the Guide yet/i)
})

test('unrecognized conversation stays conversational in character', () => {
  const result = reply('so anyway that was weird', 'larry')
  assert.match(result, /go on|listening|what happened|thinking|more to that/i)
  assert.doesNotMatch(result, /journal|logging something new/i)
})


test('Guides can talk about themselves outside journal mode', () => {
  assert.match(reply('tell me about yourself', 'bud'), /retail operations|warehouse logistics/i)
  assert.match(reply('tell me about yourself', 'sunny'), /neighborhood cafe|community arts/i)
  assert.match(reply('tell me about yourself', 'larry'), /print shop|record store/i)
  assert.match(reply('tell me about yourself', 'herb'), /quality control|chemistry/i)
  assert.match(reply('tell me about yourself', 'mary'), /caring for family|libraries/i)
})

test('boredom stays social instead of redirecting to cannabis', () => {
  const result = reply("I'm bored", 'sunny')
  assert.match(result, /story|question|entertain|company|bored/i)
  assert.doesNotMatch(result, /journal|cannabis|log an experience/i)
})

test('Lucky Larry answers an off-topic horror question from character canon', () => {
  const result = reply('do you like horror movies?', 'larry')
  assert.match(result, /atmosphere|dread|gore|monster/i)
})

test('Sunny reacts socially to a bad movie', () => {
  const result = reply('that movie sucked', 'sunny')
  assert.match(result, /tell me why|boring|complain/i)
})


test('Herb handles an ordinary coffee problem in character', () => {
  const result = reply('my coffee tastes awful today', 'herb')
  assert.match(result, /beans|grind|water|temperature|brew time/i)
})

test('Bud handles an ordinary printer complaint in character', () => {
  const result = reply('my printer is pissing me off', 'bud')
  assert.match(result, /war against humanity|what is it doing/i)
})

test('Mary reacts to terrible sleep habits without turning clinical', () => {
  const result = reply('I stayed up until four watching TV', 'mary')
  assert.match(result, /resist saying anything|what happened/i)
  assert.doesNotMatch(result, /diagnos|dose|treatment/i)
})

test('Guides have opinions about one another', () => {
  assert.match(reply('what do you think of Sunny?', 'bud'), /talks too much|notices things/i)
  assert.match(reply('what do you think of Herb?', 'larry'), /chemistry|stories/i)
  assert.match(reply('what do you think of Larry?', 'mary'), /pretends not to worry/i)
})

test('story requests draw from the selected Guide biography', () => {
  assert.match(reply('tell me a story', 'larry'), /notebook|cultivar|record|plant|horror/i)
  assert.match(reply('tell me a story', 'sunny'), /show|date|plant|cake|theater/i)
})


test('unknown general factual questions get honest character-specific ignorance', () => {
  const result = reply('who was the fourteenth president of France?', 'larry')
  assert.match(result, /got nothing|don't know|no idea|outside my notebooks|never learned|couldn't tell you/i)
  assert.doesNotMatch(result, /journal|cannabis facts|logging something/i)
})

test('hobby questions surface character canon', () => {
  assert.match(reply('what are your hobbies?', 'mary'), /gardening|mystery novels|birds|books/i)
  assert.match(reply('what are you into?', 'herb'), /coffee|fermentation|astronomy|keyboards|puzzles/i)
})

test('Guide personal identity questions stay specific and in character', () => {
  assert.match(reply('how old are you?', 'larry'), /born September 17, 1958/i)
  assert.match(reply('when is your birthday?', 'sunny'), /July 19, 1994/i)
  assert.match(reply('where are you from?', 'larry'), /Scranton, Pennsylvania/i)
  assert.match(reply('tell me about your family', 'larry'), /daughter.*two grandkids/i)
  assert.match(reply('why are you called Lucky?', 'larry'), /radio call-in contest/i)
  const intro = reply('tell me about yourself', 'larry')
  assert.match(intro, /Scranton.*print shop.*daughter.*grandkids.*garden/i)
  for (const result of [reply('how old are you?', 'larry'), intro]) assert.doesNotMatch(result, /canon|written as|age band|character metadata/i)
})

test('Larry follows his own former-spouse disclosure as a personal conversation', () => {
  const first = reply("Tell me about your ex (or ex's)", 'larry')
  assert.match(first, /married a little over twenty years/i)
  assert.doesNotMatch(first, /cannabis|journal|knowledge pack/i)
  const history = [{ role: 'user', content: "Tell me about your ex" }, { role: 'assistant', content: first }]
  assert.match(reply('what was she like?', 'larry', history), /more social|quicker with people/i)
  assert.match(reply('why did you divorce?', 'larry', history), /wore each other down|better at running a household/i)
  assert.match(reply('do you still talk?', 'larry', history), /still talk|family things|grandkids/i)
})

test('personal family subjects do not route into cannabis fallback', () => {
  assert.match(reply('tell me about your daughter', 'larry'), /daughter.*grandkids/i)
  const unknown = reply('tell me about quantum physics', 'larry')
  assert.doesNotMatch(unknown, /general cannabis facts|journal.*logged|knowledge pack yet/i)
})

test('journal note summaries do not contain mojibake quote characters', () => {
  const result = reply('what did I think of Strawberry Cream?')
  assert.match(result, /Latest note: "/)
  assert.doesNotMatch(result, /Ã|â‚¬/)
})


test('S.T.O.N.E.R. stays personality-free for character questions', () => {
  const result = reply('tell me about yourself', 'stoner')
  assert.match(result, /personality-free/i)
  assert.doesNotMatch(result, /retail|cafe|print shop|quality control|libraries/i)
})

test('S.T.O.N.E.R. gives a neutral fallback for unrelated questions', () => {
  const result = reply('who invented the paper clip?', 'stoner')
  assert.match(result, /No matching journal action|log an experience|review an entry/i)
  assert.doesNotMatch(result, /notebooks|empty shelf|wheelhouse|comfortable saying/i)
})

test('S.T.O.N.E.R. still uses the same local journal lookup', () => {
  const result = reply('what did I think of Strawberry Cream?', 'stoner')
  assert.match(result, /1 entry for Strawberry Cream/i)
  assert.match(result, /Hardly any taste/i)
})


test('unrelated factual question can leave a remembered cannabis topic', () => {
  const history = [
    { role: 'user', content: 'I have a question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  const result = reply('who invented the paper clip?', 'larry', history)
  assert.match(result, /got nothing|don't know|no idea|outside my notebooks|never learned|couldn't tell you/i)
  assert.doesNotMatch(result, /Blue Dream|cannabis facts|journal/i)
})

test('tier-zero story requests expose only the first autobiographical story', () => {
  const result = buildGuideResponse({ guide: 'larry', entries: [], messages: [{ role: 'user', content: 'tell me a story' }] })
  assert.match(result, /notebook/i)
  assert.doesNotMatch(result, /cultivar name|record bought|horror movie/i)
})

test('Guide answers a general indica versus sativa question from local B knowledge', () => {
  const result = reply('what is the difference between indica and sativa?', 'larry')
  assert.match(result, /do not reliably map/i)
  assert.doesNotMatch(result, /general cannabis facts built into the Guide yet/i)
})

test('Guide answers Blue Dream from B instead of the old no-knowledge boundary', () => {
  const result = reply('tell me about Blue Dream', 'larry')
  assert.match(result, /Santa Cruz/i)
  assert.match(result, /Blueberry.*Haze/i)
  assert.doesNotMatch(result, /do not have general cannabis facts built into the Guide yet/i)
})

test('Guide carries Blue Dream into a natural B follow-up', () => {
  const history = [
    { role: 'user', content: 'I have a question about Blue Dream' },
    { role: 'assistant', content: 'Sure. What do you want to know about Blue Dream?' },
  ]
  const result = reply('what kind of strain is it?', 'sunny', history)
  assert.match(result, /Blue Dream|Santa Cruz|Blueberry/i)
})
