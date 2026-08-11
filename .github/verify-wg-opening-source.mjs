import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CHAPTER_ONE_SCENE_TEXT,
  SESSION_ZERO_WELCOME,
} from '../src/features/games/weed-goblins/weedGoblinsChapterOne.js'
import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
} from '../src/features/games/weed-goblins/weedGoblinsChapterOneStaticRuntime.js'
import { getWeedGoblinsHelpResponse } from '../src/features/games/weed-goblins/weedGoblinsHelpChapterOne.js'

const expected = [
  "You've been chasing five goblins uphill for about an hour. They stole your Brass-Latched Research Case, they are not especially good at escaping with it, and the trail is honestly doing most of the work for you.",
  "There are little bootprints all over the mud, a drag mark from the case, and one extremely clear goblin faceprint where somebody apparently lost an argument with the hill. They got back up. The faceprint did not.",
  "The theft itself was also a mess. While they were taking the case, two of them stopped to argue about whether this counted as theft or 'aggressive redistribution.' A third one produced a form. Nobody knew who was supposed to fill it out. Then they remembered they were escaping and ran.",
  "Now the tracks are heading straight toward the King's Stash Hall, which you can just make out up on the ridge whenever the fog gets out of the way. There's a miserable little bell up there going clonk every so often. Very regal.",
  "What's your character's name, and are they human, dwarf, elf, or gnome?",
]

assert.deepEqual(SESSION_ZERO_WELCOME, expected)
let state = createWeedGoblinsRun({ seed: 'source-proof' })
assert.equal(state.sceneId, 'session-zero-name')
assert.deepEqual(state.narration, expected)

const help = getWeedGoblinsHelpResponse(state, 1, 1)
assert.equal(help.text, 'If you want name suggestions, I can give you a few.')

state = advanceWeedGoblinsSessionText(state, 'Rell')
state = advanceWeedGoblinsRun(state, 'session:race:human')
state = advanceWeedGoblinsRun(state, 'session:weapon:sword')
state = advanceWeedGoblinsRun(state, 'background:tracker')
state = advanceWeedGoblinsRun(state, 'session:pronoun:they')
state = advanceWeedGoblinsRun(state, 'session:look:tall-weathered')
assert.equal(state.sceneId, 'windcut-trail')
assert.deepEqual(
  state.narration.slice(-CHAPTER_ONE_SCENE_TEXT.windcutTrail.length),
  CHAPTER_ONE_SCENE_TEXT.windcutTrail,
)
assert.deepEqual(CHAPTER_ONE_SCENE_TEXT.windcutTrail, [
  'Wet thyme smells sharp under your boots. A brass rivet from the Research Case is pressed into the mud beside a narrow drag groove.',
  'A trail post points uphill toward Rattlebridge. Green waxed twine is caught under the rivet.',
  'Above the rise, bottle caps begin to rattle.',
])

const chat = readFileSync('src/features/games/weed-goblins/WeedGoblinsChat.jsx', 'utf8')
const helpSource = readFileSync('src/features/games/weed-goblins/weedGoblinsHelpChapterOne.js', 'utf8')
assert.doesNotMatch(chat, /automaticGuidance|getWeedGoblinsAutomaticGuidance|guidance-bubble/)
assert.match(chat, /onClick=\{handleHelp\}/)
assert.doesNotMatch(helpSource, /Type a name in the message box|forcing yourself to invent one on command/)
assert.match(helpSource, /AUTOMATIC_GUIDANCE\[state\.sceneId\]/)

console.log('EXACT_APPROVED_PREMISE_BLOCK=PASS')
console.log('PREMISE_BEFORE_NAME=PASS')
console.log('WINDCUT_AFTER_APPEARANCE=PASS')
console.log('WINDCUT_BLOCK_UNCHANGED=PASS')
console.log('HELP_OPT_IN_SOURCE=PASS')
