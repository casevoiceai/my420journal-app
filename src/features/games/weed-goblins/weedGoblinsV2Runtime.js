import {
  getCurrentActions as getCoreActions,
  prepareAction as prepareCoreAction,
  resolveEnemyTurn as resolveCoreEnemyTurn,
} from './weedGoblinsV2Engine.js'

export * from './weedGoblinsV2Engine.js'

function activeSneak(state) {
  return state?.world?.sneak?.hp > 0 && ['active', 'bargaining'].includes(state.world.sneak.status)
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

export function getCurrentActions(state) {
  const actions = getCoreActions(state)
  if (
    state?.sceneId === 'rattlebridge'
    && state.alarm === 'disabled'
    && activeSneak(state)
    && actions.some((action) => action.id === 'bridge:cross')
  ) {
    return actionsAfterDisabledAlarm(state)
  }
  return actions
}

export function prepareAction(state, actionId) {
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
