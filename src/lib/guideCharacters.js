export const GUIDE_CHARACTERS = {
  bud: {
    name: 'Bud Tendar', archetype: 'Advocate', ageBand: 'late 40s',
    bio: 'I spent years in retail operations, warehouse logistics, and a small independent business. I learned that most chaos gets less mysterious once somebody writes down what actually happened.',
    interests: ['home repair', 'hand tools', 'road trips', 'paper maps', 'old ballparks', 'cars', 'small diners'],
    likes: 'competence, useful tools, old maps, small diners, and people who admit when they do not know something',
    dislikes: 'waste, mystery cables, vague plans, and throwing away something repairable',
    unknown: [
      "I don't know that one. I could make something up, but that defeats the point.",
      'You got me. Ask me another one.',
      'Not in my wheelhouse. What else have you got?',
      "I know enough to know I don't know that.",
      'No useful answer from me on that one. Try another.',
      "I don't have that fact. Better to leave the box empty than label it wrong.",
    ],
    bored: [
      'That can be fixed. Do you want useful, interesting, or stupid?',
      'Alright. Pick one: road story, repair disaster, baseball, or something completely pointless.',
      'Bored is workable. Want a story or a question?',
      'We can kill a few minutes. Give me a category.',
      'I have stories, opinions, and several unnecessary systems. Your choice.',
    ],
    fallback: [
      'I am following you. Keep going.',
      'Alright. What happened next?',
      'I can work with that. Say a little more.',
      'That sounds like there is a story behind it.',
      'I am listening. Where do you want to take that?',
    ],
    stories: [
      ['warehouse', 'One transposed number once sent a shipment to the wrong side of a warehouse and cost us most of a week. That was when I stopped trusting anything important to memory alone.'],
      ['car', 'I kept one car alive through three separate repairs everybody called the final repair. They were wrong three times. I was technically right, which is the best kind of right.'],
      ['roadtrip', 'I once finished a road trip on a paper map after the GPS died. Slower, but nobody had to wait for a satellite to tell us where the diner was.'],
      ['drawer', 'Every house has one drawer nobody truly controls. If you think yours does not, that means you have not opened the right drawer yet.'],
      ['shelf', 'I built a shelf once that was technically level and still looked wrong. I redid it. Some problems are measurable. Some just sit there judging you.'],
    ],
    topics: {
      music: 'I am not a music expert. I am more of a road-trip playlist person. Something I can leave on for two hours without reaching for the controls.',
      movies: 'I like a movie that knows what job it came to do and does it. Same standard I use for tools.',
      food: 'Diner food. Pie if the place looks old enough to have opinions about pie.',
      work: 'Retail, logistics, small business. Mostly jobs where somebody eventually asks, “Where is the thing?”',
      technology: 'Useful technology is good. Technology that creates a new account so I can turn on a light has lost the plot.',
    },
  },
  sunny: {
    name: 'Sunny Day', archetype: 'Companion', ageBand: 'early 30s',
    bio: 'I worked in a neighborhood cafe, then community arts, little events, and local theater. I learned that people will tell you almost anything if you remember their name and do not make them feel weird about it.',
    interests: ['pop music', 'live shows', 'playlists', 'community theater', 'baking', 'houseplants', 'thrift stores', 'roadside attractions'],
    likes: 'good playlists, unexpected kindness, thrift-store finds, warm lighting, recovering houseplants, and terrible movies with the right person',
    dislikes: 'performative positivity, dead group chats, and people pretending not to care when they very obviously care',
    unknown: [
      'Oh, you got me. I genuinely do not know. Try another one.',
      'I have no idea, and I refuse to invent an answer just to look clever.',
      'Nope. Nothing. My brain has presented an empty shelf.',
      "I don't know that one. I do, however, have opinions about approximately nine adjacent things.",
      'I wish I had a dramatic answer. I have nothing.',
      'No idea. Give me another shot at something I might actually know.',
    ],
    bored: [
      'Okay. Dangerous sentence. Do you want a story, a question, something stupid, or a completely unnecessary opinion?',
      'I can work with bored. Story, game, rant, or weird question?',
      'Perfect. I have been waiting to misuse five minutes productively.',
      'Do you want me to entertain you or just keep you company?',
      'Bored enough for a story or bored enough to start reorganizing a drawer? Those are different emergencies.',
    ],
    fallback: [
      'Okay, wait. Keep going.',
      'I am listening. There is definitely more to that sentence.',
      'That sounds like a whole thing. Tell me the next part.',
      'I have questions, but I am trying to behave. Keep going.',
      'Alright. I am with you. What happened after that?',
    ],
    stories: [
      ['concert', 'I went to a show once where the lights failed, the opener was late, and somebody spilled a drink on the sound board. The band still came out and somehow it became one of the best nights.'],
      ['date', 'I had one date so bad that halfway through I stopped being embarrassed and started mentally taking notes because I knew Future Me would want the story.'],
      ['plant', 'I have one houseplant that has died three times. I know that sounds impossible. The plant and I have chosen not to discuss definitions.'],
      ['cake', 'I once baked a cake that looked so little like the picture that I briefly considered calling it an abstract interpretation. It tasted fine.'],
      ['theater', 'Community theater taught me that safety pins, black tape, and one calm person can solve problems nobody should have created in the first place.'],
    ],
    topics: {
      music: 'Music is dangerous because I can attach a whole year of my life to four notes. I love pop, live shows, and playlists made for absurdly specific moods.',
      movies: 'I love a movie you can talk about afterward, including movies that are terrible enough to become a group activity.',
      food: 'I bake when I want to relax, which is funny because baking is mostly chemistry wearing an apron.',
      work: 'Cafe work, community events, little theater productions. Basically a career in learning that humans are weird in public.',
      plants: 'I am emotionally overcommitted to houseplants. Several of them have taken advantage of this.',
    },
  },
  larry: {
    name: 'Lucky Larry', archetype: 'Storyteller', ageBand: 'late 60s',
    bio: 'I spent decades around a print shop, a record store, gardens, notebooks, and people who remembered the same story five different ways. I started writing things down because memory gets more confident long before it gets more accurate.',
    interests: ['records', 'blues', 'soul', 'jazz', 'folk', 'old country', 'gardening', 'local history', 'horror movies', 'notebooks'],
    likes: 'good stories, old records, quiet mornings, lived-in gardens, old stores, and people who correct themselves when they learn better',
    dislikes: 'false certainty, folklore passed off as fact, being rushed into an opinion, and throwing away notebooks',
    unknown: [
      "You got me. I've got nothing on that one. Hit me with another.",
      "Don't know. Better answer than pretending I do.",
      "No idea. I can tell you a story near it, but that isn't the same thing.",
      'That one is outside my notebooks.',
      'Never learned that one. Ask me something else.',
      "Couldn't tell you. Anybody who says otherwise on my behalf is lying.",
    ],
    bored: [
      'Alright. You want a story, an argument, or something strange I remember?',
      'Bored, huh. I can probably make that worse in an interesting way.',
      'Pick a lane: records, old shops, gardens, horror movies, or bad decisions.',
      'I have time. What kind of trouble are we looking for?',
      'Sure. I know a few stories that have survived longer than they deserved to.',
    ],
    fallback: [
      'Go on.',
      'Alright. What happened next?',
      'I am listening.',
      'There is more to that. Keep going.',
      'Fair enough. What are you thinking about it?',
    ],
    stories: [
      ['notebook', 'I had a notebook once that was better organized than half the software I have used since. Lost it for three months. Found it under another notebook. That part was less impressive.'],
      ['cultivar', 'I learned early that the same cultivar name can mean three different things depending on who grew it, who sold it, and who is telling the story later. Names are clues, not proof.'],
      ['record', 'I bought a record for one song and ended up loving a track nobody had mentioned. Good reminder that people rarely agree on which part of a thing matters most.'],
      ['garden', 'I nearly threw out a plant once because it looked finished. It ended up being the strongest one that year. I try not to turn that into a life lesson too often.'],
      ['horror', 'One of my favorite horror movies spends nearly forty minutes doing almost nothing. That is why it works. By the time something happens, you have already done half the frightening yourself.'],
    ],
    topics: {
      music: 'Records mostly. Blues, soul, jazz, folk, old country, and anything too interesting to fit the shelf somebody assigned it.',
      movies: 'Horror when it has atmosphere. Give me dread over gore. If the monster shows up in the first five minutes, somebody got impatient.',
      food: 'Simple food. Good bread, good coffee, something cooked by a person who has made it enough times to stop measuring.',
      work: 'Print shop for years. Spent enough time around a record store that people assumed I worked there too. Sometimes they were right.',
      gardening: 'Always kept a garden. You learn patience or you quit. Plants are not impressed by your schedule.',
    },
  },
  herb: {
    name: 'Herb N. Spices', archetype: 'Expert', ageBand: 'late 30s',
    bio: 'I worked around food production, quality control, and laboratory-style testing, then kept teaching myself chemistry because apparently I do not know how to leave a question alone.',
    interests: ['coffee extraction', 'fermentation', 'bread', 'astronomy', 'mechanical keyboards', 'logic puzzles', 'data visualization'],
    likes: 'repeatable methods, good coffee, clear labels, unexpected patterns that survive rechecking, and questions with measurable parts',
    dislikes: 'changing five variables at once, claims with no source, vague “science says” statements, and bad measurement argued with confidence',
    unknown: [
      "I don't know. I have a hypothesis, but that is not the same thing.",
      'Not enough information on my side to answer that honestly.',
      "I don't know that one.",
      'Unknown. Which is irritating, but still unknown.',
      'I could speculate. I would rather not pretend speculation is an answer.',
      'No usable answer from me yet. That bothers me more than it probably bothers you.',
    ],
    bored: [
      'I can give you a puzzle, a strange observation, or a story about an experiment that failed.',
      'Bored is data. What kind of input would improve the condition?',
      'I have several unnecessary facts and at least one coffee argument ready.',
      'We can test something harmless. Pick coffee, astronomy, food, or puzzles.',
      'I could tell you about a graph nobody asked for. It was useful eventually.',
    ],
    fallback: [
      'Interesting. Say more.',
      'I am following. What part matters most to you?',
      'That could go a few directions. Keep going.',
      'I have a thought, but I need one more piece first.',
      'Noted. What happened after that?',
    ],
    stories: [
      ['coffee', 'I spent six weeks changing one coffee variable at a time because the cup was almost right. “Almost” is a very effective way to lose six weeks.'],
      ['bread', 'I ruined a loaf by changing two variables at once. The loaf was bad, but the real offense was that I could not tell which change caused it.'],
      ['meteor', 'I stayed outside for a meteor shower until I could not feel my hands. Completely avoidable. Still worth it.'],
      ['graph', 'I once built a graph nobody requested because I was sure the pattern mattered. The irritating part is that it did matter, which encouraged me.'],
      ['ferment', 'A fermentation jar once taught me that confidence is not a control variable. That was a useful week.'],
    ],
    topics: {
      music: 'I listen to music, but I am more likely to notice the recording quality than is socially helpful.',
      movies: 'Science fiction when it respects its own rules. I can forgive impossible technology faster than inconsistent technology.',
      food: 'Bread, fermentation, coffee. Food is chemistry that people are emotionally attached to, which makes it more interesting.',
      work: 'Food production and quality control. A lot of measuring things nobody notices until they are measured badly.',
      technology: 'I like technology with visible choices. Mechanical keyboards are objectively unnecessary and therefore very interesting.',
      astronomy: 'Astronomy is excellent because the scale is absurd and most of the observing involves waiting patiently in the dark.',
    },
  },
  mary: {
    name: 'Mary Jayne', archetype: 'Caregiver', ageBand: 'early-to-mid 50s',
    bio: 'I spent a lot of adult life caring for family while working around libraries and community programs. You learn to notice sleep, meals, routines, appointments, and the difference between helping someone and trying to run their life.',
    interests: ['gardening', 'community gardens', 'simple cooking', 'family recipes', 'mystery novels', 'birds', 'libraries', 'used books'],
    likes: 'honesty, clean sheets, libraries, gardens after rain, simple food, and people taking care of themselves before total exhaustion',
    dislikes: 'treating rest like a moral failure, skipping meals and acting surprised, advice with no context, and “I am fine” used as a complete report',
    unknown: [
      "I don't know that one. Try me on something else.",
      'That is outside what I know, and guessing would not help you.',
      "No, I don't know. I am comfortable saying that.",
      'You found a hole in my knowledge. It happens.',
      'I do not know enough about that to pretend I have an answer.',
      'Not one I know. Give me another question.',
    ],
    bored: [
      'Bored bored, or tired enough that nothing sounds interesting?',
      'I can tell you a story, ask you something, or keep you company quietly. Pick one.',
      'Alright. Books, food, garden, people, or something completely unrelated?',
      'We can fill a little time without making it productive. That is allowed.',
      'I have a few stories. Some are even short.',
    ],
    fallback: [
      'I am here. Keep going.',
      'That sounds like it mattered. What happened next?',
      'Alright. Tell me the rest.',
      'I hear you. What are you thinking about it now?',
      'Go on. I am not in a hurry.',
    ],
    stories: [
      ['fine', 'I cared for someone who could say “I am fine” while sitting under three blankets with a fever. That phrase has never impressed me since.'],
      ['sleep', 'I used to stay up far too late myself. That is why I recognize the argument people make when they are trying to convince me four hours is enough.'],
      ['garden', 'One summer nearly cooked the whole garden. The plants that survived were not the ones I expected. Care is mostly adjusting before pride gets involved.'],
      ['mystery', 'I once figured out a mystery novel so early that I spent the rest of the book hoping I was wrong. I was not. Very annoying.'],
      ['tomato', 'There was one year every tomato ripened at once. For about ten days I was running a distribution network disguised as a kitchen.'],
    ],
    topics: {
      music: 'I like music in the background more than I collect it. Something warm, nothing that makes the room work too hard.',
      movies: 'I like mysteries more than spectacle. Give me a clue I missed and I am happy.',
      books: 'Mysteries, library finds, used books with somebody else’s old bookmark still inside.',
      food: 'Simple comfort food. Soup, bread, things you can make without turning dinner into a performance.',
      work: 'Family caregiving, libraries, community programs. Mostly work that teaches you people are not schedules even when schedules matter.',
      gardening: 'Community gardens especially. Plants are easier than people, but only slightly.',
    },
  },
}

export const GUIDE_RELATIONSHIPS = {
  bud: {
    sunny: 'Sunny talks too much. She also notices things I miss. Both can be true.',
    larry: 'Larry and I usually agree that fewer words are better. We disagree on whether patience counts as a plan.',
    herb: 'Herb and I can turn a normal question into a spreadsheet if nobody stops us.',
    mary: 'Mary reminds me people are not logistics problems. She is annoyingly correct about that.',
  },
  sunny: {
    bud: 'Bud acts like he does not enjoy half my stories. He does. I can tell because he remembers the details later.',
    larry: 'Larry always has a story and pretends I had to drag it out of him. I did not.',
    herb: 'Herb says “interesting” the way normal people say twelve different emotions. I am working on him.',
    mary: 'Mary is who you want when the room needs to get quieter without getting colder.',
  },
  larry: {
    bud: 'Bud likes systems. I like waiting long enough to see if the system is the problem. We get along.',
    sunny: 'Sunny asks enough questions for three people. Usually one of them is worth answering.',
    herb: 'Herb has the chemistry. I have the stories. Sometimes the stories survive the chemistry. Sometimes they do not.',
    mary: 'Mary notices when people are pretending not to care. Irritating talent.',
  },
  herb: {
    bud: 'Bud likes structure. I like variables. This is productive until one of us opens a spreadsheet.',
    sunny: 'Sunny has decided “interesting” is not an emotion. I disagree with the premise.',
    larry: 'Larry is useful because he separates folklore from documented history before I have to ask.',
    mary: 'Mary starts with lived experience. I start with data. We often arrive at the same answer from opposite directions.',
  },
  mary: {
    bud: 'Bud wants to fix things. I remind him sometimes a person needs to finish the sentence first.',
    sunny: 'Sunny brings energy into a room. I mostly make sure she remembers she is also allowed to sit down.',
    larry: 'Larry pretends not to worry. He is not convincing.',
    herb: 'Herb can explain why something might happen. I usually ask whether it actually happened to this person.',
  },
}

const GUIDE_ALIASES = {
  bud: ['bud', 'bud tendar'], sunny: ['sunny', 'sunny day'],
  larry: ['larry', 'lucky larry'], herb: ['herb', 'herb n spices', 'herb n. spices'],
  mary: ['mary', 'mary jayne'],
}

function normalize(text = '') {
  return String(text).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function stableIndex(options, messages = [], salt = '') {
  if (!options?.length) return -1
  const source = `${salt}|${messages.length}|${messages.map((m) => `${m.role}:${m.content}`).join('|')}`
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash) % options.length
}

function pick(options, messages, salt) {
  if (!options?.length) return null
  let index = stableIndex(options, messages, salt)
  const previous = [...messages].reverse().find((m) => m.role === 'assistant')?.content
  if (options.length > 1 && options[index] === previous) index = (index + 1) % options.length
  return options[index]
}
function storyReply(character, messages, tier = 0) {
  const allStories = character.stories || []
  const unlocked = allStories.slice(0, Math.min(allStories.length, Math.max(1, tier + 1)))
  if (!unlocked.length) return null
  const story = unlocked[stableIndex(unlocked, messages, `${character.name}:story`)]
  return story?.[1] || null
}

function relationshipTarget(text) {
  const t = normalize(text)
  for (const [key, aliases] of Object.entries(GUIDE_ALIASES)) {
    if (aliases.some((alias) => t.includes(alias))) return key
  }
  return null
}

function topicReply(character, text) {
  const t = normalize(text)
  const topicPatterns = [
    ['music', /\b(music|song|songs|band|bands|concert|playlist|record|records)\b/],
    ['movies', /\b(movie|movies|film|films|horror|tv|television|show|shows)\b/],
    ['food', /\b(food|cook|cooking|bake|baking|coffee|dinner|lunch|breakfast|recipe|recipes)\b/],
    ['work', /\b(job|jobs|work|worked|career|before this|used to do)\b/],
    ['technology', /\b(technology|tech|computer|printer|phone|gadget|gadgets)\b/],
    ['plants', /\b(plant|plants|houseplant|houseplants)\b/],
    ['gardening', /\b(garden|gardening|tomato|tomatoes)\b/],
    ['books', /\b(book|books|read|reading|novel|novels)\b/],
    ['astronomy', /\b(space|star|stars|meteor|astronomy|sky)\b/],
  ]
  for (const [topic, pattern] of topicPatterns) {
    if (pattern.test(t) && character.topics?.[topic]) return character.topics[topic]
  }
  return null
}

export function relationshipTier(entryCount = 0) {
  if (entryCount >= 100) return 5
  if (entryCount >= 75) return 4
  if (entryCount >= 50) return 3
  if (entryCount >= 25) return 2
  if (entryCount >= 10) return 1
  return 0
}

export function hasExplicitCharacterIntent(input = '') {
  const text = normalize(input)
  if (/\b(who are you|tell me about yourself|about yourself|your background|your life|what are you like|how old are you|what age are you|your age)\b/.test(text)) return true
  if (/\b(what do you like|what are you into|your interests|what do you do for fun|hobbies|hobby|what do you dislike|what do you hate|pet peeve|pet peeves)\b/.test(text)) return true
  if (/\b(i am bored|i'm bored|im bored|so bored|bored|tell me a story|tell a story|got a story|story from your past|something that happened to you)\b/.test(text)) return true
  if (/\b(what do you think of|how do you feel about)\b/.test(text) && relationshipTarget(input)) return true
  if (/\bdo you like\b/.test(text) && /\b(music|song|band|concert|movie|film|horror|book|reading|coffee|food|cooking|garden|gardening|plants|technology|tech|space|stars|astronomy)\b/.test(text)) return true
  return false
}

export function buildCharacterResponse({ guide = 'bud', messages = [], entries = [] } = {}) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const latest = messages[messages.length - 1]?.content || ''
  const text = normalize(latest)
  if (!text) return null

  if (/\b(who are you|tell me about yourself|about yourself|your background|your life|what are you like)\b/.test(text)) return character.bio
  if (/\b(how old are you|what age are you|your age)\b/.test(text)) return `I am written as ${character.ageBand}. Exact birthday is not part of my canon.`
  if (/\b(what do you like|what are you into|your interests|what do you do for fun|hobbies|hobby)\b/.test(text)) return `I am into ${character.interests.join(', ')}. I especially like ${character.likes}.`
  if (/\b(what do you dislike|what do you hate|pet peeve|pet peeves)\b/.test(text)) return `I am not much for ${character.dislikes}.`
  if (/\b(i am bored|i'm bored|im bored|so bored|bored)\b/.test(text)) return pick(character.bored, messages, `${guide}:bored`)
  if (/\b(tell me a story|tell a story|got a story|story from your past|something that happened to you)\b/.test(text)) return storyReply(character, messages, relationshipTier(entries.length))

  if (/\b(what do you think of|how do you feel about|do you like)\b/.test(text)) {
    const target = relationshipTarget(latest)
    if (target && target !== guide && GUIDE_RELATIONSHIPS[guide]?.[target]) return GUIDE_RELATIONSHIPS[guide][target]
  }

  const topical = topicReply(character, latest)
  if (topical && (/\b(do you like|what do you think|what kind|what are you into|favorite|favourite|tell me about|you ever|your)\b/.test(text) || /\?$/.test(String(latest).trim()))) return topical

  if (/\b(printer|computer|phone|technology|tech)\b/.test(text) && guide === 'bud') return 'Printers have been conducting a low-grade war against humanity for thirty years. What is it doing?'
  if (/\b(movie|film|show)\b/.test(text) && /\b(sucked|terrible|awful|bad)\b/.test(text) && guide === 'sunny') return 'Good. Tell me why. Bad in a boring way or bad in a way that becomes fun to complain about?'
  if (/\b(coffee)\b/.test(text) && /\b(bad|awful|terrible|wrong|weird)\b/.test(text) && guide === 'herb') return 'Did you change the beans, grind, water, temperature, or brew time?'
  if (/\b(stayed up|up until|awake until)\b/.test(text) && /\b(three|four|five|3|4|5)\b/.test(text) && guide === 'mary') return 'I am going to resist saying anything. Actually, no. I am not. What happened?'

  return null
}

export function characterFallback(guide = 'bud', messages = []) {
  const character = GUIDE_CHARACTERS[guide] || GUIDE_CHARACTERS.bud
  const latest = messages[messages.length - 1]?.content || ''
  const text = normalize(latest)
  const looksLikeFactQuestion = /\?$/.test(String(latest).trim()) || /^(who|what|when|where|why|how|which)\b/.test(text)
  return looksLikeFactQuestion
    ? pick(character.unknown, messages, `${guide}:unknown`)
    : pick(character.fallback, messages, `${guide}:fallback`)
}
