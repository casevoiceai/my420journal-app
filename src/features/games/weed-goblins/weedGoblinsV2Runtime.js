import {
  commitPendingCheck as commitCoreCheck,
  getCurrentActions as getCoreActions,
  interpretLocalFreeform as interpretCoreFreeform,
  prepareAction as prepareCoreAction,
  resolveEnemyTurn as resolveCoreEnemyTurn,
} from './weedGoblinsV2Engine.js'
import { DC, HIGHLAND_SNEAK } from './weedGoblinsV2Rules.js'

export * from './weedGoblinsV2Engine.js'

function activeSneak(state) {
  return state?.world?.sneak?.hp > 0 && ['active', 'bargaining'].includes(state.world.sneak.status)
}

function hasMana(state, cost = 1) {
  return (state?.player?.mana || 0) >= cost
}

function spendMana(state, cost = 1) {
  if (!hasMana(state, cost)) throw new Error('Not enough Mana.')
  return {
    ...state,
    player: {
      ...state.player,
      mana: state.player.mana - cost,
    },
  }
}

function rewriteLatestRuling(state, patch) {
  const ledger = [...state.ledger]
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    if (ledger[index].type !== 'ruling') continue
    ledger[index] = { ...ledger[index], ...patch }
    return { ...state, ledger }
  }
  return state
}

function appendRuling(state, pendingResolution) {
  const pending = {
    id: `resolution:${state.ledger.length + 1}`,
    ...pendingResolution,
  }
  return {
    ...state,
    pendingResolution: pending,
    ledger: [
      ...state.ledger,
      {
        id: `event:${state.ledger.length + 1}`,
        sequence: state.ledger.length + 1,
        irreversible: true,
        type: 'ruling',
        resolutionId: pending.id,
        actionId: pending.actionId,
        resolutionType: pending.type,
        stat: pending.stat || null,
        modifier: pending.modifier ?? null,
        dc: pending.dc ?? null,
        advantage: pending.advantage || 'normal',
        manaCost: pending.manaCost || 0,
        success: pending.successText || null,
        failure: pending.failureText || null,
      },
    ],
  }
}

function signatureAction(state) {
  if (!state.player.backgroundId || !hasMana(state, 1) || !activeSneak(state)) return null
  if (state.player.backgroundId === 'tracker') {
    return {
      id: 'ability:tracker-bridge',
      label: 'Push Through and take the crossing before the guard can settle',
      detail: 'Push Through · 1 Mana · Strength · Moderate DC 11',
    }
  }
  if (state.player.backgroundId === 'warden') {
    return {
      id: 'ability:warden-bridge',
      label: 'Hold the Line and force a safe way onto the bridge',
      detail: 'Hold the Line · 1 Mana · Defense · Moderate DC 11',
    }
  }
  if (state.player.backgroundId === 'diviner') {
    return {
      id: 'ability:diviner-bridge',
      label: 'Read the Wrong Map Right and find the bridge’s blind route',
      detail: '1 Mana · Magic +2 · Moderate DC 11',
    }
  }
  return null
}

function combatSignatureAction(state) {
  if (!state.player.backgroundId || !hasMana(state, 1)) return null
  if (state.player.backgroundId === 'tracker') {
    return {
      id: 'ability:tracker-combat',
      label: 'Push Through the guard’s position',
      detail: 'Push Through · 1 Mana · Strength · Easy DC 8',
    }
  }
  if (state.player.backgroundId === 'warden') {
    return {
      id: 'ability:warden-combat',
      label: 'Hold the Line and deny the guard the space it wants',
      detail: 'Hold the Line · 1 Mana · Defense · Easy DC 8',
    }
  }
  if (state.player.backgroundId === 'diviner') {
    return {
      id: 'ability:diviner-combat',
      label: 'Shape a quick spell at the Highland Sneak',
      detail: '1 Mana · Magic +2 · d6 on hit',
    }
  }
  return null
}

function actionsAfterDisabledAlarm(state) {
  const actions = []
  if (state.stealth !== 'spotted') {
    actions.push({
      id: 'bridge:bypass',
      label: 'Slip past the guard and cross while the alarm is useless',
      detail: 'Defense · Hard DC 14',
    })
  }
  actions.push({
    id: 'bridge:bargain',
    label: state.discoveries?.some((item) => item.id === 'crooked-root-mark')
      ? 'Show the crooked-root evidence and ask what this theft is really about'
      : 'Talk to the guard now that the alarm is out of the argument',
    detail: 'Social check · Moderate DC 11',
  })
  actions.push({ id: 'bridge:fight', label: 'Make this a fight' })
  return actions
}

function injectBridgeSignature(state, actions) {
  const ability = signatureAction(state)
  if (!ability) return actions.slice(0, 4)
  const withoutCross = actions.filter((action) => action.id !== 'bridge:cross')
  if (withoutCross.length < 4) return [...withoutCross, ability].slice(0, 4)

  const replaceId = state.player.backgroundId === 'warden'
    ? 'bridge:disable-alarm'
    : 'bridge:bypass'
  const index = withoutCross.findIndex((action) => action.id === replaceId)
  if (index >= 0) {
    const next = [...withoutCross]
    next[index] = ability
    return next.slice(0, 4)
  }
  return [...withoutCross.slice(0, 3), ability]
}

function injectCombatSignature(state, actions) {
  const ability = combatSignatureAction(state)
  if (!ability) return actions
  const next = actions.filter((action) => action.id !== 'combat:control')
  next.splice(Math.min(2, next.length), 0, ability)
  return next.slice(0, 4)
}

export function getCurrentActions(state) {
  let actions = getCoreActions(state)
  if (
    state?.sceneId === 'rattlebridge'
    && state.alarm === 'disabled'
    && activeSneak(state)
    && actions.some((action) => action.id === 'bridge:cross')
  ) {
    actions = actionsAfterDisabledAlarm(state)
  }
  if (state?.sceneId === 'rattlebridge' && activeSneak(state)) {
    return injectBridgeSignature(state, actions)
  }
  if (state?.sceneId === 'rattlebridge-combat' && state.combat?.turn === 'player') {
    return injectCombatSignature(state, actions)
  }
  return actions
}

function prepareBridgeSignature(state, actionId) {
  const specs = {
    'ability:tracker-bridge': { background: 'tracker', stat: 'strength' },
    'ability:warden-bridge': { background: 'warden', stat: 'defense' },
    'ability:diviner-bridge': { background: 'diviner', stat: 'magic' },
  }
  const spec = specs[actionId]
  if (!spec || state.player.backgroundId !== spec.background) throw new Error('That signature ability is not available.')

  let spent = spendMana(state, 1)
  spent = prepareCoreAction(spent, 'bridge:bypass')
  const modifier = spec.stat === 'magic' ? spent.player.magicalSkill : spent.player[spec.stat]
  const next = {
    ...spent,
    pendingResolution: {
      ...spent.pendingResolution,
      actionId,
      stat: spec.stat,
      modifier,
      dc: DC.moderate,
      manaCost: 1,
      successText: 'Use your background’s signature approach to secure a way across Rattlebridge.',
      failureText: 'The attempt still changes the bridge position, but the guard gets a clean read on you.',
    },
  }
  return rewriteLatestRuling(next, {
    actionId,
    stat: spec.stat,
    modifier,
    dc: DC.moderate,
    manaCost: 1,
    success: next.pendingResolution.successText,
    failure: next.pendingResolution.failureText,
  })
}

function prepareCombatSignature(state, actionId) {
  if (actionId === 'ability:diviner-combat') {
    if (state.player.backgroundId !== 'diviner') throw new Error('That signature ability is not available.')
    const spent = spendMana(state, 1)
    return appendRuling(spent, {
      type: 'attack',
      actionId,
      stat: 'magic',
      modifier: spent.player.magicalSkill,
      dc: HIGHLAND_SNEAK.guard,
      targetKnown: spent.discoveries.some((item) => item.id === 'sneak-guard'),
      advantage: 'normal',
      manaCost: 1,
      successText: 'The spell connects; roll d6 magical damage.',
      failureText: 'The spell misses or fails to take hold; the fight continues.',
      context: 'combat-attack',
      force: false,
      weaponId: 'diviner-magic',
      damageDice: [6],
    })
  }

  const spec = actionId === 'ability:tracker-combat'
    ? { background: 'tracker', stat: 'strength' }
    : actionId === 'ability:warden-combat'
      ? { background: 'warden', stat: 'defense' }
      : null
  if (!spec || state.player.backgroundId !== spec.background) throw new Error('That signature ability is not available.')

  let spent = spendMana(state, 1)
  spent = prepareCoreAction(spent, 'combat:control')
  const modifier = spent.player[spec.stat]
  const next = {
    ...spent,
    pendingResolution: {
      ...spent.pendingResolution,
      actionId,
      stat: spec.stat,
      modifier,
      dc: DC.easy,
      manaCost: 1,
      successText: 'Use your signature technique to take control of the guard’s position.',
      failureText: 'The technique costs Mana but does not secure the position; the guard gets its turn.',
    },
  }
  return rewriteLatestRuling(next, {
    actionId,
    stat: spec.stat,
    modifier,
    dc: DC.easy,
    manaCost: 1,
    success: next.pendingResolution.successText,
    failure: next.pendingResolution.failureText,
  })
}

export function prepareAction(state, actionId) {
  if (actionId.startsWith('ability:') && actionId.endsWith('-bridge')) {
    return prepareBridgeSignature(state, actionId)
  }
  if (actionId.startsWith('ability:') && actionId.endsWith('-combat')) {
    return prepareCombatSignature(state, actionId)
  }
  if (
    actionId === 'bridge:cross'
    && state?.sceneId === 'rattlebridge'
    && state.alarm === 'disabled'
    && activeSneak(state)
  ) {
    throw new Error('The alarm is disabled, but the Highland Sneak is still controlling the crossing.')
  }
  return prepareCoreAction(state, actionId)
}

export function commitPendingCheck(state, options) {
  const pending = state.pendingResolution
  if (pending?.actionId?.startsWith('ability:') && pending.actionId.endsWith('-bridge')) {
    const mapped = {
      ...state,
      pendingResolution: {
        ...pending,
        actionId: 'bridge:bypass',
      },
    }
    const resolved = commitCoreCheck(mapped, options)
    const ledger = resolved.ledger.map((event) => {
      if (event.resolutionId !== pending.id && event.actionId !== 'bridge:bypass') return event
      if (!['roll', 'outcome'].includes(event.type)) return event
      return { ...event, actionId: pending.actionId }
    })
    return { ...resolved, ledger }
  }
  return commitCoreCheck(state, options)
}

export function interpretLocalFreeform(state, text) {
  const core = interpretCoreFreeform(state, text)
  if (core.supported) return core

  const normalized = String(text ?? '').trim().toLowerCase()
  if (
    state?.player?.backgroundId === 'diviner'
    && hasMana(state, 1)
    && /magic|spell|cast|hex|enchant|charm|illusion|divin|mystic|arcane/.test(normalized)
  ) {
    if (state.sceneId === 'rattlebridge') {
      return { supported: true, actionId: 'ability:diviner-bridge', boundedMagic: true }
    }
    if (state.sceneId === 'rattlebridge-combat' && state.combat?.turn === 'player') {
      return { supported: true, actionId: 'ability:diviner-combat', boundedMagic: true }
    }
  }
  return core
}

export function resolveEnemyTurn(state, options = {}) {
  const next = resolveCoreEnemyTurn(state, options)
  if (
    next?.player?.wound === 'Downed'
    && next?.world?.sneak?.status === 'escaped'
    && next?.world?.sneak?.reportProcess?.status === 'completed'
    && next.campAwareness !== 'warned'
  ) {
    return {
      ...next,
      campAwareness: 'warned',
    }
  }
  return next
}
