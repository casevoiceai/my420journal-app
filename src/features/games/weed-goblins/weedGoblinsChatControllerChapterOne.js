import {
  advanceWeedGoblinsRun,
  advanceWeedGoblinsSessionText,
  createWeedGoblinsRun,
  getAvailableActions,
  getWeedGoblinsActionCheckPreview,
  isWeedGoblinsFreeTextScene,
  isWeedGoblinsSessionTextScene,
} from './weedGoblinsChapterOneStaticRuntime.js'
import { CHAPTER_ONE_ACTION_OUTCOMES, CHAPTER_ONE_ACTION_SETUPS } from './weedGoblinsChapterOne.js'

function cleanText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
}
function dieValue(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : null
}
export function createIncomingChatMessage(text, { die = null, source = 'chapter-one-static', kind = 'message' } = {}) {
  const safe = cleanText(text, 1200)
  if (!safe && kind !== 'roll-result') return null
  return Object.freeze({ direction: 'incoming', kind, text: safe, die: dieValue(die), source })
}
export function createOutgoingChoiceMessage(action) {
  if (!action?.id || !action?.label) throw new Error('A valid Weed Goblins choice is required.')
  return Object.freeze({ direction: 'outgoing', kind: 'message', text: cleanText(action.label, 240), actionId: cleanText(action.id, 120), die: null, source: 'player-choice' })
}
export function createOutgoingTextMessage(value) {
  const text = cleanText(value, 160)
  if (!text) throw new Error('A player action is required.')
  return Object.freeze({ direction: 'outgoing', kind: 'message', text, actionId: 'free-text', die: null, source: 'player-text' })
}
export function createRollTriggerMessage() {
  return Object.freeze({ direction: 'incoming', kind: 'roll-trigger', text: 'Roll d20', die: null, source: 'roll-trigger' })
}
export function createRollResultMessage(value, rolls = []) {
  const die = dieValue(value)
  if (die === null) throw new Error('A resolved D20 value is required.')
  const safeRolls = Array.isArray(rolls) ? rolls.map(dieValue).filter((roll) => roll !== null) : []
  return Object.freeze({ direction: 'incoming', kind: 'roll-result', text: '', die, rolls: Object.freeze(safeRolls.length ? safeRolls : [die]), source: 'engine-roll' })
}
export function getWeedGoblinsQuickReplies(state) { return getAvailableActions(state) }
export { isWeedGoblinsFreeTextScene, isWeedGoblinsSessionTextScene }

function setupKey(actionId) {
  return actionId === 'sneak:title-deputy' || actionId === 'sneak:title-duke' ? 'sneak:title' : actionId
}
function checkSetup(actionId, preview) {
  const intro = CHAPTER_ONE_ACTION_SETUPS[setupKey(actionId)] || 'The outcome is uncertain.'
  const stat = preview.stat === 'strength' ? 'Strength' : 'Defense'
  const mana = preview.advantage ? ` Spend ${preview.manaCost} Mana and roll with advantage.` : ''
  const diePhrase = preview.advantage ? 'on either die' : 'on the die'
  return createIncomingChatMessage(`${intro}${mana} Your ${stat} is +${preview.statBonus}. You need ${preview.requiredDie} or better ${diePhrase}. Roll d20.`, { kind: 'check-setup' })
}

export async function createWeedGoblinsChatSession({ seed = 'weed-goblins-chat-ui', journalSnapshot = {}, previousRuns = [], priorCompletedRunCount = previousRuns.length } = {}) {
  const state = createWeedGoblinsRun({ seed, journalSnapshot, previousRuns, priorCompletedRunCount })
  return { state, messages: state.narration.map((line) => createIncomingChatMessage(line)).filter(Boolean), choices: getAvailableActions(state) }
}
export function selectWeedGoblinsChatChoice(state, action) {
  const selected = getAvailableActions(state).find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)
  return { before: state, after: advanceWeedGoblinsRun(state, selected.id), outgoingMessage: createOutgoingChoiceMessage(selected) }
}
export function prepareWeedGoblinsChoiceTurn({ state, action } = {}) {
  const selected = getAvailableActions(state).find((candidate) => candidate.id === action?.id)
  if (!selected) throw new Error(`Choice ${action?.id ?? '(missing)'} is not available.`)
  const preview = getWeedGoblinsActionCheckPreview(state, selected.id)
  const outgoingMessage = createOutgoingChoiceMessage(selected)
  if (!preview.requiresRoll) return Object.freeze({ before: state, after: advanceWeedGoblinsRun(state, selected.id), plan: null, checkPreview: preview, requiresRoll: false, outgoingMessage, setupMessage: null, rollTriggerMessage: null })
  const plan = Object.freeze({ kind: 'built-in-choice', actionId: selected.id, playerAction: selected.label, style: preview.manaCost > 0 ? 'mana' : preview.stat })
  return Object.freeze({ before: state, plan, checkPreview: preview, requiresRoll: true, outgoingMessage, setupMessage: checkSetup(selected.id, preview), rollTriggerMessage: createRollTriggerMessage() })
}
export async function prepareWeedGoblinsQuickReplyTurn({ state, action } = {}) {
  if (action?.playerAction && !action?.id) return prepareWeedGoblinsFreeTextTurn({ state, playerAction: action.playerAction })
  return prepareWeedGoblinsChoiceTurn({ state, action })
}
export function submitWeedGoblinsSessionText(state, value) {
  if (!isWeedGoblinsSessionTextScene(state)) throw new Error(`Session text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  const text = cleanText(value, 160)
  return { before: state, after: advanceWeedGoblinsSessionText(state, text), outgoingMessage: text ? createOutgoingTextMessage(text) : null }
}

function action(state, id) { return getAvailableActions(state).find((candidate) => candidate.id === id) || null }
function mappedAction(state, text) {
  const t = text.toLowerCase()
  const maps = {
    'windcut-trail': [[/rivet|brass/, 'windcut:rivet'], [/groove|drag|track/, 'windcut:groove'], [/twine|green|knot/, 'windcut:twine'], [/listen|hear|sound/, 'windcut:listen'], [/bridge|rattle|uphill/, 'windcut:head-rattlebridge']],
    'rattlebridge-alarm': [[/reset|red cord/, 'rattlebridge:inspect-reset'], [/beneath|under.*bridge/, 'rattlebridge:look-below'], [/talk|fee/, 'rattlebridge:talk'], [/run|rush|fast|direct/, 'route:loud'], [/cut|quiet|careful/, 'route:quiet']],
    'rattlebridge-sneak': [[/case|carried|stole/, 'sneak:ask-case'], [/title|promotion|duke|inspector/, 'sneak:offer-title'], [/mana|magic|spell/, 'sneak:mana'], [/move|shove|push|force/, 'sneak:move'], [/paid|fee|already/, 'sneak:fee-paid']],
    'cloudberry-shelf': [[/help|free|untangle|tripwire/, 'cloudberry:help-nib'], [/bait|lower path|send nib/, 'cloudberry:bait-nib'], [/charm|bell/, 'cloudberry:take-charm'], [/look|explore|press|sky/, 'cloudberry:look-around'], [/camp|leave|move on/, 'cloudberry:leave']],
    'cloudberry-press': [[/mark|root|carv/, 'press:inspect-mark'], [/climb/, 'press:climb'], [/wait/, 'press:wait'], [/distract|shiny|glint/, 'press:distract'], [/return|back/, 'press:return']],
    'old-sky-bell': [[/rune|read/, 'skybell:runes'], [/brace|clapper|hold/, 'skybell:brace'], [/mark|root|carv/, 'skybell:inspect-mark'], [/ring/, 'skybell:ring'], [/return|back/, 'skybell:return']],
    'highland-camp': [[/grubbin|best goods/, 'camp:ask-grubbin'], [/tatter|black-root|black root|seal/, 'camp:ask-tatter'], [/ledger|picture/, 'camp:study-ledger'], [/crate|watch|outgoing/, 'camp:watch-crates'], [/stash|hall|king/, 'camp:head-hall']],
    'camp-ledger': [[/expose|reveal|prove/, 'camp:expose-tribute'], [/protect|alter|change|hide/, 'camp:protect-tribute'], [/pull|take|tear|force/, 'camp:force-ledger'], [/who|collect/, 'camp:ask-collector'], [/leave|back/, 'camp:leave-ledger']],
    'stash-latch': [[/worried/, 'latch:set-worried'], [/charm/, 'latch:use-charm'], [/force|break|smash|pry/, 'latch:force'], [/mana|magic|channel/, 'latch:channel'], [/read|study|wear|face/, 'latch:read-face']],
    'goblin-king': [[/whole court|everyone|all of them|entire court/, 'boss:challenge-court'], [/evidence|ledger|tribute|witness/, 'boss:evidence'], [/mana|theory|spell/, 'boss:spell'], [/take|hit|fight|force|club/, 'boss:overpower'], [/surrender|give.*case|hand.*case|outlast/, 'boss:outlast']],
    'whole-court': [[/break|through|force|charge/, 'court:break-line'], [/hold|defend|stand|outlast/, 'court:hold-room']],
  }
  for (const [pattern, id] of maps[state.sceneId] || []) if (pattern.test(t)) { const found = action(state, id); if (found) return found }
  return null
}
function interpretFreeText(state, value) {
  const text = cleanText(value, 160)
  if (state.sceneId === 'goblin-king') {
    const lower = text.toLowerCase()
    if (/why.*stole|why.*case|requisition/.test(lower)) return { kind: 'narrative-only', playerAction: text, responseText: CHAPTER_ONE_ACTION_OUTCOMES['boss:ask-why'].success }
    if (/matches.*crown|crown.*match|brass.*crown/.test(lower)) return { kind: 'narrative-only', playerAction: text, responseText: CHAPTER_ONE_ACTION_OUTCOMES['boss:matching-crown'].success }
  }
  const selected = mappedAction(state, text)
  if (selected) return { kind: 'existing-action', playerAction: text, actionId: selected.id }
  return { kind: 'narrative-only', playerAction: text, responseText: 'What are you trying to affect? Use one of the visible things in the scene, or name the person, object, or route you mean.' }
}
export async function prepareWeedGoblinsFreeTextTurn({ state, playerAction } = {}) {
  if (!isWeedGoblinsFreeTextScene(state)) throw new Error(`Free-text input is not available in scene ${state?.sceneId ?? '(missing)'}.`)
  const plan = Object.freeze(interpretFreeText(state, playerAction))
  if (!plan.playerAction) throw new Error('A player action is required.')
  const outgoingMessage = createOutgoingTextMessage(plan.playerAction)
  if (plan.kind === 'narrative-only') return Object.freeze({ before: state, plan, checkPreview: { requiresRoll: false }, requiresRoll: false, outgoingMessage, setupMessage: null, rollTriggerMessage: null })
  const preview = getWeedGoblinsActionCheckPreview(state, plan.actionId)
  return Object.freeze({ before: state, plan, checkPreview: preview, requiresRoll: preview.requiresRoll, outgoingMessage, setupMessage: preview.requiresRoll ? checkSetup(plan.actionId, preview) : null, rollTriggerMessage: preview.requiresRoll ? createRollTriggerMessage() : null })
}
function checkEvent(before, after) { return after.history.slice(before.history.length).find((event) => event.type === 'check') || null }
export function resolveWeedGoblinsPreparedMechanics({ preparedTurn } = {}) {
  if (!preparedTurn?.before) throw new Error('A prepared Weed Goblins turn is required.')
  const before = preparedTurn.before
  if (preparedTurn.plan?.kind === 'narrative-only') return Object.freeze({ before, after: before, checkEvent: null, rollResultMessage: null })
  const id = preparedTurn.plan?.actionId
  if (!id) throw new Error('The prepared turn has no deterministic action.')
  const after = advanceWeedGoblinsRun(before, id)
  const event = checkEvent(before, after)
  return Object.freeze({ before, after, checkEvent: event, rollResultMessage: event ? createRollResultMessage(event.roll, event.rolls) : null })
}
function transitionMessages(before, after) { return after.narration.slice(before.narration.length).map((line) => createIncomingChatMessage(line)).filter(Boolean) }
export async function narrateWeedGoblinsResolvedTurn({ preparedTurn, mechanics } = {}) {
  if (preparedTurn?.plan?.kind === 'narrative-only') return [createIncomingChatMessage(preparedTurn.plan.responseText)].filter(Boolean)
  return transitionMessages(mechanics.before, mechanics.after)
}
export async function resolveWeedGoblinsPreparedTurn({ preparedTurn } = {}) {
  const mechanics = resolveWeedGoblinsPreparedMechanics({ preparedTurn })
  return { ...mechanics, outcomeMessages: await narrateWeedGoblinsResolvedTurn({ preparedTurn, mechanics }) }
}
export async function resolveWeedGoblinsTransitionMessages({ before, after } = {}) {
  if (!before || !after) throw new Error('Both Weed Goblins transition states are required.')
  return transitionMessages(before, after)
}
export async function resolveWeedGoblinsTransitionWithStaticFallback(options = {}) { return resolveWeedGoblinsTransitionMessages(options) }
