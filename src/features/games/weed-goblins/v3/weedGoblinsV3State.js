import { ancestryById } from './content/starterLandsAncestries.js'
import { backgroundById } from './content/starterLandsBackgrounds.js'
import { questionById, STARTER_QUESTIONS } from './content/starterLandsQuestions.js'
import { weaponById } from './content/starterLandsArmory.js'
import { selectStarterQuestions } from './weedGoblinsNarrativeDirector.js'
import { validateV3State } from './weedGoblinsV3Validation.js'

function idPart() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

export function createWeedGoblinsV3State({ campaignId = 'weed-goblins-v3:starter-lands-founder', seed = idPart(), runId = idPart() } = {}) {
  const state = {
    version: 3,
    contentVersion: 'starter-lands-2026-08-27-v1',
    campaignId,
    runId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'active',
    mode: 'full-start',
    seed: String(seed),
    selectionCounter: 0,
    sceneId: 'starter:welcome',
    currentLocation: 'Mossgate Wayhouse',
    pressure: 'calm',
    player: {
      name: '',
      ancestryId: null,
      backgroundId: null,
      weaponId: null,
      strength: null,
      defense: null,
      guard: null,
      hp: null,
      maxHp: null,
      mana: null,
      maxMana: null,
      wound: 'None',
      characterFacts: [],
    },
    previewing: { ancestryId: null, weaponId: null, backgroundId: null },
    inspected: { ancestryIds: [], weaponIds: [], backgroundIds: [] },
    selectedQuestionIds: [],
    questionAnswers: {},
    discoveries: [],
    npcMemory: {
      'sable-merrow': {
        encountered: false,
        trust: 0,
        respect: 0,
        memorableIncidents: [],
        inspectedWeaponIds: [],
        chosenWeaponId: null,
      },
    },
    promises: [],
    director: {
      recentPacingRoles: ['orientation'],
      approxReadSeconds: 0,
      recentChoiceCount: 0,
      lastSelectedBlockId: 'starter:prologue:reach',
    },
    selectedBlockIds: ['starter:prologue:reach'],
    seenBlockIds: ['starter:prologue:reach'],
    acceptedCanonSnapshotId: null,
    legacyUnlockIds: [],
    history: [],
    ledger: [],
  }
  validateV3State(state)
  return state
}

function changed(state, patch) {
  const next = { ...state, ...patch, updatedAt: nowIso() }
  validateV3State(next)
  return next
}

function ledger(state, event) {
  return [...state.ledger, { at: nowIso(), ...event }]
}

function inspectList(values, id) {
  return values.includes(id) ? values : [...values, id]
}

export function beginStarter(state) {
  return changed(state, { sceneId: 'starter:name' })
}

export function setPlayerName(state, name) {
  const clean = String(name ?? '').trim().slice(0, 80)
  if (!clean) throw new Error('Your character needs a name.')
  return changed(state, {
    player: { ...state.player, name: clean },
    sceneId: 'starter:ancestry-browse',
    ledger: ledger(state, { type: 'character-name', value: clean }),
  })
}

export function previewAncestry(state, ancestryId) {
  if (!ancestryById(ancestryId)) throw new Error('Unknown ancestry.')
  return changed(state, {
    previewing: { ...state.previewing, ancestryId },
    inspected: { ...state.inspected, ancestryIds: inspectList(state.inspected.ancestryIds, ancestryId) },
  })
}

export function confirmAncestry(state, ancestryId = state.previewing.ancestryId) {
  if (!ancestryById(ancestryId)) throw new Error('Preview an ancestry before choosing.')
  const selected = selectStarterQuestions({ questions: STARTER_QUESTIONS, ancestryId, seed: state.seed, count: 3 })
  return changed(state, {
    player: { ...state.player, ancestryId },
    previewing: { ...state.previewing, ancestryId: null },
    selectedQuestionIds: selected.map((question) => question.id),
    questionAnswers: {},
    selectionCounter: state.selectionCounter + 1,
    sceneId: 'starter:identity-questions',
    ledger: ledger(state, { type: 'ancestry-confirmed', ancestryId }),
  })
}

export function answerCharacterQuestion(state, questionId, answerId) {
  if (!state.selectedQuestionIds.includes(questionId)) throw new Error('That character question is not active.')
  const question = questionById(questionId)
  const answer = question?.answers.find(([id]) => id === answerId)
  if (!question || !answer) throw new Error('Unknown character answer.')
  const existing = state.player.characterFacts.filter((item) => item.key !== question.factKey)
  const facts = [...existing, { key: question.factKey, value: answerId, label: answer[1], sourceQuestionId: questionId }]
  const answers = { ...state.questionAnswers, [questionId]: answerId }
  const complete = state.selectedQuestionIds.every((id) => id in answers)
  return changed(state, {
    player: { ...state.player, characterFacts: facts },
    questionAnswers: answers,
    sceneId: complete ? 'starter:armory-intro' : state.sceneId,
    npcMemory: complete
      ? { ...state.npcMemory, 'sable-merrow': { ...state.npcMemory['sable-merrow'], encountered: true } }
      : state.npcMemory,
    ledger: ledger(state, { type: 'character-fact', key: question.factKey, value: answerId, questionId }),
  })
}

export function enterArmory(state) {
  if (state.sceneId !== 'starter:armory-intro') return state
  return changed(state, {
    sceneId: 'starter:weapon-browse',
    selectedBlockIds: inspectList(state.selectedBlockIds, 'starter:armory:arrival'),
    seenBlockIds: inspectList(state.seenBlockIds, 'starter:armory:arrival'),
  })
}

export function previewWeapon(state, weaponId) {
  if (!weaponById(weaponId)) throw new Error('Unknown weapon.')
  const inspectedWeaponIds = inspectList(state.inspected.weaponIds, weaponId)
  return changed(state, {
    previewing: { ...state.previewing, weaponId },
    inspected: { ...state.inspected, weaponIds: inspectedWeaponIds },
    npcMemory: {
      ...state.npcMemory,
      'sable-merrow': {
        ...state.npcMemory['sable-merrow'],
        encountered: true,
        inspectedWeaponIds,
      },
    },
  })
}

export function confirmWeapon(state, weaponId = state.previewing.weaponId) {
  if (!weaponById(weaponId)) throw new Error('Preview a weapon before choosing.')
  return changed(state, {
    player: { ...state.player, weaponId },
    previewing: { ...state.previewing, weaponId: null },
    sceneId: 'starter:background-browse',
    selectionCounter: state.selectionCounter + 1,
    npcMemory: {
      ...state.npcMemory,
      'sable-merrow': {
        ...state.npcMemory['sable-merrow'],
        chosenWeaponId: weaponId,
        respect: Math.min(3, state.npcMemory['sable-merrow'].respect + (state.inspected.weaponIds.length >= 3 ? 1 : 0)),
      },
    },
    ledger: ledger(state, { type: 'weapon-confirmed', weaponId }),
  })
}

export function previewBackground(state, backgroundId) {
  if (!backgroundById(backgroundId)) throw new Error('Unknown background.')
  return changed(state, {
    previewing: { ...state.previewing, backgroundId },
    inspected: { ...state.inspected, backgroundIds: inspectList(state.inspected.backgroundIds, backgroundId) },
  })
}

export function confirmBackground(state, backgroundId = state.previewing.backgroundId) {
  const background = backgroundById(backgroundId)
  if (!background) throw new Error('Preview a background before choosing.')
  return changed(state, {
    player: {
      ...state.player,
      backgroundId,
      strength: background.stats.strength,
      defense: background.stats.defense,
      guard: background.stats.guard,
      hp: background.stats.maxHp,
      maxHp: background.stats.maxHp,
      mana: background.stats.maxMana,
      maxMana: background.stats.maxMana,
    },
    previewing: { ...state.previewing, backgroundId: null },
    sceneId: 'starter:departure',
    selectionCounter: state.selectionCounter + 1,
    ledger: ledger(state, { type: 'background-confirmed', backgroundId }),
  })
}

export function commitDeparture(state) {
  if (!state.player.name || !state.player.ancestryId || !state.player.weaponId || !state.player.backgroundId) {
    throw new Error('Character creation is not complete.')
  }
  if (!state.selectedQuestionIds.every((id) => id in state.questionAnswers)) throw new Error('Character questions are incomplete.')
  return changed(state, {
    sceneId: 'starter:theft-threshold',
    currentLocation: 'Windcut Camp, Goblin Highlands',
    pressure: 'moving',
    selectedBlockIds: inspectList(state.selectedBlockIds, 'starter:departure:road'),
    seenBlockIds: inspectList(state.seenBlockIds, 'starter:departure:road'),
    ledger: ledger(state, { type: 'starter-departure', player: { name: state.player.name, ancestryId: state.player.ancestryId, weaponId: state.player.weaponId, backgroundId: state.player.backgroundId } }),
  })
}

export function completeStarter(state) {
  return changed(state, { status: 'starter-complete', sceneId: 'starter:complete' })
}
